package ua.ukma.divenet.warning.service;

import java.time.Instant;

/** A warning as web code sees it. */
public record WarningView(
        long id,
        long siteId,
        long authorId,
        String authorName,
        String type,
        String text,
        Instant createdAt,
        Instant updatedAt) {}
