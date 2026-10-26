package ua.ukma.divenet.auth.web;

import jakarta.servlet.http.HttpServletResponse;
import java.time.Duration;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseCookie;
import ua.ukma.divenet.auth.service.AuthService;

/** The refresh-token cookie of ADR-0004 (design D5). */
final class RefreshCookie {

    static final String NAME = "refresh_token";
    static final String PATH = "/api/v1/auth";

    private RefreshCookie() {}

    static void set(HttpServletResponse response, String value) {
        response.addHeader(HttpHeaders.SET_COOKIE, build(value, AuthService.REFRESH_TOKEN_TTL));
    }

    static void clear(HttpServletResponse response) {
        response.addHeader(HttpHeaders.SET_COOKIE, build("", Duration.ZERO));
    }

    private static String build(String value, Duration maxAge) {
        return ResponseCookie.from(NAME, value)
                .httpOnly(true)
                .secure(true)
                .sameSite("Strict")
                .path(PATH)
                .maxAge(maxAge)
                .build()
                .toString();
    }
}
