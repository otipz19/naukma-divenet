package ua.ukma.divenet.user.web;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Instant;
import java.util.List;
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
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
abstract class CertificateTestBase {

    static final String CERTS = "/api/v1/certificates";
    static final String ADMIN = "/api/v1/admin/certificates";

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Autowired
    MediaService media;

    @Autowired
    JdbcTemplate jdbc;

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM certificates");
    }

    User user() {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Mira Koval", "x", Role.USER, Instant.EPOCH));
    }

    static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    static RequestPostProcessor admin() {
        return jwt().jwt(token -> token.subject("0").claim("roles", List.of("ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));
    }

    UUID upload(User user) {
        return media.upload(user.getId(), TestImages.png(40, 30)).id();
    }

    static String body(String agency, String level, String number, UUID photo) {
        String photoJson = photo == null ? "null" : "\"" + photo + "\"";
        return """
                {"agency": "%s", "level": "%s", "number": "%s", "photoId": %s}
                """.formatted(agency, level, number, photoJson);
    }

    ResultActions declare(User user, String json) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.post(CERTS)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    ResultActions edit(User user, long id, String json) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.put(CERTS + "/" + id)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    long declared(User user, UUID photo) throws Exception {
        String response = declare(user, body("PADI", "Advanced Open Water", "A-1", photo))
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(response, "$.id")).longValue();
    }

    ResultActions verify(long id) throws Exception {
        return mvc.perform(
                MockMvcRequestBuilders.post(ADMIN + "/" + id + "/verify").with(admin()));
    }

    ResultActions reject(long id, String reason) throws Exception {
        return mvc.perform(MockMvcRequestBuilders.post(ADMIN + "/" + id + "/reject")
                .with(admin())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\": \"" + reason + "\"}"));
    }
}
