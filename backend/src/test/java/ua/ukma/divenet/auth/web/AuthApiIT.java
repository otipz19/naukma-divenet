package ua.ukma.divenet.auth.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import jakarta.servlet.http.Cookie;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.List;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.JwsHeader;
import org.springframework.security.oauth2.jwt.JwtClaimsSet;
import org.springframework.security.oauth2.jwt.JwtEncoder;
import org.springframework.security.oauth2.jwt.JwtEncoderParameters;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec auth: registration, login, access tokens, the refresh cookie, rotation, logout and /me. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AuthApiIT {

    private static final String AUTH = "/api/v1/auth";
    private static final String PASSWORD = "correct-horse";

    @Autowired
    MockMvc mvc;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    JwtEncoder jwtEncoder;

    // --- Registration -------------------------------------------------------------------------

    @Test
    void successfulRegistration() throws Exception {
        String email = "Mira." + UUID.randomUUID() + "@Example.com";
        MvcResult result = mvc.perform(post(AUTH + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(email, " Mira Koval ", PASSWORD)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.tokenType").value("Bearer"))
                .andExpect(jsonPath("$.user.email").value(email.toLowerCase()))
                .andExpect(jsonPath("$.user.displayName").value("Mira Koval"))
                .andExpect(jsonPath("$.user.role").value("USER"))
                .andReturn();

        assertThat(refreshCookie(result)).isNotBlank();
        assertThat(result.getResponse().getContentAsString())
                .doesNotContain(PASSWORD)
                .doesNotContain("{bcrypt}");
    }

    @Test
    void emailAlreadyTaken() throws Exception {
        String email = unique();
        register(email);

        mvc.perform(post(AUTH + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(email.toUpperCase(), "Someone Else", PASSWORD)))
                .andExpect(status().isConflict())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM users WHERE email = ?", Integer.class, email))
                .isEqualTo(1);
    }

    @Test
    void shortPassword() throws Exception {
        mvc.perform(post(AUTH + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(unique(), "Mira", "short")))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.errors[*].field", hasItems("password")));
    }

    @Test
    void severalInvalidFields() throws Exception {
        mvc.perform(post(AUTH + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json("not-an-email", "  ", PASSWORD)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItems("email", "displayName")));
    }

    @Test
    void passwordTooLongForTheHash() throws Exception {
        String cyrillic = "ж".repeat(40);
        assertThat(cyrillic.getBytes(StandardCharsets.UTF_8)).hasSize(80);

        mvc.perform(post(AUTH + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(unique(), "Mira", cyrillic)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", hasItems("password")));
    }

    @Test
    void storedHash() throws Exception {
        String email = unique();
        register(email);

        String stored = jdbc.queryForObject("SELECT password_hash FROM users WHERE email = ?", String.class, email);
        assertThat(stored).startsWith("{bcrypt}").doesNotContain(PASSWORD);
    }

    // --- Login --------------------------------------------------------------------------------

    @Test
    void successfulLogin() throws Exception {
        String email = unique();
        register(email);

        MvcResult result = login(email.toUpperCase(), PASSWORD)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andExpect(jsonPath("$.user.email").value(email))
                .andReturn();
        assertThat(refreshCookie(result)).isNotBlank();
    }

    @Test
    void wrongPasswordAndUnknownEmailLookTheSame() throws Exception {
        String email = unique();
        register(email);

        MvcResult wrongPassword = login(email, "wrong-password")
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andReturn();
        MvcResult unknownEmail =
                login(unique(), PASSWORD).andExpect(status().isUnauthorized()).andReturn();

        for (String field : List.of("$.title", "$.detail")) {
            assertThat((String) JsonPath.read(unknownEmail.getResponse().getContentAsString(), field))
                    .isEqualTo(JsonPath.read(wrongPassword.getResponse().getContentAsString(), field));
        }
        assertThat(wrongPassword.getResponse().getHeaders(HttpHeaders.SET_COOKIE))
                .isEmpty();
        assertThat(unknownEmail.getResponse().getHeaders(HttpHeaders.SET_COOKIE))
                .isEmpty();
    }

    @Test
    void overlongPasswordOnLoginIsAWrongPassword() throws Exception {
        login(unique(), "x".repeat(100)).andExpect(status().isUnauthorized());
    }

    // --- Access tokens ------------------------------------------------------------------------

    @Test
    void tokenLifetime() throws Exception {
        login(registerAndEmail(), PASSWORD).andExpect(jsonPath("$.expiresIn").value(900));
    }

    @Test
    void expiredToken() throws Exception {
        Instant issued = Instant.now().minusSeconds(20 * 60);
        JwtClaimsSet claims = JwtClaimsSet.builder()
                .subject("1")
                .issuedAt(issued)
                .expiresAt(issued.plusSeconds(15 * 60))
                .claim("roles", List.of("USER"))
                .build();
        String token = jwtEncoder
                .encode(JwtEncoderParameters.from(
                        JwsHeader.with(MacAlgorithm.HS256).build(), claims))
                .getTokenValue();

        mvc.perform(get(AUTH + "/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void tamperedToken() throws Exception {
        String token = accessToken(register(unique()));
        String[] parts = token.split("\\.");
        String payload = new String(Base64.getUrlDecoder().decode(parts[1]), StandardCharsets.UTF_8);
        String forged = Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(payload.replace("\"USER\"", "\"ADMIN\"").getBytes(StandardCharsets.UTF_8));
        String tampered = parts[0] + "." + forged + "." + parts[2];

        mvc.perform(get("/api/v1/does-not-exist").header(HttpHeaders.AUTHORIZATION, "Bearer " + tampered))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    // --- Refresh cookie -----------------------------------------------------------------------

    @Test
    void cookieAttributes() throws Exception {
        MvcResult result = login(registerAndEmail(), PASSWORD).andReturn();

        String setCookie = refreshSetCookie(result);
        assertThat(setCookie)
                .contains("HttpOnly")
                .contains("Secure")
                .contains("SameSite=Strict")
                .contains("Path=/api/v1/auth")
                .contains("Max-Age=1209600");
        assertThat(result.getResponse().getContentAsString()).doesNotContain(refreshCookie(result));
    }

    @Test
    void onlyTheHashIsStored() throws Exception {
        String value = refreshCookie(login(registerAndEmail(), PASSWORD).andReturn());

        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM refresh_tokens WHERE token_hash = ?", Integer.class, value))
                .isZero();
        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM refresh_tokens WHERE token_hash = ?", Integer.class, sha256(value)))
                .isEqualTo(1);
    }

    // --- Refresh and rotation -----------------------------------------------------------------

    @Test
    void successfulRefresh() throws Exception {
        MvcResult login = login(registerAndEmail(), PASSWORD).andReturn();
        String first = refreshCookie(login);

        MvcResult refreshed = refresh(first)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty())
                .andReturn();

        assertThat(refreshCookie(refreshed)).isNotBlank().isNotEqualTo(first);
    }

    @Test
    void noCookie() throws Exception {
        mvc.perform(post(AUTH + "/refresh"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void expiredRefreshToken() throws Exception {
        String value = refreshCookie(login(registerAndEmail(), PASSWORD).andReturn());
        jdbc.update(
                "UPDATE refresh_tokens SET created_at = now() - interval '15 days', expires_at = now() - interval '1 day'"
                        + " WHERE token_hash = ?",
                sha256(value));

        MvcResult result = refresh(value).andExpect(status().isUnauthorized()).andReturn();
        assertThat(refreshSetCookie(result)).contains("Max-Age=0");
    }

    @Test
    void replayAfterRotation() throws Exception {
        String tokenA = refreshCookie(login(registerAndEmail(), PASSWORD).andReturn());
        String tokenB = refreshCookie(refresh(tokenA).andExpect(status().isOk()).andReturn());

        refresh(tokenA).andExpect(status().isUnauthorized());
        refresh(tokenB).andExpect(status().isUnauthorized());
    }

    @Test
    void otherSessionsAreUnaffected() throws Exception {
        String email = registerAndEmail();
        String deviceOne = refreshCookie(login(email, PASSWORD).andReturn());
        String deviceTwo = refreshCookie(login(email, PASSWORD).andReturn());

        refresh(deviceOne).andExpect(status().isOk());
        refresh(deviceOne).andExpect(status().isUnauthorized());

        refresh(deviceTwo).andExpect(status().isOk());
    }

    // --- Logout -------------------------------------------------------------------------------

    @Test
    void logoutRevokesTheToken() throws Exception {
        String value = refreshCookie(login(registerAndEmail(), PASSWORD).andReturn());

        MvcResult logout = mvc.perform(post(AUTH + "/logout").cookie(new Cookie(RefreshCookie.NAME, value)))
                .andExpect(status().isNoContent())
                .andReturn();
        assertThat(refreshSetCookie(logout)).contains("Max-Age=0");

        refresh(value).andExpect(status().isUnauthorized());
    }

    @Test
    void logoutWithoutASession() throws Exception {
        mvc.perform(post(AUTH + "/logout")).andExpect(status().isNoContent());
        mvc.perform(post(AUTH + "/logout").cookie(new Cookie(RefreshCookie.NAME, "unknown")))
                .andExpect(status().isNoContent());
    }

    // --- Current user -------------------------------------------------------------------------

    @Test
    void signedIn() throws Exception {
        String email = unique();
        String token = accessToken(register(email));

        mvc.perform(get(AUTH + "/me").header(HttpHeaders.AUTHORIZATION, "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.displayName").value("Mira Koval"))
                .andExpect(jsonPath("$.role").value("USER"));
    }

    @Test
    void anonymous() throws Exception {
        mvc.perform(get(AUTH + "/me"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    // --- Helpers ------------------------------------------------------------------------------

    private static String unique() {
        return "diver-" + UUID.randomUUID() + "@example.com";
    }

    private static String json(String email, String displayName, String password) {
        return """
                {"email": "%s", "displayName": "%s", "password": "%s"}""".formatted(email, displayName, password);
    }

    private MvcResult register(String email) throws Exception {
        return mvc.perform(post(AUTH + "/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(email, "Mira Koval", PASSWORD)))
                .andExpect(status().isCreated())
                .andReturn();
    }

    private String registerAndEmail() throws Exception {
        String email = unique();
        register(email);
        return email;
    }

    private ResultActions login(String email, String password) throws Exception {
        return mvc.perform(
                post(AUTH + "/login").contentType(MediaType.APPLICATION_JSON).content("""
                        {"email": "%s", "password": "%s"}""".formatted(email, password)));
    }

    private ResultActions refresh(String value) throws Exception {
        return mvc.perform(post(AUTH + "/refresh").cookie(new Cookie(RefreshCookie.NAME, value)));
    }

    private static String accessToken(MvcResult result) throws Exception {
        return JsonPath.read(result.getResponse().getContentAsString(), "$.accessToken");
    }

    private static String refreshSetCookie(MvcResult result) {
        return result.getResponse().getHeaders(HttpHeaders.SET_COOKIE).stream()
                .filter(h -> h.startsWith(RefreshCookie.NAME + "="))
                .findFirst()
                .orElseThrow(() -> new AssertionError("no refresh_token cookie was set"));
    }

    private static String refreshCookie(MvcResult result) {
        String header = refreshSetCookie(result);
        return header.substring(RefreshCookie.NAME.length() + 1, header.indexOf(';'));
    }

    private static String sha256(String value) throws Exception {
        return HexFormat.of()
                .formatHex(MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    }
}
