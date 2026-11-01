package ua.ukma.divenet.post.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.UUID;

/** One image of a post: an attached upload and its place in the post's order. */
@Embeddable
public record PostMedia(
        @Column(name = "media_id", nullable = false) UUID mediaId,
        @Column(nullable = false) short position) {}
