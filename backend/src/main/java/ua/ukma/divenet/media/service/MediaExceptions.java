package ua.ukma.divenet.media.service;

import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** The media failures; GlobalExceptionHandler renders each as a problem detail (design D2). */
public final class MediaExceptions {

    private MediaExceptions() {}

    /** Not JPEG, PNG or WebP by content, whatever the name or declared type says. */
    public static final class UnsupportedImageException extends ErrorResponseException {
        public UnsupportedImageException() {
            super(
                    HttpStatus.UNSUPPORTED_MEDIA_TYPE,
                    ProblemDetail.forStatusAndDetail(
                            HttpStatus.UNSUPPORTED_MEDIA_TYPE, "Only JPEG, PNG and WebP images are accepted."),
                    null);
        }
    }

    /** A supported type that cannot be decoded, or has more pixels than allowed. */
    public static final class InvalidImageException extends ErrorResponseException {
        public InvalidImageException(String detail) {
            super(HttpStatus.BAD_REQUEST, ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, detail), null);
        }
    }

    public static final class MediaNotFoundException extends ErrorResponseException {
        public MediaNotFoundException() {
            super(
                    HttpStatus.NOT_FOUND,
                    ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Media not found."),
                    null);
        }
    }

    /** Unknown, uploaded by someone else, or attached already (design D5). */
    public static final class MediaNotAttachableException extends ErrorResponseException {

        private final UUID mediaId;

        public MediaNotAttachableException(UUID mediaId) {
            super(
                    HttpStatus.BAD_REQUEST,
                    ProblemDetail.forStatusAndDetail(
                            HttpStatus.BAD_REQUEST, "Media " + mediaId + " cannot be attached."),
                    null);
            this.mediaId = mediaId;
        }

        public UUID mediaId() {
            return mediaId;
        }
    }
}
