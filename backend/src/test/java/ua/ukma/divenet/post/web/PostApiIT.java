package ua.ukma.divenet.post.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.hasItem;
import static org.hamcrest.Matchers.notNullValue;
import static org.hamcrest.Matchers.nullValue;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.user.domain.User;

/** Spec post/posts: writing posts. */
class PostApiIT extends PostTestBase {

    private void refused(User user, String json, String field) throws Exception {
        write(user, json).andExpect(status().isBadRequest()).andExpect(jsonPath("$.errors[*].field", hasItem(field)));
    }

    private void nothingStored() {
        assertThat(jdbc.queryForObject("SELECT count(*) FROM posts", Long.class))
                .isZero();
    }

    private String publishedAt(long id) throws Exception {
        String body = mvc.perform(get(POSTS + "/" + id))
                .andExpect(status().isOk())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.read(body, "$.publishedAt");
    }

    @Test
    void creatingADraft() throws Exception {
        User author = user();

        write(author, draft(" Night dive "))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.title").value("Night dive"))
                .andExpect(jsonPath("$.text").value(""))
                .andExpect(jsonPath("$.status").value("DRAFT"))
                .andExpect(jsonPath("$.publishedAt", nullValue()))
                .andExpect(jsonPath("$.author.id").value(author.getId()))
                .andExpect(jsonPath("$.author.displayName").value("Mira Koval"));
    }

    @Test
    void creatingAPublishedPost() throws Exception {
        write(user(), published("Night dive"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.publishedAt", notNullValue()));
    }

    @Test
    void anonymousVisitor() throws Exception {
        mvc.perform(post(POSTS).contentType(MediaType.APPLICATION_JSON).content(draft("Night dive")))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void blankTitle() throws Exception {
        refused(user(), draft("  "), "title");
        nothingStored();
    }

    @Test
    void publishingWithoutText() throws Exception {
        refused(user(), "{\"title\": \"T\", \"text\": \"  \", \"status\": \"PUBLISHED\"}", "text");
        nothingStored();
    }

    @Test
    void textTooLong() throws Exception {
        refused(user(), "{\"title\": \"T\", \"text\": \"" + "x".repeat(20001) + "\", \"status\": \"DRAFT\"}", "text");
        nothingStored();
    }

    @Test
    void tooManyImages() throws Exception {
        String ids = IntStream.range(0, 11)
                .mapToObj(i -> "\"" + UUID.randomUUID() + "\"")
                .collect(Collectors.joining(","));

        refused(user(), "{\"title\": \"T\", \"status\": \"DRAFT\", \"photoIds\": [" + ids + "]}", "photoIds");
    }

    @Test
    void coverRepeatedAsAnImage() throws Exception {
        User author = user();
        UUID photo = upload(author);

        refused(
                author,
                "{\"title\": \"T\", \"status\": \"DRAFT\", \"coverId\": \"%s\", \"photoIds\": [\"%s\"]}"
                        .formatted(photo, photo),
                "photoIds");
    }

    @Test
    void someoneElsesUpload() throws Exception {
        UUID theirs = upload(user());

        refused(user(), "{\"title\": \"T\", \"status\": \"DRAFT\", \"coverId\": \"" + theirs + "\"}", "coverId");
        refused(user(), "{\"title\": \"T\", \"status\": \"DRAFT\", \"photoIds\": [\"" + theirs + "\"]}", "photoIds");
        nothingStored();
    }

    @Test
    void siteWithoutARegion() throws Exception {
        Site site = site("eg-dahab");

        write(user(), "{\"title\": \"T\", \"status\": \"DRAFT\", \"siteId\": " + site.getId() + "}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.site.id").value(site.getId()))
                .andExpect(jsonPath("$.site.name").value("Reef"))
                .andExpect(jsonPath("$.regionCode").value("eg-dahab"))
                .andExpect(jsonPath("$.countryCode").value("EG"));
    }

    @Test
    void regionAlone() throws Exception {
        write(user(), "{\"title\": \"T\", \"status\": \"DRAFT\", \"regionCode\": \"eg-dahab\"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.regionCode").value("eg-dahab"))
                .andExpect(jsonPath("$.site", nullValue()));
    }

    @Test
    void unknownRegion() throws Exception {
        refused(user(), "{\"title\": \"T\", \"status\": \"DRAFT\", \"regionCode\": \"nowhere\"}", "regionCode");
    }

    @Test
    void unapprovedSite() throws Exception {
        User author = user();
        Site pending = sites.save(Site.submission(
                "Hidden", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), author, NOW));

        refused(author, "{\"title\": \"T\", \"status\": \"DRAFT\", \"siteId\": " + pending.getId() + "}", "siteId");
    }

