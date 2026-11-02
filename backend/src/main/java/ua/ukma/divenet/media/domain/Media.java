package ua.ukma.divenet.media.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import ua.ukma.divenet.user.domain.User;

/**
 * One uploaded image (ADR-0006). The bytes and the thumbnail are in {@code MediaStorage}; a feature
 * that uses the image sets {@code attachedAt}, and the cleanup deletes old uploads that it is unset on.
 */
@Entity
@Table(name = "media")
public class Media {

    @Id
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "uploader_id")
    private User uploader;

    @Column(name = "content_type", nullable = false, length = 16)
    private String contentType;

    @Column(name = "size_bytes", nullable = false)
    private long sizeBytes;

    /** Null for a video. */
    private @Nullable Integer width;

    private @Nullable Integer height;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "attached_at")
    private @Nullable Instant attachedAt;

    protected Media() {}

    public Media(UUID id, User uploader, String contentType, long sizeBytes, int width, int height, Instant createdAt) {
        this.id = id;
        this.uploader = uploader;
        this.contentType = contentType;
        this.sizeBytes = sizeBytes;
        this.width = width;
        this.height = height;
        this.createdAt = createdAt;
    }

    /** A video: stored as uploaded, so it has no dimensions (ADR-0011). */
    public static Media video(UUID id, User uploader, String contentType, long sizeBytes, Instant createdAt) {
        Media media = new Media();
        media.id = id;
        media.uploader = uploader;
        media.contentType = contentType;
        media.sizeBytes = sizeBytes;
        media.createdAt = createdAt;
        return media;
    }

    public UUID getId() {
        return id;
    }

    public User getUploader() {
        return uploader;
    }

    public String getContentType() {
        return contentType;
    }

    public long getSizeBytes() {
        return sizeBytes;
    }

    /** Images only: attaching keeps videos out of everything that reads this. */
    public int getWidth() {
        return width;
    }

    public int getHeight() {
        return height;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public @Nullable Instant getAttachedAt() {
        return attachedAt;
    }
}
