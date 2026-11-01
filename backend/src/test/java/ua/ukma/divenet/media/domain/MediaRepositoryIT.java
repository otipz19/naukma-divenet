package ua.ukma.divenet.media.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Design D1: the stored-value rules of the media table and the cleanup's partial index. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class MediaRepositoryIT {

    @Autowired
    JdbcTemplate jdbc;

    long uploaderId;

    @BeforeEach
    void createUploader() {
        uploaderId = jdbc.queryForObject("""
                INSERT INTO users (email, display_name, password_hash, role, created_at)
                VALUES (?, 'Uploader', 'x', 'USER', now()) RETURNING id""", Long.class, UUID.randomUUID() + "@example.com");
    }

    @AfterEach
    void removeMedia() {
        jdbc.update("DELETE FROM media");
    }

    private void insert(String contentType, long sizeBytes, int width, int height) {
        jdbc.update(
                """
                INSERT INTO media (id, uploader_id, content_type, size_bytes, width, height, created_at)
                VALUES (?, ?, ?, ?, ?, ?, ?)""",
                UUID.randomUUID(),
                uploaderId,
                contentType,
                sizeBytes,
                width,
                height,
                Timestamp.from(Instant.parse("2026-01-01T00:00:00Z")));
    }

    @Test
    void acceptsTheThreeImageTypes() {
        insert("image/jpeg", 1, 1, 1);
        insert("image/png", 1, 1, 1);
        insert("image/webp", 1, 1, 1);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM media", Integer.class))
                .isEqualTo(3);
    }

    @Test
    void refusesOtherContentTypes() {
        assertThatThrownBy(() -> insert("image/gif", 1, 1, 1)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refusesNonPositiveSizeAndDimensions() {
        assertThatThrownBy(() -> insert("image/png", 0, 1, 1)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert("image/png", 1, 0, 1)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert("image/png", 1, 1, 0)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void refusesAnUnknownUploader() {
        uploaderId = -1;
        assertThatThrownBy(() -> insert("image/png", 1, 1, 1)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void cleanupIndexCoversOnlyUnattachedUploads() {
        String definition = jdbc.queryForObject(
                "SELECT indexdef FROM pg_indexes WHERE tablename = 'media' AND indexname = 'media_unattached_created_at'",
                String.class);

        assertThat(definition).contains("(created_at)").contains("WHERE (attached_at IS NULL)");
    }
}
