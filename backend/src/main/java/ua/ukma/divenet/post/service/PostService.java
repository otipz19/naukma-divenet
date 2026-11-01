package ua.ukma.divenet.post.service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.geo.domain.Region;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotAttachableException;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.post.domain.Post;
import ua.ukma.divenet.post.domain.PostRepository;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/**
 * Spec post/posts.
 *
 * <p>{@code MediaService.attach} and {@code release} clear the persistence context, so posts are
 * loaded, and the region and site looked up, after attaching.
 */
@Service
public class PostService {

    private static final int EXCERPT_LENGTH = 200;
    private static final int WORDS_PER_MINUTE = 200;

    private final PostRepository posts;
    private final MediaService media;
    private final SiteCatalogService catalog;
    private final RegionRepository regions;
    private final UserRepository users;
    private final Clock clock;

    public PostService(
            PostRepository posts,
            MediaService media,
            SiteCatalogService catalog,
            RegionRepository regions,
            UserRepository users,
            Clock clock) {
        this.posts = posts;
        this.media = media;
        this.catalog = catalog;
        this.regions = regions;
        this.users = users;
        this.clock = clock;
    }

    public record Content(
            String title,
            @Nullable String text,
            String status,
            @Nullable UUID coverId,
            @Nullable List<UUID> photoIds,
            @Nullable String regionCode,
            @Nullable Long siteId) {}

    public record AuthorView(
            long id, String displayName, @Nullable String avatarUrl) {}

    public record SiteLinkView(long id, String name) {}

    public record PostView(
            long id,
            String title,
            String text,
            String status,
            int readMinutes,
            @Nullable Instant publishedAt,
            Instant updatedAt,
            AuthorView author,
            @Nullable MediaView cover,
            List<MediaView> photos,
            @Nullable String countryCode,
            @Nullable String regionCode,
            @Nullable SiteLinkView site) {}

    public record PostSummaryView(
            long id,
            String title,
            String excerpt,
            String status,
            int readMinutes,
            @Nullable Instant publishedAt,
            Instant updatedAt,
            AuthorView author,
            @Nullable MediaView cover,
            @Nullable String countryCode,
            @Nullable String regionCode,
            @Nullable SiteLinkView site) {}

    private static ErrorResponseException problem(HttpStatus status, String detail) {
        return new ErrorResponseException(status, ProblemDetail.forStatusAndDetail(status, detail), null);
    }

