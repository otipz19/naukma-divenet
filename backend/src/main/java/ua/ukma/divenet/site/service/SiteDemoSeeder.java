package ua.ukma.divenet.site.service;

import java.io.IOException;
import java.io.InputStream;
import java.time.Clock;
import java.time.Instant;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import tools.jackson.databind.json.JsonMapper;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.site.domain.GearRequirement;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteGear;
import ua.ukma.divenet.site.domain.SiteRepository;

/** Loads the demo sites into an empty database; an unknown region or gear code fails startup. */
@Component
@Profile("demo")
public class SiteDemoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(SiteDemoSeeder.class);
    private static final String SEED = "seed/sites.json";

    private final SiteRepository sites;
    private final RegionRepository regions;
    private final JsonMapper jsonMapper;
    private final Clock clock;

    public SiteDemoSeeder(SiteRepository sites, RegionRepository regions, JsonMapper jsonMapper, Clock clock) {
        this.sites = sites;
        this.regions = regions;
        this.jsonMapper = jsonMapper;
        this.clock = clock;
    }

    private record SeedSite(
            String name,
            String region,
            double lat,
            double lng,
            int difficulty,
            int minDepth,
            int maxDepth,
            String description,
            List<String> required,
            List<String> recommended) {}

    @Override
    @Transactional
    public void run(ApplicationArguments args) throws IOException {
        if (sites.count() > 0) {
            return;
        }
        Instant now = clock.instant();
        List<Site> seeded = read().stream().map(seed -> site(seed, now)).toList();
        sites.saveAll(seeded);
        log.info("Seeded {} demo sites", seeded.size());
    }

    private List<SeedSite> read() throws IOException {
        try (InputStream in = new ClassPathResource(SEED).getInputStream()) {
            return List.of(jsonMapper.readValue(in, SeedSite[].class));
        }
    }

    private Site site(SeedSite seed, Instant now) {
        Set<SiteGear> gear = new HashSet<>();
        seed.required().forEach(code -> gear.add(new SiteGear(code, GearRequirement.REQUIRED)));
        seed.recommended().forEach(code -> gear.add(new SiteGear(code, GearRequirement.RECOMMENDED)));
        return new Site(
                seed.name(),
                regions.getReferenceById(seed.region()),
                seed.lat(),
                seed.lng(),
                seed.difficulty(),
                seed.minDepth(),
                seed.maxDepth(),
                seed.description(),
                gear,
                now);
    }
}
