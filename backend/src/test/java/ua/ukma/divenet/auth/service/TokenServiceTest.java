package ua.ukma.divenet.auth.service;

import static org.assertj.core.api.Assertions.assertThat;

import com.nimbusds.jose.jwk.source.ImmutableSecret;
import java.nio.charset.StandardCharsets;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneOffset;
import javax.crypto.SecretKey;
import javax.crypto.spec.SecretKeySpec;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtEncoder;
import org.springframework.test.util.ReflectionTestUtils;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;

/** Spec auth "Access tokens are short-lived bearer tokens", scenario "Token lifetime". */
class TokenServiceTest {

    private static final Instant NOW = Instant.parse("2026-10-26T08:00:00Z");
    private static final SecretKey KEY =
            new SecretKeySpec("test-secret-of-at-least-32-bytes!!".getBytes(StandardCharsets.UTF_8), "HmacSHA256");

    @Test
    void accessTokenCarriesUserIdRoleAndFifteenMinuteExpiry() {
        TokenService tokens =
                new TokenService(new NimbusJwtEncoder(new ImmutableSecret<>(KEY)), Clock.fixed(NOW, ZoneOffset.UTC));
        User admin = new User("admin@divenet.test", "Admin", "{bcrypt}x", Role.ADMIN, NOW);
        ReflectionTestUtils.setField(admin, "id", 42L);

        String token = tokens.issueAccessToken(admin);

        NimbusJwtDecoder decoder = NimbusJwtDecoder.withSecretKey(KEY)
                .macAlgorithm(MacAlgorithm.HS256)
                .build();
        // The fixed clock lies in the past; check the claims, not the expiry against the real time.
        decoder.setJwtValidator(jwt -> OAuth2TokenValidatorResult.success());
        Jwt jwt = decoder.decode(token);
        assertThat(jwt.getSubject()).isEqualTo("42");
        assertThat(jwt.getClaimAsStringList("roles")).containsExactly("ADMIN");
        assertThat(jwt.getIssuedAt()).isEqualTo(NOW);
        assertThat(jwt.getExpiresAt()).isEqualTo(NOW.plusSeconds(900));
    }
}
