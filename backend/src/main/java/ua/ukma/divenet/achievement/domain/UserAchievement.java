package ua.ukma.divenet.achievement.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Embeddable;
import jakarta.persistence.EmbeddedId;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import java.time.Instant;

/** An award to a user; it is never updated or removed. */
@Entity
@Table(name = "user_achievements")
public class UserAchievement {

    @Embeddable
    public record Key(
            @Column(name = "user_id") long userId,
            @Column(name = "achievement_code") String achievementCode) {}

    @EmbeddedId
    private Key id;

    @Column(name = "earned_at", nullable = false)
    private Instant earnedAt;

    protected UserAchievement() {}

    public String getAchievementCode() {
        return id.achievementCode();
    }

    public Instant getEarnedAt() {
        return earnedAt;
    }
}
