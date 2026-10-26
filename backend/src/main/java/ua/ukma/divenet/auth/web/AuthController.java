package ua.ukma.divenet.auth.web;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.auth.service.AuthExceptions.InvalidRefreshTokenException;
import ua.ukma.divenet.auth.service.AuthResult;
import ua.ukma.divenet.auth.service.AuthService;
import ua.ukma.divenet.auth.web.AuthDtos.AuthResponse;
import ua.ukma.divenet.auth.web.AuthDtos.LoginRequest;
import ua.ukma.divenet.auth.web.AuthDtos.RegisterRequest;
import ua.ukma.divenet.auth.web.AuthDtos.UserResponse;

/** Spec auth: register, log in, refresh, log out and read the current user. */
@RestController
@RequestMapping("/api/v1/auth")
class AuthController {

    private final AuthService authService;

    AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    @ResponseStatus(HttpStatus.CREATED)
    AuthResponse register(@Valid @RequestBody RegisterRequest request, HttpServletResponse response) {
        return signedIn(authService.register(request.email(), request.displayName(), request.password()), response);
    }

    @PostMapping("/login")
    AuthResponse login(@Valid @RequestBody LoginRequest request, HttpServletResponse response) {
        return signedIn(authService.login(request.email(), request.password()), response);
    }

    /** A failed refresh also clears the cookie, so the browser stops sending a dead token. */
    @PostMapping("/refresh")
    AuthResponse refresh(
            @CookieValue(name = RefreshCookie.NAME, required = false) @Nullable String refreshToken,
            HttpServletResponse response) {
        try {
            return signedIn(authService.refresh(refreshToken), response);
        } catch (InvalidRefreshTokenException e) {
            RefreshCookie.clear(response);
            throw e;
        }
    }

    @PostMapping("/logout")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void logout(
            @CookieValue(name = RefreshCookie.NAME, required = false) @Nullable String refreshToken,
            HttpServletResponse response) {
        authService.logout(refreshToken);
        RefreshCookie.clear(response);
    }

    @GetMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    UserResponse me(@AuthenticationPrincipal Jwt jwt) {
        return UserResponse.of(authService.currentUser(Long.parseLong(jwt.getSubject())));
    }

    private static AuthResponse signedIn(AuthResult result, HttpServletResponse response) {
        RefreshCookie.set(response, result.refreshToken());
        return AuthResponse.of(result);
    }
}
