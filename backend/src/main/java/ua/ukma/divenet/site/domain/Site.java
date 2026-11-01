package ua.ukma.divenet.site.domain;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.Instant;
import java.util.HashSet;
import java.util.Set;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import ua.ukma.divenet.geo.domain.Region;

/** A dive site. The API exposes its location as plain {@code lat} and {@code lng}. */
@Entity
@Table(name = "sites")
public class Site {

    private static final GeometryFactory WGS84 = new GeometryFactory(new PrecisionModel(), 4326);

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 120)
    private String name;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "region_code", nullable = false)
    private Region region;

    @JdbcTypeCode(SqlTypes.GEOGRAPHY)
    @Column(nullable = false, columnDefinition = "geography(Point,4326)")
    private Point location;

    @Column(nullable = false)
    private int difficulty;

    @Column(name = "min_depth", nullable = false)
    private int minDepth;

    @Column(name = "max_depth", nullable = false)
    private int maxDepth;

    @Column(nullable = false, columnDefinition = "text")
    private String description;

    @Column(name = "created_at", nullable = false)
    private Instant createdAt;

    @ElementCollection
    @CollectionTable(name = "site_gear", joinColumns = @JoinColumn(name = "site_id"))
    private Set<SiteGear> gear = new HashSet<>();

    protected Site() {}

    public Site(
            String name,
            Region region,
            double lat,
            double lng,
            int difficulty,
            int minDepth,
            int maxDepth,
            String description,
            Set<SiteGear> gear,
            Instant createdAt) {
        this.name = name;
        this.region = region;
        this.location = WGS84.createPoint(new Coordinate(lng, lat));
        this.difficulty = difficulty;
        this.minDepth = minDepth;
        this.maxDepth = maxDepth;
        this.description = description;
        this.gear = new HashSet<>(gear);
        this.createdAt = createdAt;
    }

    public Long getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public Region getRegion() {
        return region;
    }

    public double getLat() {
        return location.getY();
    }

    public double getLng() {
        return location.getX();
    }

    public int getDifficulty() {
        return difficulty;
    }

    public int getMinDepth() {
        return minDepth;
    }

    public int getMaxDepth() {
        return maxDepth;
    }

    public String getDescription() {
        return description;
    }

    public Set<SiteGear> getGear() {
        return gear;
    }
}
