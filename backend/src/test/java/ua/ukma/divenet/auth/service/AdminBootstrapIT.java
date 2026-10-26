package ua.ukma.divenet.auth.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.DefaultApplicationArguments;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec auth "The first admin comes from the environment", scenario "Admin is created once". */
@SpringBootTest(
        properties = {"divenet.auth.admin.email=Admin@DiveNet.test", "divenet.auth.admin.password=admin-password"})
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class AdminBootstrapIT {

    @Autowired
    AdminBootstrap bootstrap;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    MockMvc mvc;

    @Test
    void adminIsCreatedOnce() throws Exception {
        // The application already ran the bootstrap at startup; a second start must change nothing.
        bootstrap.run(new DefaultApplicationArguments());

        assertThat(jdbc.queryForList("SELECT role FROM users WHERE email = 'admin@divenet.test'", String.class))
                .containsExactly("ADMIN");
        mvc.perform(post("/api/v1/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\": \"admin@divenet.test\", \"password\": \"admin-password\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.user.role").value("ADMIN"))
                .andExpect(jsonPath("$.user.displayName").value("Admin"));
    }
}
