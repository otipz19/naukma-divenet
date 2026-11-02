package ua.ukma.divenet.user.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.user.service.LockerService;
import ua.ukma.divenet.user.service.LockerService.LockerItemView;

/** Spec user/gear-locker. */
@RestController
@RequestMapping("/api/v1")
class LockerController {

    private final LockerService locker;

    LockerController(LockerService locker) {
        this.locker = locker;
    }

    @GetMapping("/users/{id}/gear-locker")
    List<LockerItemResponse> list(@PathVariable long id) {
        return locker.list(id).stream().map(LockerItemResponse::of).toList();
    }

    @PostMapping("/gear-locker")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    LockerItemResponse add(@Valid @RequestBody LockerItemRequest request, @AuthenticationPrincipal Jwt jwt) {
        return LockerItemResponse.of(locker.add(Long.parseLong(jwt.getSubject()), request.name()));
    }

    @DeleteMapping("/gear-locker/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    void remove(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        locker.remove(id, Long.parseLong(jwt.getSubject()));
    }

    record LockerItemRequest(@NotBlank @Size(max = 100) String name) {}

    @Schema(requiredProperties = {"id", "name"})
    record LockerItemResponse(long id, String name) {

        static LockerItemResponse of(LockerItemView view) {
            return new LockerItemResponse(view.id(), view.name());
        }
    }
}
