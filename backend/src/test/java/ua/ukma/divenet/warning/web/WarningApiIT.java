package ua.ukma.divenet.warning.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec warning/warnings: the warning API. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class WarningApiIT {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

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

    User author;
    User other;
    User admin;
    long siteId;

    @BeforeEach
    void seed() {
        author = user("Mira Koval");
        other = user("Oleh Kravets");
        admin = users.save(new User(UUID.randomUUID() + "@example.com", "Admin", "x", Role.ADMIN, NOW));
        siteId = approvedSite("Blue Hole").getId();
    }

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM warnings");
        jdbc.update("DELETE FROM sites");
    }

    private User user(String displayName) {
        return users.save(new User(UUID.randomUUID() + "@example.com", displayName, "x", Role.USER, NOW));
    }

    private Site approvedSite(String name) {
        return sites.save(new Site(name, regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), NOW));
    }

    private Site pendingSite(User submitter) {
        return sites.save(Site.submission(
                "Pending Reef", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), submitter, NOW));
    }

    private static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    private static RequestPostProcessor asAdmin(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    private ResultActions create(User user, long site, String json) throws Exception {
        return mvc.perform(post("/api/v1/sites/" + site + "/warnings")
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private long warning(User user, long site, String type, String text) throws Exception {
        String body = create(user, site, "{\"type\":\"" + type + "\",\"text\":\"" + text + "\"}")
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private void setCreatedAt(long id, String iso) {
        Timestamp ts = Timestamp.from(Instant.parse(iso));
        jdbc.update("UPDATE warnings SET created_at = ?, updated_at = ? WHERE id = ?", ts, ts, id);
    }

    @Test
    void postWarning() throws Exception {
        String body = create(author, siteId, "{\"type\":\"HAZARD\",\"text\":\"Strong current on the bow line\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.siteId").value(siteId))
                .andExpect(jsonPath("$.type").value("HAZARD"))
                .andExpect(jsonPath("$.text").value("Strong current on the bow line"))
                .andExpect(jsonPath("$.author.id").value(author.getId()))
                .andExpect(jsonPath("$.author.displayName").value("Mira Koval"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        long id = ((Number) JsonPath.read(body, "$.id")).longValue();
        String createdAt = JsonPath.read(body, "$.createdAt");
        String updatedAt = JsonPath.read(body, "$.updatedAt");
        assertThat(createdAt).isEqualTo(updatedAt);

        create(author, siteId, "{\"type\":\"INCIDENT\",\"text\":\"Second warning\"}")
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", "/api/v1/warnings/" + (id + 1)));
    }

    @Test
    void anonymousPostIsUnauthorized() throws Exception {
        mvc.perform(post("/api/v1/sites/" + siteId + "/warnings")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"HAZARD\",\"text\":\"Current\"}"))
                .andExpect(status().isUnauthorized());

        assertThat(jdbc.queryForObject("SELECT count(*) FROM warnings", Integer.class))
                .isZero();
    }

    @Test
    void postToPendingSiteAnswersNotFound() throws Exception {
        long pendingId = pendingSite(author).getId();

        create(author, pendingId, "{\"type\":\"HAZARD\",\"text\":\"Current\"}")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void postToUnknownSiteAnswersNotFound() throws Exception {
        create(author, 999_999L, "{\"type\":\"HAZARD\",\"text\":\"Current\"}")
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void missingTypeAnswersBadRequest() throws Exception {
        create(author, siteId, "{\"text\":\"Current\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("type")));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM warnings", Integer.class))
                .isZero();
    }

    @Test
    void unknownTypeAnswersBadRequest() throws Exception {
        create(author, siteId, "{\"type\":\"SHARKNADO\",\"text\":\"Current\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("type")));
    }

    @Test
    void lowerCaseTypeIsAcceptedAndNormalized() throws Exception {
        create(author, siteId, "{\"type\":\"marine_life\",\"text\":\"Lionfish near the arch\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.type").value("MARINE_LIFE"));
    }

    @Test
    void blankTextAnswersBadRequest() throws Exception {
        create(author, siteId, "{\"type\":\"HAZARD\",\"text\":\"   \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("text")));
    }

    @Test
    void textTooLongAnswersBadRequest() throws Exception {
        String tooLong = "a".repeat(1001);
        create(author, siteId, "{\"type\":\"HAZARD\",\"text\":\"" + tooLong + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("text")));
    }

    @Test
    void textIsTrimmed() throws Exception {
        long id = warning(author, siteId, "HAZARD", "  Strong current  ");

        mvc.perform(get("/api/v1/warnings/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Strong current"));
    }

    @Test
    void listNewestFirstAndPaging() throws Exception {
        long w1 = warning(author, siteId, "HAZARD", "May 1");
        long w3 = warning(author, siteId, "INCIDENT", "May 3");
        long w2 = warning(other, siteId, "CHANGED_CONDITIONS", "May 2");
        setCreatedAt(w1, "2026-05-01T10:00:00Z");
        setCreatedAt(w3, "2026-05-03T10:00:00Z");
        setCreatedAt(w2, "2026-05-02T10:00:00Z");

        mvc.perform(get("/api/v1/sites/" + siteId + "/warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].text", contains("May 3", "May 2", "May 1")))
                .andExpect(jsonPath("$.page.totalElements").value(3));

        mvc.perform(get("/api/v1/sites/" + siteId + "/warnings")
                        .param("size", "2")
                        .param("page", "1"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].text", contains("May 1")))
                .andExpect(jsonPath("$.page.totalPages").value(2));
    }

    @Test
    void listExcludesOtherSitesWarnings() throws Exception {
        long otherSite = approvedSite("Canyon").getId();
        warning(author, siteId, "HAZARD", "Blue Hole warning");
        warning(author, otherSite, "HAZARD", "Canyon warning");

        mvc.perform(get("/api/v1/sites/" + siteId + "/warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].text", contains("Blue Hole warning")))
                .andExpect(jsonPath("$.page.totalElements").value(1));
    }

    @Test
    void listUnapprovedSiteAnswersNotFound() throws Exception {
        long pendingId = pendingSite(author).getId();

        mvc.perform(get("/api/v1/sites/" + pendingId + "/warnings"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void readOneWarningAndUnknownWarning() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Strong current");

        mvc.perform(get("/api/v1/warnings/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.text").value("Strong current"));

        mvc.perform(get("/api/v1/warnings/999999"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void authorEditsWarning() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Old text");
        setCreatedAt(id, "2026-05-01T10:00:00Z");

        String body = mvc.perform(put("/api/v1/warnings/" + id)
                        .with(as(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"CHANGED_CONDITIONS\",\"text\":\"  New text  \"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("CHANGED_CONDITIONS"))
                .andExpect(jsonPath("$.text").value("New text"))
                .andExpect(jsonPath("$.createdAt").value("2026-05-01T10:00:00Z"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        Instant updatedAt = Instant.parse(JsonPath.read(body, "$.updatedAt"));
        assertThat(updatedAt).isAfter(Instant.parse("2026-05-01T10:00:00Z"));
    }

    @Test
    void anotherUserCannotEditWarning() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Original");

        mvc.perform(put("/api/v1/warnings/" + id)
                        .with(as(other))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"INCIDENT\",\"text\":\"Changed\"}"))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mvc.perform(get("/api/v1/warnings/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.type").value("HAZARD"))
                .andExpect(jsonPath("$.text").value("Original"));
    }

    @Test
    void invalidEditLeavesWarningUnchanged() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Original");

        mvc.perform(put("/api/v1/warnings/" + id)
                        .with(as(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"HAZARD\",\"text\":\"   \"}"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("text")));

        mvc.perform(get("/api/v1/warnings/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Original"));
    }

    @Test
    void editUnknownAndAnonymous() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Original");

        mvc.perform(put("/api/v1/warnings/999999")
                        .with(as(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"HAZARD\",\"text\":\"Updated\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        mvc.perform(put("/api/v1/warnings/" + id)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"HAZARD\",\"text\":\"Updated\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void authorDeletesWarning() throws Exception {
        long id = warning(author, siteId, "HAZARD", "To be deleted");

        mvc.perform(delete("/api/v1/warnings/" + id).with(as(author))).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/sites/" + siteId + "/warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(0));
    }

    @Test
    void anotherUserAndAnonymousCannotDeleteWarning() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Keep me");

        mvc.perform(delete("/api/v1/warnings/" + id).with(as(other)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status").value(403));

        mvc.perform(delete("/api/v1/warnings/" + id)).andExpect(status().isUnauthorized());

        mvc.perform(get("/api/v1/warnings/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Keep me"));
    }

    @Test
    void adminHidesWarningAndHideTwiceIsIdempotent() throws Exception {
        long id = warning(author, siteId, "HAZARD", "False alarm");

        mvc.perform(post("/api/v1/admin/warnings/" + id + "/hide").with(asAdmin(admin)))
                .andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/sites/" + siteId + "/warnings"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.totalElements").value(0));

        mvc.perform(get("/api/v1/warnings/" + id))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        // Hide twice responds 204
        mvc.perform(post("/api/v1/admin/warnings/" + id + "/hide").with(asAdmin(admin)))
                .andExpect(status().isNoContent());

        Long hiddenBy = jdbc.queryForObject("SELECT hidden_by FROM warnings WHERE id = ?", Long.class, id);
        assertThat(hiddenBy).isEqualTo(admin.getId());
    }

    @Test
    void nonAdminCannotHideAndUnknownWarningAnswersNotFound() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Visible");

        mvc.perform(post("/api/v1/admin/warnings/" + id + "/hide").with(as(other)))
                .andExpect(status().isForbidden());

        mvc.perform(get("/api/v1/warnings/" + id)).andExpect(status().isOk());

        mvc.perform(post("/api/v1/admin/warnings/999999/hide").with(asAdmin(admin)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    void hiddenWarningIsGoneForAuthor() throws Exception {
        long id = warning(author, siteId, "HAZARD", "Hidden soon");

        mvc.perform(post("/api/v1/admin/warnings/" + id + "/hide").with(asAdmin(admin)))
                .andExpect(status().isNoContent());

        mvc.perform(put("/api/v1/warnings/" + id)
                        .with(as(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"type\":\"INCIDENT\",\"text\":\"Try edit\"}"))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));

        mvc.perform(delete("/api/v1/warnings/" + id).with(as(author)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }
}
