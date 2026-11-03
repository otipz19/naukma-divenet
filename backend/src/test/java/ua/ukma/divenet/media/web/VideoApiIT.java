package ua.ukma.divenet.media.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaCleanup;

/** Spec media/uploads: videos, the image limit, and images and videos kept apart. */
class VideoApiIT extends VideoTestBase {

    private static final int MB = 1024 * 1024;

    @Autowired
    MediaCleanup cleanup;

    @Autowired
    ua.ukma.divenet.media.service.MediaStorage storage;

    /** Spec media/uploads, "Media can be kept in MinIO": local disk stays the default. */
    @Test
    void localDiskIsTheDefault() {
        assertThat(storage).isInstanceOf(ua.ukma.divenet.media.service.LocalDiskMediaStorage.class);
    }

    private static byte[] webm() {
        return new byte[] {0x1A, 0x45, (byte) 0xDF, (byte) 0xA3, 0x20, 0x42, (byte) 0x82, 0x04, 'w', 'e', 'b', 'm'};
    }

    private void refused(int status, byte[] bytes) throws Exception {
        long files = MediaTestSupport.allFiles();

        assertThat(uploadTo(VIDEOS, token, bytes).statusCode()).isEqualTo(status);

        assertThat(MediaTestSupport.allFiles()).isEqualTo(files);
    }

    @Test
    void mp4Upload() throws Exception {
        HttpResponse<String> response = uploadTo(VIDEOS, token, mp4(100));

        assertThat(response.statusCode()).isEqualTo(201);
        String id = JsonPath.read(response.body(), "$.id");
        assertThat(JsonPath.<String>read(response.body(), "$.contentType")).isEqualTo("video/mp4");
        assertThat(JsonPath.<String>read(response.body(), "$.url")).isEqualTo("/media/" + id);
        assertThat(response.headers().firstValue("Location")).hasValue("/media/" + id);
        assertThat(MediaTestSupport.filesOf(UUID.fromString(id))).isEqualTo(1);
    }

    @Test
    void webmUpload() throws Exception {
        HttpResponse<String> response = uploadTo(VIDEOS, token, webm());

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(JsonPath.<String>read(response.body(), "$.contentType")).isEqualTo("video/webm");
    }

    @Test
    void anonymousUpload() throws Exception {
        assertThat(uploadTo(VIDEOS, null, mp4(100)).statusCode()).isEqualTo(401);
    }

    @Test
    void notAVideo() throws Exception {
        refused(415, TestImages.png(40, 30));
        refused(415, "just some text, named clip.mp4".getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void quickTimeFile() throws Exception {
        byte[] bytes = mp4(100);
        System.arraycopy(new byte[] {'q', 't', ' ', ' '}, 0, bytes, 8, 4);

        refused(415, bytes);
    }

    @Test
    void matroskaFile() throws Exception {
        byte[] bytes = webm();
        System.arraycopy(new byte[] {'m', 'k', 'v', ' '}, 0, bytes, 8, 4);

        refused(415, bytes);
    }

    @Test
    void videoOfExactlyFiftyMegabytes() throws Exception {
        assertThat(uploadTo(VIDEOS, token, mp4(50 * MB)).statusCode()).isEqualTo(201);
    }

    @Test
    void tooLarge() throws Exception {
        refused(413, mp4(50 * MB + 1));
    }

    @Test
    void largeImage() throws Exception {
        long files = MediaTestSupport.allFiles();

        HttpResponse<String> response = uploadTo("/api/v1/media", token, TestImages.jpegOfSize(11 * MB));

        assertThat(response.statusCode()).isEqualTo(413);
        assertThat(MediaTestSupport.allFiles()).isEqualTo(files);
    }

    @Test
    void videoAsAnImage() throws Exception {
        assertThat(uploadTo("/api/v1/media", token, mp4(100)).statusCode()).isEqualTo(415);
    }

    @Test
    void wholeFile() throws Exception {
        String id = video(token);

        HttpResponse<byte[]> response = fetch("/media/" + id);

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(response.body()).isEqualTo(mp4(100));
        assertThat(response.headers().firstValue("Content-Type")).hasValue("video/mp4");
    }

    @Test
    void range() throws Exception {
        String id = video(token);

        HttpResponse<byte[]> response = fetch("/media/" + id, "Range", "bytes=0-9");

        assertThat(response.statusCode()).isEqualTo(206);
        assertThat(response.body()).hasSize(10);
    }

    @Test
    void noThumbnail() throws Exception {
        assertThat(fetch("/media/" + video(token) + "/thumb").statusCode()).isEqualTo(404);
    }

    @Test
    void videoAsAReviewPhoto() throws Exception {
        String field = field(send(
                "POST",
                "/api/v1/sites/" + site() + "/reviews",
                token,
                "{\"rating\": 5, \"photoIds\": [\"" + video(token) + "\"]}"));

        assertThat(field).isEqualTo("photoIds");
    }

    @Test
    void videoAsAPostCoverOrImage() throws Exception {
        String cover = "{\"title\": \"T\", \"status\": \"DRAFT\", \"coverId\": \"" + video(token) + "\"}";
        String photo = "{\"title\": \"T\", \"status\": \"DRAFT\", \"photoIds\": [\"" + video(token) + "\"]}";

        assertThat(field(send("POST", "/api/v1/posts", token, cover))).isEqualTo("coverId");
        assertThat(field(send("POST", "/api/v1/posts", token, photo))).isEqualTo("photoIds");
    }

    @Test
    void videoAsAnAvatar() throws Exception {
        String json = "{\"avatarId\": \"" + video(token)
                + "\", \"showDiveLog\": true, \"showStatistics\": true, \"showCertificates\": true}";

        assertThat(field(send("PUT", "/api/v1/users/me", token, json))).isEqualTo("avatarId");
    }

    @Test
    void videoAsACertificatePhoto() throws Exception {
        String json =
                "{\"agency\": \"PADI\", \"level\": \"OW\", \"number\": \"A\", \"photoId\": \"" + video(token) + "\"}";

        assertThat(field(send("POST", "/api/v1/certificates", token, json))).isEqualTo("photoId");
    }

    @Test
    void imageAsAVideo() throws Exception {
        String review = "{\"rating\": 5, \"videoIds\": [\"" + image(token) + "\"]}";
        String post = "{\"title\": \"T\", \"status\": \"DRAFT\", \"videoIds\": [\"" + image(token) + "\"]}";

        assertThat(field(send("POST", "/api/v1/sites/" + site() + "/reviews", token, review)))
                .isEqualTo("videoIds");
        assertThat(field(send("POST", "/api/v1/posts", token, post))).isEqualTo("videoIds");
    }

    @Test
    void neverAttached() throws Exception {
        String id = video(token);
        jdbc.update(
                "UPDATE media SET created_at = ? WHERE id = ?::uuid",
                Timestamp.from(Instant.now().minusSeconds(25 * 3600)),
                id);

        cleanup.run();

        assertThat(fetch("/media/" + id).statusCode()).isEqualTo(404);
        assertThat(MediaTestSupport.filesOf(UUID.fromString(id))).isZero();
    }

    private static String field(HttpResponse<String> response) {
        assertThat(response.statusCode()).isEqualTo(400);
        return JsonPath.read(response.body(), "$.errors[0].field");
    }
}
