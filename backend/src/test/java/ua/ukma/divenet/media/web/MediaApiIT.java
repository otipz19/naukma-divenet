package ua.ukma.divenet.media.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import java.awt.image.BufferedImage;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.auth.service.TokenService;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.MediaTestSupport.Multipart;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.user.domain.UserRepository;

/**
 * Spec media/uploads: upload, validation and serving, over a real port, so the multipart limits of
 * the servlet container apply as they do in production.
 */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@Import(TestcontainersConfiguration.class)
class MediaApiIT {

    private static final int TEN_MB = 10 * 1024 * 1024;

    @LocalServerPort
    int port;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    UserRepository users;

    @Autowired
    TokenService tokens;

    final HttpClient http = HttpClient.newHttpClient();
    String token;

    @BeforeEach
    void signIn() {
        token = tokens.issueAccessToken(MediaTestSupport.user(users));
    }

    @AfterEach
    void removeMedia() {
        jdbc.update("DELETE FROM media");
    }

    // --- Signed-in users upload images ---------------------------------------------------------

    @Test
    void jpegUpload() throws Exception {
        HttpResponse<String> response = upload(token, "reef.jpg", "image/jpeg", TestImages.jpeg(1200, 800));

        assertThat(response.statusCode()).isEqualTo(201);
        String id = JsonPath.read(response.body(), "$.id");
        assertThat(UUID.fromString(id).version()).isEqualTo(4);
        assertThat(JsonPath.<String>read(response.body(), "$.contentType")).isEqualTo("image/jpeg");
        assertThat(JsonPath.<Integer>read(response.body(), "$.width")).isEqualTo(1200);
        assertThat(JsonPath.<Integer>read(response.body(), "$.height")).isEqualTo(800);
        assertThat(JsonPath.<String>read(response.body(), "$.url")).isEqualTo("/media/" + id);
        assertThat(JsonPath.<String>read(response.body(), "$.thumbnailUrl")).isEqualTo("/media/" + id + "/thumb");
        assertThat(response.headers().firstValue("Location")).hasValue("/media/" + id);
        assertThat(MediaTestSupport.filesOf(UUID.fromString(id))).isEqualTo(2);
    }

    @Test
    void pngAndWebpUploads() throws Exception {
        HttpResponse<String> png = upload(token, "a.png", "image/png", TestImages.png(40, 30));
        HttpResponse<String> webp = upload(token, "b.webp", "image/webp", TestImages.webp());

        assertThat(png.statusCode()).isEqualTo(201);
        assertThat(JsonPath.<String>read(png.body(), "$.contentType")).isEqualTo("image/png");
        assertThat(webp.statusCode()).isEqualTo(201);
        assertThat(JsonPath.<String>read(webp.body(), "$.contentType")).isEqualTo("image/webp");
    }

    @Test
    void anonymousUpload() throws Exception {
        long files = MediaTestSupport.allFiles();

        HttpResponse<String> response = upload(null, "reef.jpg", "image/jpeg", TestImages.jpeg(40, 30));

        assertThat(response.statusCode()).isEqualTo(401);
        assertNothingStored(files);
    }

    @Test
    void noFilePart() throws Exception {
        Multipart body = Multipart.file("other", "reef.jpg", "image/jpeg", TestImages.jpeg(40, 30));

        HttpResponse<String> response = post(token, body);

        assertThat(response.statusCode()).isEqualTo(400);
        assertProblem(response);
        assertThat(JsonPath.<java.util.List<String>>read(response.body(), "$.errors[*].field"))
                .containsExactly("file");
    }

    // --- Only supported images are accepted -----------------------------------------------------

    @Test
    void otherFileTypeWithAnImageName() throws Exception {
        long files = MediaTestSupport.allFiles();

        HttpResponse<String> response = upload(token, "photo.jpg", "image/jpeg", TestImages.pdf());

        assertThat(response.statusCode()).isEqualTo(415);
        assertProblem(response);
        assertNothingStored(files);
    }

    @Test
    void gif() throws Exception {
        HttpResponse<String> response = upload(token, "a.gif", "image/gif", TestImages.gif(40, 30));

        assertThat(response.statusCode()).isEqualTo(415);
        assertProblem(response);
    }

    @Test
    void imageSentWithAWrongContentType() throws Exception {
        HttpResponse<String> response = upload(token, "photo.bin", "application/octet-stream", TestImages.png(40, 30));

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(JsonPath.<String>read(response.body(), "$.contentType")).isEqualTo("image/png");
    }

    @Test
    void fileOverTenMegabytes() throws Exception {
        long files = MediaTestSupport.allFiles();

        HttpResponse<String> response = upload(token, "big.jpg", "image/jpeg", TestImages.jpegOfSize(TEN_MB + 1));

        assertThat(response.statusCode()).isEqualTo(413);
        assertProblem(response);
        assertNothingStored(files);
    }

    @Test
    void fileOfExactlyTenMegabytes() throws Exception {
        HttpResponse<String> response = upload(token, "big.jpg", "image/jpeg", TestImages.jpegOfSize(TEN_MB));

        assertThat(response.statusCode()).isEqualTo(201);
    }

