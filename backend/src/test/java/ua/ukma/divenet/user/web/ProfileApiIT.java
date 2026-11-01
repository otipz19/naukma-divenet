package ua.ukma.divenet.user.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec user/profile, server scenarios. */
@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ProfileApiIT {

    private static final String USERS = "/api/v1/users/";
    private static final String ME = "/api/v1/users/me";

    @Autowired
    MockMvc mvc;

    @Autowired
    UserRepository users;

    @Autowired
    MediaService media;

    private User user() {
        return users.save(
                new User(UUID.randomUUID() + "@example.com", "Mira Koval", "secret-hash", Role.USER, Instant.EPOCH));
    }

    private static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    private UUID upload(User user) {
        return media.upload(user.getId(), TestImages.png(40, 30)).id();
    }

    private static String body(String bio, UUID avatarId) {
        String bioJson = bio == null ? "null" : "\"" + bio + "\"";
        String avatarJson = avatarId == null ? "null" : "\"" + avatarId + "\"";
        return """
                {"bio": %s, "avatarId": %s, "showDiveLog": false, "showStatistics": true, "showCertificates": true}
                """.formatted(bioJson, avatarJson);
    }

    private ResultActions edit(User user, String json) throws Exception {
        return mvc.perform(
                put(ME).with(as(user)).contentType(MediaType.APPLICATION_JSON).content(json));
    }

    @Test
    void anonymousRead() throws Exception {
        User user = user();
        UUID avatar = upload(user);
        edit(user, body("Wreck diver", avatar)).andExpect(status().isOk());

        mvc.perform(get(USERS + user.getId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayName").value("Mira Koval"))
                .andExpect(jsonPath("$.bio").value("Wreck diver"))
                .andExpect(jsonPath("$.avatar.url").value("/media/" + avatar))
                .andExpect(jsonPath("$.avatar.thumbnailUrl").value("/media/" + avatar + "/thumb"))
                .andExpect(jsonPath("$.avatar.width").value(40))
                .andExpect(jsonPath("$.showDiveLog").value(false))
                .andExpect(jsonPath("$.email").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.role").doesNotHaveJsonPath())
                .andExpect(jsonPath("$.passwordHash").doesNotHaveJsonPath());
    }

    @Test
    void newAccount() throws Exception {
        mvc.perform(get(USERS + user().getId()))
                .andExpect(jsonPath("$.bio", nullValue()))
                .andExpect(jsonPath("$.avatar", nullValue()))
                .andExpect(jsonPath("$.showDiveLog").value(true))
                .andExpect(jsonPath("$.showStatistics").value(true))
                .andExpect(jsonPath("$.showCertificates").value(true));
    }

    @Test
    void unknownUser() throws Exception {
        mvc.perform(get(USERS + "999999")).andExpect(status().isNotFound());
    }

    @Test
    void blankBio() throws Exception {
        edit(user(), body("   ", null)).andExpect(status().isOk()).andExpect(jsonPath("$.bio", nullValue()));
    }

    @Test
    void noAccessToken() throws Exception {
        mvc.perform(put(ME).contentType(MediaType.APPLICATION_JSON).content(body("x", null)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void bioTooLong() throws Exception {
        edit(user(), body("x".repeat(501), null))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("bio")));
    }

    @Test
    void missingSetting() throws Exception {
        edit(user(), "{\"showDiveLog\": true, \"showStatistics\": true}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("showCertificates")));
    }

    @Test
    void replacingTheAvatar() throws Exception {
        User user = user();
        UUID first = upload(user);
        UUID second = upload(user);
        edit(user, body(null, first)).andExpect(status().isOk());

        edit(user, body(null, second))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar.id").value(second.toString()));

        mvc.perform(get("/media/" + first)).andExpect(status().isNotFound());
        mvc.perform(get("/media/" + second)).andExpect(status().isOk());
    }

    @Test
    void keepingTheAvatar() throws Exception {
        User user = user();
        UUID avatar = upload(user);
        edit(user, body(null, avatar)).andExpect(status().isOk());

        edit(user, body("New bio", avatar)).andExpect(status().isOk());

        mvc.perform(get("/media/" + avatar)).andExpect(status().isOk());
    }

    @Test
    void removingTheAvatar() throws Exception {
        User user = user();
        UUID avatar = upload(user);
        edit(user, body(null, avatar)).andExpect(status().isOk());

        edit(user, body(null, null)).andExpect(status().isOk()).andExpect(jsonPath("$.avatar", nullValue()));

        mvc.perform(get("/media/" + avatar)).andExpect(status().isNotFound());
    }

    @Test
    void anotherUsersUpload() throws Exception {
        User user = user();
        edit(user, body("Kept", null)).andExpect(status().isOk());
        UUID foreign = upload(user());

        edit(user, body("Changed", foreign))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItem("avatarId")));

        assertThat(users.findById(user.getId()).orElseThrow().getBio()).isEqualTo("Kept");
    }
}
