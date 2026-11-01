package ua.ukma.divenet.divelog.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.divelog.domain.DiveLogEntry;
import ua.ukma.divenet.divelog.domain.DiveLogEntryRepository;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec divelog/entries: writes one's own entries, and reads a diver's within their privacy settings. */
@Service
public class DiveLogService {

    private final DiveLogEntryRepository entries;
    private final SiteCatalogService catalog;
    private final UserRepository users;
    private final Clock clock;

    public DiveLogService(
            DiveLogEntryRepository entries, SiteCatalogService catalog, UserRepository users, Clock clock) {
        this.entries = entries;
        this.catalog = catalog;
        this.users = users;
        this.clock = clock;
    }

    public record EntryContent(
            long siteId,
            LocalDate date,
            @Nullable BigDecimal maxDepth,
            @Nullable BigDecimal visibility,
            @Nullable BigDecimal waterTemperature,
            @Nullable String current,
            @Nullable String buddies,
            @Nullable String notes) {}

    public record EntryView(
            long id,
            long siteId,
            String siteName,
            String countryCode,
            String regionCode,
            LocalDate date,
            @Nullable BigDecimal maxDepth,
            @Nullable BigDecimal visibility,
            @Nullable BigDecimal waterTemperature,
            @Nullable String current,
            @Nullable String buddies,
            @Nullable String notes) {}

    public record VisitedSiteView(long siteId, String name, String countryCode, String regionCode, long dives) {}

    public record StatsView(
            long dives, long sites, @Nullable BigDecimal deepest) {}

    private static ErrorResponseException problem(HttpStatus status, String detail) {
        return new ErrorResponseException(status, ProblemDetail.forStatusAndDetail(status, detail), null);
    }

    /** A 400 with the same {@code errors} list as bean validation. */
    private static ErrorResponseException invalid(String field, String message) {
        ProblemDetail problem = ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
        problem.setProperty("errors", List.of(new FieldViolation(field, message)));
        return new ErrorResponseException(HttpStatus.BAD_REQUEST, problem, null);
    }

    @Transactional
    public EntryView create(long userId, EntryContent content) {
        DiveLogEntry entry = new DiveLogEntry(users.getReferenceById(userId), details(content), now());
        return view(entries.save(entry), true);
    }

    @Transactional
    public EntryView update(long id, long userId, EntryContent content) {
        DiveLogEntry entry = owned(id, userId);
        entry.update(details(content), now());
        return view(entry, true);
    }

    @Transactional
    public void delete(long id, long userId) {
        entries.delete(owned(id, userId));
    }

    @Transactional(readOnly = true)
    public Page<EntryView> log(long ownerId, @Nullable Long viewerId, Pageable pageable) {
        boolean owner = requireLogVisible(ownerId, viewerId);
        return entries.findByUser_IdOrderByDateDescIdDesc(ownerId, pageable).map(entry -> view(entry, owner));
    }

    @Transactional(readOnly = true)
    public List<VisitedSiteView> visitedSites(long ownerId, @Nullable Long viewerId) {
        requireLogVisible(ownerId, viewerId);
        return entries.visitedSites(ownerId).stream()
                .map(site -> new VisitedSiteView(
                        site.getSiteId(), site.getName(), site.getCountryCode(), site.getRegionCode(), site.getDives()))
                .toList();
    }

    @Transactional(readOnly = true)
    public StatsView stats(long ownerId, @Nullable Long viewerId) {
        User owner = owner(ownerId);
        if (!owner.isShowStatistics() && !isOwner(ownerId, viewerId)) {
            throw problem(HttpStatus.FORBIDDEN, "This diver's statistics are private.");
        }
        DiveLogEntryRepository.Stats stats = entries.stats(ownerId);
        return new StatsView(stats.getDives(), stats.getSites(), stats.getDeepest());
    }

    /** Answers whether the viewer is the owner, who alone may see buddies and notes. */
    private boolean requireLogVisible(long ownerId, @Nullable Long viewerId) {
        User owner = owner(ownerId);
        boolean isOwner = isOwner(ownerId, viewerId);
        if (!owner.isShowDiveLog() && !isOwner) {
            throw problem(HttpStatus.FORBIDDEN, "This diver's dive log is private.");
        }
        return isOwner;
    }

    private static boolean isOwner(long ownerId, @Nullable Long viewerId) {
        return viewerId != null && viewerId == ownerId;
    }

    private User owner(long id) {
        return users.findById(id).orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "User not found."));
    }

    private DiveLogEntry owned(long id, long userId) {
        DiveLogEntry entry =
                entries.findById(id).orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "Dive log entry not found."));
        if (entry.getUser().getId() != userId) {
            throw problem(HttpStatus.FORBIDDEN, "Only the author can change this entry.");
        }
        return entry;
    }

    private DiveLogEntry.Details details(EntryContent content) {
        // One day of grace: a diver east of Greenwich can be on a date UTC has not reached (design D4).
        if (content.date().isAfter(LocalDate.now(clock.withZone(ZoneOffset.UTC)).plusDays(1))) {
            throw invalid("date", "must not be in the future");
        }
        Site site =
                catalog.findApproved(content.siteId()).orElseThrow(() -> invalid("siteId", "must be an approved site"));
        return new DiveLogEntry.Details(
                site,
                content.date(),
                content.maxDepth(),
                content.visibility(),
                content.waterTemperature(),
                content.current(),
                blankToNull(content.buddies()),
                blankToNull(content.notes()));
    }

    private static @Nullable String blankToNull(@Nullable String text) {
        return text == null || text.isBlank() ? null : text.strip();
    }

    private static EntryView view(DiveLogEntry entry, boolean owner) {
        Site site = entry.getSite();
        return new EntryView(
                entry.getId(),
                site.getId(),
                site.getName(),
                site.getRegion().getCountry().getCode(),
                site.getRegion().getCode(),
                entry.getDate(),
                entry.getMaxDepth(),
                entry.getVisibility(),
                entry.getWaterTemperature(),
                entry.getCurrent(),
                owner ? entry.getBuddies() : null,
                owner ? entry.getNotes() : null);
    }

    /** Truncated to what timestamptz stores, so an entry reads back as it was written. */
    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
