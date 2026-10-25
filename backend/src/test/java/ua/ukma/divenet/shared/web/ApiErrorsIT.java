package ua.ukma.divenet.shared.web;

import static org.hamcrest.Matchers.containsString;
import static org.hamcrest.Matchers.not;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec shared/api-errors. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, ApiErrorsIT.ErrorsTestController.class})
class ApiErrorsIT {

    private static final String BASE = "/api/v1/test-support/errors";

    @Autowired
    MockMvc mvc;

    @Test
    void unknownApiPath() throws Exception {
        mvc.perform(get("/api/v1/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(404))
                .andExpect(jsonPath("$.title").isNotEmpty())
                .andExpect(jsonPath("$.instance").value("/api/v1/does-not-exist"));
    }

    @Test
    void unsupportedHttpMethod() throws Exception {
        mvc.perform(delete(BASE))
                .andExpect(status().isMethodNotAllowed())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(405));
    }

    @Test
    void invalidRequestBodyField() throws Exception {
        mvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{\"name\": \"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.instance").value(BASE))
                .andExpect(jsonPath("$.errors[0].field").value("name"))
                .andExpect(jsonPath("$.errors[0].message").isNotEmpty());
    }

    @Test
    void malformedJsonBody() throws Exception {
        mvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{not json"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    void handlerThrowsAnUnexpectedException() throws Exception {
        mvc.perform(get(BASE + "/boom"))
                .andExpect(status().isInternalServerError())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(500))
                .andExpect(jsonPath("$.instance").value(BASE + "/boom"))
                .andExpect(content().string(not(containsString("secret-internal-state"))))
                .andExpect(content().string(not(containsString("IllegalStateException"))))
                .andExpect(content().string(not(containsString("at ua.ukma"))));
    }

    /** Test-only endpoint. Nested in a test class, so component scanning never picks it up. */
    @RestController
    @RequestMapping(BASE)
    static class ErrorsTestController {

        record NameRequest(@NotBlank String name) {}

        @GetMapping
        String get() {
            return "ok";
        }

        @PostMapping
        String post(@Valid @RequestBody NameRequest request) {
            return request.name();
        }

        @GetMapping("/boom")
        String boom() {
            throw new IllegalStateException("secret-internal-state");
        }
    }
}
