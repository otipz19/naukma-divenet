package ua.ukma.divenet.site.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.site.service.SiteModerationService;
import ua.ukma.divenet.site.web.SiteController.SiteResponse;

/** Spec site/moderation. The security filter chain limits these paths to admins. */
@RestController
@RequestMapping("/api/v1/admin/sites")
@SecurityRequirement(name = "bearerAuth")
class SiteModerationController {

    private final SiteModerationService moderation;

    SiteModerationController(SiteModerationService moderation) {
        this.moderation = moderation;
    }

    @GetMapping
    PagedModel<QueueItemResponse> queue(@ParameterObject Pageable pageable) {
        return new PagedModel<>(moderation
                .queue(pageable)
                .map(item -> new QueueItemResponse(SiteResponse.of(item.site()), item.authorName())));
    }

    @PostMapping("/{id}/approve")
    SiteResponse approve(@PathVariable long id) {
        return SiteResponse.of(moderation.approve(id));
    }

    @PostMapping("/{id}/reject")
    SiteResponse reject(@PathVariable long id, @Valid @RequestBody RejectRequest request) {
        return SiteResponse.of(moderation.reject(id, request.reason()));
    }

    record RejectRequest(@NotBlank @Size(max = 500) String reason) {}

    @Schema(requiredProperties = {"site", "authorName"})
    record QueueItemResponse(SiteResponse site, String authorName) {}
}
