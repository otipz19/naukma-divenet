package ua.ukma.divenet.site.service;

import java.time.Clock;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import org.jspecify.annotations.Nullable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.geo.domain.Region;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.site.domain.GearItemRepository;
import ua.ukma.divenet.site.domain.GearRequirement;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteGear;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.site.domain.SiteStatus;
import ua.ukma.divenet.user.domain.UserRepository;

/** Reads dive sites and takes submissions (specs site/catalog, site/submission). */
@Service
public class SiteCatalogService {

    private final SiteRepository sites;
    private final RegionRepository regions;
    private final GearItemRepository gearItems;
    private final UserRepository users;
    private final Clock clock;

    public SiteCatalogService(
            SiteRepository sites,
            RegionRepository regions,
            GearItemRepository gearItems,
            UserRepository users,
            Clock clock) {
        this.sites = sites;
        this.regions = regions;
        this.gearItems = gearItems;
        this.users = users;
        this.clock = clock;
    }

    /** For features that refer to a site and report their own error when it cannot be used. */
    public long approvedCount(long authorId) {
        return sites.countByAuthor_IdAndStatus(authorId, SiteStatus.APPROVED);
    }

    public Optional<Site> findApproved(long id) {
        return sites.findById(id).filter(site -> site.getStatus() == SiteStatus.APPROVED);
    }

    /** Who asks: an unapproved site is shown only to its author and admins. */
    public record Viewer(@Nullable Long userId, boolean admin) {}

    public record Submission(
            String name,
            String regionCode,
            double lat,
            double lng,
            int difficulty,
            int minDepth,
            int maxDepth,
            String description,
            List<String> requiredGear,
            List<String> recommendedGear) {}

    public record OwnSubmissionView(
            long id, String name, String status, @Nullable String rejectionReason) {}

    @Transactional(readOnly = true)
    public List<SiteMarkerView> markers(SiteFilter filter) {
        return sites.findAll(SiteSearch.matching(filter)).stream()
                .map(SiteCatalogService::marker)
                .toList();
    }

    @Transactional(readOnly = true)
    public SiteView site(long id, Viewer viewer) {
        Site site = sites.findById(id).orElseThrow(SiteNotFoundException::new);
        if (!visibleTo(site, viewer)) {
            throw new SiteNotFoundException();
        }
        return view(site);
    }

    /**
     * For the review feature: the approved site, locked until the caller's transaction ends, so the
     * review writes of one site run one at a time (add-site-reviews design D2).
     */
    @Transactional
    public Site lockForReview(long id) {
        Site site = sites.findByIdForUpdate(id).orElseThrow(SiteNotFoundException::new);
        if (site.getStatus() != SiteStatus.APPROVED) {
            throw new SiteNotFoundException();
        }
        return site;
    }

    /** Stores the aggregates the review feature computed; joins the caller's transaction. */
    @Transactional
    public void updateReviewAggregates(long id, ReviewAggregates aggregates) {
        Site site = sites.findById(id).orElseThrow(SiteNotFoundException::new);
        site.setReviewAggregates(
                aggregates.averageRating(),
                aggregates.ratingCount(),
                aggregates.reviewCount(),
                aggregates.communityDifficulty());
    }

    @Transactional
    public SiteView submit(Submission submission, long authorId) {
        List<FieldViolation> violations = violations(submission);
        if (!violations.isEmpty()) {
            throw new InvalidSiteException(violations);
        }
        Region region = regions.findById(submission.regionCode()).orElseThrow();
        Set<SiteGear> gear = new HashSet<>();
        submission.requiredGear().forEach(code -> gear.add(new SiteGear(code, GearRequirement.REQUIRED)));
        submission.recommendedGear().forEach(code -> gear.add(new SiteGear(code, GearRequirement.RECOMMENDED)));
        Site site = Site.submission(
                submission.name().strip(),
                region,
                submission.lat(),
                submission.lng(),
                submission.difficulty(),
                submission.minDepth(),
                submission.maxDepth(),
                submission.description().strip(),
                gear,
                users.getReferenceById(authorId),
                clock.instant());
        return view(sites.save(site));
    }

    @Transactional(readOnly = true)
    public List<OwnSubmissionView> ownSubmissions(long authorId) {
        return sites.findByAuthor_IdOrderByCreatedAtDescIdDesc(authorId).stream()
                .map(site -> new OwnSubmissionView(
                        site.getId(), site.getName(), site.getStatus().name(), site.getRejectionReason()))
                .toList();
    }

    /** The rules that need several fields or the database; bean validation has checked the rest. */
    private List<FieldViolation> violations(Submission submission) {
        List<FieldViolation> violations = new ArrayList<>();
        if (submission.minDepth() > submission.maxDepth()) {
            violations.add(new FieldViolation("minDepth", "must not be above the maximum depth"));
        }
        if (!regions.existsById(submission.regionCode())) {
            violations.add(new FieldViolation("regionCode", "unknown region"));
        }
        if (!submission.requiredGear().stream().allMatch(gearItems::existsById)) {
            violations.add(new FieldViolation("requiredGear", "unknown gear code"));
        }
        if (!submission.recommendedGear().stream().allMatch(gearItems::existsById)) {
            violations.add(new FieldViolation("recommendedGear", "unknown gear code"));
        }
        if (submission.recommendedGear().stream().anyMatch(submission.requiredGear()::contains)) {
            violations.add(new FieldViolation("recommendedGear", "must not repeat required gear"));
        }
        return violations;
    }

    private static boolean visibleTo(Site site, Viewer viewer) {
        return site.getStatus() == SiteStatus.APPROVED
                || viewer.admin()
                || (site.getAuthor() != null && site.getAuthor().getId().equals(viewer.userId()));
    }

    static SiteView view(Site site) {
        return new SiteView(
                marker(site),
                site.getDescription(),
                gearCodes(site, GearRequirement.REQUIRED),
                gearCodes(site, GearRequirement.RECOMMENDED),
                site.getStatus().name(),
                site.getRejectionReason(),
                site.getReviewCount(),
                site.getCommunityDifficulty());
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
                site.getMaxDepth(),
                site.getRatingAverage(),
                site.getRatingCount());
    }

    private static List<String> gearCodes(Site site, GearRequirement requirement) {
        return site.getGear().stream()
                .filter(gear -> gear.requirement() == requirement)
                .map(gear -> gear.gearCode())
                .sorted()
                .toList();
    }
}
