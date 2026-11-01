package ua.ukma.divenet.achievement.service;

import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.event.TransactionalEventListener;
import ua.ukma.divenet.divelog.service.DiveLogged;
import ua.ukma.divenet.post.service.PostPublished;
import ua.ukma.divenet.site.service.SiteApproved;

/**
 * Evaluates after the action commits, in the request's thread: the award exists when the API answers,
 * and a failure here is logged by Spring without refusing the saved action (design D3).
 */
@Component
class AchievementListener {

    private final AchievementService achievements;

    AchievementListener(AchievementService achievements) {
        this.achievements = achievements;
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void on(DiveLogged event) {
        achievements.evaluate(event.userId());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void on(PostPublished event) {
        achievements.evaluate(event.authorId());
    }

    @TransactionalEventListener
    @Transactional(propagation = Propagation.REQUIRES_NEW)
    void on(SiteApproved event) {
        achievements.evaluate(event.authorId());
    }
}
