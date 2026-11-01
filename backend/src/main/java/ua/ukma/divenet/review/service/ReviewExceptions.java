package ua.ukma.divenet.review.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.shared.web.FieldViolation;

/** The review failures; each renders as a problem detail (spec review/reviews). */
public final class ReviewExceptions {

    private ReviewExceptions() {}

    public static final class ReviewNotFoundException extends ErrorResponseException {
        public ReviewNotFoundException() {
            super(
                    HttpStatus.NOT_FOUND,
                    ProblemDetail.forStatusAndDetail(HttpStatus.NOT_FOUND, "Review not found."),
                    null);
        }
    }

    /** One review per user per site (design D3). */
    public static final class ReviewAlreadyExistsException extends ErrorResponseException {
        public ReviewAlreadyExistsException() {
            super(
                    HttpStatus.CONFLICT,
                    ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "You have already reviewed this site."),
                    null);
        }
    }

    public static final class NotReviewAuthorException extends ErrorResponseException {
        public NotReviewAuthorException() {
            super(
                    HttpStatus.FORBIDDEN,
                    ProblemDetail.forStatusAndDetail(HttpStatus.FORBIDDEN, "Only the author can change this review."),
                    null);
        }
    }

    /** A 400 with the same {@code errors} list as bean validation. */
    public static final class InvalidReviewException extends ErrorResponseException {
        public InvalidReviewException(FieldViolation violation) {
            super(HttpStatus.BAD_REQUEST, problem(List.of(violation)), null);
        }

        private static ProblemDetail problem(List<FieldViolation> violations) {
            ProblemDetail problem =
                    ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
            problem.setProperty("errors", violations);
            return problem;
        }
    }
}
