package ua.ukma.divenet.site.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.site.domain.GearRequirement;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteGear;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.site.service.SiteDemoSeeder;

/** Spec site/catalog: the read endpoints, stored-value rules and "No demo profile". */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SiteApiIT {

    private static final String SITES = "/api/v1/sites";

    @Autowired
    MockMvc mvc;

    @Autowired
    SiteRepository sites;

    @Autowired
    RegionRepository regions;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    ObjectProvider<SiteDemoSeeder> seeder;

    @AfterEach
    void removeSites() {
        jdbc.update("DELETE FROM sites");
    }

    private long blueHole() {
        Site site = new Site(
                "Blue Hole",
                regions.getReferenceById("eg-dahab"),
                28.5722,
                34.5375,
                4,
                6,
                110,
                "A deep sinkhole.",
                Set.of(
                        new SiteGear("torch", GearRequirement.REQUIRED),
                        new SiteGear("smb", GearRequirement.REQUIRED),
                        new SiteGear("nitrox", GearRequirement.RECOMMENDED)),
                Instant.parse("2026-01-01T00:00:00Z"));
        return sites.save(site).getId();
    }

    private void insert(int difficulty, int minDepth, int maxDepth) {
        jdbc.update("""
                INSERT INTO sites (name, region_code, location, difficulty, min_depth, max_depth, description, created_at)
                VALUES ('Test', 'eg-dahab', ST_SetSRID(ST_MakePoint(34, 28), 4326)::geography, ?, ?, ?, 'x', now())
                """, difficulty, minDepth, maxDepth);
    }

    @Test
    void anonymousClientReadsTheMarkers() throws Exception {
        long id = blueHole();

        mvc.perform(get(SITES + "/markers"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].id").value(id))
                .andExpect(jsonPath("$[0].name").value("Blue Hole"))
                .andExpect(jsonPath("$[0].lat").value(28.5722))
                .andExpect(jsonPath("$[0].lng").value(34.5375))
                .andExpect(jsonPath("$[0].countryCode").value("EG"))
                .andExpect(jsonPath("$[0].regionCode").value("eg-dahab"))
                .andExpect(jsonPath("$[0].difficulty").value(4))
                .andExpect(jsonPath("$[0].minDepth").value(6))
                .andExpect(jsonPath("$[0].maxDepth").value(110));
    }

    @Test
    void anonymousClientReadsASite() throws Exception {
        long id = blueHole();

        mvc.perform(get(SITES + "/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Blue Hole"))
                .andExpect(jsonPath("$.description").value("A deep sinkhole."))
                .andExpect(jsonPath("$.requiredGear", contains("smb", "torch")))
                .andExpect(jsonPath("$.recommendedGear", contains("nitrox")));
    }

    @Test
    void unknownSite() throws Exception {
        mvc.perform(get(SITES + "/999999"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    /** Proves the statement itself is sound, so the refusals below come from the rules. */
    @Test
    void validValuesAreStored() {
        insert(5, 0, 10);

        assertThat(sites.count()).isOne();
    }

    @Test
    void invalidDifficulty() {
        assertThatThrownBy(() -> insert(6, 0, 10)).isInstanceOf(DataAccessException.class);
    }

    @Test
    void depthsInTheWrongOrder() {
        assertThatThrownBy(() -> insert(1, 30, 10)).isInstanceOf(DataAccessException.class);
    }

    @Test
    void negativeDepth() {
        assertThatThrownBy(() -> insert(1, -1, 10)).isInstanceOf(DataAccessException.class);
    }

    @Test
    void gearListedTwice() {
        long id = blueHole();

        assertThatThrownBy(() -> jdbc.update(
                        "INSERT INTO site_gear (site_id, gear_code, requirement) VALUES (?, 'torch', 'RECOMMENDED')",
                        id))
                .isInstanceOf(DataAccessException.class);
    }

    @Test
    void noDemoProfile() {
        assertThat(seeder.getIfAvailable()).isNull();
        assertThat(sites.count()).isZero();
    }
}
