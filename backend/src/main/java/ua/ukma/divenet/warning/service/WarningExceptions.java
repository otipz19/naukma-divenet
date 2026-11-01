package ua.ukma.divenet.warning.service;

import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;

/** The warning failures; each renders as a problem detail (spec warning/warnings). */
public final class WarningExceptions {

    private WarningExceptions() {}

    public static final class WarningNotFoundException extends ErrorResponseException {
        public WarningNotFoundException() {
            super(
                    HttpStatus.NOT_FOUND,
                    ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Warning not found."),
                    null);
        }
    }

    public static final class NotWarningAuthorException extends ErrorResponseException {
        public NotWarningAuthorException() {
            super(
                    HttpStatus.FORBIDDEN,
                    ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Only the author can change this warning."),
                    null);
        }
    }
}
