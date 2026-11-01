package ua.ukma.divenet.review.domain;

import java.math.BigDecimal;
import java.util.Optional;
import org.jspecify.annotations.Nullable;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface ReviewRepository extends JpaRepository<Review, Long> {

    /** One site's averages and counts, rounded in SQL (design D2). */
    interface Aggregates {
        @Nullable
        BigDecimal getRatingAverage();

        long getRatingCount();

        long getReviewCount();

        @Nullable
        BigDecimal getCommunityDifficulty();
    }

    boolean existsBySite_IdAndAuthor_Id(long siteId, long authorId);

    @EntityGraph(attributePaths = "author")
    Optional<Review> findBySite_IdAndAuthor_Id(long siteId, long authorId);

    @EntityGraph(attributePaths = "author")
    @Query(
            value = "select r from Review r where r.site.id = :siteId order by r.createdAt desc, r.id desc",
            countQuery = "select count(r) from Review r where r.site.id = :siteId")
    Page<Review> findNewest(long siteId, Pageable pageable);

    @EntityGraph(attributePaths = "author")
    @Query(value = """
                    select r from Review r where r.site.id = :siteId
                    order by r.rating desc nulls last, r.createdAt desc, r.id desc""", countQuery = "select count(r) from Review r where r.site.id = :siteId")
    Page<Review> findHighestRated(long siteId, Pageable pageable);

    @Query(value = """
                    SELECT round(avg(rating), 1) AS "ratingAverage", count(rating) AS "ratingCount",
                           count(*) AS "reviewCount", round(avg(difficulty), 1) AS "communityDifficulty"
                    FROM reviews WHERE site_id = :siteId""", nativeQuery = true)
    Aggregates aggregates(long siteId);
}