    @Test
    void corruptImage() throws Exception {
        long files = MediaTestSupport.allFiles();

        HttpResponse<String> response = upload(token, "bad.jpg", "image/jpeg", TestImages.corruptJpeg());

        assertThat(response.statusCode()).isEqualTo(400);
        assertProblem(response);
        assertNothingStored(files);
    }

    @Test
    void tooManyPixels() throws Exception {
        long files = MediaTestSupport.allFiles();

        HttpResponse<String> response = upload(token, "huge.png", "image/png", TestImages.pngHeaderOnly(10000, 6000));

        assertThat(response.statusCode()).isEqualTo(400);
        assertProblem(response);
        assertNothingStored(files);
    }

    // --- Each upload gets a thumbnail -----------------------------------------------------------

    @Test
    void thumbnailIsScaledDown() throws Exception {
        String id = uploadedId(TestImages.jpeg(1200, 800));

        HttpResponse<byte[]> thumbnail = get("/media/" + id + "/thumb");

        BufferedImage image = TestImages.read(thumbnail.body());
        assertThat(image.getWidth()).isEqualTo(640);
        assertThat(image.getHeight()).isEqualTo(427);
    }

    @Test
    void smallImageIsNotEnlarged() throws Exception {
        String id = uploadedId(TestImages.jpeg(300, 200));

        BufferedImage image = TestImages.read(get("/media/" + id + "/thumb").body());

        assertThat(image.getWidth()).isEqualTo(300);
        assertThat(image.getHeight()).isEqualTo(200);
    }

    @Test
    void transparentPngThumbnailIsWhite() throws Exception {
        String id = uploadedId(TestImages.transparentPng(20, 10));

        BufferedImage image = TestImages.read(get("/media/" + id + "/thumb").body());

        int rgb = image.getRGB(10, 5);
        assertThat(Math.min((rgb >> 16) & 0xFF, Math.min((rgb >> 8) & 0xFF, rgb & 0xFF)))
                .isGreaterThanOrEqualTo(250);
    }

    // --- Media is served to everyone ------------------------------------------------------------

    @Test
    void anonymousClientReadsAnUpload() throws Exception {
        byte[] webp = TestImages.webp();
        String id = uploadedId(webp);

        HttpResponse<byte[]> response = get("/media/" + id);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type")).hasValue("image/webp");
        assertThat(response.body()).isEqualTo(webp);
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("public, max-age=31536000, immutable");
        assertThat(response.headers().firstValue("X-Content-Type-Options")).hasValue("nosniff");
        assertThat(response.headers().firstValue("Content-Disposition")).hasValue("inline");
    }

    @Test
    void anonymousClientReadsAThumbnail() throws Exception {
        String id = uploadedId(TestImages.png(40, 30));

        HttpResponse<byte[]> response = get("/media/" + id + "/thumb");

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.headers().firstValue("Content-Type")).hasValue("image/jpeg");
        assertThat(response.headers().firstValue("Cache-Control")).hasValue("public, max-age=31536000, immutable");
    }

    @Test
    void unknownMedia() throws Exception {
        for (String path : new String[] {"/media/" + UUID.randomUUID(), "/media/" + UUID.randomUUID() + "/thumb"}) {
            HttpResponse<byte[]> response = get(path);

            assertThat(response.statusCode()).as(path).isEqualTo(404);
            assertThat(response.headers().firstValue("Content-Type")).hasValue("application/problem+json");
        }
    }

    @Test
    void malformedId() throws Exception {
        assertThat(get("/media/not-a-uuid").statusCode()).isEqualTo(404);
        assertThat(get("/media/not-a-uuid/thumb").statusCode()).isEqualTo(404);
    }

    // --- Helpers ----------------------------------------------------------------------------------

    private String uploadedId(byte[] image) throws Exception {
        HttpResponse<String> response = upload(token, "image", "application/octet-stream", image);
        assertThat(response.statusCode()).isEqualTo(201);
        return JsonPath.read(response.body(), "$.id");
    }

    private HttpResponse<String> upload(@Nullable String accessToken, String filename, String type, byte[] bytes)
            throws Exception {
        return post(accessToken, Multipart.file("file", filename, type, bytes));
    }

    private HttpResponse<String> post(@Nullable String accessToken, Multipart body) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri("/api/v1/media"))
                .header("Content-Type", body.contentType())
                .POST(BodyPublishers.ofByteArray(body.body()));
        if (accessToken != null) {
            request.header("Authorization", "Bearer " + accessToken);
        }
        return http.send(request.build(), BodyHandlers.ofString());
    }

    private HttpResponse<byte[]> get(String path) throws Exception {
        return http.send(HttpRequest.newBuilder(uri(path)).GET().build(), BodyHandlers.ofByteArray());
    }

    private URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }

    private static void assertProblem(HttpResponse<String> response) {
        assertThat(response.headers().firstValue("Content-Type")).hasValue("application/problem+json");
    }

    private void assertNothingStored(long filesBefore) {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM media", Integer.class))
                .isZero();
        assertThat(MediaTestSupport.allFiles()).isEqualTo(filesBefore);
    }
}
