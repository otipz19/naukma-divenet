package ua.ukma.divenet.media.web;

import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.UUID;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.media.service.MediaView;

/** Spec media/uploads "Signed-in users upload images". */
@RestController
@RequestMapping("/api/v1/media")
class MediaController {

    private final MediaService mediaService;

    MediaController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @ResponseStatus(HttpStatus.CREATED)
    @SecurityRequirement(name = "bearerAuth")
    MediaResponse upload(
            @RequestPart("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt, HttpServletResponse response)
            throws IOException {
        MediaView media = mediaService.upload(Long.parseLong(jwt.getSubject()), file.getBytes());
        response.setHeader(HttpHeaders.LOCATION, media.url());
        return MediaResponse.of(media);
    }

    @Schema(requiredProperties = {"id", "url", "thumbnailUrl", "contentType", "width", "height"})
    record MediaResponse(UUID id, String url, String thumbnailUrl, String contentType, int width, int height) {

        static MediaResponse of(MediaView media) {
            return new MediaResponse(
                    media.id(), media.url(), media.thumbnailUrl(), media.contentType(), media.width(), media.height());
        }
    }
}
