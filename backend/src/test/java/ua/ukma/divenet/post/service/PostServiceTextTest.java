package ua.ukma.divenet.post.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class PostServiceTextTest {

    @Test
    void excerptIsOneLine() {
        assertThat(PostService.excerpt(" One\n\ntwo   three ")).isEqualTo("One two three");
    }

    @Test
    void excerptCutsAtAWord() {
        String excerpt = PostService.excerpt("word ".repeat(100));

        assertThat(excerpt).endsWith("word…").hasSizeLessThanOrEqualTo(201);
    }

    @Test
    void excerptCutsAWordWithNoSpaces() {
        assertThat(PostService.excerpt("x".repeat(300))).hasSize(201);
    }

    @Test
    void readingTimeRoundsUpAndIsAtLeastOne() {
        assertThat(PostService.readMinutes("")).isEqualTo(1);
        assertThat(PostService.readMinutes("word ".repeat(200))).isEqualTo(1);
        assertThat(PostService.readMinutes("word ".repeat(201))).isEqualTo(2);
    }
}
