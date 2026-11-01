package ua.ukma.divenet.media.web;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.media.service.MediaService.MediaFile;

/**
 * Spec media/uploads "Media is served to everyone". Outside {@code /api/v1}, so it is not in the API
 * contract: it serves bytes, not JSON (design D2).
 */
@RestController
@RequestMapping("/media")
class MediaFileController {

    /** A media id never changes its content. */
    static final String CACHE_CONTROL = "public, max-age=31536000, immutable";

    private final MediaService mediaService;

    MediaFileController(MediaService mediaService) {
        this.mediaService = mediaService;
    }

    /** The id is a string, so a malformed one is a 404 like an unknown one, not a 400. */
    @GetMapping("/{id}")
    ResponseEntity<Resource> original(@PathVariable String id) {
        return serve(mediaService.original(id));
    }

    @GetMapping("/{id}/thumb")
    ResponseEntity<Resource> thumbnail(@PathVariable String id) {
        return serve(mediaService.thumbnail(id));
    }

    private static ResponseEntity<Resource> serve(MediaFile file) {
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(file.contentType()))
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.inline().build().toString())
                .body(file.resource());
    }
}
