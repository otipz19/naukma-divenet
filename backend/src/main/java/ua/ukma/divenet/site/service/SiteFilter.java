package ua.ukma.divenet.site.service;

import java.math.BigDecimal;
import java.util.List;
import org.jspecify.annotations.Nullable;

/**
 * The optional search and filters of spec site/search. {@code qRegions} and {@code qCountries} are codes
 * whose translated names matched the text on the client (design D3). {@code minRating} and {@code sort}
 * come from add-site-reviews.
 */
public record SiteFilter(
        @Nullable String q,
        List<String> qRegions,
        List<String> qCountries,
        List<Integer> difficulties,
        List<String> gear,
        @Nullable String country,
        @Nullable String region,
        @Nullable Integer minDepth,
        @Nullable Integer maxDepth,
        @Nullable BigDecimal minRating,
        MarkerSort sort) {}
