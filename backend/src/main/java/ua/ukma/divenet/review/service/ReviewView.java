package ua.ukma.divenet.review.service;

import java.time.Instant;
import java.util.List;
import org.jspecify.annotations.Nullable;
import ua.ukma.divenet.media.service.MediaView;

/** A review as web code sees it; {@code photos} in display order. */
public record ReviewView(
        long id,
        long siteId,
        long authorId,
        String authorName,
        @Nullable Integer rating,
        @Nullable Integer difficulty,
        @Nullable String text,
        List<MediaView> photos,
        Instant createdAt,
        Instant updatedAt) {}
