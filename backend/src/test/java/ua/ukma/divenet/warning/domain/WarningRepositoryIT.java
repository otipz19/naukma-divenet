package ua.ukma.divenet.warning.domain;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.sql.Timestamp;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.jdbc.core.JdbcTemplate;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Design D1 and D2: the stored-value rules and visible-only queries of the warnings table. */
@SpringBootTest
@Import(TestcontainersConfiguration.class)
class WarningRepositoryIT {

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    WarningRepository warnings;

    long siteId;
    long authorId;
    long adminId;

    @BeforeEach
    void createSiteAndUsers() {
        siteId = jdbc.queryForObject("""
                INSERT INTO sites (name, region_code, location, difficulty, min_depth, max_depth, description, created_at, status)
                VALUES ('Test', 'eg-dahab', ST_SetSRID(ST_MakePoint(34, 28), 4326)::geography, 1, 0, 10, 'x', now(), 'APPROVED')
                RETURNING id""", Long.class);
        authorId = user();
        adminId = user();
    }

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM warnings");
        jdbc.update("DELETE FROM sites");
    }

    private long user() {
        return jdbc.queryForObject("""
                INSERT INTO users (email, display_name, password_hash, role, created_at)
                VALUES (?, 'Diver', 'x', 'USER', now()) RETURNING id""", Long.class, UUID.randomUUID() + "@example.com");
    }

    private long insert(
            String type, String text, Instant createdAt, @Nullable Instant hiddenAt, @Nullable Long hiddenBy) {
        return jdbc.queryForObject(
                """
                INSERT INTO warnings (site_id, author_id, type, text, created_at, updated_at, hidden_at, hidden_by)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?) RETURNING id""",
                Long.class,
                siteId,
                authorId,
                type,
                text,
                Timestamp.from(createdAt),
                Timestamp.from(createdAt),
                hiddenAt == null ? null : Timestamp.from(hiddenAt),
                hiddenBy);
    }

    @Test
    void validWarningsAreStored() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        insert("HAZARD", "Strong current", now, null, null);
        insert("INCIDENT", "Line snapped", now, now, adminId);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM warnings", Integer.class))
                .isEqualTo(2);
    }

    @Test
    void unknownTypeIsRejected() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        assertThatThrownBy(() -> insert("SHARKNADO", "Danger", now, null, null))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert("hazard", "Danger", now, null, null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void blankTextIsRejected() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        assertThatThrownBy(() -> insert("HAZARD", "", now, null, null))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert("HAZARD", "   ", now, null, null))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void unpairedHiddenAtAndHiddenByAreRejected() {
        Instant now = Instant.parse("2026-05-01T10:00:00Z");
        assertThatThrownBy(() -> insert("HAZARD", "Current", now, now, null))
                .isInstanceOf(DataIntegrityViolationException.class);
        assertThatThrownBy(() -> insert("HAZARD", "Current", now, null, adminId))
                .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void findVisibleBySiteAndFindVisibleByIdSkipHiddenAndOrderNewestFirst() {
        Instant t1 = Instant.parse("2026-05-01T10:00:00Z");
        Instant t2 = Instant.parse("2026-05-02T10:00:00Z");
        Instant t3 = Instant.parse("2026-05-03T10:00:00Z");

        long w1 = insert("HAZARD", "May 1", t1, null, null);
        long wHidden = insert("INCIDENT", "Hidden", t3, t3, adminId);
        long w2 = insert("MARINE_LIFE", "May 2", t2, null, null);

        assertThat(warnings.findVisibleById(w1)).isPresent();
        assertThat(warnings.findVisibleById(wHidden)).isEmpty();
        assertThat(warnings.findById(wHidden)).isPresent();

        Page<Warning> page = warnings.findVisibleBySite(siteId, PageRequest.of(0, 10));
        assertThat(page.getTotalElements()).isEqualTo(2);
        assertThat(page.getContent()).extracting(Warning::getId).containsExactly(w2, w1);
    }
}
