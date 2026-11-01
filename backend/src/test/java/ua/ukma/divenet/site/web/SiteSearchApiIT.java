package ua.ukma.divenet.site.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.site.domain.GearRequirement;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteGear;
import ua.ukma.divenet.site.domain.SiteRepository;

/** Spec site/search, server scenarios, and site/catalog "Markers are ordered by name". */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class SiteSearchApiIT {

    @Autowired
    MockMvc mvc;

    @Autowired
    SiteRepository sites;

    @Autowired
    RegionRepository regions;

    @Autowired
    JdbcTemplate jdbc;

    private void site(String name, String region, int difficulty, int min, int max, Set<SiteGear> gear) {
        sites.save(new Site(
                name,
                regions.getReferenceById(region),
                10,
                20,
                difficulty,
                min,
                max,
                "x",
                new HashSet<>(gear),
                Instant.parse("2026-01-01T00:00:00Z")));
    }

    private static SiteGear required(String code) {
        return new SiteGear(code, GearRequirement.REQUIRED);
    }

    @BeforeEach
    void seed() {
        site("Blue Hole", "eg-dahab", 4, 6, 40, Set.of(required("torch"), required("smb")));
        site("Lighthouse", "eg-dahab", 1, 3, 18, Set.of(required("torch")));
        site(
                "Thistlegorm",
                "eg-sharm-el-sheikh",
                2,
                16,
                32,
                Set.of(new SiteGear("torch", GearRequirement.RECOMMENDED)));
        site("Canyon", "hr-istria", 3, 40, 50, Set.of());
    }

    @AfterEach
    void removeSites() {
        jdbc.update("DELETE FROM sites");
    }

    private List<String> names(String query) throws Exception {
        String body = mvc.perform(get("/api/v1/sites/markers?" + query))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$[*].name");
    }

    /** As a parameter: a query string in the URL template would be encoded a second time. */
    private List<String> namesForText(String q) throws Exception {
        String body = mvc.perform(get("/api/v1/sites/markers").param("q", q))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$[*].name");
    }

    @Test
    void markersAreOrderedByNameWithoutFilters() throws Exception {
        assertThat(names("")).containsExactly("Blue Hole", "Canyon", "Lighthouse", "Thistlegorm");
    }

    @Test
    void matchByNameIgnoringCase() throws Exception {
        assertThat(names("q=bLuE")).containsExactly("Blue Hole");
    }

    @Test
    void matchByRegionAndByCountry() throws Exception {
        assertThat(names("q=dahab")).containsExactly("Blue Hole", "Lighthouse");
        assertThat(names("q=egypt")).containsExactly("Blue Hole", "Lighthouse", "Thistlegorm");
    }

    @Test
    void wildcardsAreLiteral() throws Exception {
        assertThat(namesForText("%")).isEmpty();
        assertThat(namesForText("_")).isEmpty();
    }

    @Test
    void blankSearchIsIgnored() throws Exception {
        assertThat(namesForText(" ")).hasSize(4);
    }

    @Test
    void codesCountAsTextMatches() throws Exception {
        assertThat(names("q=дахаб")).isEmpty();
        assertThat(names("q=дахаб&qRegion=eg-dahab")).containsExactly("Blue Hole", "Lighthouse");
        assertThat(names("q=хорватія&qCountry=HR")).containsExactly("Canyon");
    }

    @Test
    void anyOfSeveralDifficulties() throws Exception {
        assertThat(names("difficulty=1&difficulty=2")).containsExactly("Lighthouse", "Thistlegorm");
    }

    @Test
    void allOfSeveralGearItems() throws Exception {
        assertThat(names("gear=torch&gear=smb")).containsExactly("Blue Hole");
        assertThat(names("gear=torch")).containsExactly("Blue Hole", "Lighthouse");
    }

    @Test
    void countryAndRegion() throws Exception {
        assertThat(names("country=EG")).containsExactly("Blue Hole", "Lighthouse", "Thistlegorm");
        assertThat(names("region=eg-dahab")).containsExactly("Blue Hole", "Lighthouse");
    }

    @Test
    void depthRangesOverlap() throws Exception {
        assertThat(names("minDepth=5&maxDepth=30")).contains("Thistlegorm").doesNotContain("Canyon");
        assertThat(names("minDepth=33")).doesNotContain("Thistlegorm");
        assertThat(names("maxDepth=15")).doesNotContain("Thistlegorm");
    }

    @Test
    void textAndFilterTogether() throws Exception {
        assertThat(names("q=dahab&difficulty=1")).containsExactly("Lighthouse");
    }

    @Test
    void invalidParameter() throws Exception {
        mvc.perform(get("/api/v1/sites/markers?difficulty=hard"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }
}
