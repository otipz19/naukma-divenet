package ua.ukma.divenet.site.service;

import java.math.BigDecimal;
import org.jspecify.annotations.Nullable;

public record SiteMarkerView(
        long id,
        String name,
        double lat,
        double lng,
        String countryCode,
        String regionCode,
        int difficulty,
        int minDepth,
        int maxDepth,
        @Nullable BigDecimal averageRating,
        int ratingCount) {}
