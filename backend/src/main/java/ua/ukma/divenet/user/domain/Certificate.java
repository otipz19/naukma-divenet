package ua.ukma.divenet.user.domain;

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
import java.util.UUID;
import org.jspecify.annotations.Nullable;

/** A certificate a diver has declared. An edit returns it to pending: a verification covers only what was checked. */
@Entity
@Table(name = "certificates")
public class Certificate {

    public enum Status {
        PENDING,
        VERIFIED,
        REJECTED
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false, length = 16)
    private String agency;

    @Column(nullable = false, length = 100)
    private String level;

    @Column(nullable = false, length = 50)
    private String number;

    /** An upload of this user; a plain id, so this package does not depend on {@code media.domain}. */
    @Column(name = "photo_id")
    private @Nullable UUID photoId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status = Status.PENDING;

    @Column(name = "rejection_reason", length = 500)
    private @Nullable String rejectionReason;

    @Column(name = "verified_at")
    private @Nullable Instant verifiedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    protected Certificate() {}

    public Certificate(User user, Instant now) {
        this.user = user;
        this.createdAt = now;
        this.updatedAt = now;
    }

    public void declare(String agency, String level, String number, @Nullable UUID photoId, Instant now) {
        this.agency = agency;
        this.level = level;
        this.number = number;
        this.photoId = photoId;
        this.status = Status.PENDING;
        this.rejectionReason = null;
        this.verifiedAt = null;
        this.updatedAt = now;
    }

    public void verify(Instant now) {
        this.status = Status.VERIFIED;
        this.verifiedAt = now;
        this.updatedAt = now;
    }

    public void reject(String reason, Instant now) {
        this.status = Status.REJECTED;
        this.rejectionReason = reason;
        this.updatedAt = now;
    }

    public Long getId() {
        return id;
    }

    public User getUser() {
        return user;
    }

    public String getAgency() {
        return agency;
    }

    public String getLevel() {
        return level;
    }

    public String getNumber() {
        return number;
    }

    public @Nullable UUID getPhotoId() {
        return photoId;
    }

    public Status getStatus() {
        return status;
    }

    public @Nullable String getRejectionReason() {
        return rejectionReason;
    }
}
