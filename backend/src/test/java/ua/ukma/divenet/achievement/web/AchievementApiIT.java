package ua.ukma.divenet.achievement.web;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.everyItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import ua.ukma.divenet.user.domain.User;

/** Spec achievement/achievements, "The API reports achievements and progress". */
class AchievementApiIT extends AchievementTestBase {

    private static String path(User user) {
        return "/api/v1/users/" + user.getId() + "/achievements";
    }

    private User hiding() {
        User user = user();
        user.updateProfile(null, null, true, false, true);
        return users.save(user);
    }

    @Test
    void earnedAndLocked() throws Exception {
        User user = user();
        long site = site("eg-dahab");
        for (int i = 0; i < 3; i++) {
            log(user, site, "10");
        }

        mvc.perform(get(path(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath(
                        "$[*].code",
                        contains(
                                "first-dive",
                                "ten-dives",
                                "ten-sites",
                                "globetrotter",
                                "deep-diver",
                                "first-post",
                                "five-posts",
                                "first-site")))
                .andExpect(jsonPath("$[0].target").value(1))
                .andExpect(jsonPath("$[0].progress").value(1))
                .andExpect(jsonPath("$[0].earnedAt").isNotEmpty())
                .andExpect(jsonPath("$[1].target").value(10))
                .andExpect(jsonPath("$[1].progress").value(3))
                .andExpect(jsonPath("$[1].earnedAt", nullValue()));
    }

    @Test
    void depthIsRoundedDown() throws Exception {
        User user = user();
        log(user, site("eg-dahab"), "39.9");

        mvc.perform(get(path(user)))
                .andExpect(jsonPath("$[4].code").value("deep-diver"))
                .andExpect(jsonPath("$[4].progress").value(39))
                .andExpect(jsonPath("$[4].earnedAt", nullValue()));
    }

    @Test
    void progressIsCappedAtTheTarget() throws Exception {
        User user = user();
        log(user, site("eg-dahab"), "45");

        mvc.perform(get(path(user))).andExpect(jsonPath("$[4].progress").value(40));
    }

    @Test
    void progressAfterADeletion() throws Exception {
        User user = user();
        long id = log(user, site("eg-dahab"), "10");
        mvc.perform(delete(LOG + "/" + id).with(as(user))).andExpect(status().isNoContent());

        mvc.perform(get(path(user)))
                .andExpect(jsonPath("$[0].progress").value(0))
                .andExpect(jsonPath("$[0].earnedAt").isNotEmpty());
    }

    @Test
    void statisticsHidden() throws Exception {
        User user = hiding();
        log(user, site("eg-dahab"), "10");

        mvc.perform(get(path(user)))
                .andExpect(jsonPath("$[*].progress").value(everyItem(nullValue())))
                .andExpect(jsonPath("$[0].earnedAt").isNotEmpty());
        mvc.perform(get(path(user)).with(as(user()))).andExpect(jsonPath("$[1].progress", nullValue()));
        mvc.perform(get(path(user)).with(admin())).andExpect(jsonPath("$[1].progress", nullValue()));
    }

    @Test
    void ownerWithStatisticsHidden() throws Exception {
        User user = hiding();
        log(user, site("eg-dahab"), "10");

        mvc.perform(get(path(user)).with(as(user)))
                .andExpect(jsonPath("$[1].progress").value(1));
    }

    @Test
    void unknownUser() throws Exception {
        mvc.perform(get("/api/v1/users/999999/achievements")).andExpect(status().isNotFound());
    }
}
