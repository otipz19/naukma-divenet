package ua.ukma.divenet.review.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.review.service.ReviewService.Content;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec review/ratings: the site's aggregates follow every review write (design D2). */
@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ReviewAggregatesIT {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Autowired
    ReviewService reviews;

    @Autowired
    MockMvc mvc;

    @Autowired
    SiteRepository sites;

    @Autowired
    RegionRepository regions;

    @Autowired
    UserRepository users;

    @Autowired
    JdbcTemplate jdbc;

    long siteId;

    @BeforeEach
    void createSite() {
        siteId = sites.save(new Site(
                        "Blue Hole", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), NOW))
                .getId();
    }

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM reviews");
        jdbc.update("DELETE FROM sites");
    }

    private long user() {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Diver", "x", Role.USER, NOW))
                .getId();
    }

    private ReviewView review(long userId, @Nullable Integer rating, @Nullable Integer difficulty) {
        return reviews.create(
                siteId, userId, new Content(rating, difficulty, rating == null ? "Text only." : null, List.of()));
    }

    @Test
    void ratingsAveraged() throws Exception {
        review(user(), 5, null);
        review(user(), 4, null);
        review(user(), 4, null);
        review(user(), null, null);

        mvc.perform(get("/api/v1/sites/" + siteId))
                .andExpect(jsonPath("$.averageRating").value(4.3))
                .andExpect(jsonPath("$.ratingCount").value(3))
                .andExpect(jsonPath("$.reviewCount").value(4));
    }

    @Test
    void communityDifficulty() throws Exception {
        review(user(), 3, 2);
        review(user(), 3, 5);
        review(user(), 3, null);

        mvc.perform(get("/api/v1/sites/" + siteId))
                .andExpect(jsonPath("$.communityDifficulty").value(3.5));
    }

    @Test
    void noReviews() throws Exception {
        mvc.perform(get("/api/v1/sites/" + siteId))
                .andExpect(jsonPath("$.averageRating").doesNotExist())
                .andExpect(jsonPath("$.communityDifficulty").doesNotExist())
                .andExpect(jsonPath("$.ratingCount").value(0))
                .andExpect(jsonPath("$.reviewCount").value(0));
    }

    @Test
    void editChangesTheAverage() throws Exception {
        long author = user();
        ReviewView review = review(author, 2, null);

        reviews.update(review.id(), author, new Content(5, null, null, List.of()));

        mvc.perform(get("/api/v1/sites/markers"))
                .andExpect(jsonPath("$[0].averageRating").value(5.0))
                .andExpect(jsonPath("$[0].ratingCount").value(1));
    }

    @Test
    void deleteRemovesTheRating() throws Exception {
        long author = user();
        ReviewView review = review(author, 4, 3);

        reviews.delete(review.id(), author);

        mvc.perform(get("/api/v1/sites/" + siteId))
                .andExpect(jsonPath("$.averageRating").doesNotExist())
                .andExpect(jsonPath("$.ratingCount").value(0))
                .andExpect(jsonPath("$.reviewCount").value(0))
                .andExpect(jsonPath("$.communityDifficulty").doesNotExist());
    }

    @Test
    void concurrentReviews() throws Exception {
        List<Long> authors = new ArrayList<>();
        for (int i = 0; i < 10; i++) {
            authors.add(user());
        }
        CountDownLatch start = new CountDownLatch(1);
        List<Future<ReviewView>> results = new ArrayList<>();
        try (ExecutorService pool = Executors.newFixedThreadPool(10)) {
            for (long author : authors) {
                results.add(pool.submit(() -> {
                    start.await();
                    return review(author, 4, null);
                }));
            }
            start.countDown();
            for (Future<ReviewView> result : results) {
                result.get();
            }
        }

        mvc.perform(get("/api/v1/sites/" + siteId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.ratingCount").value(10))
                .andExpect(jsonPath("$.reviewCount").value(10));
        assertThat(jdbc.queryForObject("SELECT count(*) FROM reviews", Integer.class))
                .isEqualTo(10);
    }
}
