package ua.ukma.divenet.post.web;

import static org.assertj.core.api.Assertions.assertThat;

import com.jayway.jsonpath.JsonPath;
import java.net.http.HttpResponse;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import ua.ukma.divenet.media.web.VideoTestBase;

/** Spec post/posts, "A post takes videos". */
class PostVideoApiIT extends VideoTestBase {

    private static String body(String... videoIds) {
        String ids = Stream.of(videoIds).map(id -> "\"" + id + "\"").collect(Collectors.joining(","));
        return "{\"title\": \"T\", \"text\": \"Text\", \"status\": \"PUBLISHED\", \"videoIds\": [" + ids + "]}";
    }

    private HttpResponse<String> create(String... videoIds) throws Exception {
        return send("POST", "/api/v1/posts", token, body(videoIds));
    }

    private static long id(HttpResponse<String> response) {
        assertThat(response.statusCode()).isEqualTo(201);
        return ((Number) JsonPath.read(response.body(), "$.id")).longValue();
    }

    private void refused(HttpResponse<String> response) {
        assertThat(response.statusCode()).isEqualTo(400);
        assertThat(JsonPath.<String>read(response.body(), "$.errors[0].field")).isEqualTo("videoIds");
    }

    @Test
    void creatingWithAVideo() throws Exception {
        String video = video(token);

        HttpResponse<String> response = create(video);

        assertThat(response.statusCode()).isEqualTo(201);
        assertThat(JsonPath.<String>read(response.body(), "$.videos[0].id")).isEqualTo(video);
        assertThat(JsonPath.<String>read(response.body(), "$.videos[0].url")).isEqualTo("/media/" + video);
        assertThat(JsonPath.<String>read(response.body(), "$.videos[0].contentType"))
                .isEqualTo("video/mp4");
    }

    @Test
    void tooMany() throws Exception {
        refused(create(video(token), video(token), video(token), video(token)));
    }

    @Test
    void someoneElsesVideo() throws Exception {
        refused(create(video(newToken())));
    }

    @Test
    void removingOnEdit() throws Exception {
        String kept = video(token);
        String removed = video(token);
        long id = id(create(kept, removed));

        HttpResponse<String> response = send("PUT", "/api/v1/posts/" + id, token, body(kept));

        assertThat(response.statusCode()).isEqualTo(200);
        assertThat(JsonPath.<List<String>>read(response.body(), "$.videos[*].id"))
                .containsExactly(kept);
        assertThat(fetch("/media/" + kept).statusCode()).isEqualTo(200);
        assertThat(fetch("/media/" + removed).statusCode()).isEqualTo(404);
    }

    @Test
    void deletingThePost() throws Exception {
        String video = video(token);
        long id = id(create(video));

        assertThat(send("DELETE", "/api/v1/posts/" + id, token, null).statusCode())
                .isEqualTo(204);

        assertThat(fetch("/media/" + video).statusCode()).isEqualTo(404);
    }

    @Test
    void lists() throws Exception {
        id(create(video(token)));

        String feed = new String(fetch("/api/v1/posts").body());

        assertThat(JsonPath.<Map<String, Object>>read(feed, "$.content[0]")).doesNotContainKey("videos");
    }
}
