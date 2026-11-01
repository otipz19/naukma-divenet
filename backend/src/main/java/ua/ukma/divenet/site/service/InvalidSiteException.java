package ua.ukma.divenet.site.service;

import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.shared.web.FieldViolation;

/** A 400 with the same {@code errors} list as bean validation. */
public final class InvalidSiteException extends ErrorResponseException {

    public InvalidSiteException(List<FieldViolation> violations) {
        super(HttpStatus.BAD_REQUEST, problem(violations), null);
    }

    private static ProblemDetail problem(List<FieldViolation> violations) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
        problem.setProperty("errors", violations);
        return problem;
    }
}
