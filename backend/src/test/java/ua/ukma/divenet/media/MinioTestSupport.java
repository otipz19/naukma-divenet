package ua.ukma.divenet.media;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.utility.DockerImageName;

/** One MinIO for the test classes that use it, with the stack's image (ADR-0012). */
public final class MinioTestSupport {

    public static final DockerImageName IMAGE = DockerImageName.parse(
                    "cgr.dev/chainguard/minio@sha256:3c60a2a8c4d33409a9bc7a623a7fcbfb4605adc3d89422d2f53b3f673a6e5597")
            .asCompatibleSubstituteFor("minio/minio");

    /** Started on first use and stopped by Testcontainers' reaper. The image only starts as root. */
    public static final MinIOContainer MINIO = new MinIOContainer(IMAGE)
            .withUserName("divenet")
            .withPassword("divenet-minio-test")
            .withCreateContainerCmdModifier(cmd -> cmd.withUser("0"));

    static {
        MINIO.start();
    }

    private MinioTestSupport() {}

    public static void register(DynamicPropertyRegistry registry, String bucket) {
        registry.add("divenet.media.storage", () -> "minio");
        registry.add("divenet.media.minio.endpoint", MINIO::getS3URL);
        registry.add("divenet.media.minio.access-key", MINIO::getUserName);
        registry.add("divenet.media.minio.secret-key", MINIO::getPassword);
        registry.add("divenet.media.minio.bucket", () -> bucket);
    }
}
