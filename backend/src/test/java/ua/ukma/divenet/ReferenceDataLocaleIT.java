package ua.ukma.divenet;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * Specs geo and site/gear-catalog, "Seeded codes and locale keys match", and achievement/achievements. Only {@code en} is read: the
 * gate's i18n parity step carries these keys over to {@code uk}.
 */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class ReferenceDataLocaleIT {

    /** Maven runs from {@code backend/}. */
    private static final Path EN_LOCALE = Path.of("../frontend/src/i18n/locales/en.json");

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void countryCodesMatchLocaleKeys() throws IOException {
        assertThat(localeKeys("$.geo.countries")).isEqualTo(seededCodes("countries"));
    }

    @Test
    void regionCodesMatchLocaleKeys() throws IOException {
        assertThat(localeKeys("$.geo.regions")).isEqualTo(seededCodes("regions"));
    }

    @Test
    void gearCodesMatchLocaleKeys() throws IOException {
        assertThat(localeKeys("$.gear")).isEqualTo(seededCodes("gear_items"));
    }

    /** Spec achievement/achievements. */
    @Test
    void achievementCodesMatchLocaleKeys() throws IOException {
        assertThat(localeKeys("$.achievement.items")).isEqualTo(seededCodes("achievements"));
        for (String code : seededCodes("achievements")) {
            String locale = Files.readString(EN_LOCALE);
            assertThat(JsonPath.<String>read(locale, "$.achievement.items['" + code + "'].name"))
                    .isNotBlank();
            assertThat(JsonPath.<String>read(locale, "$.achievement.items['" + code + "'].description"))
                    .isNotBlank();
        }
    }

    private Set<String> seededCodes(String table) {
        return Set.copyOf(jdbc.queryForList("SELECT code FROM " + table, String.class));
    }

    private static Set<String> localeKeys(String path) throws IOException {
        Map<String, ?> entries = JsonPath.read(Files.readString(EN_LOCALE), path);
        return Set.copyOf(entries.keySet());
    }
}
