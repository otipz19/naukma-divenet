package ua.ukma.divenet.achievement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

/** A seeded achievement definition, with a code such as {@code first-dive}. Migrations own the rows. */
@Entity
@Table(name = "achievements")
public class Achievement {

    /** What a rule measures. */
    public enum Metric {
        DIVES,
        SITES,
        COUNTRIES,
        DEEPEST,
        PUBLISHED_POSTS,
        APPROVED_SITES
    }

    @Id
    private String code;

    @Column(nullable = false, length = 100)
    private String name;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Metric metric;

    @Column(nullable = false)
    private int target;

    @Column(nullable = false)
    private short position;

    protected Achievement() {}

    public String getCode() {
        return code;
    }

    public Metric getMetric() {
        return metric;
    }

    public int getTarget() {
        return target;
    }
}
