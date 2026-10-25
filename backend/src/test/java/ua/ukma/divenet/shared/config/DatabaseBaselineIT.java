package ua.ukma.divenet.shared.config;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.Arrays;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationInfo;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec shared/database: "Migrations own the schema", "Spatial and trigram extensions are enabled". */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class DatabaseBaselineIT {

    @Autowired
    Flyway flyway;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void startAgainstEmptyDatabaseAppliesEveryMigration() {
        MigrationInfo[] applied = flyway.info().applied();

        assertThat(applied).isNotEmpty();
        assertThat(Arrays.stream(applied).map(m -> m.getState().isFailed())).containsOnly(false);
        assertThat(flyway.info().pending()).isEmpty();
    }

    @Test
    void startAgainstMigratedDatabaseAppliesNothing() {
        assertThat(flyway.migrate().migrationsExecuted).isZero();
    }

    @Test
    void postgisIsAvailable() {
        Double metres = jdbc.queryForObject(
                "SELECT ST_Distance('SRID=4326;POINT(0 0)'::geography, 'SRID=4326;POINT(0 1)'::geography)",
                Double.class);

        assertThat(metres).isBetween(110_000.0, 112_000.0);
    }

    @Test
    void trigramSimilarityIsAvailable() {
        Double similarity = jdbc.queryForObject("SELECT similarity('blue hole', 'blue holes')", Double.class);

        assertThat(similarity).isGreaterThan(0.5);
    }
}
