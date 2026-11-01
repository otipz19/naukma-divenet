package ua.ukma.divenet.achievement.domain;

import java.time.Instant;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface UserAchievementRepository extends JpaRepository<UserAchievement, UserAchievement.Key> {

    List<UserAchievement> findById_UserId(long userId);

    /** Does nothing when already awarded, so concurrent requests cannot fail or award twice. */
    @Modifying
    @Query(value = """
            INSERT INTO user_achievements (user_id, achievement_code, earned_at)
            VALUES (:userId, :code, :earnedAt)
            ON CONFLICT DO NOTHING
            """, nativeQuery = true)
    void award(long userId, String code, Instant earnedAt);
}
