package ua.ukma.divenet.media.service;

import java.util.Optional;
import org.springframework.core.io.Resource;

/**
 * Where media files live (ADR-0006). Keys are {@code {id}} for an original and {@code {id}.thumb.jpg}
 * for its thumbnail. A write is atomic: a reader sees the whole file or none of it.
 */
public interface MediaStorage {

    void write(String key, byte[] bytes);

    Optional<Resource> read(String key);

    /** Does nothing when the key does not exist. */
    void delete(String key);
}
