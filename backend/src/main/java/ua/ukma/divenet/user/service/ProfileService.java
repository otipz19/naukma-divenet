package ua.ukma.divenet.user.service;

import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotAttachableException;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/**
 * Reads and edits public profiles (spec user/profile).
 *
 * <p>{@code MediaService.attach} and {@code release} clear the persistence context, so the user is
 * saved before a release and read again after each.
 */
@Service
public class ProfileService {

    private final UserRepository users;
    private final MediaService media;

    public ProfileService(UserRepository users, MediaService media) {
        this.users = users;
        this.media = media;
    }

    public record ProfileView(
            long id,
            String displayName,
            @Nullable String bio,
            @Nullable MediaView avatar,
            boolean showDiveLog,
            boolean showStatistics,
            boolean showCertificates) {}

    public record ProfileEdit(
            @Nullable String bio,
            @Nullable UUID avatarId,
            boolean showDiveLog,
            boolean showStatistics,
            boolean showCertificates) {}

    public static final class ProfileNotFoundException extends ErrorResponseException {
        public ProfileNotFoundException() {
            super(
                    HttpStatus.NOT_FOUND,
                    ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "User not found."),
                    null);
        }
    }

    /** A 400 with the same {@code errors} list as bean validation. */
    public static final class InvalidAvatarException extends ErrorResponseException {
        public InvalidAvatarException(String detail) {
            super(HttpStatus.BAD_REQUEST, problem(detail), null);
        }

        private static ProblemDetail problem(String detail) {
            ProblemDetail problem =
                    ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
            problem.setProperty("errors", List.of(new FieldViolation("avatarId", detail)));
            return problem;
        }
    }

    @Transactional(readOnly = true)
    public ProfileView profile(long id) {
        return view(find(id));
    }

    /** Attaches first, so a refused upload changes nothing. */
    @Transactional
    public ProfileView update(long userId, ProfileEdit edit) {
        UUID previous = find(userId).getAvatarId();
        UUID next = edit.avatarId();
        if (next != null && !next.equals(previous)) {
            attach(next, userId);
        }
        User user = find(userId);
        user.updateProfile(
                edit.bio() == null || edit.bio().isBlank() ? null : edit.bio().strip(),
                next,
                edit.showDiveLog(),
                edit.showStatistics(),
                edit.showCertificates());
        users.saveAndFlush(user);
        if (previous != null && !previous.equals(next)) {
            media.release(List.of(previous));
        }
        return view(find(userId));
    }

    private void attach(UUID avatarId, long userId) {
        try {
            media.attach(List.of(avatarId), userId);
        } catch (MediaNotAttachableException e) {
            throw new InvalidAvatarException(e.getBody().getDetail());
        }
    }

    private User find(long id) {
        return users.findById(id).orElseThrow(ProfileNotFoundException::new);
    }

    private ProfileView view(User user) {
        MediaView avatar = user.getAvatarId() == null
                ? null
                : media.views(List.of(user.getAvatarId())).stream().findFirst().orElse(null);
        return new ProfileView(
                user.getId(),
                user.getDisplayName(),
                user.getBio(),
                avatar,
                user.isShowDiveLog(),
                user.isShowStatistics(),
                user.isShowCertificates());
    }
}
