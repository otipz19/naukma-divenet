package ua.ukma.divenet.user.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.AfterEach;
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
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec user/gear-locker. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GearLockerApiIT {

    private static final String LOCKER = "/api/v1/gear-locker";

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Autowired
    JdbcTemplate jdbc;

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM locker_items");
    }

    private User user() {
        return users.save(new User(UUID.randomUUID() + "@example.com", "Mira", "x", Role.USER, Instant.EPOCH));
    }

    private static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    private ResultActions add(User user, String name) throws Exception {
        return mvc.perform(post(LOCKER)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"name\": \"" + name + "\"}"));
    }

    private long added(User user, String name) throws Exception {
        String body = add(user, name)
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return ((Number) JsonPath.read(body, "$.id")).longValue();
    }

    private static String path(User user) {
        return "/api/v1/users/" + user.getId() + "/gear-locker";
    }

    private long count(User user) {
        return jdbc.queryForObject("SELECT count(*) FROM locker_items WHERE user_id = ?", Long.class, user.getId());
    }

    @Test
    void readingIgnoresCaseInTheOrder() throws Exception {
        User user = user();
        added(user, "regulator");
        added(user, "BCD");

        mvc.perform(get(path(user)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", contains("BCD", "regulator")));
    }

    @Test
    void unknownUser() throws Exception {
        mvc.perform(get("/api/v1/users/999999/gear-locker")).andExpect(status().isNotFound());
    }

    @Test
    void adding() throws Exception {
        add(user(), " Regulator ")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.name").value("Regulator"));
    }

    @Test
    void twoOfTheSame() throws Exception {
        User user = user();
        added(user, "Tank");
        added(user, "Tank");

        assertThat(count(user)).isEqualTo(2);
    }

    @Test
    void invalidName() throws Exception {
        User user = user();

        add(user, "  ").andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("name")));
        add(user, "x".repeat(101))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("name")));

        assertThat(count(user)).isZero();
    }

    @Test
    void lockerFull() throws Exception {
        User user = user();
        jdbc.update(
                "INSERT INTO locker_items (user_id, name, created_at) SELECT ?, 'Item', now() FROM generate_series(1, 100)",
                user.getId());

        add(user, "One more")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("name")));

        assertThat(count(user)).isEqualTo(100);
    }

    @Test
    void anonymousVisitor() throws Exception {
        mvc.perform(post(LOCKER).contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"Tank\"}"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void removing() throws Exception {
        User user = user();
        long id = added(user, "Tank");

        mvc.perform(delete(LOCKER + "/" + id).with(as(user))).andExpect(status().isNoContent());

        assertThat(count(user)).isZero();
    }

    @Test
    void someoneElsesItem() throws Exception {
        User user = user();
        long id = added(user, "Tank");
        RequestPostProcessor admin = jwt().jwt(token -> token.subject("0").claim("roles", List.of("ADMIN")))
                .authorities(new SimpleGrantedAuthority("ROLE_ADMIN"));

        mvc.perform(delete(LOCKER + "/" + id).with(as(user()))).andExpect(status().isNotFound());
        mvc.perform(delete(LOCKER + "/" + id).with(admin)).andExpect(status().isNotFound());

        assertThat(count(user)).isEqualTo(1);
    }

    @Test
    void unknownItem() throws Exception {
        mvc.perform(delete(LOCKER + "/999999").with(as(user()))).andExpect(status().isNotFound());
    }
}
