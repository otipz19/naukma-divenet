package ua.ukma.divenet.geo.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;

/** A seeded region of one country, with a code such as {@code eg-dahab}. Migrations own the rows. */
@Entity
@Table(name = "regions")
public class Region {

    @Id
    @Column(length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "country_code", nullable = false)
    private Country country;

    @Column(nullable = false, length = 100)
    private String name;

    protected Region() {}

    public String getCode() {
        return code;
    }

    public Country getCountry() {
        return country;
    }

    public String getName() {
        return name;
    }
}
