package ua.ukma.divenet.review.web;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.startsWith;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.jwt;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.jayway.jsonpath.JsonPath;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.stream.Collectors;
import java.util.stream.IntStream;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import ua.ukma.divenet.TestcontainersConfiguration;
import ua.ukma.divenet.geo.domain.RegionRepository;
import ua.ukma.divenet.media.MediaTestSupport;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.MediaService;
import ua.ukma.divenet.site.domain.Site;
import ua.ukma.divenet.site.domain.SiteRepository;
import ua.ukma.divenet.user.domain.Role;
import ua.ukma.divenet.user.domain.User;
import ua.ukma.divenet.user.domain.UserRepository;
import ua.ukma.divenet.user.service.CertificateService;

/** Spec review/reviews: the review API. */
@SpringBootTest(properties = MediaTestSupport.MEDIA_DIR_PROPERTY)
@AutoConfigureMockMvc
@Import(TestcontainersConfiguration.class)
class ReviewApiIT {

    private static final Instant NOW = Instant.parse("2026-01-01T00:00:00Z");

    @Autowired
    MockMvc mvc;

    @Autowired
    SiteRepository sites;

    @Autowired
    RegionRepository regions;

    @Autowired
    UserRepository users;

    @Autowired
    MediaService mediaService;

    @Autowired
    JdbcTemplate jdbc;

    @Autowired
    CertificateService certificates;

    @Autowired
    jakarta.persistence.EntityManagerFactory entityManagerFactory;

    User author;
    User other;
    long siteId;

    @BeforeEach
    void seed() {
        author = user("Oleh Kravets");
        other = user("Iryna Melnyk");
        siteId = site().getId();
    }

    @AfterEach
    void removeRows() {
        jdbc.update("DELETE FROM certificates");
        jdbc.update("DELETE FROM reviews");
        jdbc.update("DELETE FROM media");
        jdbc.update("DELETE FROM sites");
    }

    private User user(String displayName) {
        return users.save(new User(UUID.randomUUID() + "@example.com", displayName, "x", Role.USER, NOW));
    }

