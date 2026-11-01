package ua.ukma.divenet.divelog.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.divelog.service.DiveLogService;
import ua.ukma.divenet.divelog.service.DiveLogService.EntryContent;
import ua.ukma.divenet.divelog.service.DiveLogService.EntryView;
import ua.ukma.divenet.divelog.service.DiveLogService.StatsView;
import ua.ukma.divenet.divelog.service.DiveLogService.VisitedSiteView;

/** Spec divelog/entries. The reads are public routes; the service applies the privacy settings. */
@RestController
@RequestMapping("/api/v1")
class DiveLogController {

    private final DiveLogService diveLog;

    DiveLogController(DiveLogService diveLog) {
        this.diveLog = diveLog;
    }

    @PostMapping("/dive-log")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    EntryResponse create(@Valid @RequestBody EntryRequest request, @AuthenticationPrincipal Jwt jwt) {
        return EntryResponse.of(diveLog.create(userId(jwt), request.toContent()));
    }

    @PutMapping("/dive-log/{id}")
    @SecurityRequirement(name = "bearerAuth")
    EntryResponse update(
            @PathVariable long id, @Valid @RequestBody EntryRequest request, @AuthenticationPrincipal Jwt jwt) {
        return EntryResponse.of(diveLog.update(id, userId(jwt), request.toContent()));
    }

    @DeleteMapping("/dive-log/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    void delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        diveLog.delete(id, userId(jwt));
    }

    @GetMapping("/users/{id}/dive-log")
    PagedModel<EntryResponse> log(
            @PathVariable long id, @ParameterObject Pageable pageable, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return new PagedModel<>(diveLog.log(id, viewerId(jwt), pageable).map(EntryResponse::of));
    }

    @GetMapping("/users/{id}/visited-sites")
    List<VisitedSiteResponse> visitedSites(@PathVariable long id, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return diveLog.visitedSites(id, viewerId(jwt)).stream()
                .map(VisitedSiteResponse::of)
                .toList();
    }

    @GetMapping("/users/{id}/dive-stats")
    StatsResponse stats(@PathVariable long id, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return StatsResponse.of(diveLog.stats(id, viewerId(jwt)));
    }

    private static long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }

    private static @Nullable Long viewerId(@Nullable Jwt jwt) {
        return jwt == null ? null : Long.valueOf(jwt.getSubject());
    }

    record EntryRequest(
            @NotNull Long siteId,
            @NotNull LocalDate date,

            @Nullable @DecimalMin("0") @DecimalMax("400") @Digits(integer = 3, fraction = 1)
            BigDecimal maxDepth,

            @Nullable @DecimalMin("0") @DecimalMax("200") @Digits(integer = 3, fraction = 1)
            BigDecimal visibility,

            @Nullable @DecimalMin("-5") @DecimalMax("40") @Digits(integer = 2, fraction = 1)
            BigDecimal waterTemperature,

            @Schema(allowableValues = {"NONE", "MILD", "MODERATE", "STRONG"})
            @Nullable
            @Pattern(regexp = "NONE|MILD|MODERATE|STRONG")
            String current,

            @Nullable @Size(max = 200) String buddies,
            @Nullable @Size(max = 2000) String notes) {

        EntryContent toContent() {
            return new EntryContent(siteId, date, maxDepth, visibility, waterTemperature, current, buddies, notes);
        }
    }

    /** Buddies and notes are null for anyone but the owner. */
    @Schema(requiredProperties = {"id", "siteId", "siteName", "countryCode", "regionCode", "date"})
    record EntryResponse(
            long id,
            long siteId,
            String siteName,
            String countryCode,
            String regionCode,
            LocalDate date,
            @Nullable BigDecimal maxDepth,
            @Nullable BigDecimal visibility,
            @Nullable BigDecimal waterTemperature,

            @Schema(allowableValues = {"NONE", "MILD", "MODERATE", "STRONG"}) @Nullable
            String current,

            @Nullable String buddies,
            @Nullable String notes) {

        static EntryResponse of(EntryView entry) {
            return new EntryResponse(
                    entry.id(),
                    entry.siteId(),
                    entry.siteName(),
                    entry.countryCode(),
                    entry.regionCode(),
                    entry.date(),
                    entry.maxDepth(),
                    entry.visibility(),
                    entry.waterTemperature(),
                    entry.current(),
                    entry.buddies(),
                    entry.notes());
        }
    }

    @Schema(requiredProperties = {"siteId", "name", "countryCode", "regionCode", "dives"})
    record VisitedSiteResponse(long siteId, String name, String countryCode, String regionCode, long dives) {

        static VisitedSiteResponse of(VisitedSiteView site) {
            return new VisitedSiteResponse(
                    site.siteId(), site.name(), site.countryCode(), site.regionCode(), site.dives());
        }
    }

    @Schema(requiredProperties = {"dives", "sites"})
    record StatsResponse(long dives, long sites, @Nullable BigDecimal deepest) {

        static StatsResponse of(StatsView stats) {
            return new StatsResponse(stats.dives(), stats.sites(), stats.deepest());
        }
    }
}
