package ua.ukma.divenet.site.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItems;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec site/gear-catalog. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class GearApiIT {

    private static final String GEAR_ITEMS = "/api/v1/gear-items";

    @Autowired
    MockMvc mvc;

    @Test
    void anonymousClientReadsTheCatalog() throws Exception {
        mvc.perform(get(GEAR_ITEMS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].code", hasItems("torch", "drysuit", "smb", "nitrox", "reef-hook")));
        assertThat(field("name")).isSorted();
    }

    @Test
    void codeFormat() throws Exception {
        assertThat(field("code"))
                .isNotEmpty()
                .doesNotHaveDuplicates()
                .allSatisfy(code -> assertThat(code).matches("^[a-z0-9]+(-[a-z0-9]+)*$"));
    }

    private List<String> field(String name) throws Exception {
        String body = mvc.perform(get(GEAR_ITEMS)).andReturn().getResponse().getContentAsString();
        return JsonPath.read(body, "$[*]." + name);
    }
}