    @Test
    void regionAndSiteDisagree() throws Exception {
        Site site = site("eg-dahab");

        refused(
                user(),
                "{\"title\": \"T\", \"status\": \"DRAFT\", \"regionCode\": \"hr-istria\", \"siteId\": " + site.getId()
                        + "}",
                "siteId");
    }

    @Test
    void publishingADraft() throws Exception {
        User author = user();
        long id = written(author, draft("T"));

        edit(author, id, published("T"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("PUBLISHED"))
                .andExpect(jsonPath("$.publishedAt", notNullValue()));
    }

    @Test
    void movingBackToDrafts() throws Exception {
        User author = user();
        long id = written(author, published("T"));

        edit(author, id, draft("T"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("DRAFT"));

        mvc.perform(get(POSTS + "/" + id)).andExpect(status().isNotFound());
    }

    @Test
    void publishingAgainKeepsTheFirstTime() throws Exception {
        User author = user();
        long id = written(author, published("T"));
        String first = publishedAt(id);

        edit(author, id, draft("T")).andExpect(status().isOk());
        edit(author, id, published("T")).andExpect(status().isOk());

        assertThat(publishedAt(id)).isEqualTo(first);
    }

    @Test
    void removingAnImage() throws Exception {
        User author = user();
        UUID kept = upload(author);
        UUID removed = upload(author);
        long id = written(
                author,
                "{\"title\": \"T\", \"status\": \"DRAFT\", \"photoIds\": [\"%s\", \"%s\"]}".formatted(kept, removed));

        edit(author, id, "{\"title\": \"T\", \"status\": \"DRAFT\", \"photoIds\": [\"" + kept + "\"]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos.length()").value(1))
                .andExpect(jsonPath("$.photos[0].id").value(kept.toString()));

        assertThat(exists(kept)).isTrue();
        assertThat(exists(removed)).isFalse();
    }

    @Test
    void replacingTheCover() throws Exception {
        User author = user();
        UUID first = upload(author);
        UUID second = upload(author);
        long id = written(author, "{\"title\": \"T\", \"status\": \"DRAFT\", \"coverId\": \"" + first + "\"}");

        edit(author, id, "{\"title\": \"T\", \"status\": \"DRAFT\", \"coverId\": \"" + second + "\"}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cover.id").value(second.toString()));

        assertThat(exists(first)).isFalse();
    }

    @Test
    void deleting() throws Exception {
        User author = user();
        UUID cover = upload(author);
        UUID photo = upload(author);
        long id = written(
                author,
                "{\"title\": \"T\", \"status\": \"DRAFT\", \"coverId\": \"%s\", \"photoIds\": [\"%s\"]}"
                        .formatted(cover, photo));

        mvc.perform(delete(POSTS + "/" + id).with(as(author))).andExpect(status().isNoContent());

        mvc.perform(get(POSTS + "/" + id).with(as(author))).andExpect(status().isNotFound());
        assertThat(exists(cover)).isFalse();
        assertThat(exists(photo)).isFalse();
    }

    @Test
    void notTheAuthor() throws Exception {
        User author = user();
        long id = written(author, published("Mine"));

        edit(user(), id, published("Theirs")).andExpect(status().isForbidden());
        mvc.perform(delete(POSTS + "/" + id).with(as(user()))).andExpect(status().isForbidden());
        mvc.perform(delete(POSTS + "/" + id).with(admin())).andExpect(status().isForbidden());

        mvc.perform(get(POSTS + "/" + id)).andExpect(jsonPath("$.title").value("Mine"));
    }

    @Test
    void unknownPost() throws Exception {
        User author = user();

        edit(author, 999999, published("T")).andExpect(status().isNotFound());
        mvc.perform(delete(POSTS + "/999999").with(as(author))).andExpect(status().isNotFound());
    }
}
