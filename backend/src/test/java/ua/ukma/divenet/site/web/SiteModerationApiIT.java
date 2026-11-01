package ua.ukma.divenet.site.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasItem;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.ResultActions;
import ua.ukma.divenet.site.domain.SiteStatus;
import ua.ukma.divenet.user.domain.User;

/** Spec site/moderation, server scenarios. */
class SiteModerationApiIT extends SiteApiTestBase {

    private ResultActions reject(long id, String reason) throws Exception {
        return mvc.perform(post(ADMIN_SITES + "/" + id + "/reject")
                .with(admin())
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"reason\": \"" + reason + "\"}"));
    }

    private SiteStatus statusOf(long id) {
        return sites.findById(id).orElseThrow().getStatus();
    }

    @Test
    void pendingSitesOnly() throws Exception {
        approvedSite("Public");
        pendingSite("First", user("Mira Koval"));
        pendingSite("Second", user("Oleh"));

        mvc.perform(get(ADMIN_SITES).with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].site.name", contains("First", "Second")))
                .andExpect(jsonPath("$.content[0].authorName").value("Mira Koval"))
                .andExpect(jsonPath("$.page.totalElements").value(2));
    }

    @Test
    void notAnAdminOnTheQueue() throws Exception {
        mvc.perform(get(ADMIN_SITES).with(as(user("Mira")))).andExpect(status().isForbidden());
    }

    @Test
    void approvedSiteBecomesPublic() throws Exception {
        long id = pendingSite("New Reef", user("Mira")).getId();

        mvc.perform(post(ADMIN_SITES + "/" + id + "/approve").with(admin()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("APPROVED"));

        mvc.perform(get(SITES + "/markers")).andExpect(jsonPath("$[*].name", contains("New Reef")));
    }

    @Test
    void rejectedWithAReason() throws Exception {
        long id = pendingSite("New Reef", user("Mira")).getId();

        reject(id, " Duplicate of Canyon ")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("REJECTED"))
                .andExpect(jsonPath("$.rejectionReason").value("Duplicate of Canyon"));

        mvc.perform(get(SITES + "/markers")).andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void noReason() throws Exception {
        long id = pendingSite("New Reef", user("Mira")).getId();

        reject(id, " ").andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem("reason")));

        assertThat(statusOf(id)).isEqualTo(SiteStatus.PENDING);
    }

    @Test
    void alreadyModerated() throws Exception {
        long approved = approvedSite("Public").getId();
        long rejected = pendingSite("Rejected", user("Mira")).getId();
        reject(rejected, "Duplicate");

        mvc.perform(post(ADMIN_SITES + "/" + approved + "/approve").with(admin()))
                .andExpect(status().isConflict());
        mvc.perform(post(ADMIN_SITES + "/" + rejected + "/approve").with(admin()))
                .andExpect(status().isConflict());
        reject(approved, "Late").andExpect(status().isConflict());

        assertThat(statusOf(approved)).isEqualTo(SiteStatus.APPROVED);
        assertThat(statusOf(rejected)).isEqualTo(SiteStatus.REJECTED);
    }

    @Test
    void unknownSite() throws Exception {
        mvc.perform(post(ADMIN_SITES + "/999999/approve").with(admin())).andExpect(status().isNotFound());
    }

    @Test
    void notAnAdminOnApprove() throws Exception {
        User mira = user("Mira");
        long id = pendingSite("Own", mira).getId();

        mvc.perform(post(ADMIN_SITES + "/" + id + "/approve").with(as(mira))).andExpect(status().isForbidden());

        assertThat(statusOf(id)).isEqualTo(SiteStatus.PENDING);
    }
}
