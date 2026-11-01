package ua.ukma.divenet.media.service;

import java.util.UUID;
import ua.ukma.divenet.media.domain.Media;

/** An upload as features and the API see it; the URLs are the public file routes (design D2). */
public record MediaView(UUID id, String contentType, int width, int height) {

    static MediaView of(Media media) {
        return new MediaView(media.getId(), media.getContentType(), media.getWidth(), media.getHeight());
    }

    public String url() {
        return "/media/" + id;
    }

    public String thumbnailUrl() {
        return thumbnailUrlOf(id);
    }

    /** Derived from the id alone, so a list of authors needs no query for their avatars. */
    public static String thumbnailUrlOf(UUID id) {
        return "/media/" + id + "/thumb";
    }
}
