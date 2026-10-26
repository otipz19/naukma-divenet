package ua.ukma.divenet.auth.web;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import ua.ukma.divenet.auth.service.AuthResult;
import ua.ukma.divenet.auth.service.UserView;

/** Request and response bodies of {@code /api/v1/auth} (design D9). */
final class AuthDtos {

    private AuthDtos() {}

    /** Email and display name are trimmed before validation. */
    record RegisterRequest(
            @NotBlank @Email @Size(max = 254) String email,
            @NotBlank @Size(max = 50) String displayName,
            @NotBlank @Size(min = 8) @MaxUtf8Bytes(72) String password) {

        RegisterRequest {
            email = email == null ? null : email.strip();
            displayName = displayName == null ? null : displayName.strip();
        }
    }

    /** No format rules: a malformed login gets the same 401 as a wrong one. */
    record LoginRequest(@NotBlank String email, @NotBlank String password) {}

    /** Every property is always present, so the generated front-end types are not optional. */
    @Schema(requiredProperties = {"id", "email", "displayName", "role"})
    record UserResponse(
            long id,
            String email,
            String displayName,
            @Schema(allowableValues = {"USER", "ADMIN"}) String role) {

        static UserResponse of(UserView user) {
            return new UserResponse(user.id(), user.email(), user.displayName(), user.role());
        }
    }

    /** The refresh token is never in the body; it travels only in the cookie. */
    @Schema(requiredProperties = {"accessToken", "tokenType", "expiresIn", "user"})
    record AuthResponse(
            String accessToken,
            @Schema(allowableValues = "Bearer") String tokenType,

            @Schema(description = "Access-token lifetime in seconds")
            long expiresIn,

            UserResponse user) {

        static AuthResponse of(AuthResult result) {
            return new AuthResponse(result.accessToken(), "Bearer", result.expiresIn(), UserResponse.of(result.user()));
        }
    }
}
