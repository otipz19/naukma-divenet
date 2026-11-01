package ua.ukma.divenet.site.service;

import java.util.List;

public record SiteView(
        SiteMarkerView marker, String description, List<String> requiredGear, List<String> recommendedGear) {}
