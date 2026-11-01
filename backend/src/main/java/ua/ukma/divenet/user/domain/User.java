package ua.ukma.divenet.user.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** A DiveNet account. Other features reference it with {@code @ManyToOne User}. */
@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** Always lower case, so lookups and the unique constraint ignore letter case. */
    @Column(nullable = false, unique = true, length = 254)
    private String email;

    @Column(name = "display_name", nullable = false, length = 50)
    private String displayName;

    @Column(name = "password_hash", nullable = false, length = 100)
    private String passwordHash;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Role role;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(length = 500)
    private @Nullable String bio;

    /** An upload of this user; a plain id, so this package does not depend on {@code media.domain}. */
    @Column(name = "avatar_id")
    private @Nullable UUID avatarId;

    @Column(name = "show_dive_log", nullable = false)
    private boolean showDiveLog = true;

    @Column(name = "show_statistics", nullable = false)
    private boolean showStatistics = true;

    @Column(name = "show_certificates", nullable = false)
    private boolean showCertificates = true;

    protected User() {}

    public User(String email, String displayName, String passwordHash, Role role, Instant createdAt) {
        this.email = email;
        this.displayName = displayName;
        this.passwordHash = passwordHash;
        this.role = role;
        this.createdAt = createdAt;
    }

    public void updateProfile(
            @Nullable String bio,
            @Nullable UUID avatarId,
            boolean showDiveLog,
            boolean showStatistics,
            boolean showCertificates) {
        this.bio = bio;
        this.avatarId = avatarId;
        this.showDiveLog = showDiveLog;
        this.showStatistics = showStatistics;
        this.showCertificates = showCertificates;
    }

    public @Nullable String getBio() {
        return bio;
    }

    public @Nullable UUID getAvatarId() {
        return avatarId;
    }

    public boolean isShowDiveLog() {
        return showDiveLog;
    }

    public boolean isShowStatistics() {
        return showStatistics;
    }

    public boolean isShowCertificates() {
        return showCertificates;
    }

    public Long getId() {
        return id;
    }

    public String getEmail() {
        return email;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getPasswordHash() {
        return passwordHash;
    }

    public Role getRole() {
        return role;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }
}
