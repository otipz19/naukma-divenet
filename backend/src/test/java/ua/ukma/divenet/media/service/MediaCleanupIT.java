package ua.ukma.divenet.media.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Timestamp;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.time.ZoneOffset;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.PlatformTransactionManager;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.domain.MediaRepository;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec media/uploads "Unattached uploads expire", with the cleanup's clock fixed (design D6). */
@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class MediaCleanupIT {

    private static final Instant UPLOADED = Instant.parse("2026-06-01T12:00:00Z");

    @Autowired
    MediaRepository media;

    @Autowired
    MediaStorage storage;

    @Autowired
    UserRepository users;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    PlatformTransactionManager transactions;

    long uploaderId;

    @BeforeEach
    void createUploader() {
        uploaderId = MediaTestSupport.user(users).getId();
    }

    @AfterEach
    void removeMedia() {
        jdbc.update("DELETE FROM media");
    }

    private UUID stored(@Nullable Instant attachedAt) {
        UUID id = UUID.randomUUID();
        jdbc.update(
                """
                INSERT INTO media (id, uploader_id, content_type, size_bytes, width, height, created_at, attached_at)
                VALUES (?, ?, 'image/png', 3, 1, 1, ?, ?)""", id, uploaderId, Timestamp.from(UPLOADED), attachedAt == null ? null : Timestamp.from(attachedAt));
        storage.write(MediaService.originalKey(id), new byte[] {1, 2, 3});
        storage.write(MediaService.thumbnailKey(id), new byte[] {4});
        return id;
    }

    private int cleanUpAfter(Duration sinceUpload) {
        Clock clock = Clock.fixed(UPLOADED.plus(sinceUpload), ZoneOffset.UTC);
        return new MediaCleanup(media, storage, clock, transactions).run();
    }

    private boolean exists(UUID id) {
        return jdbc.queryForObject("SELECT count(*) FROM media WHERE id = ?", Integer.class, id) == 1;
    }

    @Test
    void oldUnattachedUpload() {
        UUID id = stored(null);

        assertThat(cleanUpAfter(Duration.ofHours(25))).isEqualTo(1);

        assertThat(exists(id)).isFalse();
        assertThat(MediaTestSupport.filesOf(id)).isZero();
    }

    @Test
    void recentUnattachedUpload() {
        UUID id = stored(null);

        assertThat(cleanUpAfter(Duration.ofHours(23))).isZero();

        assertThat(exists(id)).isTrue();
        assertThat(MediaTestSupport.filesOf(id)).isEqualTo(2);
    }

    @Test
    void oldAttachedUpload() {
        UUID id = stored(UPLOADED.plus(Duration.ofMinutes(5)));

        assertThat(cleanUpAfter(Duration.ofHours(25))).isZero();

        assertThat(exists(id)).isTrue();
        assertThat(MediaTestSupport.filesOf(id)).isEqualTo(2);
    }
}
