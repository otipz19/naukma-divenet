package ua.ukma.divenet.media.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import ua.ukma.divenet.media.MinioTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaStorage;
import ua.ukma.divenet.media.service.MinioMediaStorage;

/** Spec media/uploads, "Media can be kept in MinIO", through the API. */
class MinioMediaApiIT extends VideoTestBase {

    @DynamicPropertySource
    static void minio(DynamicPropertyRegistry registry) {
        MinioTestSupport.register(registry, "api-test");
    }

    @Autowired
    MediaStorage storage;

    @Test
    void uploadAndServe() throws Exception {
        assertThat(storage).isInstanceOf(MinioMediaStorage.class);
        HttpResponse<String> response = uploadTo("/api/v1/media", token, TestImages.jpeg(1200, 800));
        String id = JsonPath.read(response.body(), "$.id");

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(storage.read(id)).isPresent();
        assertThat(storage.read(id + ".thumb.jpg")).isPresent();
        HttpResponse<byte[]> original = fetch("/media/" + id);
        assertThat(original.statusCode()).isEqualTo(200);
        assertThat(original.headers().firstValue("Content-Type")).hasValue("image/jpeg");
        assertThat(fetch("/media/" + id + "/thumb").statusCode()).isEqualTo(200);
    }

    @Test
    void range() throws Exception {
        String id = video(token);

        HttpResponse<byte[]> response = fetch("/media/" + id, "Range", "bytes=0-9");

        assertThat(response.statusCode()).isEqualTo(206);
        assertThat(response.body()).hasSize(10);
    }

    @Test
    void release() throws Exception {
        String video = video(token);
        HttpResponse<String> post = send(
                "POST",
                "/api/v1/posts",
                token,
                "{\"title\": \"T\", \"status\": \"DRAFT\", \"videoIds\": [\"" + video + "\"]}");
        long postId = ((Number) JsonPath.read(post.body(), "$.id")).longValue();

        send("DELETE", "/api/v1/posts/" + postId, token, null);

        assertThat(storage.read(video)).isEmpty();
    }

    @Test
    void missingObject() throws Exception {
        String id = video(token);
        storage.delete(id);

        assertThat(fetch("/media/" + id).statusCode()).isEqualTo(404);
    }
}
