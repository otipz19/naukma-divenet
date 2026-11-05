package ua.ukma.divenet.demo.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec demo/seed "No demo profile"; shares the plain test context. */
@SpringBootTest
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class NoDemoProfileIT {

    @Autowired
    ObjectProvider<DemoSeeder> seeder;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void noDemoProfile() {
        assertThat(seeder.getIfAvailable()).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users WHERE email LIKE '%@demo.divenet.test'", Long.class))
                .isZero();
    }
}
