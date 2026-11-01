package ua.ukma.divenet.site.service;

import java.util.List;
import org.jspecify.annotations.Nullable;

/** {@code status} is the status's name, so web code never sees the entity. */
public record SiteView(
        SiteMarkerView marker,
        String description,
        List<String> requiredGear,
        List<String> recommendedGear,
        String status,
        @Nullable String rejectionReason) {}
