package ua.ukma.divenet.media.service;

import java.util.UUID;
import ua.ukma.divenet.media.domain.Media;

/** A video as features and the API see it. It has no thumbnail or dimensions (ADR-0011). */
public record VideoView(UUID id, String contentType) {

    static VideoView of(Media media) {
        return new VideoView(media.getId(), media.getContentType());
    }

    public String url() {
        return "/media/" + id;
    }
}
