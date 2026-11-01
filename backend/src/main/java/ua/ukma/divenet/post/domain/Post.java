package ua.ukma.divenet.post.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
import org.jspecify.annotations.Nullable;
import ua.ukma.divenet.geo.domain.Region;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/** A diver's blog post (add-posts design D1), a draft or published. */
@Entity
@Table(name = "posts")
public class Post {

    public enum Status {
        DRAFT,
        PUBLISHED
    }

    /** What the author writes; {@code photoIds} in display order. */
    public record Details(
            String title,
            String text,
            Status status,
            @Nullable UUID coverId,
            List<UUID> photoIds,
            @Nullable Region region,
            @Nullable Site site) {}

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "author_id", nullable = false)
    private User author;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(nullable = false, length = 20000)
    private String text;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 16)
    private Status status;

    @Column(name = "cover_id")
    private @Nullable UUID coverId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "region_code")
    private @Nullable Region region;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "site_id")
    private @Nullable Site site;

    @Column(name = "published_at")
    private @Nullable Instant publishedAt;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;

    /** A bag: any change rewrites the rows, so reordering never trips {@code UNIQUE (media_id)}. */
    @ElementCollection
    @CollectionTable(name = "post_media", joinColumns = @JoinColumn(name = "post_id"))
    @OrderBy("position")
    private List<PostMedia> photos = new ArrayList<>();

    protected Post() {}

    public Post(User author, Details details, Instant now) {
        this.author = author;
        this.createdAt = now;
        update(details, now);
    }

    /** Replaces the content; only the first publication sets the publication time. */
    public void update(Details details, Instant now) {
        title = details.title();
        text = details.text();
        status = details.status();
        coverId = details.coverId();
        region = details.region();
        site = details.site();
        updatedAt = now;
        if (status == Status.PUBLISHED && publishedAt == null) {
            publishedAt = now;
        }
        photos.clear();
        for (int i = 0; i < details.photoIds().size(); i++) {
            photos.add(new PostMedia(details.photoIds().get(i), (short) i));
        }
    }

    public Long getId() {
        return id;
    }

    public User getAuthor() {
        return author;
    }

    public String getTitle() {
        return title;
    }

    public String getText() {
        return text;
    }

    public Status getStatus() {
        return status;
    }

    public @Nullable UUID getCoverId() {
        return coverId;
    }

    public @Nullable Region getRegion() {
        return region;
    }

    public @Nullable Site getSite() {
        return site;
    }

    public @Nullable Instant getPublishedAt() {
        return publishedAt;
    }

    public Instant getUpdatedAt() {
        return updatedAt;
    }

    /** The images' media ids in display order. */
    public List<UUID> getPhotoIds() {
        return photos.stream().map(PostMedia::mediaId).toList();
    }
}
