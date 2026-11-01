package ua.ukma.divenet.geo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import java.util.List;

/** A seeded country; {@code code} is its ISO 3166-1 alpha-2 code. Migrations own the rows. */
@Entity
@Table(name = "countries")
public class Country {

    @Id
    @Column(length = 2)
    private String code;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    @OneToMany(mappedBy = "country")
    @OrderBy("name")
    private List<Region> regions;

    protected Country() {}

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }

    public List<Region> getRegions() {
        return regions;
    }
}
