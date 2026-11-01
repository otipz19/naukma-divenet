package ua.ukma.divenet.divelog.web;

import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/** Spec divelog/entries: writing entries. */
class DiveLogApiIT extends DiveLogTestBase {

    private static LocalDate today() {
        return LocalDate.now(ZoneOffset.UTC);
    }

    private long create(User user, long siteId) throws Exception {
        String body = post(user, minimal(siteId, "2026-05-12"))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private void refused(User user, String json, String field) throws Exception {
        post(user, json).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem(field)));
    }

    @Test
    void onlyTheRequiredFields() throws Exception {
        Site site = site("Blue Hole");

        post(user(), minimal(site.getId(), "2026-05-12"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.siteName").value("Blue Hole"))
                .andExpect(jsonPath("$.countryCode").value("EG"))
                .andExpect(jsonPath("$.regionCode").value("eg-dahab"))
                .andExpect(jsonPath("$.date").value("2026-05-12"))
                .andExpect(jsonPath("$.maxDepth", nullValue()))
                .andExpect(jsonPath("$.current", nullValue()));
    }

    @Test
    void allFields() throws Exception {
        post(user(), """
                        {"siteId": %d, "date": "2026-05-12", "maxDepth": 30.4, "visibility": 25, "waterTemperature": -1.5,
                         "current": "MILD", "buddies": " Oleh ", "notes": "Turtle"}
                        """.formatted(site("Reef").getId()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maxDepth").value(30.4))
                .andExpect(jsonPath("$.waterTemperature").value(-1.5))
                .andExpect(jsonPath("$.current").value("MILD"))
                .andExpect(jsonPath("$.buddies").value("Oleh"))
                .andExpect(jsonPath("$.notes").value("Turtle"));
    }

    @Test
    void noAccessToken() throws Exception {
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(LOG)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(minimal(1, "2026-05-12")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void pendingSite() throws Exception {
        User user = user();
        Site pending = sites.save(Site.submission(
                "Hidden", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), user, NOW));

        refused(user, minimal(pending.getId(), "2026-05-12"), "siteId");
        refused(user, minimal(999999, "2026-05-12"), "siteId");
    }

    @Test
    void missingFields() throws Exception {
        refused(user(), "{\"date\": \"2026-05-12\"}", "siteId");
        refused(user(), "{\"siteId\": 1}", "date");
    }

    @Test
    void dateInTheFuture() throws Exception {
        refused(user(), minimal(site("Reef").getId(), today().plusDays(2).toString()), "date");
    }

    @Test
    void tomorrowInUtc() throws Exception {
        post(user(), minimal(site("Reef").getId(), today().plusDays(1).toString()))
                .andExpect(status().isCreated());
    }

    @Test
    void valuesOutOfRange() throws Exception {
        long id = site("Reef").getId();
        String prefix = "{\"siteId\": " + id + ", \"date\": \"2026-05-12\", ";

        refused(user(), prefix + "\"maxDepth\": 401}", "maxDepth");
        refused(user(), prefix + "\"visibility\": 201}", "visibility");
        refused(user(), prefix + "\"waterTemperature\": 41}", "waterTemperature");
        refused(user(), prefix + "\"current\": \"WILD\"}", "current");
        refused(user(), prefix + "\"buddies\": \"" + "x".repeat(201) + "\"}", "buddies");
        refused(user(), prefix + "\"notes\": \"" + "x".repeat(2001) + "\"}", "notes");
    }

    @Test
    void edit() throws Exception {
        User user = user();
        long siteId = site("Reef").getId();
        long id = create(user, siteId);

        mvc.perform(put(LOG + "/" + id)
                        .with(as(user))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"siteId\": " + siteId + ", \"date\": \"2026-05-13\", \"maxDepth\": 12.5}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.date").value("2026-05-13"))
                .andExpect(jsonPath("$.maxDepth").value(12.5));
    }

    @Test
    void deleteEntry() throws Exception {
        User user = user();
        long id = create(user, site("Reef").getId());

        mvc.perform(delete(LOG + "/" + id).with(as(user))).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/users/" + user.getId() + "/dive-log"))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void anotherUser() throws Exception {
        User user = user();
        long siteId = site("Reef").getId();
        long id = create(user, siteId);

        mvc.perform(put(LOG + "/" + id)
                        .with(as(user()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(minimal(siteId, "2026-01-01")))
                .andExpect(status().isForbidden());
        mvc.perform(delete(LOG + "/" + id).with(as(user()))).andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/users/" + user.getId() + "/dive-log"))
                .andExpect(jsonPath("$.content[0].date").value("2026-05-12"));
    }

    @Test
    void unknownEntry() throws Exception {
        mvc.perform(put(LOG + "/999999")
                        .with(as(user()))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(minimal(site("Reef").getId(), "2026-05-12")))
                .andExpect(status().isNotFound());
    }
}
