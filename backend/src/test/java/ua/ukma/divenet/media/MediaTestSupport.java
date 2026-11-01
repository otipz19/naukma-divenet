package ua.ukma.divenet.media;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Instant;
import java.util.UUID;
import java.util.stream.Stream;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Shared pieces of the media integration tests. */
public final class MediaTestSupport {

    /** Every media test context uses this directory, so the contexts can be shared. */
    public static final String MEDIA_DIR_PROPERTY = "divenet.media.dir=target/test-media";

    public static final Path MEDIA_DIR = Path.of("target/test-media");

    private MediaTestSupport() {}

    public static User user(UserRepository users) {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Diver", "x", Role.USER, Instant.now()));
    }

    /** The original and thumbnail files of one upload that exist in storage. */
    public static long filesOf(UUID id) {
        return Stream.of(id.toString(), id + ".thumb.jpg")
                .map(key -> MEDIA_DIR.resolve(key.substring(0, 2)).resolve(key))
                .filter(Files::exists)
                .count();
    }

    public static long allFiles() {
        if (!Files.exists(MEDIA_DIR)) {
            return 0;
        }
        try (Stream<Path> files = Files.walk(MEDIA_DIR)) {
            return files.filter(Files::isRegularFile).count();
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    /** A multipart/form-data body with one file part. */
    public record Multipart(String contentType, byte[] body) {

        private static final String BOUNDARY = "divenet-test-boundary";

        public static Multipart file(String part, String filename, String contentType, byte[] bytes) {
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            out.writeBytes(("--" + BOUNDARY + "\r\n"
                            + "Content-Disposition: form-data; name=\"" + part + "\"; filename=\"" + filename
                            + "\"\r\n" + "Content-Type: " + contentType + "\r\n\r\n")
                    .getBytes(StandardCharsets.UTF_8));
            out.writeBytes(bytes);
            out.writeBytes(("\r\n--" + BOUNDARY + "--\r\n").getBytes(StandardCharsets.UTF_8));
            return new Multipart("multipart/form-data; boundary=" + BOUNDARY, out.toByteArray());
        }
    }
}
