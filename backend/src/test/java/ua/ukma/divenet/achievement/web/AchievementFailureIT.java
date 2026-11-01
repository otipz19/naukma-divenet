package ua.ukma.divenet.achievement.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyLong;
import static org.mockito.Mockito.doThrow;

import org.junit.jupiter.api.Test;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import ua.ukma.divenet.achievement.service.AchievementService;
import ua.ukma.divenet.user.domain.User;

/** Spec achievement/achievements, "A failed evaluation does not refuse the action". */
class AchievementFailureIT extends AchievementTestBase {

    @MockitoSpyBean
    AchievementService achievements;

    @Test
    void evaluationFails() throws Exception {
        doThrow(new IllegalStateException("boom")).when(achievements).evaluate(anyLong());
        User user = user();

        // log() asserts the 201.
        log(user, site("eg-dahab"), "10");

        assertThat(jdbc.queryForObject(
                        "SELECT count(*) FROM dive_log_entries WHERE user_id = ?", Long.class, user.getId()))
                .isEqualTo(1);
        assertThat(earned(user)).isEmpty();
    }
}
