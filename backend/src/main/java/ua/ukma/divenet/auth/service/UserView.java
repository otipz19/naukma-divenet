package ua.ukma.divenet.auth.service;

import ua.ukma.divenet.user.domain.User;

/** The public view of an account. {@code role} is the role's name, so web code never sees the entity. */
public record UserView(long id, String email, String displayName, String role) {

    static UserView of(User user) {
        return new UserView(
                user.getId(),
                user.getEmail(),
                user.getDisplayName(),
                user.getRole().name());
    }
}
