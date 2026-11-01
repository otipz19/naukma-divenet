package ua.ukma.divenet.achievement.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.time.Instant;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.achievement.service.AchievementService;

/** Spec achievement/achievements. */
@RestController
@RequestMapping("/api/v1")
class AchievementController {

    private final AchievementService achievements;

    AchievementController(AchievementService achievements) {
        this.achievements = achievements;
    }

    @GetMapping("/users/{id}/achievements")
    List<AchievementResponse> list(@PathVariable long id, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return achievements.list(id, jwt == null ? null : Long.valueOf(jwt.getSubject())).stream()
                .map(view -> new AchievementResponse(view.code(), view.target(), view.progress(), view.earnedAt()))
                .toList();
    }

    @Schema(requiredProperties = {"code", "target"})
    record AchievementResponse(
            String code,
            int target,
            @Nullable Integer progress,
            @Nullable Instant earnedAt) {}
}
