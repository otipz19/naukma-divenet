package ua.ukma.divenet.site.service;

public record SiteMarkerView(
        long id,
        String name,
        double lat,
        double lng,
        String countryCode,
        String regionCode,
        int difficulty,
        int minDepth,
        int maxDepth) {}
