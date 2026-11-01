package ua.ukma.divenet.achievement.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
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
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
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
abstract class AchievementTestBase {

    static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");
    static final String LOG = "/api/v1/dive-log";
    static final String POSTS = "/api/v1/posts";

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
        jdbc.update("DELETE FROM user_achievements");
        jdbc.update("DELETE FROM dive_log_entries");
        jdbc.update("DELETE FROM posts");
        jdbc.update("DELETE FROM sites");
    }

    User user() {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Mira", "x", Role.USER, NOW));
    }

    long site(String region) {
        return sites.save(new Site("Reef", regions.getReferenceById(region), 28, 34, 1, 5, 20, "x", Set.of(), NOW))
                .getId();
    }

    long submitted(User author) {
        return sites.save(Site.submission(
                        "Mine", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), author, NOW))
                .getId();
    }

    static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    static RequestPostProcessor admin() {
        return jwt().jwt(token -> token.subject("0").claim("roles", List.of("ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    ResultActions send(MockMvcRequestBuilder request, User user, String json) throws Exception {
        return mvc.perform(request.build()
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    interface MockMvcRequestBuilder {
        org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder build();
    }

    long log(User user, long siteId, String depth) throws Exception {
        String response = send(() -> MockMvcRequestBuilders.post(LOG), user, dive(siteId, depth))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    static String dive(long siteId, String depth) {
        return "{\"siteId\": %d, \"date\": \"2026-05-12\", \"maxDepth\": %s}".formatted(siteId, depth);
    }

    long publish(User user) throws Exception {
        String response = send(
                        () -> MockMvcRequestBuilders.post(POSTS),
                        user,
                        "{\"title\": \"T\", \"text\": \"Text\", \"status\": \"PUBLISHED\"}")
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    void setPost(User user, long id, String status) throws Exception {
        send(
                        () -> MockMvcRequestBuilders.put(POSTS + "/" + id),
                        user,
                        "{\"title\": \"T\", \"text\": \"Text\", \"status\": \"" + status + "\"}")
                .andExpect(status().isOk());
    }

    List<String> earned(User user) {
        return jdbc.queryForList(
                "SELECT achievement_code FROM user_achievements WHERE user_id = ?", String.class, user.getId());
    }
}
