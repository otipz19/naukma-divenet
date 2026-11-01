package ua.ukma.divenet.user.service;

import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.media.service.MediaExceptions.MediaNotAttachableException;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.media.service.MediaView;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.user.domain.Certificate;
import ua.ukma.divenet.user.domain.CertificateRepository;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/**
 * Specs user/certificates and user/certificate-verification.
 *
 * <p>{@code MediaService.attach} and {@code release} clear the persistence context, so a certificate is
 * saved before a release and read again after each.
 */
@Service
public class CertificateService {

    private final CertificateRepository certificates;
    private final UserRepository users;
    private final MediaService media;
    private final Clock clock;

    public CertificateService(
            CertificateRepository certificates, UserRepository users, MediaService media, Clock clock) {
        this.certificates = certificates;
        this.users = users;
        this.media = media;
        this.clock = clock;
    }

    /** Who asks: the owner and admins see hidden certificates and private details. */
    public record Viewer(@Nullable Long userId, boolean admin) {}

    public record Declaration(
            String agency,
            String level,
            String number,
            @Nullable UUID photoId) {}

    /** {@code number}, {@code photo} and {@code rejectionReason} are null for the public. */
    public record CertificateView(
            long id,
            String agency,
            String level,
            String status,
            @Nullable String number,
            @Nullable MediaView photo,
            @Nullable String rejectionReason) {}

    public record QueueItemView(CertificateView certificate, long holderId, String holderName) {}

    private static ErrorResponseException problem(HttpStatus status, String detail) {
        return new ErrorResponseException(status, ProblemDetail.forStatusAndDetail(status, detail), null);
    }

    @Transactional
    public CertificateView declare(long userId, Declaration declaration) {
        if (declaration.photoId() != null) {
            attach(declaration.photoId(), userId);
        }
        Instant now = now();
        Certificate certificate = new Certificate(users.getReferenceById(userId), now);
        fill(certificate, declaration, now);
        return fullView(certificates.save(certificate));
    }

    @Transactional
    public CertificateView update(long id, long userId, Declaration declaration) {
        UUID previous = owned(id, userId).getPhotoId();
        UUID next = declaration.photoId();
        if (next != null && !next.equals(previous)) {
            attach(next, userId);
        }
        Certificate certificate = find(id);
        fill(certificate, declaration, now());
        certificates.saveAndFlush(certificate);
        if (previous != null && !previous.equals(next)) {
            media.release(List.of(previous));
        }
        return fullView(find(id));
    }

    @Transactional
    public void delete(long id, long userId) {
        Certificate certificate = owned(id, userId);
        UUID photo = certificate.getPhotoId();
        certificates.delete(certificate);
        certificates.flush();
        if (photo != null) {
            media.release(List.of(photo));
        }
    }

