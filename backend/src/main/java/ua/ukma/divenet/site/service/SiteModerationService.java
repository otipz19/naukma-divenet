package ua.ukma.divenet.site.service;

import org.springframework.context.ApplicationEventPublisher;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.site.domain.SiteStatus;

/** The admin queue (spec site/moderation). Access is limited by the {@code /api/v1/admin/**} rule. */
@Service
public class SiteModerationService {

    private final SiteRepository sites;
    private final ApplicationEventPublisher events;

    public SiteModerationService(SiteRepository sites, ApplicationEventPublisher events) {
        this.sites = sites;
        this.events = events;
    }

    public record QueueItemView(SiteView site, String authorName) {}

    public static final class SiteNotPendingException extends ErrorResponseException {
        public SiteNotPendingException() {
            super(
                    HttpStatus.CONFLICT,
                    ProblemDetail.forStatusAndDetail(HttpStatus.CONFLICT, "This site has already been moderated."),
                    null);
        }
    }

    @Transactional(readOnly = true)
    public Page<QueueItemView> queue(Pageable pageable) {
        return sites.findByStatusOrderByCreatedAtAscIdAsc(SiteStatus.PENDING, pageable)
                .map(site -> new QueueItemView(
                        SiteCatalogService.view(site),
                        site.getAuthor() == null ? "" : site.getAuthor().getDisplayName()));
    }

    @Transactional
    public SiteView approve(long id) {
        Site site = pending(id);
        site.approve();
        if (site.getAuthor() != null) {
            events.publishEvent(new SiteApproved(site.getAuthor().getId()));
        }
        return SiteCatalogService.view(site);
    }

    @Transactional
    public SiteView reject(long id, String reason) {
        Site site = pending(id);
        site.reject(reason.strip());
        return SiteCatalogService.view(site);
    }

    private Site pending(long id) {
        Site site = sites.findById(id).orElseThrow(SiteNotFoundException::new);
        if (site.getStatus() != SiteStatus.PENDING) {
            throw new SiteNotPendingException();
        }
        return site;
    }
}
