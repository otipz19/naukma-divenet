package ua.ukma.divenet.media.service;

import io.minio.BucketExistsArgs;
import io.minio.GetObjectArgs;
import io.minio.MakeBucketArgs;
import io.minio.MinioClient;
import io.minio.PutObjectArgs;
import io.minio.RemoveObjectArgs;
import io.minio.StatObjectArgs;
import io.minio.StatObjectResponse;
import io.minio.errors.ErrorResponseException;
import java.io.ByteArrayInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.AbstractResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/**
 * Keeps media in one private MinIO bucket, created at startup (ADR-0012). Keys are the same as on
 * local disk. An S3 put is atomic, so a reader sees all of a file or none of it.
 */
@Component
@ConditionalOnProperty(name = "divenet.media.storage", havingValue = "minio")
public class MinioMediaStorage implements MediaStorage {

    private final MinioClient client;
    private final String bucket;

    public MinioMediaStorage(
            @Value("${divenet.media.minio.endpoint}") String endpoint,
            @Value("${divenet.media.minio.access-key}") String accessKey,
            @Value("${divenet.media.minio.secret-key}") String secretKey,
            @Value("${divenet.media.minio.bucket}") String bucket) {
        this.client = MinioClient.builder()
                .endpoint(endpoint)
                .credentials(accessKey, secretKey)
                .build();
        this.bucket = bucket;
        // No policy is set, so the bucket stays private: only the back-end reads it.
        call(() -> {
            if (!client.bucketExists(BucketExistsArgs.builder().bucket(bucket).build())) {
                client.makeBucket(MakeBucketArgs.builder().bucket(bucket).build());
            }
            return null;
        });
    }

    @Override
    public void write(String key, byte[] bytes) {
        call(() -> client.putObject(PutObjectArgs.builder().bucket(bucket).object(key).stream(
                        new ByteArrayInputStream(bytes), bytes.length, -1)
                .build()));
    }

    @Override
    public Optional<Resource> read(String key) {
        try {
            StatObjectResponse stat = client.statObject(
                    StatObjectArgs.builder().bucket(bucket).object(key).build());
            return Optional.of(new ObjectResource(
                    key, stat.size(), stat.lastModified().toInstant().toEpochMilli()));
        } catch (ErrorResponseException e) {
            if ("NoSuchKey".equals(e.errorResponse().code())) {
                return Optional.empty();
            }
            throw new IllegalStateException("Could not read media " + key, e);
        } catch (Exception e) {
            throw new IllegalStateException("Could not read media " + key, e);
        }
    }

    /** MinIO answers a removal of a missing object with success. */
    @Override
    public void delete(String key) {
        call(() -> {
            client.removeObject(
                    RemoveObjectArgs.builder().bucket(bucket).object(key).build());
            return null;
        });
    }

    private interface MinioCall<T> {
        T run() throws Exception;
    }

    private static <T> T call(MinioCall<T> call) {
        try {
            return call.run();
        } catch (Exception e) {
            throw new IllegalStateException("MinIO request failed", e);
        }
    }

    /**
     * Re-readable, with a known length, so Spring MVC can answer range requests (design D3).
     * shortcut: a range is served by skipping from the start of the object; use a ranged GET if
     * seeking into large videos gets slow.
     */
    private final class ObjectResource extends AbstractResource {

        private final String key;
        private final long size;
        private final long lastModified;

        ObjectResource(String key, long size, long lastModified) {
            this.key = key;
            this.size = size;
            this.lastModified = lastModified;
        }

        @Override
        public InputStream getInputStream() throws IOException {
            try {
                return client.getObject(
                        GetObjectArgs.builder().bucket(bucket).object(key).build());
            } catch (IOException e) {
                throw e;
            } catch (Exception e) {
                throw new IOException("Could not read media " + key, e);
            }
        }

        @Override
        public boolean exists() {
            return true;
        }

        @Override
        public long contentLength() {
            return size;
        }

        @Override
        public long lastModified() {
            return lastModified;
        }

        @Override
        public String getDescription() {
            return "MinIO object " + bucket + "/" + key;
        }
    }
}
