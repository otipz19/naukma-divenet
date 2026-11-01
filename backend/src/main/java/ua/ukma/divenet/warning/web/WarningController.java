package ua.ukma.divenet.warning.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpHeaders;
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
import ua.ukma.divenet.warning.service.WarningService;
import ua.ukma.divenet.warning.service.WarningView;

/** Spec warning/warnings (design D4, D5). */
@RestController
@RequestMapping("/api/v1")
class WarningController {

    private final WarningService warnings;

    WarningController(WarningService warnings) {
        this.warnings = warnings;
    }

    @GetMapping("/sites/{siteId}/warnings")
    PagedModel<WarningResponse> list(@PathVariable long siteId, @ParameterObject Pageable pageable) {
        return new PagedModel<>(warnings.list(siteId, pageable).map(WarningResponse::of));
    }

    @GetMapping("/warnings/{id}")
    WarningResponse get(@PathVariable long id) {
        return WarningResponse.of(warnings.get(id));
    }

    @PostMapping("/sites/{siteId}/warnings")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    WarningResponse create(
            @PathVariable long siteId,
            @Valid @RequestBody WarningRequest request,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletResponse response) {
        WarningView warning = warnings.create(siteId, userId(jwt), request.type(), request.text());
        response.setHeader(HttpHeaders.LOCATION, "/api/v1/warnings/" + warning.id());
        return WarningResponse.of(warning);
    }

    @PutMapping("/warnings/{id}")
    @SecurityRequirement(name = "bearerAuth")
    WarningResponse update(
            @PathVariable long id, @Valid @RequestBody WarningRequest request, @AuthenticationPrincipal Jwt jwt) {
        return WarningResponse.of(warnings.update(id, userId(jwt), request.type(), request.text()));
    }

    @DeleteMapping("/warnings/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    void delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        warnings.delete(id, userId(jwt));
    }

    private static long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }

    /**
     * {@code type} is a validated string so an unknown value produces a field error on {@code type}
     * rather than an unreadable-body 400 (design D4).
     */
    @Schema(requiredProperties = {"type", "text"})
    record WarningRequest(
            @Schema(allowableValues = {"HAZARD", "INCIDENT", "CHANGED_CONDITIONS", "MARINE_LIFE"})
            @NotBlank
            @Pattern(regexp = "(?i)HAZARD|INCIDENT|CHANGED_CONDITIONS|MARINE_LIFE")
            String type,

            @NotBlank @Size(max = 1000) String text) {}

    @Schema(requiredProperties = {"id", "displayName"})
    record WarningAuthorResponse(long id, String displayName) {}

    @Schema(requiredProperties = {"id", "siteId", "type", "text", "author", "createdAt", "updatedAt"})
    record WarningResponse(
            long id,
            long siteId,

            @Schema(allowableValues = {"HAZARD", "INCIDENT", "CHANGED_CONDITIONS", "MARINE_LIFE"})
            String type,

            String text,
            WarningAuthorResponse author,
            Instant createdAt,
            Instant updatedAt) {

        static WarningResponse of(WarningView warning) {
            return new WarningResponse(
                    warning.id(),
                    warning.siteId(),
                    warning.type(),
                    warning.text(),
                    new WarningAuthorResponse(warning.authorId(), warning.authorName()),
                    warning.createdAt(),
                    warning.updatedAt());
        }
    }
}
