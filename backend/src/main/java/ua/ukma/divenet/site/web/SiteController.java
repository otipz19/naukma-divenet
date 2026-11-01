package ua.ukma.divenet.site.web;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.site.service.MarkerSort;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.site.service.SiteCatalogService.OwnSubmissionView;
import ua.ukma.divenet.site.service.SiteCatalogService.Submission;
import ua.ukma.divenet.site.service.SiteCatalogService.Viewer;
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
            @RequestParam(required = false) @Nullable Integer maxDepth,
            @RequestParam(required = false) @Nullable @DecimalMin("1") @DecimalMax("5") BigDecimal minRating,
            @Parameter(
                            schema =
                                    @Schema(
                                            allowableValues = {"name", "rating"},
                                            defaultValue = "name"))
                    @RequestParam(defaultValue = "name")
                    MarkerSort sort) {
        SiteFilter filter = new SiteFilter(
                q == null || q.isBlank() ? null : q.strip(),
                orEmpty(qRegion),
                orEmpty(qCountry),
                orEmpty(difficulty),
                orEmpty(gear),
                country,
                region,
                minDepth,
                maxDepth,
                minRating,
                sort);
        return catalog.markers(filter).stream().map(SiteMarkerResponse::of).toList();
    }

    private static <T> List<T> orEmpty(@Nullable List<T> values) {
        return values == null ? List.of() : values;
    }

    /** An unapproved site answers 404 unless the token is its author's or an admin's. */
    @GetMapping("/{id}")
    SiteResponse site(@PathVariable long id, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return SiteResponse.of(catalog.site(id, viewer(jwt)));
    }

    /** Spec site/submission. */
    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    SiteResponse submit(@Valid @RequestBody SubmissionRequest request, @AuthenticationPrincipal Jwt jwt) {
        return SiteResponse.of(catalog.submit(request.toSubmission(), Long.parseLong(jwt.getSubject())));
    }

    @GetMapping("/mine")
    @SecurityRequirement(name = "bearerAuth")
    List<OwnSubmissionResponse> mine(@AuthenticationPrincipal Jwt jwt) {
        return catalog.ownSubmissions(Long.parseLong(jwt.getSubject())).stream()
                .map(OwnSubmissionResponse::of)
                .toList();
    }

    private static Viewer viewer(@Nullable Jwt jwt) {
        if (jwt == null) {
            return new Viewer(null, false);
        }
        List<String> roles = jwt.getClaimAsStringList("roles");
        return new Viewer(Long.valueOf(jwt.getSubject()), roles != null && roles.contains("ADMIN"));
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
                "maxDepth",
                "ratingCount"
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
            int maxDepth,
            @Nullable BigDecimal averageRating,
            int ratingCount) {

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
                    m.maxDepth(),
                    m.averageRating(),
                    m.ratingCount());
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
                "ratingCount",
                "reviewCount",
                "description",
                "requiredGear",
                "recommendedGear",
                "status"
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
            @Nullable BigDecimal averageRating,
            int ratingCount,
            int reviewCount,
            @Nullable BigDecimal communityDifficulty,
            String description,
            @NotNull List<String> requiredGear,
            @NotNull List<String> recommendedGear,

            @Schema(allowableValues = {"PENDING", "APPROVED", "REJECTED"})
            String status,

            @Nullable String rejectionReason) {

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
                    m.averageRating(),
                    m.ratingCount(),
                    site.reviewCount(),
                    site.communityDifficulty(),
                    site.description(),
                    site.requiredGear(),
                    site.recommendedGear(),
                    site.status(),
                    site.rejectionReason());
        }
    }

    /** Cross-field and reference rules run in the service (design D4). */
    record SubmissionRequest(
            @NotBlank @Size(max = 120) String name,
            @NotBlank String regionCode,
            @NotNull @DecimalMin("-90") @DecimalMax("90") Double lat,
            @NotNull @DecimalMin("-180") @DecimalMax("180") Double lng,
            @NotNull @Min(1) @Max(5) Integer difficulty,
            @NotNull @Min(0) @Max(400) Integer minDepth,
            @NotNull @Min(0) @Max(400) Integer maxDepth,
            @NotBlank @Size(max = 5000) String description,
            @Nullable List<String> requiredGear,
            @Nullable List<String> recommendedGear) {

        Submission toSubmission() {
            return new Submission(
                    name,
                    regionCode,
                    lat,
                    lng,
                    difficulty,
                    minDepth,
                    maxDepth,
                    description,
                    orEmpty(requiredGear),
                    orEmpty(recommendedGear));
        }
    }

    @Schema(requiredProperties = {"id", "name", "status"})
    record OwnSubmissionResponse(
            long id,
            String name,

            @Schema(allowableValues = {"PENDING", "APPROVED", "REJECTED"})
            String status,

            @Nullable String rejectionReason) {

        static OwnSubmissionResponse of(OwnSubmissionView view) {
            return new OwnSubmissionResponse(view.id(), view.name(), view.status(), view.rejectionReason());
        }
    }
}
