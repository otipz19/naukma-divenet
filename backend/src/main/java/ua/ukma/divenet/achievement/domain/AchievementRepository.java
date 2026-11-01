package ua.ukma.divenet.achievement.domain;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AchievementRepository extends JpaRepository<Achievement, String> {

    List<Achievement> findAllByOrderByPosition();
}
