package ua.ukma.divenet.divelog.domain;

import java.math.BigDecimal;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface DiveLogEntryRepository extends JpaRepository<DiveLogEntry, Long> {

    interface VisitedSite {
        long getSiteId();

        String getName();

        String getCountryCode();

        String getRegionCode();

        long getDives();
    }

    interface Stats {
        long getDives();

        long getSites();

        long getCountries();

        @Nullable
        BigDecimal getDeepest();
    }

    @EntityGraph(attributePaths = {"site", "site.region", "site.region.country"})
    Page<DiveLogEntry> findByUser_IdOrderByDateDescIdDesc(long userId, Pageable pageable);

    @Query("""
            select s.id as siteId, s.name as name, c.code as countryCode, r.code as regionCode, count(e) as dives
            from DiveLogEntry e join e.site s join s.region r join r.country c
            where e.user.id = :userId
            group by s.id, s.name, c.code, r.code
            order by s.name
            """)
    List<VisitedSite> visitedSites(long userId);

    @Query("""
            select count(e) as dives, count(distinct e.site.id) as sites,
                   count(distinct e.site.region.country.code) as countries, max(e.maxDepth) as deepest
            from DiveLogEntry e where e.user.id = :userId
            """)
    Stats stats(long userId);
}
