package ua.ukma.divenet.site.domain;

import jakarta.persistence.LockModeType;
import java.util.List;
import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;

public interface SiteRepository extends JpaRepository<Site, Long>, JpaSpecificationExecutor<Site> {

    long countByAuthor_IdAndStatus(long authorId, SiteStatus status);

    List<Site> findByAuthor_IdOrderByCreatedAtDescIdDesc(long authorId);

    /** The moderation queue, oldest first. */
    @EntityGraph(attributePaths = {"region", "region.country", "author"})
    Page<Site> findByStatusOrderByCreatedAtAscIdAsc(SiteStatus status, Pageable pageable);

    /** {@code SELECT ... FOR UPDATE}: serialises the review writes of one site (add-site-reviews design D2). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select s from Site s where s.id = :id")
    Optional<Site> findByIdForUpdate(long id);
}
