package ua.ukma.divenet.review.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import java.util.UUID;

/** One photo of a review: an attached upload and its place in the review's order. */
@Embeddable
public record ReviewMedia(
        @Column(name = "media_id", nullable = false) UUID mediaId,
        @Column(nullable = false) short position) {}
