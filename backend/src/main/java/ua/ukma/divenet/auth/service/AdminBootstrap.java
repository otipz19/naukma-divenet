package ua.ukma.divenet.auth.service;

import java.time.Clock;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.shared.security.AuthProperties;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Creates the first admin from {@code ADMIN_EMAIL} and {@code ADMIN_PASSWORD} (spec auth, design D8). */
@Component
public class AdminBootstrap implements ApplicationRunner {

    /** The same minimum as registration, so the admin never gets a password sign-up would refuse. */
    public static final int MIN_PASSWORD_LENGTH = 8;

    private static final Logger log = LoggerFactory.getLogger(AdminBootstrap.class);

    private final AuthProperties.Admin admin;
    private final UserRepository users;
    private final PasswordEncoder passwordEncoder;
    private final Clock clock;

    public AdminBootstrap(
            AuthProperties properties, UserRepository users, PasswordEncoder passwordEncoder, Clock clock) {
        this.admin = properties.admin();
        this.users = users;
        this.passwordEncoder = passwordEncoder;
        this.clock = clock;
    }

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        if (!admin.isConfigured()) {
            return;
        }
        String password = admin.password();
        if (password.length() < MIN_PASSWORD_LENGTH) {
            throw new IllegalStateException("ADMIN_PASSWORD must be at least " + MIN_PASSWORD_LENGTH + " characters.");
        }
        String email = AuthService.normalizeEmail(admin.email());
        if (users.existsByEmail(email)) {
            return;
        }
        users.save(new User(
                email, admin.displayName().strip(), passwordEncoder.encode(password), Role.ADMIN, clock.instant()));
        log.info("Created the admin account {}", email);
    }
}
