package ua.ukma.divenet.auth.service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** The auth failures; GlobalExceptionHandler renders each as a problem detail (design D6). */
public final class AuthExceptions {

    private AuthExceptions() {}

    /** One fixed message for a wrong password and an unknown email alike. */
    public static final class InvalidCredentialsException extends ErrorResponseException {
        public InvalidCredentialsException() {
            super(
                    HttpStatus.UNAUTHORIZED,
                    ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "Email or password is incorrect."),
                    null);
        }
    }

    public static final class EmailTakenException extends ErrorResponseException {
        public EmailTakenException() {
            super(
                    HttpStatus.CONFLICT,
                    ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "This email is already registered."),
                    null);
        }
    }

    /** Missing, unknown, expired, rotated or revoked refresh token. */
    public static final class InvalidRefreshTokenException extends ErrorResponseException {
        public InvalidRefreshTokenException() {
            super(
                    HttpStatus.UNAUTHORIZED,
                    ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "The session has ended. Log in again."),
                    null);
        }
    }

    /** The access token names a user that no longer exists. */
    public static final class UnknownUserException extends ErrorResponseException {
        public UnknownUserException() {
            super(
                    HttpStatus.UNAUTHORIZED,
                    ProblemDetail.forStatusAndDetail(HttpStatus.UNAUTHORIZED, "A valid access token is required."),
                    null);
        }
    }
}
