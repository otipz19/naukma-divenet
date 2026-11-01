package ua.ukma.divenet.user.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.user.service.ProfileService;
import ua.ukma.divenet.user.service.ProfileService.ProfileEdit;
import ua.ukma.divenet.user.service.ProfileService.ProfileView;

/** Spec user/profile. Never returns the email, role or password hash. */
@RestController
@RequestMapping("/api/v1/users")
class ProfileController {

    private final ProfileService profiles;

    ProfileController(ProfileService profiles) {
        this.profiles = profiles;
    }

    @GetMapping("/{id}")
    ProfileResponse profile(@PathVariable long id) {
        return ProfileResponse.of(profiles.profile(id));
    }

    @PutMapping("/me")
    @SecurityRequirement(name = "bearerAuth")
    ProfileResponse update(@Valid @RequestBody ProfileRequest request, @AuthenticationPrincipal Jwt jwt) {
        return ProfileResponse.of(profiles.update(
                Long.parseLong(jwt.getSubject()),
                new ProfileEdit(
                        request.bio(),
                        request.avatarId(),
                        request.showDiveLog(),
                        request.showStatistics(),
                        request.showCertificates())));
    }

    record ProfileRequest(
            @Nullable @Size(max = 500) String bio,
            @Nullable UUID avatarId,
            @NotNull Boolean showDiveLog,
            @NotNull Boolean showStatistics,
            @NotNull Boolean showCertificates) {}

    @Schema(requiredProperties = {"id", "url", "thumbnailUrl", "width", "height"})
    record AvatarResponse(UUID id, String url, String thumbnailUrl, int width, int height) {

        static @Nullable AvatarResponse of(@Nullable MediaView media) {
            return media == null
                    ? null
                    : new AvatarResponse(media.id(), media.url(), media.thumbnailUrl(), media.width(), media.height());
        }
    }

    @Schema(requiredProperties = {"id", "displayName", "showDiveLog", "showStatistics", "showCertificates"})
    record ProfileResponse(
            long id,
            String displayName,
            @Nullable String bio,
            @Nullable AvatarResponse avatar,
            boolean showDiveLog,
            boolean showStatistics,
            boolean showCertificates) {

        static ProfileResponse of(ProfileView view) {
            return new ProfileResponse(
                    view.id(),
                    view.displayName(),
                    view.bio(),
                    AvatarResponse.of(view.avatar()),
                    view.showDiveLog(),
                    view.showStatistics(),
                    view.showCertificates());
        }
    }
}
