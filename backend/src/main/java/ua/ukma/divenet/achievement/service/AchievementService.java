package ua.ukma.divenet.achievement.service;

import java.math.BigDecimal;
import java.time.Clock;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import org.jspecify.annotations.Nullable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.achievement.domain.Achievement;
import ua.ukma.divenet.achievement.domain.Achievement.Metric;
import ua.ukma.divenet.achievement.domain.AchievementRepository;
import ua.ukma.divenet.achievement.domain.UserAchievement;
import ua.ukma.divenet.achievement.domain.UserAchievementRepository;
import ua.ukma.divenet.divelog.service.DiveLogService;
import ua.ukma.divenet.post.service.PostService;
import ua.ukma.divenet.site.service.SiteCatalogService;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec achievement/achievements: a rule reads live data, and an award is permanent (design D2). */
@Service
public class AchievementService {

    private final AchievementRepository achievements;
    private final UserAchievementRepository awards;
    private final DiveLogService diveLog;
    private final PostService posts;
    private final SiteCatalogService sites;
    private final UserRepository users;
    private final Clock clock;

    public AchievementService(
            AchievementRepository achievements,
            UserAchievementRepository awards,
            DiveLogService diveLog,
            PostService posts,
            SiteCatalogService sites,
            UserRepository users,
            Clock clock) {
        this.achievements = achievements;
        this.awards = awards;
        this.diveLog = diveLog;
        this.posts = posts;
        this.sites = sites;
        this.users = users;
        this.clock = clock;
    }

    /** Progress is null when the viewer may not see it. */
    public record AchievementView(
            String code,
            int target,
            @Nullable Integer progress,
            @Nullable Instant earnedAt) {}

    /** Awards every target the user meets now; safe to call at any time. */
    @Transactional
    public void evaluate(long userId) {
        Map<Metric, Long> numbers = numbers(userId);
        Instant now = clock.instant().truncatedTo(ChronoUnit.MICROS);
        for (Achievement achievement : achievements.findAll()) {
            if (numbers.get(achievement.getMetric()) >= achievement.getTarget()) {
                awards.award(userId, achievement.getCode(), now);
            }
        }
    }

    /** Progress shows dive counts, so it follows the statistics setting (design D4). */
    @Transactional(readOnly = true)
    public List<AchievementView> list(long userId, @Nullable Long viewerId) {
        User user = users.findById(userId).orElseThrow(() -> {
            HttpStatus status = HttpStatus.NOT_FOUND;
            return new ErrorResponseException(
                    status, ProblemDetail.forStatusAndDetail(status, "User not found."), null);
        });
        boolean showProgress = user.isShowStatistics() || user.getId().equals(viewerId);
        Map<Metric, Long> numbers = showProgress ? numbers(userId) : Map.of();
        Map<String, Instant> earned = awards.findById_UserId(userId).stream()
                .collect(Collectors.toMap(UserAchievement::getAchievementCode, UserAchievement::getEarnedAt));
        return achievements.findAllByOrderByPosition().stream()
                .map(achievement -> new AchievementView(
                        achievement.getCode(),
                        achievement.getTarget(),
                        showProgress
                                ? (int) Math.min(numbers.get(achievement.getMetric()), achievement.getTarget())
                                : null,
                        earned.get(achievement.getCode())))
                .toList();
    }

    private Map<Metric, Long> numbers(long userId) {
        DiveLogService.ActivityView activity = diveLog.activity(userId);
        BigDecimal deepest = activity.deepest();
        Map<Metric, Long> numbers = new EnumMap<>(Metric.class);
        numbers.put(Metric.DIVES, activity.dives());
        numbers.put(Metric.SITES, activity.sites());
        numbers.put(Metric.COUNTRIES, activity.countries());
        numbers.put(Metric.DEEPEST, deepest == null ? 0 : deepest.longValue());
        numbers.put(Metric.PUBLISHED_POSTS, posts.publishedCount(userId));
        numbers.put(Metric.APPROVED_SITES, sites.approvedCount(userId));
        return numbers;
    }
}
