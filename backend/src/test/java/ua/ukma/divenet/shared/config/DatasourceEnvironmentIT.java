package ua.ukma.divenet.shared.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.sql.Connection;
import javax.sql.DataSource;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.postgresql.PostgreSQLContainer;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec shared/database: "Connection settings come from the environment". */
@SpringBootTest
class DatasourceEnvironmentIT {

    static final PostgreSQLContainer DB = new PostgreSQLContainer(TestcontainersConfiguration.POSTGIS_IMAGE)
            .withDatabaseName("envdb")
            .withUsername("envuser")
            .withPassword("envpass");

    static {
        DB.start();
    }

    // Registered under the variable names application.yaml reads, not as spring.datasource.*.
    @DynamicPropertySource
    static void environment(DynamicPropertyRegistry registry) {
        registry.add("DB_URL", DB::getJdbcUrl);
        registry.add("DB_USERNAME", DB::getUsername);
        registry.add("DB_PASSWORD", DB::getPassword);
    }

    @AfterAll
    static void stop() {
        DB.stop();
    }

    @Autowired
    DataSource dataSource;

    @Test
    void environmentOverridesTheDatasource() throws Exception {
        try (Connection connection = dataSource.getConnection()) {
            assertThat(connection.getMetaData().getURL()).isEqualTo(DB.getJdbcUrl());
            assertThat(connection.getMetaData().getUserName()).isEqualTo("envuser");
        }
    }
}
