package ua.ukma.divenet.site.service;

import jakarta.persistence.criteria.Expression;
import jakarta.persistence.criteria.Fetch;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.Path;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Root;
import jakarta.persistence.criteria.Subquery;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import org.hibernate.query.criteria.HibernateCriteriaBuilder;
import org.springframework.data.jpa.domain.Specification;
import ua.ukma.divenet.geo.domain.Country;
import ua.ukma.divenet.geo.domain.Region;
import ua.ukma.divenet.site.domain.GearRequirement;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteStatus;

/** Turns a {@link SiteFilter} into a query; only supplied filters add a predicate (design D2). */
final class SiteSearch {

    private static final char ESCAPE = '\\';

    private SiteSearch() {}

    static Specification<Site> matching(SiteFilter filter) {
        return (root, query, cb) -> {
            // Fetched for the marker fields, so the list stays one query.
            Fetch<Site, Region> regionFetch = root.fetch("region");
            regionFetch.fetch("country");
            HibernateCriteriaBuilder hcb = (HibernateCriteriaBuilder) cb;
            if (filter.sort() == MarkerSort.RATING) {
                // Unrated sites last; ties by name (add-site-reviews design D4).
                query.orderBy(hcb.desc(root.get("ratingAverage"), false), cb.asc(root.get("name")));
            } else {
                query.orderBy(cb.asc(root.get("name")));
            }

            Path<Region> region = root.get("region");
            Path<Country> country = region.get("country");
            List<Predicate> predicates = new ArrayList<>();
            predicates.add(cb.equal(root.get("status"), SiteStatus.APPROVED));
            if (filter.q() != null) {
                predicates.add(textMatch(filter, root, region, country, hcb));
            }
            if (!filter.difficulties().isEmpty()) {
                predicates.add(root.get("difficulty").in(filter.difficulties()));
            }
            for (String code : filter.gear()) {
                Subquery<Integer> required = query.subquery(Integer.class);
                Join<Site, ?> gear = required.correlate(root).join("gear");
                required.select(cb.literal(1))
                        .where(
                                cb.equal(gear.get("gearCode"), code),
                                cb.equal(gear.get("requirement"), GearRequirement.REQUIRED));
                predicates.add(cb.exists(required));
            }
            if (filter.country() != null) {
                predicates.add(cb.equal(country.get("code"), filter.country()));
            }
            if (filter.region() != null) {
                predicates.add(cb.equal(region.get("code"), filter.region()));
            }
            if (filter.minDepth() != null) {
                predicates.add(cb.ge(root.<Integer>get("maxDepth"), filter.minDepth()));
            }
            if (filter.maxDepth() != null) {
                predicates.add(cb.le(root.<Integer>get("minDepth"), filter.maxDepth()));
            }
            if (filter.minRating() != null) {
                // An unrated site has a null average, which never compares true.
                predicates.add(cb.ge(root.<BigDecimal>get("ratingAverage"), filter.minRating()));
            }
            return cb.and(predicates.toArray(Predicate[]::new));
        };
    }

    private static Predicate textMatch(
            SiteFilter filter,
            Root<Site> root,
            Path<Region> region,
            Path<Country> country,
            HibernateCriteriaBuilder cb) {
        String pattern = "%" + escapeLike(filter.q()) + "%";
        List<Predicate> any = new ArrayList<>(List.of(
                ilike(cb, root.get("name"), pattern),
                ilike(cb, region.get("name"), pattern),
                ilike(cb, country.get("name"), pattern)));
        if (!filter.qRegions().isEmpty()) {
            any.add(region.get("code").in(filter.qRegions()));
        }
        if (!filter.qCountries().isEmpty()) {
            any.add(country.get("code").in(filter.qCountries()));
        }
        return cb.or(any.toArray(Predicate[]::new));
    }

    private static Predicate ilike(HibernateCriteriaBuilder cb, Expression<String> value, String pattern) {
        return cb.ilike(value, pattern, ESCAPE);
    }

    static String escapeLike(String text) {
        return text.replace("\\", "\\\\").replace("%", "\\%").replace("_", "\\_");
    }
}
