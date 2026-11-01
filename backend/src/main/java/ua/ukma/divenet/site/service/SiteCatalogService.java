package ua.ukma.divenet.site.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.site.domain.GearRequirement;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;

/** Reads dive sites (spec site/catalog). */
@Service
public class SiteCatalogService {

    private final SiteRepository sites;

    public SiteCatalogService(SiteRepository sites) {
        this.sites = sites;
    }

    @Transactional(readOnly = true)
    public List<SiteMarkerView> markers() {
        return sites.findAllWithRegion().stream()
                .map(SiteCatalogService::marker)
                .toList();
    }

    @Transactional(readOnly = true)
    public SiteView site(long id) {
        Site site = sites.findById(id).orElseThrow(SiteNotFoundException::new);
        return new SiteView(
                marker(site),
                site.getDescription(),
                gearCodes(site, GearRequirement.REQUIRED),
                gearCodes(site, GearRequirement.RECOMMENDED));
    }

    private static SiteMarkerView marker(Site site) {
        return new SiteMarkerView(
                site.getId(),
                site.getName(),
                site.getLat(),
                site.getLng(),
                site.getRegion().getCountry().getCode(),
                site.getRegion().getCode(),
                site.getDifficulty(),
                site.getMinDepth(),
                site.getMaxDepth());
    }

    private static List<String> gearCodes(Site site, GearRequirement requirement) {
        return site.getGear().stream()
                .filter(gear -> gear.requirement() == requirement)
                .map(gear -> gear.gearCode())
                .sorted()
                .toList();
    }
}
