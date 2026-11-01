package ua.ukma.divenet.achievement.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import ua.ukma.divenet.user.domain.User;

/** Spec achievement/achievements: awards. */
class AchievementAwardIT extends AchievementTestBase {

    @Test
    void firstDive() throws Exception {
        User user = user();

        log(user, site("eg-dahab"), "10");

        assertThat(earned(user)).containsExactly("first-dive");
    }

    @Test
    void tenDives() throws Exception {
        User user = user();
        long site = site("eg-dahab");
        for (int i = 0; i < 9; i++) {
            log(user, site, "10");
        }
        assertThat(earned(user)).doesNotContain("ten-dives");

        log(user, site, "10");

        assertThat(earned(user)).contains("ten-dives");
    }

    @Test
    void tenSites() throws Exception {
        User user = user();
        for (int i = 0; i < 9; i++) {
            log(user, site("eg-dahab"), "10");
        }
        long repeat = site("eg-dahab");
        log(user, repeat, "10");
        log(user, repeat, "10");
        // Eleven dives, ten sites: and only the tenth different site earns it.
        assertThat(earned(user)).contains("ten-sites");
    }

    @Test
    void nineSitesAreNotEnough() throws Exception {
        User user = user();
        long repeat = site("eg-dahab");
        for (int i = 0; i < 8; i++) {
            log(user, site("eg-dahab"), "10");
        }
        log(user, repeat, "10");
        log(user, repeat, "10");

        assertThat(earned(user)).contains("ten-dives").doesNotContain("ten-sites");
    }

    @Test
    void fiveCountries() throws Exception {
        User user = user();
        for (String region : new String[] {"eg-dahab", "hr-istria", "gr-crete", "it-sicily"}) {
            log(user, site(region), "10");
        }
        assertThat(earned(user)).doesNotContain("globetrotter");

        log(user, site("mt-gozo"), "10");

        assertThat(earned(user)).contains("globetrotter");
    }

    @Test
    void deepDive() throws Exception {
        User user = user();

        log(user, site("eg-dahab"), "40");

        assertThat(earned(user)).contains("deep-diver");
    }

    @Test
    void editingADive() throws Exception {
        User user = user();
        long site = site("eg-dahab");
        long id = log(user, site, "20");
        assertThat(earned(user)).doesNotContain("deep-diver");

        mvc.perform(put(LOG + "/" + id)
                        .with(as(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(dive(site, "40")))
                .andExpect(status().isOk());

        assertThat(earned(user)).contains("deep-diver");
    }

    @Test
    void firstPost() throws Exception {
        User user = user();

        publish(user);

        assertThat(earned(user)).containsExactly("first-post");
    }

    @Test
    void aDraftDoesNotCount() throws Exception {
        User user = user();

        mvc.perform(post(POSTS)
                        .with(as(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"title\": \"T\", \"status\": \"DRAFT\"}"))
                .andExpect(status().isCreated());

        assertThat(earned(user)).isEmpty();
    }

    @Test
    void publishingADraftCounts() throws Exception {
        User user = user();
        long id = publish(user);
        jdbc.update("DELETE FROM user_achievements");
        setPost(user, id, "DRAFT");
        assertThat(earned(user)).isEmpty();

        setPost(user, id, "PUBLISHED");

        assertThat(earned(user)).containsExactly("first-post");
    }

    @Test
    void fivePosts() throws Exception {
        User user = user();
        for (int i = 0; i < 4; i++) {
            publish(user);
        }
        assertThat(earned(user)).doesNotContain("five-posts");

        publish(user);

        assertThat(earned(user)).contains("five-posts");
    }

    @Test
    void publishingAgainCounts() throws Exception {
        User user = user();
        long moved = publish(user);
        setPost(user, moved, "DRAFT");
        for (int i = 0; i < 4; i++) {
            publish(user);
        }
        assertThat(earned(user)).doesNotContain("five-posts");

        setPost(user, moved, "PUBLISHED");

        assertThat(earned(user)).contains("five-posts");
    }

    @Test
    void approvedSite() throws Exception {
        User author = user();
        long site = submitted(author);

        mvc.perform(post("/api/v1/admin/sites/" + site + "/approve").with(admin()))
                .andExpect(status().isOk());

        assertThat(earned(author)).containsExactly("first-site");
    }

    @Test
    void rejectedSite() throws Exception {
        User author = user();
        long site = submitted(author);

        mvc.perform(post("/api/v1/admin/sites/" + site + "/reject")
                        .with(admin())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"reason\": \"Duplicate\"}"))
                .andExpect(status().isOk());

        assertThat(earned(author)).isEmpty();
    }

    @Test
    void deletingTheDiveKeepsTheAward() throws Exception {
        User user = user();
        long id = log(user, site("eg-dahab"), "10");

        mvc.perform(delete(LOG + "/" + id).with(as(user))).andExpect(status().isNoContent());

        assertThat(earned(user)).containsExactly("first-dive");
    }

    @Test
    void keepsTheFirstEarnedDate() throws Exception {
        User user = user();
        long site = site("eg-dahab");
        log(user, site, "10");
        jdbc.update(
                "UPDATE user_achievements SET earned_at = ? WHERE user_id = ?",
                java.sql.Timestamp.from(NOW),
                user.getId());

        log(user, site, "10");

        Instant earnedAt = jdbc.queryForObject(
                        "SELECT earned_at FROM user_achievements WHERE user_id = ? AND achievement_code = 'first-dive'",
                        java.sql.Timestamp.class,
                        user.getId())
                .toInstant();
        assertThat(earnedAt).isEqualTo(NOW);
    }
}
