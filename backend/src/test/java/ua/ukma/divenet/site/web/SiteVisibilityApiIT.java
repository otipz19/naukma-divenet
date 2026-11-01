package ua.ukma.divenet.site.web;

import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/** Spec site/catalog: who sees an unapproved site. */
class SiteVisibilityApiIT extends SiteApiTestBase {

    @Test
    void unapprovedSitesAreHiddenFromMarkers() throws Exception {
        User author = user("Mira");
        approvedSite("Public");
        pendingSite("Pending", author);
        Site rejected = pendingSite("Rejected", author);
        rejected.reject("Duplicate");
        sites.save(rejected);

        for (var viewer :
                new org.springframework.test.web.servlet.request.RequestPostProcessor[] {as(author), admin()}) {
            mvc.perform(get(SITES + "/markers").with(viewer)).andExpect(jsonPath("$[*].name", contains("Public")));
        }
        mvc.perform(get(SITES + "/markers")).andExpect(jsonPath("$[*].name", contains("Public")));
    }

    @Test
    void searchDoesNotRevealUnapprovedSites() throws Exception {
        pendingSite("Hidden Reef", user("Mira"));

        mvc.perform(get(SITES + "/markers").param("q", "hidden"))
                .andExpect(jsonPath("$.length()").value(0));
    }

    @Test
    void pendingSiteForOthers() throws Exception {
        long id = pendingSite("Pending", user("Mira")).getId();

        mvc.perform(get(SITES + "/" + id)).andExpect(status().isNotFound());
        mvc.perform(get(SITES + "/" + id).with(as(user("Oleh")))).andExpect(status().isNotFound());
    }

    @Test
    void pendingSiteForItsAuthorAndAdmins() throws Exception {
        User author = user("Mira");
        long id = pendingSite("Pending", author).getId();

        mvc.perform(get(SITES + "/" + id).with(as(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PENDING"));
        mvc.perform(get(SITES + "/" + id).with(admin())).andExpect(status().isOk());
    }

    @Test
    void approvedSiteShowsItsStatusToAnyone() throws Exception {
        long id = approvedSite("Public").getId();

        mvc.perform(get(SITES + "/" + id)).andExpect(jsonPath("$.status").value("APPROVED"));
    }
}
