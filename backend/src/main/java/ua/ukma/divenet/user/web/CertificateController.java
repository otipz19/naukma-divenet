package ua.ukma.divenet.user.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
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
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.user.service.CertificateService;
import ua.ukma.divenet.user.service.CertificateService.CertificateView;
import ua.ukma.divenet.user.service.CertificateService.Declaration;
import ua.ukma.divenet.user.service.CertificateService.Viewer;

/** Specs user/certificates and user/certificate-verification. The security filter chain guards the admin paths. */
@RestController
@RequestMapping("/api/v1")
class CertificateController {

    private final CertificateService certificates;

    CertificateController(CertificateService certificates) {
        this.certificates = certificates;
    }

    @PostMapping("/certificates")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    CertificateResponse declare(@Valid @RequestBody CertificateRequest request, @AuthenticationPrincipal Jwt jwt) {
        return CertificateResponse.of(certificates.declare(userId(jwt), request.toDeclaration()));
    }

    @PutMapping("/certificates/{id}")
    @SecurityRequirement(name = "bearerAuth")
    CertificateResponse update(
            @PathVariable long id, @Valid @RequestBody CertificateRequest request, @AuthenticationPrincipal Jwt jwt) {
        return CertificateResponse.of(certificates.update(id, userId(jwt), request.toDeclaration()));
    }

    @DeleteMapping("/certificates/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    void delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        certificates.delete(id, userId(jwt));
    }

    @GetMapping("/users/{id}/certificates")
    List<CertificateResponse> list(@PathVariable long id, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return certificates.list(id, viewer(jwt)).stream()
                .map(CertificateResponse::of)
                .toList();
    }

    @GetMapping("/admin/certificates")
    @SecurityRequirement(name = "bearerAuth")
    PagedModel<CertificateQueueItemResponse> queue(@ParameterObject Pageable pageable) {
        return new PagedModel<>(certificates
                .queue(pageable)
                .map(item -> new CertificateQueueItemResponse(
                        CertificateResponse.of(item.certificate()), item.holderId(), item.holderName())));
    }

    @PostMapping("/admin/certificates/{id}/verify")
    @SecurityRequirement(name = "bearerAuth")
    CertificateResponse verify(@PathVariable long id) {
        return CertificateResponse.of(certificates.verify(id));
    }

    @PostMapping("/admin/certificates/{id}/reject")
    @SecurityRequirement(name = "bearerAuth")
    CertificateResponse reject(@PathVariable long id, @Valid @RequestBody RejectCertificateRequest request) {
        return CertificateResponse.of(certificates.reject(id, request.reason()));
    }

    private static long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }

    private static Viewer viewer(@Nullable Jwt jwt) {
        if (jwt == null) {
            return new Viewer(null, false);
        }
        List<String> roles = jwt.getClaimAsStringList("roles");
        return new Viewer(Long.valueOf(jwt.getSubject()), roles != null && roles.contains("ADMIN"));
    }

    record CertificateRequest(
            @Schema(allowableValues = {"PADI", "SSI", "CMAS", "OTHER"})
            @NotBlank
            @Pattern(regexp = "PADI|SSI|CMAS|OTHER")
            String agency,

            @NotBlank @Size(max = 100) String level,
            @NotBlank @Size(max = 50) String number,
            @Nullable UUID photoId) {

        Declaration toDeclaration() {
            return new Declaration(agency, level, number, photoId);
        }
    }

    record RejectCertificateRequest(
            @NotBlank @Size(max = 500) String reason) {}

    @Schema(requiredProperties = {"id", "url", "thumbnailUrl", "width", "height"})
    record CertificatePhotoResponse(UUID id, String url, String thumbnailUrl, int width, int height) {

        static @Nullable CertificatePhotoResponse of(@Nullable MediaView media) {
            return media == null
                    ? null
                    : new CertificatePhotoResponse(
                            media.id(), media.url(), media.thumbnailUrl(), media.width(), media.height());
        }
    }

    /** The number, photo and reason are null for the public. */
    @Schema(requiredProperties = {"id", "agency", "level", "status"})
    record CertificateResponse(
            long id,

            @Schema(allowableValues = {"PADI", "SSI", "CMAS", "OTHER"})
            String agency,

            String level,

            @Schema(allowableValues = {"PENDING", "VERIFIED", "REJECTED"})
            String status,

            @Nullable String number,
            @Nullable CertificatePhotoResponse photo,
            @Nullable String rejectionReason) {

        static CertificateResponse of(CertificateView view) {
            return new CertificateResponse(
                    view.id(),
                    view.agency(),
                    view.level(),
                    view.status(),
                    view.number(),
                    CertificatePhotoResponse.of(view.photo()),
                    view.rejectionReason());
        }
    }

    @Schema(requiredProperties = {"certificate", "holderId", "holderName"})
    record CertificateQueueItemResponse(CertificateResponse certificate, long holderId, String holderName) {}
}
