package ua.ukma.divenet.review.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import jakarta.persistence.EntityManagerFactory;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import ua.ukma.divenet.media.web.VideoTestBase;

/** Spec review/reviews, "A review takes videos". */
class ReviewVideoApiIT extends VideoTestBase {

    @Autowired
    EntityManagerFactory entityManagerFactory;

    long siteId;

    @BeforeEach
    void createSite() {
        siteId = site();
    }

    private HttpResponse<String> create(String accessToken, String... videoIds) throws Exception {
        return send("POST", "/api/v1/sites/" + siteId + "/reviews", accessToken, body(videoIds));
    }

    private static String body(String... videoIds) {
        String ids = Stream.of(videoIds).map(id -> "\"" + id + "\"").collect(Collectors.joining(","));
        return "{\"rating\": 5, \"videoIds\": [" + ids + "]}";
    }

    private static long id(HttpResponse<String> response) {
        assertThat(response.statusCode()).isEqualTo(201);
        return ((Number) JsonPath.read(response.body(), "$.id")).longValue();
    }

    private void refused(HttpResponse<String> response, String field) {
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(JsonPath.<String>read(response.body(), "$.errors[0].field")).isEqualTo(field);
    }

    @Test
    void creatingWithAVideo() throws Exception {
        String video = video(token);

        HttpResponse<String> response = create(token, video);

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(JsonPath.<String>read(response.body(), "$.videos[0].id")).isEqualTo(video);
        assertThat(JsonPath.<String>read(response.body(), "$.videos[0].url")).isEqualTo("/media/" + video);
        assertThat(JsonPath.<String>read(response.body(), "$.videos[0].contentType"))
                .isEqualTo("video/mp4");
    }

    @Test
    void tooMany() throws Exception {
        refused(create(token, video(token), video(token), video(token), video(token)), "videoIds");
    }

    @Test
    void someoneElsesVideo() throws Exception {
        refused(create(token, video(newToken())), "videoIds");
    }

    @Test
    void aVideoAlone() throws Exception {
        HttpResponse<String> response = send(
                "POST", "/api/v1/sites/" + siteId + "/reviews", token, "{\"videoIds\": [\"" + video(token) + "\"]}");

        refused(response, "text");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM reviews", Long.class))
                .isZero();
    }

    @Test
    void removingOnEdit() throws Exception {
        String kept = video(token);
        String removed = video(token);
        long id = id(create(token, kept, removed));

        HttpResponse<String> response = send("PUT", "/api/v1/reviews/" + id, token, body(kept));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(JsonPath.<List<String>>read(response.body(), "$.videos[*].id"))
                .containsExactly(kept);
        assertThat(fetch("/media/" + kept).statusCode()).isEqualTo(200);
        assertThat(fetch("/media/" + removed).statusCode()).isEqualTo(404);
    }

    @Test
    void deletingTheReview() throws Exception {
        String video = video(token);
        long id = id(create(token, video));

        assertThat(send("DELETE", "/api/v1/reviews/" + id, token, null).statusCode())
                .isEqualTo(204);

        assertThat(fetch("/media/" + video).statusCode()).isEqualTo(404);
    }

    @Test
    void queryCount() throws Exception {
        org.hibernate.stat.Statistics statistics =
                entityManagerFactory.unwrap(org.hibernate.SessionFactory.class).getStatistics();
        statistics.setStatisticsEnabled(true);
        id(create(token, video(token)));
        statistics.clear();
        fetch("/api/v1/sites/" + siteId + "/reviews");
        long withOne = statistics.getPrepareStatementCount();

        for (int i = 0; i < 3; i++) {
            String other = newToken();
            id(create(other, video(other)));
        }
        statistics.clear();
        HttpResponse<byte[]> page = fetch("/api/v1/sites/" + siteId + "/reviews");

        assertThat(JsonPath.<List<?>>read(new String(page.body()), "$.content")).hasSize(4);
        assertThat(statistics.getPrepareStatementCount()).isEqualTo(withOne);
        statistics.setStatisticsEnabled(false);
    }
}
