package ua.ukma.divenet.warning.web;

import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.warning.service.WarningService;

/** Spec warning/warnings (design D2, D5). The security filter chain limits these paths to admins. */
@RestController
@RequestMapping("/api/v1/admin/warnings")
@SecurityRequirement(name = "bearerAuth")
class WarningModerationController {

    private final WarningService warnings;

    WarningModerationController(WarningService warnings) {
        this.warnings = warnings;
    }

    @PostMapping("/{id}/hide")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    void hide(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        warnings.hide(id, Long.parseLong(jwt.getSubject()));
    }
}
