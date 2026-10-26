package ua.ukma.divenet.shared.security;

import java.nio.charset.StandardCharsets;
import org.jspecify.annotations.Nullable;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;

/**
 * Settings of {@code divenet.auth}, read from {@code JWT_SECRET} and {@code ADMIN_*} (design D8).
 *
 * @param jwtSecret HMAC key for access tokens; at least 32 bytes in UTF-8
 * @param admin the first admin, created at startup when email and password are set
 */
@ConfigurationProperties("divenet.auth")
public record AuthProperties(String jwtSecret, @DefaultValue Admin admin) {

    public static final int MIN_SECRET_BYTES = 32;

    public AuthProperties {
        if (jwtSecret == null || jwtSecret.getBytes(StandardCharsets.UTF_8).length < MIN_SECRET_BYTES) {
            throw new IllegalStateException(
                    "JWT_SECRET must be at least " + MIN_SECRET_BYTES + " bytes long (divenet.auth.jwt-secret).");
        }
    }

    public byte[] jwtSecretBytes() {
        return jwtSecret.getBytes(StandardCharsets.UTF_8);
    }

    /** Blank values count as unset, so {@code ADMIN_EMAIL=} in an env file disables the bootstrap. */
    public record Admin(
            @Nullable String email,
            @Nullable String password,
            @DefaultValue("Admin") String displayName) {

        public boolean isConfigured() {
            return email != null && !email.isBlank() && password != null && !password.isBlank();
        }
    }
}
