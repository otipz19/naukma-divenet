package ua.ukma.divenet.auth.service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Clock;
import java.time.Duration;
import java.time.Instant;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.auth.domain.RefreshToken;
import ua.ukma.divenet.auth.domain.RefreshTokenRepository;
import ua.ukma.divenet.auth.service.AuthExceptions.EmailTakenException;
import ua.ukma.divenet.auth.service.AuthExceptions.InvalidCredentialsException;
import ua.ukma.divenet.auth.service.AuthExceptions.InvalidRefreshTokenException;
import ua.ukma.divenet.auth.service.AuthExceptions.UnknownUserException;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Registration, login and the rotating refresh tokens of ADR-0004 (design D4). */
@Service
public class AuthService {

    public static final Duration REFRESH_TOKEN_TTL = Duration.ofDays(14);

    /** bcrypt reads only this many bytes; longer passwords are refused (design D7). */
    public static final int MAX_PASSWORD_BYTES = 72;

    private static final int REFRESH_TOKEN_BYTES = 32;

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final Clock clock;
    private final SecureRandom random = new SecureRandom();
    /** Compared against on unknown emails, so their login takes as long as a wrong password. */
    private final String dummyHash;

    public AuthService(
            UserRepository users,
            RefreshTokenRepository refreshTokens,
            PasswordEncoder passwordEncoder,
            TokenService tokenService,
            Clock clock) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.clock = clock;
        this.dummyHash = passwordEncoder.encode("dummy-password-for-timing");
    }

    /** Lower case, so emails compare case-insensitively. */
    public static String normalizeEmail(String email) {
        return email.strip().toLowerCase(Locale.ROOT);
    }

    @Transactional
    public AuthResult register(String email, String displayName, String password) {
        String normalized = normalizeEmail(email);
        if (users.existsByEmail(normalized)) {
            throw new EmailTakenException();
        }
        User user;
        try {
            user = users.saveAndFlush(new User(
                    normalized, displayName.strip(), passwordEncoder.encode(password), Role.USER, clock.instant()));
        } catch (DataIntegrityViolationException concurrentSignUp) {
            throw new EmailTakenException();
        }
        return startSession(user);
    }

    @Transactional
    public AuthResult login(String email, String password) {
        User user = users.findByEmail(normalizeEmail(email)).orElse(null);
        boolean tooLong = password.getBytes(StandardCharsets.UTF_8).length > MAX_PASSWORD_BYTES;
        if (user == null || tooLong) {
            passwordEncoder.matches("dummy-password", dummyHash);
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(password, user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        return startSession(user);
    }

    /**
     * Rotates a refresh token. A token that was already rotated is a replay: its whole family is
     * revoked, and that revocation must commit although the call fails.
     */
    @Transactional(noRollbackFor = InvalidRefreshTokenException.class)
    public AuthResult refresh(@Nullable String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        RefreshToken token =
                refreshTokens.findForUpdate(hash(refreshToken)).orElseThrow(InvalidRefreshTokenException::new);
        Instant now = clock.instant();
        if (token.isRevoked()) {
            throw new InvalidRefreshTokenException();
        }
        if (token.isRotated()) {
            refreshTokens.revokeFamily(token.getFamilyId(), now);
            throw new InvalidRefreshTokenException();
        }
        if (!token.getExpiresAt().isAfter(now)) {
            throw new InvalidRefreshTokenException();
        }
        token.markRotated(now);
        return issue(token.getUser(), token.getFamilyId());
    }

    /** Revokes only the presented token, so other devices stay signed in. Unknown tokens are ignored. */
    @Transactional
    public void logout(@Nullable String refreshToken) {
        if (refreshToken == null || refreshToken.isBlank()) {
            return;
        }
        refreshTokens.findForUpdate(hash(refreshToken)).ifPresent(token -> token.revoke(clock.instant()));
    }

    @Transactional(readOnly = true)
    public UserView currentUser(long userId) {
        return users.findById(userId).map(UserView::of).orElseThrow(UnknownUserException::new);
    }

    private AuthResult startSession(User user) {
        return issue(user, UUID.randomUUID());
    }

    private AuthResult issue(User user, UUID familyId) {
        byte[] bytes = new byte[REFRESH_TOKEN_BYTES];
        random.nextBytes(bytes);
        String refreshToken = Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
        Instant now = clock.instant();
        refreshTokens.save(new RefreshToken(user, familyId, hash(refreshToken), now, now.plus(REFRESH_TOKEN_TTL)));
        return new AuthResult(
                tokenService.issueAccessToken(user),
                TokenService.ACCESS_TOKEN_TTL.toSeconds(),
                refreshToken,
                UserView.of(user));
    }

    /** SHA-256, hex encoded: the token has 256 bits of entropy, so a slow hash adds nothing. */
    static String hash(String refreshToken) {
        try {
            byte[] digest = MessageDigest.getInstance("SHA-256").digest(refreshToken.getBytes(StandardCharsets.UTF_8));
            return HexFormat.of().formatHex(digest);
        } catch (NoSuchAlgorithmException e) {
            throw new IllegalStateException(e);
        }
    }
}