    /** A 400 with the same {@code errors} list as bean validation. */
    private static ErrorResponseException invalid(String field, String message) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
        problem.setProperty("errors", List.of(new FieldViolation(field, message)));
        return new ErrorResponseException(HttpStatus.BAD_REQUEST, problem, null);
    }

    @Transactional
    public PostView create(long authorId, Content content) {
        List<UUID> photoIds = photoIds(content);
        check(content, photoIds);
        attach(content.coverId() == null ? List.of() : List.of(content.coverId()), authorId, "coverId");
        attach(photoIds, authorId, "photoIds");
        Post post = new Post(users.getReferenceById(authorId), details(content, photoIds), now());
        return view(posts.save(post));
    }

    /** Uploads left out are released, new ones attached, kept ones untouched (as ReviewService.update). */
    @Transactional
    public PostView update(long id, long userId, Content content) {
        Post post = authored(id, userId);
        List<UUID> photoIds = photoIds(content);
        check(content, photoIds);
        List<UUID> current = uploads(post.getCoverId(), post.getPhotoIds());
        UUID cover = content.coverId();
        attach(cover == null || current.contains(cover) ? List.of() : List.of(cover), userId, "coverId");
        attach(photoIds.stream().filter(photo -> !current.contains(photo)).toList(), userId, "photoIds");
        List<UUID> requested = uploads(cover, photoIds);
        post = load(id);
        post.update(details(content, photoIds), now());
        // The links go before the uploads they point to.
        posts.flush();
        media.release(
                current.stream().filter(photo -> !requested.contains(photo)).toList());
        return view(load(id));
    }

    @Transactional
    public void delete(long id, long userId) {
        Post post = authored(id, userId);
        List<UUID> uploads = uploads(post.getCoverId(), post.getPhotoIds());
        posts.delete(post);
        posts.flush();
        media.release(uploads);
    }

    /** A draft is hidden from everyone but its author: 404, so its existence does not show. */
    @Transactional(readOnly = true)
    public PostView read(long id, @Nullable Long viewerId) {
        Post post = load(id);
        boolean author = post.getAuthor().getId().equals(viewerId);
        if (post.getStatus() == Post.Status.DRAFT && !author) {
            throw notFound();
        }
        return view(post);
    }

    @Transactional(readOnly = true)
    public Page<PostSummaryView> blog(long authorId, Pageable pageable) {
        if (!users.existsById(authorId)) {
            throw problem(HttpStatus.NOT_FOUND, "User not found.");
        }
        return summaries(
                posts.findByAuthor_IdAndStatusOrderByPublishedAtDescIdDesc(authorId, Post.Status.PUBLISHED, pageable));
    }

    @Transactional(readOnly = true)
    public Page<PostSummaryView> drafts(long authorId, Pageable pageable) {
        return summaries(
                posts.findByAuthor_IdAndStatusOrderByUpdatedAtDescIdDesc(authorId, Post.Status.DRAFT, pageable));
    }

    /** One line of the text, cut at a word. */
    static String excerpt(String text) {
        String line = text.strip().replaceAll("\\s+", " ");
        if (line.length() <= EXCERPT_LENGTH) {
            return line;
        }
        int cut = line.lastIndexOf(' ', EXCERPT_LENGTH);
        return line.substring(0, cut > 0 ? cut : EXCERPT_LENGTH) + "…";
    }

    /** At least one minute, even for an empty draft. */
    static int readMinutes(String text) {
        String stripped = text.strip();
        int words = stripped.isEmpty() ? 0 : stripped.split("\\s+").length;
        return Math.max(1, (words + WORDS_PER_MINUTE - 1) / WORDS_PER_MINUTE);
    }

    private static List<UUID> photoIds(Content content) {
        return content.photoIds() == null
                ? List.of()
                : content.photoIds().stream().distinct().toList();
    }

    private static void check(Content content, List<UUID> photoIds) {
        if (content.status().equals(Post.Status.PUBLISHED.name())
                && (content.text() == null || content.text().isBlank())) {
            throw invalid("text", "A published post needs text.");
        }
        if (content.coverId() != null && photoIds.contains(content.coverId())) {
            throw invalid("photoIds", "The cover cannot also be an image.");
        }
    }

    /** The API names fields, so a refused upload is a violation on the field that named it. */
    private void attach(Collection<UUID> ids, long userId, String field) {
        try {
            media.attach(ids, userId);
        } catch (MediaNotAttachableException e) {
            throw invalid(field, e.getBody().getDetail());
        }
    }

    private Post.Details details(Content content, List<UUID> photoIds) {
        Region region = content.regionCode() == null
                ? null
                : regions.findById(content.regionCode())
                        .orElseThrow(() -> invalid("regionCode", "must be a known region"));
        Site site = content.siteId() == null
                ? null
                : catalog.findApproved(content.siteId())
                        .orElseThrow(() -> invalid("siteId", "must be an approved site"));
        // A site's posts are always in its region, so a feed can filter on the region alone (design D4).
        if (site != null && region != null && !site.getRegion().getCode().equals(region.getCode())) {
            throw invalid("siteId", "must be in the chosen region");
        }
        return new Post.Details(
                content.title().strip(),
                content.text() == null ? "" : content.text().strip(),
                Post.Status.valueOf(content.status()),
                content.coverId(),
                photoIds,
                site != null ? site.getRegion() : region,
                site);
    }

    private static List<UUID> uploads(@Nullable UUID cover, List<UUID> photoIds) {
        List<UUID> uploads = new ArrayList<>(photoIds);
        if (cover != null) {
            uploads.add(cover);
        }
        return uploads;
    }

    private Post authored(long id, long userId) {
        Post post = load(id);
        if (post.getAuthor().getId() != userId) {
            throw problem(HttpStatus.FORBIDDEN, "Only the author can change this post.");
        }
        return post;
    }

    private Post load(long id) {
        return posts.findById(id).orElseThrow(PostService::notFound);
    }

    private static ErrorResponseException notFound() {
        return problem(HttpStatus.NOT_FOUND, "Post not found.");
    }

    private PostView view(Post post) {
        UUID coverId = post.getCoverId();
        MediaView cover = coverId == null
                ? null
                : media.views(List.of(coverId)).stream().findFirst().orElse(null);
        Region region = post.getRegion();
        return new PostView(
                post.getId(),
                post.getTitle(),
                post.getText(),
                post.getStatus().name(),
                readMinutes(post.getText()),
                post.getPublishedAt(),
                post.getUpdatedAt(),
                author(post.getAuthor()),
                cover,
                media.views(post.getPhotoIds()),
                region == null ? null : region.getCountry().getCode(),
                region == null ? null : region.getCode(),
                site(post.getSite()));
    }

    /** One query for all the page's covers. */
    private Page<PostSummaryView> summaries(Page<Post> page) {
        List<UUID> coverIds = page.stream()
                .map(Post::getCoverId)
                .filter(java.util.Objects::nonNull)
                .toList();
        Map<UUID, MediaView> covers =
                media.views(coverIds).stream().collect(Collectors.toMap(MediaView::id, Function.identity()));
        return page.map(post -> {
            Region region = post.getRegion();
            return new PostSummaryView(
                    post.getId(),
                    post.getTitle(),
                    excerpt(post.getText()),
                    post.getStatus().name(),
                    readMinutes(post.getText()),
                    post.getPublishedAt(),
                    post.getUpdatedAt(),
                    author(post.getAuthor()),
                    post.getCoverId() == null ? null : covers.get(post.getCoverId()),
                    region == null ? null : region.getCountry().getCode(),
                    region == null ? null : region.getCode(),
                    site(post.getSite()));
        });
    }

    private static AuthorView author(User user) {
        UUID avatar = user.getAvatarId();
        return new AuthorView(
                user.getId(), user.getDisplayName(), avatar == null ? null : MediaView.thumbnailUrlOf(avatar));
    }

    private static @Nullable SiteLinkView site(@Nullable Site site) {
        return site == null ? null : new SiteLinkView(site.getId(), site.getName());
    }

    /** Truncated to what timestamptz stores, so a post reads back as it was written. */
    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
