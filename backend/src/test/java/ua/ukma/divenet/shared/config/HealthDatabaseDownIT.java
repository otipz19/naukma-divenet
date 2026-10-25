package ua.ukma.divenet.shared.config;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.springframework.test.web.servlet.MockMvc;
import org.testcontainers.postgresql.PostgreSQLContainer;
import ua.ukma.divenet.TestcontainersConfiguration;

/**
 * Spec shared/health: "Database unreachable". Uses its own container, because the test stops it; the
 * shared container from {@link TestcontainersConfiguration} must stay up for other test classes.
 */
@SpringBootTest(
        properties = {
            "spring.datasource.hikari.connection-timeout=2000",
            "spring.datasource.hikari.validation-timeout=1000"
        })
@AutoConfigureMockMvc
@DirtiesContext
class HealthDatabaseDownIT {

    static final PostgreSQLContainer DB = new PostgreSQLContainer(TestcontainersConfiguration.POSTGIS_IMAGE);

    static {
        DB.start();
    }

    @DynamicPropertySource
    static void datasource(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", DB::getJdbcUrl);
        registry.add("spring.datasource.username", DB::getUsername);
        registry.add("spring.datasource.password", DB::getPassword);
    }

    @AfterAll
    static void stop() {
        DB.stop();
    }

    @Autowired
    MockMvc mvc;

    @Test
    void databaseUnreachable() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());

        DB.stop();

        mvc.perform(get("/actuator/health"))
                .andExpect(status().isServiceUnavailable())
                .andExpect(jsonPath("$.status").value("DOWN"));
    }
}
