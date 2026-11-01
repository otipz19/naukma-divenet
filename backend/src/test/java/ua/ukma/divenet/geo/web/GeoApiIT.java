package ua.ukma.divenet.geo.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec geo. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GeoApiIT {

    private static final String COUNTRIES = "/api/v1/countries";

    @Autowired
    MockMvc mvc;

    @Test
    void anonymousClientReadsTheHierarchy() throws Exception {
        mvc.perform(get(COUNTRIES))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.code == 'EG')].name").value("Egypt"))
                .andExpect(jsonPath("$[?(@.code == 'EG')].regions[?(@.code == 'eg-dahab')].name")
                        .value("Dahab"));
    }

    @Test
    void countriesAndRegionsAreSorted() throws Exception {
        List<Map<String, Object>> countries = countries();

        assertThat(countries.stream().map(country -> (String) country.get("name")))
                .isSorted();
        assertThat(countries)
                .allSatisfy(country -> assertThat(regions(country).stream().map(region -> region.get("name")))
                        .isSorted());
    }

    @Test
    void noEmptyCountry() throws Exception {
        assertThat(countries())
                .isNotEmpty()
                .allSatisfy(country -> assertThat(regions(country)).isNotEmpty());
    }

    @Test
    void codeFormats() throws Exception {
        List<Map<String, Object>> countries = countries();

        assertThat(countries).allSatisfy(country -> {
            String code = (String) country.get("code");
            assertThat(code).matches("^[A-Z]{2}$");
            assertThat(regions(country))
                    .allSatisfy(region -> assertThat(region.get("code"))
                            .matches("^[a-z]{2}(-[a-z0-9]+)+$")
                            .startsWith(code.toLowerCase(Locale.ROOT) + "-"));
        });
        assertThat(countries.stream()
                        .flatMap(country -> regions(country).stream())
                        .map(region -> region.get("code")))
                .doesNotHaveDuplicates();
    }

    private List<Map<String, Object>> countries() throws Exception {
        String body = mvc.perform(get(COUNTRIES)).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$");
    }

    @SuppressWarnings("unchecked")
    private static List<Map<String, String>> regions(Map<String, Object> country) {
        return (List<Map<String, String>>) country.get("regions");
    }
}
