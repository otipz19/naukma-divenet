package ua.ukma.divenet.post.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.containsInAnyOrder;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.persistence.EntityManagerFactory;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import ua.ukma.divenet.user.domain.User;

/** Spec post/feed, API scenarios. */
class PostFeedApiIT extends PostTestBase {

    @Autowired
    EntityManagerFactory entityManagerFactory;

    private static String inRegion(String title, String region) {
        return "{\"title\": \"%s\", \"text\": \"Some text\", \"status\": \"PUBLISHED\", \"regionCode\": \"%s\"}"
                .formatted(title, region);
    }

    private static String atSite(String title, long siteId) {
        return "{\"title\": \"%s\", \"text\": \"Some text\", \"status\": \"PUBLISHED\", \"siteId\": %d}"
                .formatted(title, siteId);
    }

    @Test
    void newestFirst() throws Exception {
        written(user(), published("First"));
        written(user(), published("Second"));
        written(user(), draft("Hidden"));

        mvc.perform(get(POSTS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", contains("Second", "First")))
                .andExpect(jsonPath("$.content[0].author.displayName").value("Mira Koval"))
                .andExpect(jsonPath("$.page.totalElements").value(2));
    }

    @Test
    void aClientCannotChangeTheOrder() throws Exception {
        written(user(), published("First"));
        written(user(), published("Second"));

        mvc.perform(get(POSTS).param("sort", "title,asc"))
                .andExpect(jsonPath("$.content[*].title", contains("Second", "First")));
    }

    @Test
    void publishedAgainKeepsItsPlace() throws Exception {
        User author = user();
        long older = written(author, published("Older"));
        written(user(), published("Newer"));

        edit(author, older, draft("Older")).andExpect(status().isOk());
        edit(author, older, published("Older")).andExpect(status().isOk());

        mvc.perform(get(POSTS)).andExpect(jsonPath("$.content[*].title", contains("Newer", "Older")));
    }

    @Test
    void pages() throws Exception {
        written(user(), published("First"));
        written(user(), published("Second"));

        mvc.perform(get(POSTS).param("page", "1").param("size", "1"))
                .andExpect(jsonPath("$.content[*].title", contains("First")))
                .andExpect(jsonPath("$.page.number").value(1))
                .andExpect(jsonPath("$.page.totalPages").value(2));
    }

    @Test
    void byCountry() throws Exception {
        User author = user();
        written(author, inRegion("Dahab", "eg-dahab"));
        written(author, atSite("Egyptian site", site("eg-hurghada").getId()));
        written(author, inRegion("Istria", "hr-istria"));
        written(author, published("Nowhere"));

        mvc.perform(get(POSTS).param("countryCode", "EG"))
                .andExpect(jsonPath("$.content[*].title", containsInAnyOrder("Dahab", "Egyptian site")));
    }

    @Test
    void byRegion() throws Exception {
        User author = user();
        written(author, inRegion("Dahab", "eg-dahab"));
        written(author, atSite("Dahab site", site("eg-dahab").getId()));
        written(author, inRegion("Hurghada", "eg-hurghada"));

        mvc.perform(get(POSTS).param("regionCode", "eg-dahab"))
                .andExpect(jsonPath("$.content[*].title", containsInAnyOrder("Dahab", "Dahab site")));
    }

    @Test
    void bySite() throws Exception {
        User author = user();
        long siteId = site("eg-dahab").getId();
        written(author, atSite("Here", siteId));
        written(author, atSite("Elsewhere", site("eg-dahab").getId()));
        written(author, inRegion("Same region", "eg-dahab"));

        mvc.perform(get(POSTS).param("siteId", String.valueOf(siteId)))
                .andExpect(jsonPath("$.content[*].title", contains("Here")));
    }

    @Test
    void countryAndRegionDisagree() throws Exception {
        written(user(), inRegion("Dahab", "eg-dahab"));

        mvc.perform(get(POSTS).param("countryCode", "HR").param("regionCode", "eg-dahab"))
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void unknownFilterValue() throws Exception {
        written(user(), inRegion("Dahab", "eg-dahab"));

        mvc.perform(get(POSTS).param("regionCode", "nowhere"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
        mvc.perform(get(POSTS).param("countryCode", "ZZ"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(0));
    }

    @Test
    void queryCountDoesNotGrowWithThePage() throws Exception {
        org.hibernate.stat.Statistics statistics =
                entityManagerFactory.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        User author = user();
        written(author, covered(author, site("eg-dahab").getId()));
        statistics.clear();
        mvc.perform(get(POSTS)).andExpect(status().isOk());
        long withOne = statistics.getPrepareStatementCount();

        for (int i = 0; i < 9; i++) {
            User other = user();
            written(other, covered(other, site("hr-istria").getId()));
        }
        statistics.clear();
        mvc.perform(get(POSTS)).andExpect(jsonPath("$.content.length()").value(10));

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(withOne);
        statistics.setStatisticsEnabled(false);
    }

    private String covered(User author, long siteId) {
        return "{\"title\": \"Post\", \"text\": \"Some text\", \"status\": \"PUBLISHED\", \"coverId\": \"%s\", \"siteId\": %d}"
                .formatted(upload(author), siteId);
    }
}
