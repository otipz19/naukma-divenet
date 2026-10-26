package ua.ukma.divenet.auth.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;

import java.time.Clock;
import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.factory.PasswordEncoderFactories;
import ua.ukma.divenet.shared.security.AuthProperties;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec auth "The first admin comes from the environment"; design D8. */
class AdminBootstrapTest {

    private static final String SECRET = "k".repeat(32);

    private final UserRepository users = mock(UserRepository.class);

    private AdminBootstrap bootstrap(String email, String password) {
        AuthProperties properties = new AuthProperties(SECRET, new AuthProperties.Admin(email, password, "Admin"));
        return new AdminBootstrap(
                properties, users, PasswordEncoderFactories.createDelegatingPasswordEncoder(), Clock.systemUTC());
    }

    /** Scenario "No admin variables". */
    @Test
    void noAdminVariablesCreateNoUser() {
        bootstrap(null, null).run(null);
        bootstrap("", "").run(null);
        bootstrap("admin@divenet.test", null).run(null);

        verify(users, never()).save(any(User.class));
    }

    @Test
    void shortAdminPasswordFailsStartup() {
        assertThatThrownBy(() -> bootstrap("admin@divenet.test", "short").run(null))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("ADMIN_PASSWORD");
        verify(users, never()).save(any(User.class));
    }
}
