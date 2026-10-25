package ua.ukma.divenet.shared.config;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Files;
import java.nio.file.Path;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;

/**
 * Spec shared/api-contract. Keeps api/openapi.json in sync with the running API. To regenerate the
 * snapshot, run {@value ContractSnapshot#REGENERATE_COMMAND}.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ApiContractTest {

    /** Relative to backend/, the working directory of Maven's test run. */
    private static final Path SNAPSHOT = Path.of("..", "api", "openapi.json");

    @Autowired
    MockMvc mvc;

    @Test
    void openApiDocumentIsServed() throws Exception {
        mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.openapi").value(startsWith("3.")));
    }

    @Test
    void snapshotIsCurrent() throws Exception {
        ContractSnapshot.verify(generatedDocument(), SNAPSHOT, Boolean.getBoolean("openapi.update"));
    }

    @Test
    void staleSnapshotFailsAndIsLeftUntouched(@TempDir Path dir) throws Exception {
        String generated = generatedDocument();
        Path stale = dir.resolve("openapi.json");
        String staleContent = ContractSnapshot.normalize(generated).replace("DiveNet API", "Outdated API");
        Files.writeString(stale, staleContent);

        assertThatThrownBy(() -> ContractSnapshot.verify(generated, stale, false))
                .isInstanceOf(AssertionError.class)
                .hasMessageContaining(ContractSnapshot.REGENERATE_COMMAND);
        assertThat(Files.readString(stale)).isEqualTo(staleContent);
    }

    private String generatedDocument() throws Exception {
        return mvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
    }
}
