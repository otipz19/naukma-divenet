package ua.ukma.divenet.site.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;

import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Accounts, tokens and pending sites for the moderation tests. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
abstract class SiteApiTestBase {

    static final String SITES = "/api/v1/sites";
    static final String ADMIN_SITES = "/api/v1/admin/sites";
    static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

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

    @AfterEach
    void removeSites() {
        jdbc.update("DELETE FROM sites");
    }

    User user(String displayName) {
        return users.save(new User(UUID.randomUUID() + "@example.com", displayName, "x", Role.USER, NOW));
    }

    static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    static RequestPostProcessor admin() {
        return jwt().jwt(token -> token.subject("0").claim("roles", List.of("ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    Site pendingSite(String name, User author) {
        return sites.save(Site.submission(
                name, regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), author, NOW));
    }

    Site approvedSite(String name) {
        return sites.save(new Site(name, regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), NOW));
    }
}
