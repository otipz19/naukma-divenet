package ua.ukma.divenet;

import org.junit.jupiter.api.Test;
import org.springframework.modulith.core.ApplicationModules;

/** ADR-0002: module boundaries are checked by the build, not only by review. */
class ModularityTest {

    @Test
    void moduleBoundariesAreRespected() {
        ApplicationModules.of(DiveNetApplication.class).verify();
    }
}
