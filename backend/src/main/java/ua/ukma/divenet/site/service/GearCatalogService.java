package ua.ukma.divenet.site.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.site.domain.GearItemRepository;

/** Reads the fixed gear catalog (spec site/gear-catalog). */
@Service
public class GearCatalogService {

    private final GearItemRepository gearItems;

    public GearCatalogService(GearItemRepository gearItems) {
        this.gearItems = gearItems;
    }

    @Transactional(readOnly = true)
    public List<GearItemView> gearItems() {
        return gearItems.findAllByOrderByNameAsc().stream()
                .map(item -> new GearItemView(item.getCode(), item.getName()))
                .toList();
    }
}
