package ua.ukma.divenet.review.service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotAttachableException;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.review.domain.Review;
import ua.ukma.divenet.review.domain.ReviewRepository;
import ua.ukma.divenet.review.service.ReviewExceptions.InvalidReviewException;
import ua.ukma.divenet.review.service.ReviewExceptions.NotReviewAuthorException;
import ua.ukma.divenet.review.service.ReviewExceptions.ReviewAlreadyExistsException;
import ua.ukma.divenet.review.service.ReviewExceptions.ReviewNotFoundException;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.service.ReviewAggregates;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.site.service.SiteCatalogService.Viewer;
import ua.ukma.divenet.user.domain.UserRepository;
import ua.ukma.divenet.user.service.CertificateService;

/**
 * Specs review/reviews and review/ratings. Every write locks the site first, so the writes of one site
 * run one at a time, and recomputes the site's aggregates before it returns (design D2).
 *
 * <p>{@code MediaService.attach} and {@code release} clear the persistence context, so reviews are
 * loaded again after them.
 */
@Service
public class ReviewService {

    private static final Viewer ANYONE = new Viewer(null, false);

    private final ReviewRepository reviews;
    private final SiteCatalogService catalog;
    private final MediaService media;
    private final UserRepository users;
    private final CertificateService certificates;
    private final Clock clock;

    public ReviewService(
            ReviewRepository reviews,
            SiteCatalogService catalog,
            MediaService media,
            UserRepository users,
            CertificateService certificates,
            Clock clock) {
        this.reviews = reviews;
        this.catalog = catalog;
        this.media = media;
        this.users = users;
        this.certificates = certificates;
        this.clock = clock;
    }

    /** What a create or edit sets; bean validation has checked ranges, lengths and the photo count. */
    public record Content(
            @Nullable Integer rating,
            @Nullable Integer difficulty,
            @Nullable String text,
            List<UUID> photoIds) {}

    /** Unknown and unapproved sites answer 404, as their details do. */
    @Transactional(readOnly = true)
    public Page<ReviewView> list(long siteId, ReviewSort sort, int page, int size) {
        catalog.site(siteId, ANYONE);
        PageRequest pageable = PageRequest.of(page, size);
        Page<Review> found = sort == ReviewSort.RATING
                ? reviews.findHighestRated(siteId, pageable)
                : reviews.findNewest(siteId, pageable);
        Map<UUID, MediaView> photos = photos(
                found.stream().flatMap(review -> review.getPhotoIds().stream()).toList());
        Map<Long, String> badges = certificates.verifiedBadges(found.stream()
                .map(review -> review.getAuthor().getId())
                .distinct()
                .toList());
        return found.map(review -> view(review, photos, badges));
    }

    @Transactional(readOnly = true)
    public ReviewView mine(long siteId, long userId) {
        return view(reviews.findBySite_IdAndAuthor_Id(siteId, userId).orElseThrow(ReviewNotFoundException::new));
    }

    @Transactional
    public ReviewView create(long siteId, long authorId, Content content) {
        Site site = catalog.lockForReview(siteId);
        if (reviews.existsBySite_IdAndAuthor_Id(siteId, authorId)) {
            throw new ReviewAlreadyExistsException();
        }
        String text = text(content);
        List<UUID> photoIds = distinct(content.photoIds());
        attach(photoIds, authorId);
        Instant now = now();
        Review review = new Review(site, users.getReferenceById(authorId), now);
        review.setContent(content.rating(), content.difficulty(), text, photoIds, now);
        long id = reviews.saveAndFlush(review).getId();
        refreshAggregates(siteId);
        return view(load(id));
    }

    /** Design D5: photos left out are released, new ones attached, kept ones untouched. */
    @Transactional
    public ReviewView update(long id, long userId, Content content) {
        Review review = authored(id, userId);
        long siteId = review.getSite().getId();
        catalog.lockForReview(siteId);
        String text = text(content);
        List<UUID> current = review.getPhotoIds();
        List<UUID> requested = distinct(content.photoIds());
        attach(requested.stream().filter(photo -> !current.contains(photo)).toList(), userId);
        review = load(id);
        review.setContent(content.rating(), content.difficulty(), text, requested, now());
        // The links go before the uploads they point to.
        reviews.flush();
        media.release(
                current.stream().filter(photo -> !requested.contains(photo)).toList());
        refreshAggregates(siteId);
        return view(load(id));
    }

    @Transactional
    public void delete(long id, long userId) {
        Review review = authored(id, userId);
        long siteId = review.getSite().getId();
        catalog.lockForReview(siteId);
        List<UUID> photoIds = review.getPhotoIds();
        reviews.delete(review);
        reviews.flush();
        media.release(photoIds);
        refreshAggregates(siteId);
    }

    private Review authored(long id, long userId) {
        Review review = load(id);
        if (review.getAuthor().getId() != userId) {
            throw new NotReviewAuthorException();
        }
        return review;
    }

    private Review load(long id) {
        return reviews.findById(id).orElseThrow(ReviewNotFoundException::new);
    }

    /** The stripped text, or null when blank; refuses a review with neither rating nor text. */
    private static @Nullable String text(Content content) {
        String text = content.text() == null || content.text().isBlank()
                ? null
                : content.text().strip();
        if (text == null && content.rating() == null) {
            throw new InvalidReviewException(new FieldViolation("text", "A rating or a text is required."));
        }
        return text;
    }

    /** The review API names fields, so a refused upload is a violation on {@code photoIds} (design D4). */
    private void attach(List<UUID> photoIds, long userId) {
        try {
            media.attach(photoIds, userId);
        } catch (MediaNotAttachableException e) {
            throw new InvalidReviewException(
                    new FieldViolation("photoIds", e.getBody().getDetail()));
        }
    }

    private void refreshAggregates(long siteId) {
        reviews.flush();
        ReviewRepository.Aggregates aggregates = reviews.aggregates(siteId);
        catalog.updateReviewAggregates(
                siteId,
                new ReviewAggregates(
                        aggregates.getRatingAverage(),
                        (int) aggregates.getRatingCount(),
                        (int) aggregates.getReviewCount(),
                        aggregates.getCommunityDifficulty()));
    }

    private ReviewView view(Review review) {
        return view(
                review,
                photos(review.getPhotoIds()),
                certificates.verifiedBadges(List.of(review.getAuthor().getId())));
    }

    private Map<UUID, MediaView> photos(List<UUID> ids) {
        return media.views(ids).stream().collect(Collectors.toMap(MediaView::id, Function.identity()));
    }

    private static ReviewView view(Review review, Map<UUID, MediaView> photos, Map<Long, String> badges) {
        return new ReviewView(
                review.getId(),
                review.getSite().getId(),
                review.getAuthor().getId(),
                review.getAuthor().getDisplayName(),
                review.getAuthor().getAvatarId() == null
                        ? null
                        : MediaView.thumbnailUrlOf(review.getAuthor().getAvatarId()),
                badges.get(review.getAuthor().getId()),
                review.getRating(),
                review.getDifficulty(),
                review.getText(),
                review.getPhotoIds().stream().map(photos::get).toList(),
                review.getCreatedAt(),
                review.getUpdatedAt());
    }

    private static List<UUID> distinct(List<UUID> ids) {
        return List.copyOf(new LinkedHashSet<>(ids));
    }

    /** Truncated to what timestamptz stores, so a review reads back as it was written. */
    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
