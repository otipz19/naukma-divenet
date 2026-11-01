package ua.ukma.divenet.post.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.UUID;
import org.jspecify.annotations.Nullable;
import org.springdoc.core.annotations.ParameterObject;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
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
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.post.service.PostService;
import ua.ukma.divenet.post.service.PostService.AuthorView;
import ua.ukma.divenet.post.service.PostService.Content;
import ua.ukma.divenet.post.service.PostService.PostSummaryView;
import ua.ukma.divenet.post.service.PostService.PostView;
import ua.ukma.divenet.post.service.PostService.SiteLinkView;

/** Spec post/posts. */
@RestController
@RequestMapping("/api/v1")
class PostController {

    private final PostService posts;

    PostController(PostService posts) {
        this.posts = posts;
    }

    @PostMapping("/posts")
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    PostResponse create(@Valid @RequestBody PostRequest request, @AuthenticationPrincipal Jwt jwt) {
        return PostResponse.of(posts.create(userId(jwt), request.toContent()));
    }

    @GetMapping("/posts/drafts")
    @SecurityRequirement(name = "bearerAuth")
    PagedModel<PostSummaryResponse> drafts(@ParameterObject Pageable pageable, @AuthenticationPrincipal Jwt jwt) {
        return new PagedModel<>(posts.drafts(userId(jwt), pageable).map(PostSummaryResponse::of));
    }

    @GetMapping("/posts/{id}")
    PostResponse read(@PathVariable long id, @AuthenticationPrincipal @Nullable Jwt jwt) {
        return PostResponse.of(posts.read(id, jwt == null ? null : userId(jwt)));
    }

    @PutMapping("/posts/{id}")
    @SecurityRequirement(name = "bearerAuth")
    PostResponse update(
            @PathVariable long id, @Valid @RequestBody PostRequest request, @AuthenticationPrincipal Jwt jwt) {
        return PostResponse.of(posts.update(id, userId(jwt), request.toContent()));
    }

    @DeleteMapping("/posts/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @SecurityRequirement(name = "bearerAuth")
    void delete(@PathVariable long id, @AuthenticationPrincipal Jwt jwt) {
        posts.delete(id, userId(jwt));
    }

    @GetMapping("/users/{id}/posts")
    PagedModel<PostSummaryResponse> blog(@PathVariable long id, @ParameterObject Pageable pageable) {
        return new PagedModel<>(posts.blog(id, pageable).map(PostSummaryResponse::of));
    }

    private static long userId(Jwt jwt) {
        return Long.parseLong(jwt.getSubject());
    }

    record PostRequest(
            @NotBlank @Size(max = 200) String title,
            @Nullable @Size(max = 20000) String text,

            @Schema(allowableValues = {"DRAFT", "PUBLISHED"}) @NotBlank @Pattern(regexp = "DRAFT|PUBLISHED")
            String status,

            @Nullable UUID coverId,
            @Nullable @Size(max = 10) List<UUID> photoIds,
            @Nullable String regionCode,
            @Nullable Long siteId) {

        Content toContent() {
            return new Content(title, text, status, coverId, photoIds, regionCode, siteId);
        }
    }

    @Schema(requiredProperties = {"id", "url", "thumbnailUrl", "width", "height"})
    record PostPhotoResponse(UUID id, String url, String thumbnailUrl, int width, int height) {

        static PostPhotoResponse of(MediaView media) {
            return new PostPhotoResponse(media.id(), media.url(), media.thumbnailUrl(), media.width(), media.height());
        }
    }

    @Schema(requiredProperties = {"id", "displayName"})
    record PostAuthorResponse(
            long id, String displayName, @Nullable String avatarUrl) {

        static PostAuthorResponse of(AuthorView author) {
            return new PostAuthorResponse(author.id(), author.displayName(), author.avatarUrl());
        }
    }

    @Schema(requiredProperties = {"id", "name"})
    record PostSiteResponse(long id, String name) {

        static @Nullable PostSiteResponse of(@Nullable SiteLinkView site) {
            return site == null ? null : new PostSiteResponse(site.id(), site.name());
        }
    }

    @Schema(requiredProperties = {"id", "title", "text", "status", "readMinutes", "updatedAt", "author", "photos"})
    record PostResponse(
            long id,
            String title,
            String text,

            @Schema(allowableValues = {"DRAFT", "PUBLISHED"})
            String status,

            int readMinutes,
            java.time.@Nullable Instant publishedAt,
            java.time.Instant updatedAt,
            PostAuthorResponse author,
            @Nullable PostPhotoResponse cover,
            List<PostPhotoResponse> photos,
            @Nullable String countryCode,
            @Nullable String regionCode,
            @Nullable PostSiteResponse site) {

        static PostResponse of(PostView view) {
            return new PostResponse(
                    view.id(),
                    view.title(),
                    view.text(),
                    view.status(),
                    view.readMinutes(),
                    view.publishedAt(),
                    view.updatedAt(),
                    PostAuthorResponse.of(view.author()),
                    view.cover() == null ? null : PostPhotoResponse.of(view.cover()),
                    view.photos().stream().map(PostPhotoResponse::of).toList(),
                    view.countryCode(),
                    view.regionCode(),
                    PostSiteResponse.of(view.site()));
        }
    }

    @Schema(requiredProperties = {"id", "title", "excerpt", "status", "readMinutes", "updatedAt", "author"})
    record PostSummaryResponse(
            long id,
            String title,
            String excerpt,

            @Schema(allowableValues = {"DRAFT", "PUBLISHED"})
            String status,

            int readMinutes,
            java.time.@Nullable Instant publishedAt,
            java.time.Instant updatedAt,
            PostAuthorResponse author,
            @Nullable PostPhotoResponse cover,
            @Nullable String countryCode,
            @Nullable String regionCode,
            @Nullable PostSiteResponse site) {

        static PostSummaryResponse of(PostSummaryView view) {
            return new PostSummaryResponse(
                    view.id(),
                    view.title(),
                    view.excerpt(),
                    view.status(),
                    view.readMinutes(),
                    view.publishedAt(),
                    view.updatedAt(),
                    PostAuthorResponse.of(view.author()),
                    view.cover() == null ? null : PostPhotoResponse.of(view.cover()),
                    view.countryCode(),
                    view.regionCode(),
                    PostSiteResponse.of(view.site()));
        }
    }
}
