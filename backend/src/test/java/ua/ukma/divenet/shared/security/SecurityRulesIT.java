package ua.ukma.divenet.shared.security;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec auth: "Endpoints are protected by default". */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, SecurityRulesIT.SecuredTestController.class})
class SecurityRulesIT {

    private static final String WRITE = "/api/v1/test-support/security";
    private static final String ADMIN = "/api/v1/admin/test-support/ping";

    @Autowired
    MockMvc mvc;

    @Test
    void anonymousWriteIsRefused() throws Exception {
        mvc.perform(post(WRITE))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(header().string("WWW-Authenticate", startsWith("Bearer")))
                .andExpect(jsonPath("$.status").value(401))
                .andExpect(jsonPath("$.instance").value(WRITE));
    }

    @Test
    void signedInWriteReachesTheEndpoint() throws Exception {
        mvc.perform(post(WRITE).with(jwt())).andExpect(status().isOk());
    }

    @Test
    void userOnAnAdminEndpoint() throws Exception {
        mvc.perform(get(ADMIN).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_USER"))))
                .andExpect(status().isForbidden())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON))
                .andExpect(jsonPath("$.status").value(403))
                .andExpect(jsonPath("$.instance").value(ADMIN));
    }

    @Test
    void anonymousOnAnAdminEndpoint() throws Exception {
        mvc.perform(get(ADMIN))
                .andExpect(status().isUnauthorized())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    void adminOnAnAdminEndpoint() throws Exception {
        mvc.perform(get(ADMIN).with(jwt().authorities(new SimpleGrantedAuthority("ROLE_ADMIN"))))
                .andExpect(status().isOk())
                .andExpect(content().string("pong"));
    }

    @Test
    void publicReadsStayAnonymous() throws Exception {
        mvc.perform(get("/actuator/health")).andExpect(status().isOk());
        mvc.perform(get("/api/v1/does-not-exist"))
                .andExpect(status().isNotFound())
                .andExpect(content().contentType(MediaType.APPLICATION_PROBLEM_JSON));
    }

    /** Test-only endpoints. Nested in a test class, so component scanning never picks them up. */
    @RestController
    static class SecuredTestController {

        @PostMapping(WRITE)
        String write() {
            return "written";
        }

        @GetMapping(ADMIN)
        String ping() {
            return "pong";
        }
    }
}
