package ua.ukma.divenet.site.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A seeded gear item that a site can require or recommend. Migrations own the rows. */
@Entity
@Table(name = "gear_items")
public class GearItem {

    @Id
    @Column(length = 50)
    private String code;

    @Column(nullable = false, unique = true, length = 100)
    private String name;

    protected GearItem() {}

    public String getCode() {
        return code;
    }

    public String getName() {
        return name;
    }
}
