package ua.ukma.divenet.media.service;

import static org.assertj.core.api.Assertions.assertThat;
import static ua.ukma.divenet.media.MinioTestSupport.MINIO;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse.BodyHandlers;
import java.nio.charset.StandardCharsets;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;

/** The `MediaStorage` contract against a real MinIO (add-object-storage design D2, D3). */
class MinioMediaStorageIT {

    private final String bucket = "contract-" + UUID.randomUUID();
    private final MinioMediaStorage storage =
            new MinioMediaStorage(MINIO.getS3URL(), MINIO.getUserName(), MINIO.getPassword(), bucket);

    @Test
    void writesAndReadsWithTheSize() throws Exception {
        storage.write("abc", "hello".getBytes(StandardCharsets.UTF_8));

        Resource resource = storage.read("abc").orElseThrow();

        assertThat(resource.contentLength()).isEqualTo(5);
        assertThat(resource.getContentAsByteArray()).isEqualTo("hello".getBytes(StandardCharsets.UTF_8));
        // Re-readable, which range requests need.
        assertThat(resource.getContentAsByteArray()).hasSize(5);
    }

    @Test
    void missingKey() {
        assertThat(storage.read("missing")).isEmpty();
    }

    @Test
    void deletes() {
        storage.write("abc", new byte[] {1});

        storage.delete("abc");
        storage.delete("never-written");

        assertThat(storage.read("abc")).isEmpty();
    }

    @Test
    void bucketCreatedAndPrivate() throws Exception {
        storage.write("abc", new byte[] {1});

        int status = HttpClient.newHttpClient()
                .send(
                        HttpRequest.newBuilder(URI.create(MINIO.getS3URL() + "/" + bucket + "/abc"))
                                .build(),
                        BodyHandlers.discarding())
                .statusCode();

        assertThat(status).isEqualTo(403);
        // Starting again on an existing bucket is fine.
        new MinioMediaStorage(MINIO.getS3URL(), MINIO.getUserName(), MINIO.getPassword(), bucket);
    }
}
