package ua.ukma.divenet.post.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import jakarta.persistence.EntityManagerFactory;
import java.util.UUID;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import ua.ukma.divenet.user.domain.User;

/** Spec post/posts: reading posts, the blog and drafts. */
class PostReadApiIT extends PostTestBase {

    @Autowired
    EntityManagerFactory entityManagerFactory;

    private static String blog(User user) {
        return "/api/v1/users/" + user.getId() + "/posts";
    }

    private static String full(String title, UUID cover, long siteId) {
        return "{\"title\": \"%s\", \"text\": \"Some text\", \"status\": \"PUBLISHED\", \"coverId\": \"%s\", \"siteId\": %d}"
                .formatted(title, cover, siteId);
    }

    @Test
    void readingAPublishedPost() throws Exception {
        User author = user();
        UUID cover = upload(author);
        UUID photo = upload(author);
        long siteId = site("eg-dahab").getId();
        long id = written(
                author,
                "{\"title\": \"T\", \"text\": \"Some text\", \"status\": \"PUBLISHED\", \"coverId\": \"%s\", \"photoIds\": [\"%s\"], \"siteId\": %d}"
                        .formatted(cover, photo, siteId));

        mvc.perform(get(POSTS + "/" + id))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.text").value("Some text"))
                .andExpect(jsonPath("$.readMinutes").value(1))
                .andExpect(jsonPath("$.author.id").value(author.getId()))
                .andExpect(jsonPath("$.cover.id").value(cover.toString()))
                .andExpect(jsonPath("$.photos[0].id").value(photo.toString()))
                .andExpect(jsonPath("$.regionCode").value("eg-dahab"))
                .andExpect(jsonPath("$.site.id").value(siteId));
    }

    @Test
    void authorReadsADraft() throws Exception {
        User author = user();
        long id = written(author, draft("Mine"));

        mvc.perform(get(POSTS + "/" + id).with(as(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));
    }

    /** Ids above the JVM's small-number cache: comparing two boxed Longs with == would refuse the author. */
    @Test
    void authorWithALargeIdReadsADraft() throws Exception {
        jdbc.queryForObject(
                "SELECT setval(pg_get_serial_sequence('users', 'id'), GREATEST(1000, (SELECT max(id) FROM users)))",
                Long.class);
        User author = user();
        long id = written(author, draft("Mine"));

        mvc.perform(get(POSTS + "/" + id).with(as(author))).andExpect(status().isOk());
    }

    @Test
    void someoneElseReadsADraft() throws Exception {
        long id = written(user(), draft("Mine"));

        mvc.perform(get(POSTS + "/" + id)).andExpect(status().isNotFound());
        mvc.perform(get(POSTS + "/" + id).with(as(user()))).andExpect(status().isNotFound());
        mvc.perform(get(POSTS + "/" + id).with(admin())).andExpect(status().isNotFound());
    }

    @Test
    void readingABlog() throws Exception {
        User author = user();
        written(author, published("First"));
        written(author, published("Second"));
        written(author, draft("Hidden"));

        mvc.perform(get(blog(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", contains("Second", "First")))
                .andExpect(jsonPath("$.content[0].excerpt").value("Some text"))
                .andExpect(jsonPath("$.content[0].readMinutes").value(1))
                .andExpect(jsonPath("$.content[0].text").doesNotExist())
                .andExpect(jsonPath("$.page.totalElements").value(2));
    }

    @Test
    void unknownAuthor() throws Exception {
        mvc.perform(get("/api/v1/users/999999/posts")).andExpect(status().isNotFound());
    }

    @Test
    void ownDrafts() throws Exception {
        User author = user();
        long older = written(author, draft("Older"));
        written(author, draft("Newer"));
        written(author, published("Public"));
        written(user(), draft("Theirs"));
        edit(author, older, draft("Edited")).andExpect(status().isOk());

        mvc.perform(get(POSTS + "/drafts").with(as(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].title", contains("Edited", "Newer")));
    }

    @Test
    void draftsWhenAnonymous() throws Exception {
        mvc.perform(get(POSTS + "/drafts")).andExpect(status().isUnauthorized());
    }

    @Test
    void queryCountDoesNotGrowWithThePage() throws Exception {
        org.hibernate.stat.Statistics statistics =
                entityManagerFactory.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        User author = user();
        long siteId = site("eg-dahab").getId();
        written(author, full("Post", upload(author), siteId));
        statistics.clear();
        mvc.perform(get(blog(author))).andExpect(status().isOk());
        long withOne = statistics.getPrepareStatementCount();

        for (int i = 0; i < 9; i++) {
            written(author, full("Post", upload(author), site("hr-istria").getId()));
        }
        statistics.clear();
        mvc.perform(get(blog(author))).andExpect(jsonPath("$.content.length()").value(10));

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(withOne);
        statistics.setStatisticsEnabled(false);
    }
}
