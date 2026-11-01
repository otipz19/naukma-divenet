package ua.ukma.divenet.divelog.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import org.jspecify.annotations.Nullable;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/** A record that a user dived a site on a date. */
@Entity
@Table(name = "dive_log_entries")
public class DiveLogEntry {

    /** The fields an author sets. */
    public record Details(
            Site site,
            LocalDate date,
            @Nullable BigDecimal maxDepth,
            @Nullable BigDecimal visibility,
            @Nullable BigDecimal waterTemperature,
            @Nullable String current,
            @Nullable String buddies,
            @Nullable String notes) {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @Column(name = "dive_date", nullable = false)
    private LocalDate date;

    @Column(name = "max_depth", precision = 4, scale = 1)
    private @Nullable BigDecimal maxDepth;

    @Column(precision = 4, scale = 1)
    private @Nullable BigDecimal visibility;

    @Column(name = "water_temperature", precision = 3, scale = 1)
    private @Nullable BigDecimal waterTemperature;

    @Column(name = "current_strength", length = 16)
    private @Nullable String current;

    @Column(length = 200)
    private @Nullable String buddies;

    @Column(length = 2000)
    private @Nullable String notes;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected DiveLogEntry() {}

    public DiveLogEntry(User user, Details details, Instant now) {
        this.user = user;
        this.createdAt = now;
        update(details, now);
    }

    public void update(Details details, Instant now) {
        this.site = details.site();
        this.date = details.date();
        this.maxDepth = details.maxDepth();
        this.visibility = details.visibility();
        this.waterTemperature = details.waterTemperature();
        this.current = details.current();
        this.buddies = details.buddies();
        this.notes = details.notes();
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public Site getSite() {
        return site;
    }

    public LocalDate getDate() {
        return date;
    }

    public @Nullable BigDecimal getMaxDepth() {
        return maxDepth;
    }

    public @Nullable BigDecimal getVisibility() {
        return visibility;
    }

    public @Nullable BigDecimal getWaterTemperature() {
        return waterTemperature;
    }

    public @Nullable String getCurrent() {
        return current;
    }

    public @Nullable String getBuddies() {
        return buddies;
    }

    public @Nullable String getNotes() {
        return notes;
    }
}
