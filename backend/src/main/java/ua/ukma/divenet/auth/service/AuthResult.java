package ua.ukma.divenet.auth.service;

/**
 * A signed-in session: the access token for the body, the refresh token for the cookie only.
 *
 * @param expiresIn access-token lifetime in seconds
 */
public record AuthResult(String accessToken, long expiresIn, String refreshToken, UserView user) {}
