package ua.ukma.divenet.divelog.web;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import ua.ukma.divenet.user.domain.User;

/** Spec divelog/entries: reading a diver's log within their privacy settings. */
class DiveLogPrivacyApiIT extends DiveLogTestBase {

    private static String path(User user, String section) {
        return "/api/v1/users/" + user.getId() + "/" + section;
    }

    private User hiding(boolean log, boolean statistics) {
        User user = user();
        user.updateProfile(null, null, !log, !statistics, true);
        return users.save(user);
    }

    @Test
    void publicLogNewestFirst() throws Exception {
        User diver = user();
        long siteId = site("Reef").getId();
        logged(diver, siteId, "2026-05-11", null);
        logged(diver, siteId, "2026-05-13", null);
        logged(diver, siteId, "2026-05-12", null);

        mvc.perform(get(path(diver, "dive-log")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].date", contains("2026-05-13", "2026-05-12", "2026-05-11")));
    }

    @Test
    void hiddenLog() throws Exception {
        User diver = hiding(true, false);

        mvc.perform(get(path(diver, "dive-log"))).andExpect(status().isForbidden());
        mvc.perform(get(path(diver, "visited-sites"))).andExpect(status().isForbidden());
        mvc.perform(get(path(diver, "dive-log")).with(as(user()))).andExpect(status().isForbidden());
        mvc.perform(get(path(diver, "visited-sites")).with(as(user()))).andExpect(status().isForbidden());
    }

    @Test
    void ownerOfAHiddenLog() throws Exception {
        User diver = hiding(true, false);
        logged(diver, site("Reef").getId(), "2026-05-12", null);

        mvc.perform(get(path(diver, "dive-log")).with(as(diver)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1));
        mvc.perform(get(path(diver, "visited-sites")).with(as(diver))).andExpect(status().isOk());
    }

    @Test
    void visitedSites() throws Exception {
        User diver = user();
        long canyon = site("Canyon").getId();
        long anchor = site("Anchor Bay").getId();
        logged(diver, canyon, "2026-05-11", null);
        logged(diver, canyon, "2026-05-12", null);
        logged(diver, anchor, "2026-05-13", null);

        mvc.perform(get(path(diver, "visited-sites")))
                .andExpect(jsonPath("$[*].name", contains("Anchor Bay", "Canyon")))
                .andExpect(jsonPath("$[*].dives", contains(1, 2)))
                .andExpect(jsonPath("$[0].regionCode").value("eg-dahab"));
    }

    @Test
    void unknownUser() throws Exception {
        mvc.perform(get("/api/v1/users/999999/dive-log")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/users/999999/visited-sites")).andExpect(status().isNotFound());
        mvc.perform(get("/api/v1/users/999999/dive-stats")).andExpect(status().isNotFound());
    }

    @Test
    void buddiesAndNotesForAnotherReader() throws Exception {
        User diver = user();
        logged(diver, site("Reef").getId(), "2026-05-12", "30.4");

        mvc.perform(get(path(diver, "dive-log")))
                .andExpect(jsonPath("$.content[0].buddies", nullValue()))
                .andExpect(jsonPath("$.content[0].notes", nullValue()))
                .andExpect(jsonPath("$.content[0].maxDepth").value(30.4));
        mvc.perform(get(path(diver, "dive-log")).with(as(user())))
                .andExpect(jsonPath("$.content[0].buddies", nullValue()));
    }

    @Test
    void buddiesAndNotesForTheOwner() throws Exception {
        User diver = user();
        logged(diver, site("Reef").getId(), "2026-05-12", null);

        mvc.perform(get(path(diver, "dive-log")).with(as(diver)))
                .andExpect(jsonPath("$.content[0].buddies").value("Oleh"))
                .andExpect(jsonPath("$.content[0].notes").value("Turtle"));
    }

    @Test
    void statistics() throws Exception {
        User diver = user();
        long first = site("First").getId();
        logged(diver, first, "2026-05-11", "10");
        logged(diver, first, "2026-05-12", "30.4");
        logged(diver, site("Second").getId(), "2026-05-13", null);

        mvc.perform(get(path(diver, "dive-stats")))
                .andExpect(jsonPath("$.dives").value(3))
                .andExpect(jsonPath("$.sites").value(2))
                .andExpect(jsonPath("$.deepest").value(30.4));
    }

    @Test
    void noDives() throws Exception {
        mvc.perform(get(path(user(), "dive-stats")))
                .andExpect(jsonPath("$.dives").value(0))
                .andExpect(jsonPath("$.sites").value(0))
                .andExpect(jsonPath("$.deepest", nullValue()));
    }

    @Test
    void hiddenStatistics() throws Exception {
        User diver = hiding(false, true);

        mvc.perform(get(path(diver, "dive-stats")).with(as(user()))).andExpect(status().isForbidden());
        mvc.perform(get(path(diver, "dive-stats")).with(as(diver))).andExpect(status().isOk());
    }
}
