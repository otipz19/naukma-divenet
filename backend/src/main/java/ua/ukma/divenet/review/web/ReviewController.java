package ua.ukma.divenet.review.web;

import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springframework.data.web.PagedModel;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.review.service.ReviewService;
import ua.ukma.divenet.review.service.ReviewService.Content;
import ua.ukma.divenet.review.service.ReviewSort;
import ua.ukma.divenet.review.service.ReviewView;

/** Spec review/reviews (design D4). Writes need a token; the security filter chain enforces it. */
@RestController
@RequestMapping("/api/v1")
class ReviewController {

    private final ReviewService reviews;

    ReviewController(ReviewService reviews) {
        this.reviews = reviews;
    }

    /** {@code sort} names the review order, so paging takes plain {@code page} and {@code size}. */
    @GetMapping("/sites/{siteId}/reviews")
    PagedModel<ReviewResponse> list(
            @PathVariable long siteId,
            @Parameter(
                            schema =
                                    @Schema(
                                            allowableValues = {"newest", "rating"},
                                            defaultValue = "newest"))
                    @RequestParam(defaultValue = "newest")
                    ReviewSort sort,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return new PagedModel<>(reviews.list(siteId, sort, page, size).map(ReviewResponse::of));
    }

    @GetMapping("/sites/{siteId}/reviews/mine")
    @SecurityRequirement(name = "bearerAuth")
    ReviewResponse mine(@PathVariable long siteId, @AuthenticationPrincipal Jwt jwt) {
        return ReviewResponse.of(reviews.mine(siteId, userId(jwt)));
    }

    @PostMapping("/sites/{siteId}/reviews")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    ReviewResponse create(
            @PathVariable long siteId,
            @Valid @RequestBody ReviewRequest request,
            @AuthenticationPrincipal Jwt jwt,
            HttpServletResponse response) {
        ReviewView review = reviews.create(siteId, userId(jwt), request.toContent());
        response.setHeader(HttpHeaders.LOCATION, "/api/v1/reviews/" + review.id());
        return ReviewResponse.of(review);
    }

    @PutMapping("/reviews/{id}")
    @SecurityRequirement(name = "bearerAuth")
    ReviewResponse update(
            @PathVariable long id, @Valid @RequestBody ReviewRequest request, @AuthenticationPrincipal Jwt jwt) {
        return ReviewResponse.of(reviews.update(id, userId(jwt), request.toContent()));
    }

    @DeleteMapping("/reviews/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    void delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        reviews.delete(id, userId(jwt));
    }

    private static long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }

    /** Every field is optional; the service requires a rating or a text. */
    record ReviewRequest(
            @Nullable @Min(1) @Max(5) Integer rating,
            @Nullable @Min(1) @Max(5) Integer difficulty,
            @Nullable @Size(max = 4000) String text,
            @Nullable @Size(max = 6) List<@NotNull UUID> photoIds) {

        Content toContent() {
            return new Content(rating, difficulty, text, photoIds == null ? List.of() : photoIds);
        }
    }

    @Schema(requiredProperties = {"id", "displayName"})
    record AuthorResponse(
            long id, String displayName, @Nullable String avatarUrl) {}

    @Schema(requiredProperties = {"id", "url", "thumbnailUrl", "width", "height"})
    record PhotoResponse(UUID id, String url, String thumbnailUrl, int width, int height) {

        static PhotoResponse of(MediaView media) {
            return new PhotoResponse(media.id(), media.url(), media.thumbnailUrl(), media.width(), media.height());
        }
    }

    /** Absent fields are the ones the author left out. */
    @Schema(requiredProperties = {"id", "siteId", "author", "photos", "createdAt", "updatedAt"})
    record ReviewResponse(
            long id,
            long siteId,
            AuthorResponse author,
            @Nullable Integer rating,
            @Nullable Integer difficulty,
            @Nullable String text,
            List<PhotoResponse> photos,
            Instant createdAt,
            Instant updatedAt) {

        static ReviewResponse of(ReviewView review) {
            return new ReviewResponse(
                    review.id(),
                    review.siteId(),
                    new AuthorResponse(review.authorId(), review.authorName(), review.authorAvatarUrl()),
                    review.rating(),
                    review.difficulty(),
                    review.text(),
                    review.photos().stream().map(PhotoResponse::of).toList(),
                    review.createdAt(),
                    review.updatedAt());
        }
    }
}
