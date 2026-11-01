package ua.ukma.divenet.post.web;

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
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
abstract class PostTestBase {

    static final String POSTS = "/api/v1/posts";
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
    MediaService media;

    @Autowired
    JdbcTemplate jdbc;

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM posts");
        jdbc.update("DELETE FROM sites");
    }

    User user() {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Mira Koval", "x", Role.USER, NOW));
    }

    Site site(String regionCode) {
        return sites.save(new Site("Reef", regions.getReferenceById(regionCode), 28, 34, 1, 5, 20, "x", Set.of(), NOW));
    }

    UUID upload(User user) {
        return media.upload(user.getId(), TestImages.png(40, 30)).id();
    }

    boolean exists(UUID upload) {
        return !media.views(List.of(upload)).isEmpty();
    }

    static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    static RequestPostProcessor admin() {
        return jwt().jwt(token -> token.subject("0").claim("roles", List.of("ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    static String draft(String title) {
        return "{\"title\": \"" + title + "\", \"status\": \"DRAFT\"}";
    }

    static String published(String title) {
        return "{\"title\": \"" + title + "\", \"text\": \"Some text\", \"status\": \"PUBLISHED\"}";
    }

    ResultActions write(User user, String json) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.post(POSTS)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    ResultActions edit(User user, long id, String json) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.put(POSTS + "/" + id)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    long written(User user, String json) throws Exception {
        String response = write(user, json)
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }
}
