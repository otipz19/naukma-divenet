package ua.ukma.divenet.geo.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CountryRepository extends JpaRepository<Country, String> {

    @Query("select distinct c from Country c join fetch c.regions order by c.name")
    List<Country> findAllWithRegions();
}
