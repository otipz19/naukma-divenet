package ua.ukma.divenet.site.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.site.service.SiteFilter;
import ua.ukma.divenet.site.service.SiteMarkerView;
import ua.ukma.divenet.site.service.SiteView;

/** Spec site/catalog: map markers and one site's details. */
@RestController
@RequestMapping("/api/v1/sites")
class SiteController {

    private final SiteCatalogService catalog;

    SiteController(SiteCatalogService catalog) {
        this.catalog = catalog;
    }

    /** Spec site/search: every parameter is optional, and a blank search counts as none. */
    @GetMapping("/markers")
    List<SiteMarkerResponse> markers(
            @RequestParam(required = false) @Nullable String q,
            @RequestParam(required = false) @Nullable List<String> qRegion,
            @RequestParam(required = false) @Nullable List<String> qCountry,
            @RequestParam(required = false) @Nullable List<Integer> difficulty,
            @RequestParam(required = false) @Nullable List<String> gear,
            @RequestParam(required = false) @Nullable String country,
            @RequestParam(required = false) @Nullable String region,
            @RequestParam(required = false) @Nullable Integer minDepth,
            @RequestParam(required = false) @Nullable Integer maxDepth) {
        SiteFilter filter = new SiteFilter(
                q == null || q.isBlank() ? null : q.strip(),
                orEmpty(qRegion),
                orEmpty(qCountry),
                orEmpty(difficulty),
                orEmpty(gear),
                country,
                region,
                minDepth,
                maxDepth);
        return catalog.markers(filter).stream().map(SiteMarkerResponse::of).toList();
    }

    private static <T> List<T> orEmpty(@Nullable List<T> values) {
        return values == null ? List.of() : values;
    }

    @GetMapping("/{id}")
    SiteResponse site(@PathVariable long id) {
        return SiteResponse.of(catalog.site(id));
    }

    /** Every property is always present, so the generated front-end types are not optional. */
    @Schema(
            requiredProperties = {
                "id",
                "name",
                "lat",
                "lng",
                "countryCode",
                "regionCode",
                "difficulty",
                "minDepth",
                "maxDepth"
            })
    record SiteMarkerResponse(
            long id,
            String name,
            double lat,
            double lng,
            String countryCode,
            String regionCode,
            int difficulty,
            int minDepth,
            int maxDepth) {

        static SiteMarkerResponse of(SiteMarkerView m) {
            return new SiteMarkerResponse(
                    m.id(),
                    m.name(),
                    m.lat(),
                    m.lng(),
                    m.countryCode(),
                    m.regionCode(),
                    m.difficulty(),
                    m.minDepth(),
                    m.maxDepth());
        }
    }

    @Schema(
            requiredProperties = {
                "id",
                "name",
                "lat",
                "lng",
                "countryCode",
                "regionCode",
                "difficulty",
                "minDepth",
                "maxDepth",
                "description",
                "requiredGear",
                "recommendedGear"
            })
    record SiteResponse(
            long id,
            String name,
            double lat,
            double lng,
            String countryCode,
            String regionCode,
            int difficulty,
            int minDepth,
            int maxDepth,
            String description,
            List<String> requiredGear,
            List<String> recommendedGear) {

        static SiteResponse of(SiteView site) {
            SiteMarkerView m = site.marker();
            return new SiteResponse(
                    m.id(),
                    m.name(),
                    m.lat(),
                    m.lng(),
                    m.countryCode(),
                    m.regionCode(),
                    m.difficulty(),
                    m.minDepth(),
                    m.maxDepth(),
                    site.description(),
                    site.requiredGear(),
                    site.recommendedGear());
        }
    }
}
