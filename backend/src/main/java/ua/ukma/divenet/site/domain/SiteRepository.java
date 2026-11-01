package ua.ukma.divenet.site.domain;

import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;

public interface SiteRepository extends JpaRepository<Site, Long>, JpaSpecificationExecutor<Site> {

    List<Site> findByAuthor_IdOrderByCreatedAtDescIdDesc(long authorId);

    /** The moderation queue, oldest first. */
    @EntityGraph(attributePaths = {"region", "region.country", "author"})
    Page<Site> findByStatusOrderByCreatedAtAscIdAsc(SiteStatus status, Pageable pageable);
}
