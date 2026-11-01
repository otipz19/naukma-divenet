package ua.ukma.divenet.warning.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import org.jspecify.annotations.Nullable;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/**
 * A safety or condition warning posted on a dive site (add-site-warnings design D1, D2). Hiding sets
 * {@code hiddenAt} and {@code hiddenBy} so the row remains for the record while disappearing from
 * visible queries.
 */
@Entity
@Table(name = "warnings")
public class Warning {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 32)
    private WarningType type;

    @Column(nullable = false, length = 1000)
    private String text;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    @Column(name = "hidden_at")
    private @Nullable Instant hiddenAt;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "hidden_by")
    private @Nullable User hiddenBy;

    protected Warning() {}

    public Warning(Site site, User author, WarningType type, String text, Instant createdAt) {
        this.site = site;
        this.author = author;
        this.type = type;
        this.text = text;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    public void setContent(WarningType type, String text, Instant updatedAt) {
        this.type = type;
        this.text = text;
        this.updatedAt = updatedAt;
    }

    public void hide(User admin, Instant hiddenAt) {
        if (this.hiddenAt == null) {
            this.hiddenAt = hiddenAt;
            this.hiddenBy = admin;
        }
    }

    public Long getId() {
        return id;
    }

    public Site getSite() {
        return site;
    }

    public User getAuthor() {
        return author;
    }

    public WarningType getType() {
        return type;
    }

    public String getText() {
        return text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    public @Nullable Instant getHiddenAt() {
        return hiddenAt;
    }

    public @Nullable User getHiddenBy() {
        return hiddenBy;
    }
}
