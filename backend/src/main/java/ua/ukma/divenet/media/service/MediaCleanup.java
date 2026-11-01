package ua.ukma.divenet.media.service;

import java.time.Clock;
import java.time.Duration;
import java.util.List;
import java.util.UUID;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import ua.ukma.divenet.media.domain.MediaRepository;

/**
 * Spec media/uploads "Unattached uploads expire": deletes uploads nobody attached within 24 hours,
 * and their files after the commit (design D6).
 */
@Component
public class MediaCleanup {

    public static final Duration MAX_UNATTACHED_AGE = Duration.ofHours(24);
    private static final Logger log = LoggerFactory.getLogger(MediaCleanup.class);

    private final MediaRepository media;
    private final MediaStorage storage;
    private final Clock clock;
    private final TransactionTemplate transaction;

    public MediaCleanup(
            MediaRepository media, MediaStorage storage, Clock clock, PlatformTransactionManager transactions) {
        this.media = media;
        this.storage = storage;
        this.clock = clock;
        this.transaction = new TransactionTemplate(transactions);
    }

    /** Returns the number of uploads deleted. */
    @Scheduled(fixedDelayString = "${divenet.media.cleanup-interval}", initialDelayString = "PT5M")
    public int run() {
        List<UUID> deleted = transaction.execute(status -> {
            List<UUID> ids = media.deleteUnattachedCreatedBefore(clock.instant().minus(MAX_UNATTACHED_AGE));
            MediaService.deleteFilesAfterCommit(storage, ids);
            return ids;
        });
        if (!deleted.isEmpty()) {
            log.info("Deleted {} unattached uploads older than {}", deleted.size(), MAX_UNATTACHED_AGE);
        }
        return deleted.size();
    }
}
