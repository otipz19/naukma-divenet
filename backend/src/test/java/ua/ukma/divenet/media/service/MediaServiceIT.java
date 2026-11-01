package ua.ukma.divenet.media.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotAttachableException;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec media/uploads: attaching uploads to content and releasing them (design D5). */
@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class MediaServiceIT {

    @Autowired
    MediaService mediaService;

    @Autowired
    UserRepository users;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvc mvc;

    @Autowired
    PlatformTransactionManager transactions;

    long userA;
    long userB;

    @BeforeEach
    void createUsers() {
        userA = MediaTestSupport.user(users).getId();
        userB = MediaTestSupport.user(users).getId();
    }

    @AfterEach
    void removeMedia() {
        jdbc.update("DELETE FROM media");
    }

    private UUID uploadBy(long userId) {
        return mediaService.upload(userId, TestImages.png(40, 30)).id();
    }

    private boolean attached(UUID id) {
        return jdbc.queryForObject("SELECT attached_at IS NOT NULL FROM media WHERE id = ?", Boolean.class, id);
    }

    @Test
    void ownUnattachedUploads() {
        UUID first = uploadBy(userA);
        UUID second = uploadBy(userA);

        List<MediaView> views = mediaService.attach(List.of(first, second), userA);

        assertThat(views).extracting(MediaView::id).containsExactly(first, second);
        assertThat(attached(first)).isTrue();
        assertThat(attached(second)).isTrue();
    }

    @Test
    void anotherUsersUpload() {
        UUID own = uploadBy(userA);
        UUID others = uploadBy(userB);

        assertThatThrownBy(() -> mediaService.attach(List.of(own, others), userA))
                .isInstanceOfSatisfying(
                        MediaNotAttachableException.class,
                        e -> assertThat(e.mediaId()).isEqualTo(others))
                .hasMessageContaining(others.toString());
        assertThat(attached(own)).isFalse();
        assertThat(attached(others)).isFalse();
    }

    @Test
    void uploadAlreadyAttached() {
        UUID id = uploadBy(userA);
        mediaService.attach(List.of(id), userA);

        assertThatThrownBy(() -> mediaService.attach(List.of(id), userA))
                .isInstanceOfSatisfying(
                        MediaNotAttachableException.class,
                        e -> assertThat(e.mediaId()).isEqualTo(id));
    }

    @Test
    void unknownId() {
        UUID own = uploadBy(userA);
        UUID unknown = UUID.randomUUID();

        assertThatThrownBy(() -> mediaService.attach(List.of(own, unknown), userA))
                .isInstanceOfSatisfying(
                        MediaNotAttachableException.class,
                        e -> assertThat(e.mediaId()).isEqualTo(unknown));
        assertThat(attached(own)).isFalse();
    }

    @Test
    void attachJoinsTheCallersTransaction() {
        UUID id = uploadBy(userA);
        TransactionTemplate caller = new TransactionTemplate(transactions);

        assertThatThrownBy(() -> caller.executeWithoutResult(status -> {
                    mediaService.attach(List.of(id), userA);
                    throw new IllegalStateException("the review failed to save");
                }))
                .isInstanceOf(IllegalStateException.class);

        assertThat(attached(id)).isFalse();
    }

    @Test
    void releasedUploadIsGone() throws Exception {
        UUID id = uploadBy(userA);
        mediaService.attach(List.of(id), userA);
        assertThat(MediaTestSupport.filesOf(id)).isEqualTo(2);

        mediaService.release(List.of(id));

        mvc.perform(get("/media/" + id)).andExpect(status().isNotFound());
        mvc.perform(get("/media/" + id + "/thumb")).andExpect(status().isNotFound());
        assertThat(MediaTestSupport.filesOf(id)).isZero();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM media WHERE id = ?", Integer.class, id))
                .isZero();
    }

    @Test
    void releaseKeepsTheFilesWhenTheCallerRollsBack() {
        UUID id = uploadBy(userA);
        TransactionTemplate caller = new TransactionTemplate(transactions);

        assertThatThrownBy(() -> caller.executeWithoutResult(status -> {
                    mediaService.release(List.of(id));
                    throw new IllegalStateException("the delete failed");
                }))
                .isInstanceOf(IllegalStateException.class);

        assertThat(MediaTestSupport.filesOf(id)).isEqualTo(2);
    }
}
