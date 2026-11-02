package ua.ukma.divenet.media.domain;

import java.time.Instant;
import java.util.Collection;
import java.util.List;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface MediaRepository extends JpaRepository<Media, UUID> {

    /**
     * One statement, so an upload the cleanup deleted, another user's upload or one attached already is
     * simply not counted (design D5). So is the wrong kind: an image cannot be attached as a video.
     */
    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("""
            update Media m set m.attachedAt = :now
            where m.id in :ids and m.uploader.id = :uploaderId and m.attachedAt is null
            and m.contentType like :typePrefix""")
    int attach(Collection<UUID> ids, long uploaderId, String typePrefix, Instant now);

    @Modifying(flushAutomatically = true, clearAutomatically = true)
    @Query("delete from Media m where m.id in :ids")
    int deleteByIds(Collection<UUID> ids);

    /** Deletes the unattached uploads created before {@code cutoff} and returns their ids (design D6). */
    @Query(
            value = "DELETE FROM media WHERE attached_at IS NULL AND created_at < :cutoff RETURNING id",
            nativeQuery = true)
    List<UUID> deleteUnattachedCreatedBefore(Instant cutoff);
}
