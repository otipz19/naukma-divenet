package ua.ukma.divenet.shared.security;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;

/** Spec auth: "The signing key comes from the environment". */
class AuthPropertiesTest {

    private final ApplicationContextRunner runner =
            new ApplicationContextRunner().withUserConfiguration(PropertiesOnly.class);

    @Test
    void shortKeyIsRefused() {
        runner.withPropertyValues("divenet.auth.jwt-secret=too-short").run(context -> {
            assertThat(context).hasFailed();
            assertThat(context.getStartupFailure()).rootCause().hasMessageContaining("JWT_SECRET");
        });
    }

    @Test
    void keyOf32BytesIsAccepted() {
        runner.withPropertyValues("divenet.auth.jwt-secret=" + "k".repeat(32)).run(context -> {
            assertThat(context).hasNotFailed();
            assertThat(context.getBean(AuthProperties.class).admin().isConfigured())
                    .isFalse();
        });
    }

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(AuthProperties.class)
    static class PropertiesOnly {}
}
