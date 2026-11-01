package ua.ukma.divenet.review.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Design D1: the stored-value rules of the reviews and review_media tables. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ReviewRepositoryIT {

    @Autowired
    JdbcTemplate jdbc;

    long siteId;
    long authorId;

    @BeforeEach
    void createSiteAndAuthor() {
        siteId = jdbc.queryForObject("""
                INSERT INTO sites (name, region_code, location, difficulty, min_depth, max_depth, description, created_at, status)
                VALUES ('Test', 'eg-dahab', ST_SetSRID(ST_MakePoint(34, 28), 4326)::geography, 1, 0, 10, 'x', now(), 'APPROVED')
                RETURNING id""", Long.class);
        authorId = user();
    }

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM reviews");
        jdbc.update("DELETE FROM media");
        jdbc.update("DELETE FROM sites");
    }

    private long user() {
        return jdbc.queryForObject("""
                INSERT INTO users (email, display_name, password_hash, role, created_at)
                VALUES (?, 'Diver', 'x', 'USER', now()) RETURNING id""", Long.class, UUID.randomUUID() + "@example.com");
    }

    private long insert(long author, @Nullable Integer rating, @Nullable Integer difficulty, @Nullable String text) {
        return jdbc.queryForObject("""
                INSERT INTO reviews (site_id, author_id, rating, difficulty, text, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, now(), now()) RETURNING id""", Long.class, siteId, author, rating, difficulty, text);
    }

    private UUID media() {
        UUID id = UUID.randomUUID();
        jdbc.update("""
                INSERT INTO media (id, uploader_id, content_type, size_bytes, width, height, created_at)
                VALUES (?, ?, 'image/png', 1, 1, 1, now())""", id, authorId);
        return id;
    }

    /** Proves the statement itself is sound, so the refusals below come from the rules. */
    @Test
    void validReviewsAreStored() {
        insert(authorId, 1, 5, null);
        insert(user(), null, null, "Calm.");

        assertThat(jdbc.queryForObject("SELECT count(*) FROM reviews", Integer.class))
                .isEqualTo(2);
    }

    @Test
    void ratingOutOfRange() {
        assertThatThrownBy(() -> insert(authorId, 0, null, "x")).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert(authorId, 6, null, "x")).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void difficultyOutOfRange() {
        assertThatThrownBy(() -> insert(authorId, 3, 0, null)).isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert(authorId, 3, 6, null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void neitherRatingNorText() {
        assertThatThrownBy(() -> insert(authorId, null, 2, null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void secondReviewOfTheSameSiteByTheSameUser() {
        insert(authorId, 4, null, null);

        assertThatThrownBy(() -> insert(authorId, 5, null, null)).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void uploadInTwoReviews() {
        UUID photo = media();
        long first = insert(authorId, 4, null, null);
        long second = insert(user(), 4, null, null);
        jdbc.update("INSERT INTO review_media (review_id, media_id, position) VALUES (?, ?, 0)", first, photo);

        assertThatThrownBy(() -> jdbc.update(
                        "INSERT INTO review_media (review_id, media_id, position) VALUES (?, ?, 0)", second, photo))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void deletingAReviewDeletesItsPhotoLinks() {
        UUID photo = media();
        long review = insert(authorId, 4, null, null);
        jdbc.update("INSERT INTO review_media (review_id, media_id, position) VALUES (?, ?, 0)", review, photo);

        jdbc.update("DELETE FROM reviews WHERE id = ?", review);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM review_media", Integer.class))
                .isZero();
    }
}
