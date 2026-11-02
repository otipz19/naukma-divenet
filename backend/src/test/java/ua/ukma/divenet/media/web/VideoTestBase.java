package ua.ukma.divenet.media.web;

import com.jayway.jsonpath.JsonPath;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpRequest.BodyPublishers;
import java.net.http.HttpResponse;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Set;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.SpringBootTest.WebEnvironment;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.auth.service.TokenService;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.MediaTestSupport.Multipart;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.user.domain.UserRepository;

/** Over a real port, so the multipart limits of the servlet container apply as they do in production. */
@SpringBootTest(webEnvironment = WebEnvironment.RANDOM_PORT, properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@Import(TestcontainersConfiguration.class)
public abstract class VideoTestBase {

    protected static final String VIDEOS = "/api/v1/media/videos";

    @LocalServerPort
    protected int port;

    @Autowired
    protected JdbcTemplate jdbc;

    @Autowired
    protected UserRepository users;

    @Autowired
    protected TokenService tokens;

    @Autowired
    protected SiteRepository sites;

    @Autowired
    protected RegionRepository regions;

    protected final HttpClient http = HttpClient.newHttpClient();
    protected String token;

    @BeforeEach
    void signIn() {
        token = newToken();
    }

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM certificates");
        jdbc.update("DELETE FROM reviews");
        jdbc.update("DELETE FROM posts");
        jdbc.update("DELETE FROM sites");
        jdbc.update("UPDATE users SET avatar_id = NULL");
        jdbc.update("DELETE FROM media");
    }

    protected String newToken() {
        return tokens.issueAccessToken(MediaTestSupport.user(users));
    }

    /** A minimal file with an MP4 signature; the server does not read further. */
    protected static byte[] mp4(int size) {
        byte[] bytes = new byte[Math.max(size, 12)];
        System.arraycopy(new byte[] {0, 0, 0, 24, 'f', 't', 'y', 'p', 'i', 's', 'o', 'm'}, 0, bytes, 0, 12);
        return bytes;
    }

    protected long site() {
        return sites.save(new Site(
                        "Reef", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), Instant.EPOCH))
                .getId();
    }

    protected HttpResponse<String> uploadTo(String path, @Nullable String accessToken, byte[] bytes) throws Exception {
        Multipart body = Multipart.file("file", "clip", "application/octet-stream", bytes);
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path))
                .header("Content-Type", body.contentType())
                .POST(BodyPublishers.ofByteArray(body.body()));
        if (accessToken != null) {
            request.header("Authorization", "Bearer " + accessToken);
        }
        return http.send(request.build(), BodyHandlers.ofString());
    }

    protected String video(String accessToken) throws Exception {
        return JsonPath.read(uploadTo(VIDEOS, accessToken, mp4(100)).body(), "$.id");
    }

    protected String image(String accessToken) throws Exception {
        return JsonPath.read(
                uploadTo("/api/v1/media", accessToken, TestImages.png(40, 30)).body(), "$.id");
    }

    protected HttpResponse<String> send(String method, String path, String accessToken, @Nullable String json)
            throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path))
                .header("Authorization", "Bearer " + accessToken)
                .header("Content-Type", "application/json")
                .method(
                        method,
                        json == null ? BodyPublishers.noBody() : BodyPublishers.ofString(json, StandardCharsets.UTF_8));
        return http.send(request.build(), BodyHandlers.ofString());
    }

    protected HttpResponse<byte[]> fetch(String path, String... headers) throws Exception {
        HttpRequest.Builder request = HttpRequest.newBuilder(uri(path)).GET();
        if (headers.length > 0) {
            request.headers(headers);
        }
        return http.send(request.build(), BodyHandlers.ofByteArray());
    }

    protected URI uri(String path) {
        return URI.create("http://localhost:" + port + path);
    }
}
