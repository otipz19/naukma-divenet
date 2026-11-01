package ua.ukma.divenet.site.service;

import java.math.BigDecimal;
import org.jspecify.annotations.Nullable;

/** What the review feature stores on a site after each review write (add-site-reviews design D2). */
public record ReviewAggregates(
        @Nullable BigDecimal averageRating,
        int ratingCount,
        int reviewCount,
        @Nullable BigDecimal communityDifficulty) {}
