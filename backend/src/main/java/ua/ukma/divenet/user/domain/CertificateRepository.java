package ua.ukma.divenet.user.domain;

import java.util.Collection;
import java.util.List;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface CertificateRepository extends JpaRepository<Certificate, Long> {

    List<Certificate> findByUser_IdOrderByCreatedAtDescIdDesc(long userId);

    /** The verification queue, oldest first. */
    @EntityGraph(attributePaths = "user")
    Page<Certificate> findByStatusOrderByCreatedAtAscIdAsc(Certificate.Status status, Pageable pageable);

    /** Newest verification first, for the badge. Leaves out divers who hide their certificates. */
    @Query("""
            select c from Certificate c join fetch c.user u
            where u.id in :userIds and c.status = 'VERIFIED' and u.showCertificates = true
            order by c.verifiedAt desc, c.id desc
            """)
    List<Certificate> findVerifiedForBadges(Collection<Long> userIds);
}
