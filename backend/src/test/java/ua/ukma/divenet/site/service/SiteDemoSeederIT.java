package ua.ukma.divenet.site.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.context.ActiveProfiles;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.site.domain.SiteStatus;

/** Spec site/catalog "The demo profile seeds real sites". This context has its own database. */
@SpringBootTest
@ActiveProfiles("demo")
@Import(TestcontainersConfiguration.class)
class SiteDemoSeederIT {

    @Autowired
    SiteDemoSeeder seeder;

    @Autowired
    SiteRepository sites;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void demoProfileOnAnEmptyDatabase() {
        assertThat(sites.count()).isGreaterThanOrEqualTo(50);
        Integer countriesWithoutSites = jdbc.queryForObject("""
                SELECT count(*) FROM countries c WHERE NOT EXISTS (
                    SELECT 1 FROM sites s JOIN regions r ON r.code = s.region_code WHERE r.country_code = c.code)
                """, Integer.class);
        assertThat(countriesWithoutSites).isZero();
    }

    @Test
    void seededSitesAreApproved() {
        // Demo divers' own submissions (spec demo/seed) have an author and may be pending.
        assertThat(sites.findAll().stream().filter(site -> site.getAuthor() == null))
                .allSatisfy(site -> assertThat(site.getStatus()).isEqualTo(SiteStatus.APPROVED));
    }

    @Test
    void demoProfileOnASeededDatabase() throws IOException {
        long before = sites.count();

        seeder.run(null);

        assertThat(sites.count()).isEqualTo(before);
    }
}
