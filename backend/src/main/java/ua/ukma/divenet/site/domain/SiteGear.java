package ua.ukma.divenet.site.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;

/** One gear item a site requires or recommends. */
@Embeddable
public record SiteGear(
        @Column(name = "gear_code", nullable = false, length = 50)
        String gearCode,

        @Enumerated(EnumType.STRING) @Column(nullable = false, length = 16)
        GearRequirement requirement) {}
