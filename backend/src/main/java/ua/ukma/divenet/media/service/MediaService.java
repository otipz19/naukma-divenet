package ua.ukma.divenet.media.service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import ua.ukma.divenet.auth.service.AuthExceptions.UnknownUserException;
import ua.ukma.divenet.media.domain.Media;
import ua.ukma.divenet.media.domain.MediaRepository;
import ua.ukma.divenet.media.service.ImageProcessor.ProcessedImage;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotAttachableException;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotFoundException;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/**
 * Spec media/uploads: upload and serve images, and the API other features use to attach and release
 * them (design D3, D5). Files are written before the row and deleted after it, so a row always has
 * its files.
 */
@Service
public class MediaService {

    private final MediaRepository media;
    private final UserRepository users;
    private final MediaStorage storage;
    private final ImageProcessor images;
    private final Clock clock;

    public MediaService(
            MediaRepository media, UserRepository users, MediaStorage storage, ImageProcessor images, Clock clock) {
        this.media = media;
        this.users = users;
        this.storage = storage;
        this.images = images;
        this.clock = clock;
    }

    /** A file a media route serves: its bytes and content type. */
    public record MediaFile(Resource resource, String contentType) {}

    @Transactional
    public MediaView upload(long uploaderId, byte[] bytes) {
        ProcessedImage image = images.process(bytes);
        User uploader = users.findById(uploaderId).orElseThrow(UnknownUserException::new);
        UUID id = UUID.randomUUID();
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCompletion(int status) {
                if (status != STATUS_COMMITTED) {
                    deleteFiles(storage, List.of(id));
                }
            }
        });
        storage.write(originalKey(id), bytes);
        storage.write(thumbnailKey(id), image.thumbnail());
        Media saved = media.saveAndFlush(new Media(
                id, uploader, image.contentType(), bytes.length, image.width(), image.height(), clock.instant()));
        return MediaView.of(saved);
    }

    @Transactional(readOnly = true)
    public MediaFile original(String id) {
        Media found = find(id);
        return new MediaFile(file(originalKey(found.getId())), found.getContentType());
    }

    @Transactional(readOnly = true)
    public MediaFile thumbnail(String id) {
        Media found = find(id);
        return new MediaFile(file(thumbnailKey(found.getId())), "image/jpeg");
    }

    /**
     * Attaches the uploads to a feature's content on behalf of {@code userId}: all of them, or none
     * when any is unknown, someone else's or attached already. Joins the caller's transaction.
     */
    @Transactional
    public List<MediaView> attach(Collection<UUID> ids, long userId) {
        Set<UUID> unique = new LinkedHashSet<>(ids);
        if (unique.isEmpty()) {
            return List.of();
        }
        // Truncated to what timestamptz stores, so the rows read back compare equal.
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        int attached = media.attach(unique, userId, now);
        List<Media> rows = media.findAllById(unique);
        if (attached != unique.size()) {
            Set<UUID> attachedNow = new LinkedHashSet<>();
            rows.stream()
                    .filter(m -> m.getUploader().getId() == userId && now.equals(m.getAttachedAt()))
                    .forEach(m -> attachedNow.add(m.getId()));
            UUID refused = unique.stream()
                    .filter(id -> !attachedNow.contains(id))
                    .findFirst()
                    .orElseThrow();
            throw new MediaNotAttachableException(refused);
        }
        return unique.stream()
                .map(id -> rows.stream()
                        .filter(m -> m.getId().equals(id))
                        .findFirst()
                        .orElseThrow())
                .map(MediaView::of)
                .toList();
    }

    /** Deletes the uploads' records, and their files once the caller's transaction commits. */
    @Transactional
    public void release(Collection<UUID> ids) {
        Set<UUID> unique = new LinkedHashSet<>(ids);
        if (unique.isEmpty()) {
            return;
        }
        media.deleteByIds(unique);
        deleteFilesAfterCommit(storage, unique);
    }

    static String originalKey(UUID id) {
        return id.toString();
    }

    static String thumbnailKey(UUID id) {
        return id + ".thumb.jpg";
    }

    static void deleteFilesAfterCommit(MediaStorage storage, Collection<UUID> ids) {
        List<UUID> copy = List.copyOf(ids);
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                deleteFiles(storage, copy);
            }
        });
    }

    private static void deleteFiles(MediaStorage storage, Collection<UUID> ids) {
        for (UUID id : ids) {
            storage.delete(originalKey(id));
            storage.delete(thumbnailKey(id));
        }
    }

    /** A malformed id is just another unknown id. */
    private Media find(String id) {
        UUID uuid;
        try {
            uuid = UUID.fromString(id);
        } catch (IllegalArgumentException e) {
            throw new MediaNotFoundException();
        }
        return media.findById(uuid).orElseThrow(MediaNotFoundException::new);
    }

    private Resource file(String key) {
        return storage.read(key).orElseThrow(MediaNotFoundException::new);
    }
}
