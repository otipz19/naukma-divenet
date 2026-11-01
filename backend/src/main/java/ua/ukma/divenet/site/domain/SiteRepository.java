package ua.ukma.divenet.site.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface SiteRepository extends JpaRepository<Site, Long> {

    /** One query for the whole map: the region and country are fetched with the sites. */
    @Query("select s from Site s join fetch s.region r join fetch r.country")
    List<Site> findAllWithRegion();
}
