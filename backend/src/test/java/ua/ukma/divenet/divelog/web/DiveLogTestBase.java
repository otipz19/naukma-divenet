package ua.ukma.divenet.divelog.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
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

@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
abstract class DiveLogTestBase {

    static final String LOG = "/api/v1/dive-log";
    static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Autowired
    SiteRepository sites;

    @Autowired
    RegionRepository regions;

    @Autowired
    JdbcTemplate jdbc;

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM dive_log_entries");
        jdbc.update("DELETE FROM sites");
    }

    User user() {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Mira", "x", Role.USER, NOW));
    }

    Site site(String name) {
        return sites.save(new Site(name, regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), NOW));
    }

    static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    static String minimal(long siteId, String date) {
        return "{\"siteId\": " + siteId + ", \"date\": \"" + date + "\"}";
    }

    ResultActions post(User user, String json) throws Exception {
        return mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post(LOG)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    void logged(User user, long siteId, String date, String maxDepth) throws Exception {
        String depth = maxDepth == null ? "" : ", \"maxDepth\": " + maxDepth;
        post(
                        user,
                        "{\"siteId\": " + siteId + ", \"date\": \"" + date + "\"" + depth
                                + ", \"buddies\": \"Oleh\", \"notes\": \"Turtle\"}")
                .andExpect(status().isCreated());
    }
}
