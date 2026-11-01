package ua.ukma.divenet.site.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface GearItemRepository extends JpaRepository<GearItem, String> {

    List<GearItem> findAllByOrderByNameAsc();
}
