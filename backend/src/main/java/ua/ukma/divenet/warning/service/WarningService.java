package ua.ukma.divenet.warning.service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.site.service.SiteCatalogService.Viewer;
import ua.ukma.divenet.user.domain.UserRepository;
import ua.ukma.divenet.warning.domain.Warning;
import ua.ukma.divenet.warning.domain.WarningRepository;
import ua.ukma.divenet.warning.domain.WarningType;
import ua.ukma.divenet.warning.service.WarningExceptions.NotWarningAuthorException;
import ua.ukma.divenet.warning.service.WarningExceptions.WarningNotFoundException;

/** Spec warning/warnings (design D2, D3, D5). */
@Service
public class WarningService {

    private static final Viewer ANYONE = new Viewer(null, false);

    private final WarningRepository warnings;
    private final SiteCatalogService catalog;
    private final SiteRepository sites;
    private final UserRepository users;
    private final Clock clock;

    public WarningService(
            WarningRepository warnings,
            SiteCatalogService catalog,
            SiteRepository sites,
            UserRepository users,
            Clock clock) {
        this.warnings = warnings;
        this.catalog = catalog;
        this.sites = sites;
        this.users = users;
        this.clock = clock;
    }

    /** Unknown and unapproved sites answer 404, as their details do. */
    @Transactional(readOnly = true)
    public Page<WarningView> list(long siteId, Pageable pageable) {
        catalog.site(siteId, ANYONE);
        PageRequest fixed = PageRequest.of(pageable.getPageNumber(), pageable.getPageSize());
        return warnings.findVisibleBySite(siteId, fixed).map(WarningService::view);
    }

    @Transactional(readOnly = true)
    public WarningView get(long id) {
        return view(loadVisible(id));
    }

    @Transactional
    public WarningView create(long siteId, long authorId, String type, String text) {
        catalog.site(siteId, ANYONE);
        Instant now = now();
        Warning warning = new Warning(
                sites.getReferenceById(siteId),
                users.getReferenceById(authorId),
                WarningType.valueOf(type.toUpperCase(java.util.Locale.ROOT)),
                text.strip(),
                now);
        long id = warnings.saveAndFlush(warning).getId();
        return view(loadVisible(id));
    }

    @Transactional
    public WarningView update(long id, long userId, String type, String text) {
        Warning warning = authored(id, userId);
        warning.setContent(WarningType.valueOf(type.toUpperCase(java.util.Locale.ROOT)), text.strip(), now());
        warnings.flush();
        return view(warning);
    }

    @Transactional
    public void delete(long id, long userId) {
        Warning warning = authored(id, userId);
        warnings.delete(warning);
    }

    /** Design D2: loads with {@code findById}, so hiding an already-hidden warning is a 204 no-op. */
    @Transactional
    public void hide(long id, long adminId) {
        Warning warning = warnings.findById(id).orElseThrow(WarningNotFoundException::new);
        warning.hide(users.getReferenceById(adminId), now());
    }

    private Warning authored(long id, long userId) {
        Warning warning = loadVisible(id);
        if (warning.getAuthor().getId() != userId) {
            throw new NotWarningAuthorException();
        }
        return warning;
    }

    private Warning loadVisible(long id) {
        return warnings.findVisibleById(id).orElseThrow(WarningNotFoundException::new);
    }

    private static WarningView view(Warning warning) {
        return new WarningView(
                warning.getId(),
                warning.getSite().getId(),
                warning.getAuthor().getId(),
                warning.getAuthor().getDisplayName(),
                warning.getType().name(),
                warning.getText(),
                warning.getCreatedAt(),
                warning.getUpdatedAt());
    }

    /** Truncated to what timestamptz stores, so a warning reads back as it was written. */
    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
