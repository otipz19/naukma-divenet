package ua.ukma.divenet.review.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import org.hibernate.annotations.BatchSize;
import org.jspecify.annotations.Nullable;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/**
 * A user's review of a site (add-site-reviews design D1): a rating, a difficulty on the site's 1-5
 * scale, text and photos, each optional, but never without both rating and text.
 */
@Entity
@Table(name = "reviews")
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "site_id", nullable = false)
    private Site site;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    private @Nullable Short rating;

    private @Nullable Short difficulty;

    @Column(length = 4000)
    private @Nullable String text;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** A bag: any change rewrites the rows, so reordering never trips {@code UNIQUE (media_id)}. */
    @ElementCollection
    @CollectionTable(name = "review_media", joinColumns = @JoinColumn(name = "review_id"))
    @OrderBy("position")
    @BatchSize(size = 50)
    private List<ReviewMedia> photos = new ArrayList<>();

    @ElementCollection
    @CollectionTable(name = "review_videos", joinColumns = @JoinColumn(name = "review_id"))
    @OrderBy("position")
    @BatchSize(size = 50)
    private List<ReviewMedia> videos = new ArrayList<>();

    protected Review() {}

    public Review(Site site, User author, Instant createdAt) {
        this.site = site;
        this.author = author;
        this.createdAt = createdAt;
        this.updatedAt = createdAt;
    }

    /** Replaces the content; {@code photoIds} in display order. */
    public void setContent(
            @Nullable Integer rating,
            @Nullable Integer difficulty,
            @Nullable String text,
            List<UUID> photoIds,
            Instant updatedAt) {
        this.rating = rating == null ? null : rating.shortValue();
        this.difficulty = difficulty == null ? null : difficulty.shortValue();
        this.text = text;
        this.updatedAt = updatedAt;
        photos.clear();
        for (int i = 0; i < photoIds.size(); i++) {
            photos.add(new ReviewMedia(photoIds.get(i), (short) i));
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

    public @Nullable Integer getRating() {
        return rating == null ? null : rating.intValue();
    }

    public @Nullable Integer getDifficulty() {
        return difficulty == null ? null : difficulty.intValue();
    }

    public @Nullable String getText() {
        return text;
    }

    public Instant getCreatedAt() {
        return createdAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /** Replaces the videos; {@code videoIds} in display order. */
    public void setVideoIds(List<UUID> videoIds) {
        videos.clear();
        for (int i = 0; i < videoIds.size(); i++) {
            videos.add(new ReviewMedia(videoIds.get(i), (short) i));
        }
    }

    public List<UUID> getVideoIds() {
        return videos.stream().map(ReviewMedia::mediaId).toList();
    }

    /** The photos' media ids in display order. */
    public List<UUID> getPhotoIds() {
        return photos.stream().map(ReviewMedia::mediaId).toList();
    }
}