    private Site site() {
        return sites.save(
                new Site("Blue Hole", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), NOW));
    }

    private static RequestPostProcessor as(User user) {
        return jwt().jwt(token -> token.subject(String.valueOf(user.getId())).claim("roles", List.of("USER")))
                .authorities(new SimpleGrantedAuthority("ROLE_USER"));
    }

    private UUID upload(User user) {
        return mediaService.upload(user.getId(), TestImages.png(40, 30)).id();
    }

    private ResultActions create(User user, long site, String json) throws Exception {
        return mvc.perform(post("/api/v1/sites/" + site + "/reviews")
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private long review(User user, String json) throws Exception {
        String body = create(user, siteId, json)
                .andExpect(status().isCreated())
                .andReturn()
                .getResponse()
                .getContentAsString();
        return JsonPath.<Number>read(body, "$.id").longValue();
    }

    private ResultActions update(User user, long id, String json) throws Exception {
        return mvc.perform(put("/api/v1/reviews/" + id)
                .with(as(user))
                .contentType(MediaType.APPLICATION_JSON)
                .content(json));
    }

    private static String photos(UUID... ids) {
        return java.util.Arrays.stream(ids).map(id -> "\"" + id + "\"").collect(Collectors.joining(","));
    }

    private int reviewCount() {
        return jdbc.queryForObject("SELECT count(*) FROM reviews", Integer.class);
    }

    private boolean attached(UUID id) {
        return jdbc.queryForObject("SELECT attached_at IS NOT NULL FROM media WHERE id = ?", Boolean.class, id);
    }

    private static void assertProblem(ResultActions result, int status) throws Exception {
        result.andExpect(status().is(status))
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    // --- Signed-in users review an approved site ------------------------------------------------

    @Test
    void reviewWithEveryField() throws Exception {
        UUID photo = upload(author);

        String body = create(
                        author,
                        siteId,
                        "{\"rating\":4,\"difficulty\":3,\"text\":\"Great wall.\",\"photoIds\":[" + photos(photo) + "]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.siteId").value(siteId))
                .andExpect(jsonPath("$.rating").value(4))
                .andExpect(jsonPath("$.difficulty").value(3))
                .andExpect(jsonPath("$.text").value("Great wall."))
                .andExpect(jsonPath("$.photos[0].id").value(photo.toString()))
                .andExpect(jsonPath("$.photos[0].url").value("/media/" + photo))
                .andExpect(jsonPath("$.photos[0].thumbnailUrl").value("/media/" + photo + "/thumb"))
                .andExpect(jsonPath("$.author.id").value(author.getId()))
                .andExpect(jsonPath("$.author.displayName").value("Oleh Kravets"))
                .andReturn()
                .getResponse()
                .getContentAsString();

        assertThat(JsonPath.<Number>read(body, "$.id").longValue()).isPositive();
        assertThat(attached(photo)).isTrue();
    }

    @Test
    void locationHeaderNamesTheReview() throws Exception {
        var response = create(author, siteId, "{\"rating\":5}")
                .andExpect(status().isCreated())
                .andExpect(header().string("Location", startsWith("/api/v1/reviews/")))
                .andReturn()
                .getResponse();

        long id = JsonPath.<Number>read(response.getContentAsString(), "$.id").longValue();
        assertThat(response.getHeader("Location")).isEqualTo("/api/v1/reviews/" + id);
    }

    @Test
    void anonymousClient() throws Exception {
        mvc.perform(post("/api/v1/sites/" + siteId + "/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"rating\":5}"))
                .andExpect(status().isUnauthorized());

        assertThat(reviewCount()).isZero();
    }

    @Test
    void pendingSite() throws Exception {
        long pending = sites.save(Site.submission(
                        "Pending", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), author, NOW))
                .getId();

        assertProblem(create(author, pending, "{\"rating\":5}"), 404);
    }

    @Test
    void unknownSite() throws Exception {
        assertProblem(create(author, 999_999, "{\"rating\":5}"), 404);
    }

    // --- A review has a rating or text ----------------------------------------------------------

    @Test
    void ratingOnly() throws Exception {
        create(author, siteId, "{\"rating\":5}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").doesNotExist());
    }

    @Test
    void textOnly() throws Exception {
        create(author, siteId, "{\"text\":\"  Calm in the morning. \"}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.text").value("Calm in the morning."))
                .andExpect(jsonPath("$.rating").doesNotExist());
    }

    @Test
    void neitherRatingNorText() throws Exception {
        ResultActions result = create(author, siteId, "{\"difficulty\":2,\"text\":\"   \"}");

        assertProblem(result, 400);
        result.andExpect(jsonPath("$.errors[*].field", contains("text")));
        assertThat(reviewCount()).isZero();
    }

    @Test
    void outOfRange() throws Exception {
        create(author, siteId, "{\"rating\":6}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", contains("rating")));
        create(author, siteId, "{\"rating\":3,\"difficulty\":0}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", contains("difficulty")));
        create(author, siteId, "{\"text\":\"" + "x".repeat(4001) + "\"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", contains("text")));
        assertThat(reviewCount()).isZero();
    }

    // --- A user reviews a site once -------------------------------------------------------------

    @Test
    void secondReview() throws Exception {
        long id = review(author, "{\"rating\":3,\"text\":\"First.\"}");

        assertProblem(create(author, siteId, "{\"rating\":5}"), 409);
        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews/mine").with(as(author)))
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.rating").value(3))
                .andExpect(jsonPath("$.text").value("First."));
    }

    @Test
    void differentUsers() throws Exception {
        create(author, siteId, "{\"rating\":3}").andExpect(status().isCreated());
        create(other, siteId, "{\"rating\":4}").andExpect(status().isCreated());
    }

    // --- Reviews carry the author's photos ------------------------------------------------------

    @Test
    void tooManyPhotos() throws Exception {
        UUID[] ids = IntStream.range(0, 7).mapToObj(i -> UUID.randomUUID()).toArray(UUID[]::new);

        ResultActions result = create(author, siteId, "{\"rating\":5,\"photoIds\":[" + photos(ids) + "]}");

        assertProblem(result, 400);
        result.andExpect(jsonPath("$.errors[*].field", contains("photoIds")));
    }

    @Test
    void anotherUsersUpload() throws Exception {
        UUID others = upload(other);

        ResultActions result = create(author, siteId, "{\"rating\":5,\"photoIds\":[" + photos(others) + "]}");

        assertProblem(result, 400);
        result.andExpect(jsonPath("$.errors[*].field", contains("photoIds")));
        assertThat(reviewCount()).isZero();
        assertThat(attached(others)).isFalse();
    }

    @Test
    void photosKeepTheirOrder() throws Exception {
        UUID a = upload(author);
        UUID b = upload(author);

        create(author, siteId, "{\"rating\":5,\"photoIds\":[" + photos(b, a) + "]}")
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.photos[*].id", contains(b.toString(), a.toString())));
        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews"))
                .andExpect(jsonPath("$.content[0].photos[*].id", contains(b.toString(), a.toString())));
    }

    // --- Everyone reads a site's reviews --------------------------------------------------------

    private void writtenOn(long id, String instant) {
        jdbc.update("UPDATE reviews SET created_at = ? WHERE id = ?", Timestamp.from(Instant.parse(instant)), id);
    }

    @Test
    void newestFirst() throws Exception {
        long may1 = review(author, "{\"rating\":5}");
        long may3 = review(other, "{\"rating\":3}");
        writtenOn(may1, "2026-05-01T10:00:00Z");
        writtenOn(may3, "2026-05-03T10:00:00Z");

        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", contains((int) may3, (int) may1)));
    }

    @Test
    void highestRatedFirst() throws Exception {
        long three = review(author, "{\"rating\":3}");
        long five = review(other, "{\"rating\":5}");
        long none = review(user("Third"), "{\"text\":\"No stars.\"}");

        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews?sort=rating"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content[*].id", contains((int) five, (int) three, (int) none)));
    }

    @Test
    void paged() throws Exception {
        review(author, "{\"rating\":3}");
        review(other, "{\"rating\":5}");
        review(user("Third"), "{\"rating\":4}");

        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews?size=2"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(2))
                .andExpect(jsonPath("$.page.totalElements").value(3));
    }

    @Test
    void unapprovedSite() throws Exception {
        long pending = sites.save(Site.submission(
                        "Pending", regions.getReferenceById("eg-dahab"), 28, 34, 1, 5, 20, "x", Set.of(), author, NOW))
                .getId();

        assertProblem(mvc.perform(get("/api/v1/sites/" + pending + "/reviews")), 404);
        assertProblem(mvc.perform(get("/api/v1/sites/999999/reviews")), 404);
    }

    @Test
    void unknownSort() throws Exception {
        assertProblem(mvc.perform(get("/api/v1/sites/" + siteId + "/reviews?sort=oldest")), 400);
    }

    // --- Users read their own review of a site --------------------------------------------------

    @Test
    void ownReviewExists() throws Exception {
        long id = review(author, "{\"rating\":4}");
        review(other, "{\"rating\":2}");

        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews/mine").with(as(author)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(id))
                .andExpect(jsonPath("$.rating").value(4));
    }

    @Test
    void noOwnReview() throws Exception {
        review(other, "{\"rating\":2}");

        assertProblem(
                mvc.perform(get("/api/v1/sites/" + siteId + "/reviews/mine").with(as(author))), 404);
    }

    @Test
    void anonymousOwnReview() throws Exception {
        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews/mine")).andExpect(status().isUnauthorized());
    }

    // --- Authors edit their review --------------------------------------------------------------

    @Test
    void authorEdits() throws Exception {
        UUID a = upload(author);
        UUID b = upload(author);
        UUID c = upload(author);
        long id = review(author, "{\"rating\":3,\"photoIds\":[" + photos(a, b) + "]}");

        update(author, id, "{\"rating\":4,\"photoIds\":[" + photos(b, c) + "]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(4))
                .andExpect(jsonPath("$.photos[*].id", contains(b.toString(), c.toString())));

        mvc.perform(get("/media/" + a)).andExpect(status().isNotFound());
        mvc.perform(get("/media/" + b)).andExpect(status().isOk());
        assertThat(attached(c)).isTrue();
    }

    @Test
    void editReordersKeptPhotos() throws Exception {
        UUID a = upload(author);
        UUID b = upload(author);
        long id = review(author, "{\"rating\":3,\"photoIds\":[" + photos(a, b) + "]}");

        update(author, id, "{\"rating\":3,\"photoIds\":[" + photos(b, a) + "]}")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.photos[*].id", contains(b.toString(), a.toString())));
    }

    @Test
    void editFollowsTheCreateRules() throws Exception {
        long id = review(author, "{\"rating\":3}");

        update(author, id, "{\"text\":\" \"}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", contains("text")));
        update(author, id, "{\"rating\":3,\"photoIds\":[" + photos(upload(other)) + "]}")
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors[*].field", contains("photoIds")));
    }

    @Test
    void anotherUserEdits() throws Exception {
        long id = review(author, "{\"rating\":3}");

        assertProblem(update(other, id, "{\"rating\":1}"), 403);
        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews/mine").with(as(author)))
                .andExpect(jsonPath("$.rating").value(3));
    }

    @Test
    void unknownReview() throws Exception {
        assertProblem(update(author, 999_999, "{\"rating\":1}"), 404);
    }

    // --- Authors delete their review ------------------------------------------------------------

    @Test
    void authorDeletes() throws Exception {
        UUID photo = upload(author);
        long id = review(author, "{\"rating\":3,\"photoIds\":[" + photos(photo) + "]}");

        mvc.perform(delete("/api/v1/reviews/" + id).with(as(author))).andExpect(status().isNoContent());

        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews"))
                .andExpect(jsonPath("$.content.length()").value(0));
        mvc.perform(get("/media/" + photo)).andExpect(status().isNotFound());
    }

    @Test
    void anotherUserDeletes() throws Exception {
        long id = review(author, "{\"rating\":3}");

        assertProblem(mvc.perform(delete("/api/v1/reviews/" + id).with(as(other))), 403);
        assertThat(reviewCount()).isOne();
    }

    @Test
    void anonymousDelete() throws Exception {
        long id = review(author, "{\"rating\":3}");

        mvc.perform(delete("/api/v1/reviews/" + id)).andExpect(status().isUnauthorized());
        assertThat(reviewCount()).isOne();
    }

    /** Spec review/site-reviews "API field". */
    @Test
    void authorAvatarUrl() throws Exception {
        create(author, siteId, "{\"text\": \"Nice\"}").andExpect(status().isCreated());
        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews"))
                .andExpect(jsonPath("$.content[0].author.avatarUrl", org.hamcrest.Matchers.nullValue()));

        UUID avatar = upload(author);
        mvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put("/api/v1/users/me")
                        .with(as(author))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"avatarId\": \"" + avatar
                                + "\", \"showDiveLog\": true, \"showStatistics\": true, \"showCertificates\": true}"))
                .andExpect(status().isOk());

        mvc.perform(get("/api/v1/sites/" + siteId + "/reviews"))
                .andExpect(jsonPath("$.content[0].author.avatarUrl").value("/media/" + avatar + "/thumb"));
    }

    private long verifiedCertificate(User user, String agency, String level) {
        long id = certificates
                .declare(user.getId(), new CertificateService.Declaration(agency, level, "N-1", null))
                .id();
        certificates.verify(id);
        return id;
    }

    private org.springframework.test.web.servlet.ResultActions reviews() throws Exception {
        return mvc.perform(get("/api/v1/sites/" + siteId + "/reviews"));
    }

    /** Spec review/site-reviews "A review's author shows a verified badge". */
    @Test
    void verifiedAuthor() throws Exception {
        create(author, siteId, "{\"text\": \"Nice\"}").andExpect(status().isCreated());
        reviews().andExpect(jsonPath("$.content[0].author.verifiedCertificate", org.hamcrest.Matchers.nullValue()));

        verifiedCertificate(author, "PADI", "Advanced Open Water");

        reviews().andExpect(jsonPath("$.content[0].author.verifiedCertificate").value("PADI Advanced Open Water"));
    }

    @Test
    void severalVerified() throws Exception {
        create(author, siteId, "{\"text\": \"Nice\"}").andExpect(status().isCreated());
        verifiedCertificate(author, "PADI", "Open Water");
        verifiedCertificate(author, "SSI", "Rescue");

        reviews().andExpect(jsonPath("$.content[0].author.verifiedCertificate").value("SSI Rescue"));
    }

    @Test
    void unverifiedAuthor() throws Exception {
        create(author, siteId, "{\"text\": \"Nice\"}").andExpect(status().isCreated());
        certificates.declare(author.getId(), new CertificateService.Declaration("PADI", "Pending", "N", null));
        long rejected = certificates
                .declare(author.getId(), new CertificateService.Declaration("PADI", "Refused", "N", null))
                .id();
        certificates.reject(rejected, "Unreadable");

        reviews().andExpect(jsonPath("$.content[0].author.verifiedCertificate", org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void hiddenCertificates() throws Exception {
        create(author, siteId, "{\"text\": \"Nice\"}").andExpect(status().isCreated());
        verifiedCertificate(author, "PADI", "Open Water");
        author.updateProfile(null, null, true, true, false);
        users.save(author);

        reviews().andExpect(jsonPath("$.content[0].author.verifiedCertificate", org.hamcrest.Matchers.nullValue()));
    }

    @Test
    void otherAgency() throws Exception {
        create(author, siteId, "{\"text\": \"Nice\"}").andExpect(status().isCreated());
        verifiedCertificate(author, "OTHER", "Rescue Diver");

        reviews().andExpect(jsonPath("$.content[0].author.verifiedCertificate").value("Rescue Diver"));
    }

    /** Design D4: more authors on a page must not mean more queries. */
    @Test
    void badgesTakeOneQueryForAPage() throws Exception {
        org.hibernate.stat.Statistics statistics =
                entityManagerFactory.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        create(author, siteId, "{\"text\": \"First\"}").andExpect(status().isCreated());
        verifiedCertificate(author, "PADI", "Open Water");
        statistics.clear();
        reviews().andExpect(status().isOk());
        long withOneAuthor = statistics.getPrepareStatementCount();

        for (int i = 0; i < 3; i++) {
            User reviewer = user("Reviewer " + i);
            create(reviewer, siteId, "{\"text\": \"More\"}").andExpect(status().isCreated());
            verifiedCertificate(reviewer, "PADI", "Open Water");
        }
        statistics.clear();
        reviews().andExpect(jsonPath("$.content.length()").value(4));

        assertThat(statistics.getPrepareStatementCount()).isEqualTo(withOneAuthor);
        statistics.setStatisticsEnabled(false);
    }
}
