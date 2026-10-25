package ua.ukma.divenet;

import org.springframework.boot.SpringApplication;

/** Runs the API locally against a throwaway PostGIS container: {@code ./mvnw spring-boot:test-run}. */
public class TestDiveNetApplication {

    public static void main(String[] args) {
        SpringApplication.from(DiveNetApplication::main)
                .with(TestcontainersConfiguration.class)
                .run(args);
    }
}
