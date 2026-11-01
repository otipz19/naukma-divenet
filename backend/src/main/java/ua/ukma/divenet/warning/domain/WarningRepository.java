package ua.ukma.divenet.warning.domain;

import java.util.Optional;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface WarningRepository extends JpaRepository<Warning, Long> {

    @EntityGraph(attributePaths = "author")
    @Query("select w from Warning w where w.id = :id and w.hiddenAt is null")
    Optional<Warning> findVisibleById(long id);

    @EntityGraph(attributePaths = "author")
    @Query(value = """
                    select w from Warning w
                    where w.site.id = :siteId and w.hiddenAt is null
                    order by w.createdAt desc, w.id desc""", countQuery = "select count(w) from Warning w where w.site.id = :siteId and w.hiddenAt is null")
    Page<Warning> findVisibleBySite(long siteId, Pageable pageable);
}