    @Transactional(readOnly = true)
    public List<CertificateView> list(long ownerId, Viewer viewer) {
        User owner = users.findById(ownerId).orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "User not found."));
        boolean privileged = viewer.admin() || Long.valueOf(ownerId).equals(viewer.userId());
        if (!owner.isShowCertificates() && !privileged) {
            throw problem(HttpStatus.FORBIDDEN, "This diver's certificates are private.");
        }
        List<Certificate> found = certificates.findByUser_IdOrderByCreatedAtDescIdDesc(ownerId);
        if (!privileged) {
            return found.stream()
                    .filter(certificate -> certificate.getStatus() != Certificate.Status.REJECTED)
                    .map(CertificateService::publicView)
                    .toList();
        }
        Map<UUID, MediaView> photos = photos(found);
        return found.stream().map(certificate -> fullView(certificate, photos)).toList();
    }

    @Transactional(readOnly = true)
    public Page<QueueItemView> queue(Pageable pageable) {
        Page<Certificate> found =
                certificates.findByStatusOrderByCreatedAtAscIdAsc(Certificate.Status.PENDING, pageable);
        Map<UUID, MediaView> photos = photos(found.getContent());
        return found.map(certificate -> new QueueItemView(
                fullView(certificate, photos),
                certificate.getUser().getId(),
                certificate.getUser().getDisplayName()));
    }

    @Transactional
    public CertificateView verify(long id) {
        Certificate certificate = pending(id);
        certificate.verify(now());
        return fullView(certificate);
    }

    @Transactional
    public CertificateView reject(long id, String reason) {
        Certificate certificate = pending(id);
        certificate.reject(reason.strip(), now());
        return fullView(certificate);
    }

    /** Each diver's most recently verified certificate, for a page of reviews, in one query (design D4). */
    @Transactional(readOnly = true)
    public Map<Long, String> verifiedBadges(Collection<Long> userIds) {
        Map<Long, String> badges = new HashMap<>();
        if (userIds.isEmpty()) {
            return badges;
        }
        for (Certificate certificate : certificates.findVerifiedForBadges(userIds)) {
            badges.putIfAbsent(certificate.getUser().getId(), badge(certificate));
        }
        return badges;
    }

    private static String badge(Certificate certificate) {
        return certificate.getAgency().equals("OTHER")
                ? certificate.getLevel()
                : certificate.getAgency() + " " + certificate.getLevel();
    }

    private static void fill(Certificate certificate, Declaration declaration, Instant now) {
        certificate.declare(
                declaration.agency(),
                declaration.level().strip(),
                declaration.number().strip(),
                declaration.photoId(),
                now);
    }

    private void attach(UUID photoId, long userId) {
        try {
            media.attach(List.of(photoId), userId);
        } catch (MediaNotAttachableException e) {
            ProblemDetail problem =
                    ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
            problem.setProperty(
                    "errors", List.of(new FieldViolation("photoId", e.getBody().getDetail())));
            throw new ErrorResponseException(HttpStatus.BAD_REQUEST, problem, null);
        }
    }

    private Certificate find(long id) {
        return certificates.findById(id).orElseThrow(() -> problem(HttpStatus.NOT_FOUND, "Certificate not found."));
    }

    private Certificate owned(long id, long userId) {
        Certificate certificate = find(id);
        if (certificate.getUser().getId() != userId) {
            throw problem(HttpStatus.FORBIDDEN, "Only the owner can change this certificate.");
        }
        return certificate;
    }

    private Certificate pending(long id) {
        Certificate certificate = find(id);
        if (certificate.getStatus() != Certificate.Status.PENDING) {
            throw problem(HttpStatus.CONFLICT, "This certificate has already been moderated.");
        }
        return certificate;
    }

    private Map<UUID, MediaView> photos(List<Certificate> found) {
        List<UUID> ids = found.stream()
                .map(Certificate::getPhotoId)
                .filter(photo -> photo != null)
                .toList();
        return media.views(ids).stream().collect(Collectors.toMap(MediaView::id, Function.identity()));
    }

    private CertificateView fullView(Certificate certificate) {
        return fullView(certificate, photos(List.of(certificate)));
    }

    private static CertificateView fullView(Certificate certificate, Map<UUID, MediaView> photos) {
        return new CertificateView(
                certificate.getId(),
                certificate.getAgency(),
                certificate.getLevel(),
                certificate.getStatus().name(),
                certificate.getNumber(),
                certificate.getPhotoId() == null ? null : photos.get(certificate.getPhotoId()),
                certificate.getRejectionReason());
    }

    private static CertificateView publicView(Certificate certificate) {
        return new CertificateView(
                certificate.getId(),
                certificate.getAgency(),
                certificate.getLevel(),
                certificate.getStatus().name(),
                null,
                null,
                null);
    }

    /** Truncated to what timestamptz stores, so a certificate reads back as it was written. */
    private Instant now() {
        return clock.instant().truncatedTo(ChronoUnit.MICROS);
    }
}
