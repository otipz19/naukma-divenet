package ua.ukma.divenet.demo.service;

import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Profile;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Component;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.json.JsonMapper;
import ua.ukma.divenet.achievement.service.AchievementService;
import ua.ukma.divenet.auth.service.AuthService;
import ua.ukma.divenet.divelog.service.DiveLogService;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.post.service.PostService;
import ua.ukma.divenet.review.service.ReviewService;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.site.domain.SiteStatus;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.site.service.SiteModerationService;
import ua.ukma.divenet.user.domain.UserRepository;
import ua.ukma.divenet.user.service.CertificateService;
import ua.ukma.divenet.user.service.LockerService;
import ua.ukma.divenet.user.service.ProfileService;
import ua.ukma.divenet.warning.service.WarningService;

/**
 * Seeds the demo community through the services, once, after the demo sites (spec demo/seed, design D1-D7).
 */
@Component
@Profile("demo")
@Order(2)
public class DemoSeeder implements ApplicationRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoSeeder.class);
    private static final String SEED = "seed/demo.json";

    record DemoSeed(String password, List<SeedDiver> divers) {}

    record SeedDiver(
            String email,
            String name,
            @Nullable String bio,
            boolean showDiveLog,
            boolean showStatistics,
            boolean showCertificates,
            List<SeedCertificate> certificates,
            List<SeedDive> dives,
            List<SeedReview> reviews,
            List<SeedWarning> warnings,
            List<SeedPost> posts,
            List<SeedSubmission> submissions,
            List<String> locker) {}

    /** {@code status} is VERIFIED, PENDING or REJECTED. */
    record SeedCertificate(
            String agency,
            String level,
            String number,
            String status,
            @Nullable String reason) {}

    record SeedDive(
            String site,
            int daysAgo,
            @Nullable BigDecimal depth,
            @Nullable BigDecimal visibility,
            @Nullable BigDecimal temperature,
            @Nullable String current,
            @Nullable String buddies,
            @Nullable String notes) {}

    record SeedReview(
            String site,
            @Nullable Integer rating,
            @Nullable Integer difficulty,
            @Nullable String text,
            int photos) {}

    record SeedWarning(String site, String type, String text) {}

    /** {@code status} is DRAFT or PUBLISHED; a site sets the region. */
    record SeedPost(
            String title,
            String text,
            String status,
            @Nullable String site,
            @Nullable String region,
            int photos) {}

    /** {@code status} is APPROVED, PENDING or REJECTED. */
    record SeedSubmission(
            String name,
            String region,
            double lat,
            double lng,
            int difficulty,
            int minDepth,
            int maxDepth,
            String description,
            List<String> required,
            List<String> recommended,
            String status,
            @Nullable String reason) {}

    private final JsonMapper jsonMapper;
    private final TransactionTemplate transaction;
    private final Clock clock;
    private final UserRepository users;
    private final SiteRepository sites;
    private final AuthService auth;
    private final ProfileService profiles;
    private final MediaService media;
    private final CertificateService certificates;
    private final DiveLogService diveLog;
    private final ReviewService reviews;
    private final WarningService warnings;
    private final PostService posts;
    private final SiteCatalogService catalog;
    private final SiteModerationService moderation;
    private final LockerService locker;
    private final AchievementService achievements;

    public DemoSeeder(
            JsonMapper jsonMapper,
            PlatformTransactionManager transactionManager,
            Clock clock,
            UserRepository users,
            SiteRepository sites,
            AuthService auth,
            ProfileService profiles,
            MediaService media,
            CertificateService certificates,
            DiveLogService diveLog,
            ReviewService reviews,
            WarningService warnings,
            PostService posts,
            SiteCatalogService catalog,
            SiteModerationService moderation,
            LockerService locker,
            AchievementService achievements) {
        this.jsonMapper = jsonMapper;
        this.transaction = new TransactionTemplate(transactionManager);
        this.clock = clock;
        this.users = users;
        this.sites = sites;
        this.auth = auth;
        this.profiles = profiles;
        this.media = media;
        this.certificates = certificates;
        this.diveLog = diveLog;
        this.reviews = reviews;
        this.warnings = warnings;
        this.posts = posts;
        this.catalog = catalog;
        this.moderation = moderation;
        this.locker = locker;
        this.achievements = achievements;
    }

    @Override
    public void run(ApplicationArguments args) throws IOException {
        try (InputStream in = new ClassPathResource(SEED).getInputStream()) {
            seed(jsonMapper.readValue(in, DemoSeed.class));
        }
    }

    /** Skips when the first diver exists; otherwise all or nothing, then awards (design D6). */
    void seed(DemoSeed seed) {
        if (seed.divers().isEmpty()
                || users.existsByEmail(
                        AuthService.normalizeEmail(seed.divers().getFirst().email()))) {
            return;
        }
        List<Long> ids = transaction.execute(status -> {
            Map<String, Long> siteIds = sites.findAll().stream()
                    .filter(site -> site.getStatus() == SiteStatus.APPROVED)
                    .collect(Collectors.toMap(Site::getName, Site::getId, (a, b) -> a));
            Images images = new Images();
            List<Long> seeded = new ArrayList<>();
            for (SeedDiver diver : seed.divers()) {
                seeded.add(diver(diver, seed.password(), siteIds, images));
            }
            return seeded;
        });
        ids.forEach(achievements::evaluate);
        log.info("Seeded {} demo divers", ids.size());
    }

    private long diver(SeedDiver diver, String password, Map<String, Long> siteIds, Images images) {
        long id = auth.register(diver.email(), diver.name(), password).user().id();
        profiles.update(
                id,
                new ProfileService.ProfileEdit(
                        diver.bio(),
                        images.upload(id, 256, 256),
                        diver.showDiveLog(),
                        diver.showStatistics(),
                        diver.showCertificates()));
        for (SeedCertificate seed : diver.certificates()) {
            long certificate = certificates
                    .declare(id, new CertificateService.Declaration(seed.agency(), seed.level(), seed.number(), null))
                    .id();
            switch (seed.status()) {
                case "VERIFIED" -> certificates.verify(certificate);
                case "REJECTED" -> certificates.reject(certificate, required(seed.reason(), seed.number()));
                default -> {}
            }
        }
        LocalDate today = LocalDate.now(clock.withZone(ZoneOffset.UTC));
        for (SeedDive dive : diver.dives()) {
            diveLog.create(
                    id,
                    new DiveLogService.EntryContent(
                            site(siteIds, dive.site()),
                            today.minusDays(dive.daysAgo()),
                            dive.depth(),
                            dive.visibility(),
                            dive.temperature(),
                            dive.current(),
                            dive.buddies(),
                            dive.notes()));
        }
        for (SeedReview review : diver.reviews()) {
            reviews.create(
                    site(siteIds, review.site()),
                    id,
                    new ReviewService.Content(
                            review.rating(),
                            review.difficulty(),
                            review.text(),
                            images.uploadAll(id, review.photos()),
                            List.of()));
        }
        for (SeedWarning warning : diver.warnings()) {
            warnings.create(site(siteIds, warning.site()), id, warning.type(), warning.text());
        }
        for (SeedPost post : diver.posts()) {
            posts.create(
                    id,
                    new PostService.Content(
                            post.title(),
                            post.text(),
                            post.status(),
                            images.upload(id, 640, 480),
                            images.uploadAll(id, post.photos()),
                            List.of(),
                            post.region(),
                            post.site() == null ? null : site(siteIds, post.site())));
        }
        for (SeedSubmission seed : diver.submissions()) {
            long site = catalog.submit(
                            new SiteCatalogService.Submission(
                                    seed.name(),
                                    seed.region(),
                                    seed.lat(),
                                    seed.lng(),
                                    seed.difficulty(),
                                    seed.minDepth(),
                                    seed.maxDepth(),
                                    seed.description(),
                                    seed.required(),
                                    seed.recommended()),
                            id)
                    .marker()
                    .id();
            switch (seed.status()) {
                case "APPROVED" -> moderation.approve(site);
                case "REJECTED" -> moderation.reject(site, required(seed.reason(), seed.name()));
                default -> {}
            }
        }
        diver.locker().forEach(item -> locker.add(id, item));
        return id;
    }

    private static long site(Map<String, Long> siteIds, String name) {
        Long id = siteIds.get(name);
        if (id == null) {
            throw new IllegalStateException("The demo seed names an unknown site: " + name);
        }
        return id;
    }

    private static String required(@Nullable String reason, String of) {
        if (reason == null) {
            throw new IllegalStateException("The demo seed rejects without a reason: " + of);
        }
        return reason;
    }

    /** Uploads generated pictures, each from the next seed number, so a run is reproducible. */
    private final class Images {
        private long next = 1;

        UUID upload(long userId, int width, int height) {
            return media.upload(userId, DemoImages.jpeg(next++, width, height)).id();
        }

        List<UUID> uploadAll(long userId, int count) {
            List<UUID> ids = new ArrayList<>();
            for (int i = 0; i < count; i++) {
                ids.add(upload(userId, 640, 480));
            }
            return ids;
        }
    }
}
