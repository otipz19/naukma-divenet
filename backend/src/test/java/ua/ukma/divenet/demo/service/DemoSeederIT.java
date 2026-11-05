package ua.ukma.divenet.demo.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.media.MediaTestSupport;

/** Spec demo/seed. The demo profile seeded this context's own database at startup. */
@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class DemoSeederIT {

    private static final String DEMO = "email LIKE '%@demo.divenet.test'";

    @Autowired
    DemoSeeder seeder;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvc mvc;

    private long count(String sql) {
        Long count = jdbc.queryForObject(sql, Long.class);
        return count == null ? 0 : count;
    }

    @Test
    void demoProfileOnAnEmptyDatabase() throws Exception {
        List<String> emails = jdbc.queryForList("SELECT email FROM users WHERE " + DEMO, String.class);
        assertThat(emails).hasSizeGreaterThanOrEqualTo(8);
        for (String email : emails) {
            mvc.perform(post("/api/v1/auth/login")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content("{\"email\": \"" + email + "\", \"password\": \"divenet-demo\"}"))
                    .andExpect(status().isOk());
        }
        assertThat(count("SELECT count(*) FROM dive_log_entries")).isGreaterThanOrEqualTo(50);
        assertThat(count("SELECT count(*) FROM reviews")).isGreaterThanOrEqualTo(25);
        assertThat(count("SELECT count(*) FROM warnings")).isGreaterThanOrEqualTo(5);
        assertThat(count("SELECT count(*) FROM posts WHERE status = 'PUBLISHED'"))
                .isGreaterThanOrEqualTo(8);
        assertThat(count("SELECT count(*) FROM posts WHERE status = 'DRAFT'")).isGreaterThanOrEqualTo(2);
        assertThat(count("SELECT count(*) FROM sites WHERE status = 'PENDING'")).isEqualTo(2);
        assertThat(count("SELECT count(*) FROM certificates WHERE status = 'PENDING'"))
                .isGreaterThanOrEqualTo(1);
        // The other states are seeded too, so each moderation outcome shows.
        assertThat(count("SELECT count(*) FROM sites WHERE status = 'REJECTED'"))
                .isEqualTo(1);
        assertThat(count("SELECT count(*) FROM sites WHERE status = 'APPROVED' AND author_id IS NOT NULL"))
                .isEqualTo(1);
        assertThat(count("SELECT count(*) FROM certificates WHERE status = 'REJECTED'"))
                .isGreaterThanOrEqualTo(1);
        assertThat(count("SELECT count(*) FROM locker_items")).isGreaterThanOrEqualTo(8);
    }

    @Test
    void ratingsComeFromTheReviews() {
        assertThat(count("SELECT count(*) FROM sites WHERE rating_count > 0")).isGreaterThan(0);
        assertThat(count("""
                SELECT count(*) FROM sites s WHERE s.review_count <> (SELECT count(*) FROM reviews r WHERE r.site_id = s.id)
                   OR s.rating_count <> (SELECT count(r.rating) FROM reviews r WHERE r.site_id = s.id)
                   OR s.rating_average IS DISTINCT FROM
                      (SELECT round(avg(r.rating), 1) FROM reviews r WHERE r.site_id = s.id)
                """)).isZero();
    }

    @Test
    void seededContentHasImages() throws Exception {
        assertThat(count("SELECT count(*) FROM users WHERE " + DEMO + " AND avatar_id IS NULL"))
                .isZero();
        assertThat(count("SELECT count(*) FROM posts WHERE status = 'PUBLISHED' AND cover_id IS NULL"))
                .isZero();
        assertThat(count("SELECT count(DISTINCT review_id) FROM review_media")).isGreaterThan(0);
        List<UUID> images = jdbc.queryForList("""
                (SELECT avatar_id FROM users WHERE avatar_id IS NOT NULL LIMIT 1)
                UNION ALL (SELECT cover_id FROM posts WHERE cover_id IS NOT NULL LIMIT 1)
                UNION ALL (SELECT media_id FROM review_media LIMIT 1)
                """, UUID.class);
        assertThat(images).hasSize(3);
        for (UUID id : images) {
            mvc.perform(get("/media/" + id)).andExpect(status().isOk());
        }
    }

    @Test
    void restart() throws Exception {
        String totals = "SELECT (SELECT count(*) FROM users) || '/' || (SELECT count(*) FROM dive_log_entries)"
                + " || '/' || (SELECT count(*) FROM reviews) || '/' || (SELECT count(*) FROM posts)";
        String before = jdbc.queryForObject(totals, String.class);

        seeder.run(new DefaultApplicationArguments());

        assertThat(jdbc.queryForObject(totals, String.class)).isEqualTo(before);
    }

    @Test
    void seedRefersToAMissingSite() {
        DemoSeeder.SeedDiver diver = new DemoSeeder.SeedDiver(
                "broken@demo.divenet.test",
                "Broken Seed",
                null,
                true,
                true,
                true,
                List.of(),
                List.of(new DemoSeeder.SeedDive("Atlantis Reef", 1, null, null, null, null, null, null)),
                List.of(),
                List.of(),
                List.of(),
                List.of(),
                List.of());

        assertThatThrownBy(() -> seeder.seed(new DemoSeeder.DemoSeed("divenet-demo", List.of(diver))))
                .hasMessageContaining("Atlantis Reef");
        assertThat(count("SELECT count(*) FROM users WHERE email = 'broken@demo.divenet.test'"))
                .isZero();
    }

    @Test
    void awardsOnASeededProfile() {
        assertThat(count("""
                SELECT count(*) FROM users u WHERE u.%s
                  AND EXISTS (SELECT 1 FROM dive_log_entries d WHERE d.user_id = u.id)
                  AND NOT EXISTS (SELECT 1 FROM user_achievements a
                                  WHERE a.user_id = u.id AND a.achievement_code = 'first-dive')
                """.formatted(DEMO))).isZero();
        assertThat(count("SELECT count(*) FROM user_achievements WHERE achievement_code = 'first-post'"))
                .isGreaterThan(0);
        assertThat(count("SELECT count(*) FROM user_achievements WHERE achievement_code = 'first-site'"))
                .isGreaterThan(0);
    }
}
