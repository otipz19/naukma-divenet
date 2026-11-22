package ua.ukma.divenet.demo.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;
import org.junit.jupiter.api.Test;
import org.springframework.core.io.Resource;
import org.springframework.core.io.support.PathMatchingResourcePatternResolver;
import tools.jackson.databind.json.JsonMapper;
import ua.ukma.divenet.media.service.ImageProcessor;

/** Spec demo/seed, "Seeded post and review pictures are credited photos". */
class DemoPhotosTest {

    private final List<DemoPhotos.Credit> credits =
            DemoPhotos.credits(JsonMapper.builder().build());

    @Test
    void everyPhotoIsCredited() throws IOException {
        List<String> files = Arrays.stream(new PathMatchingResourcePatternResolver()
                        .getResources("classpath:" + DemoPhotos.DIRECTORY + "*.jpg"))
                .map(Resource::getFilename)
                .filter(Objects::nonNull)
                .sorted()
                .toList();
        List<String> credited =
                credits.stream().map(DemoPhotos.Credit::file).sorted().toList();

        assertThat(files).isNotEmpty();
        assertThat(credited).doesNotHaveDuplicates().isEqualTo(files);
        for (DemoPhotos.Credit credit : credits) {
            assertThat(credit.title()).as(credit.file()).isNotBlank();
            assertThat(credit.author()).as(credit.file()).isNotBlank();
            assertThat(credit.source()).as(credit.file()).startsWith("https://commons.wikimedia.org/");
            assertThat(credit.licence()).as(credit.file()).matches("Public domain|CC0|CC BY(-SA)? [0-9.]+");
        }
    }

    @Test
    void theUploadAcceptsEveryPhoto() {
        ImageProcessor processor = new ImageProcessor();
        for (DemoPhotos.Credit credit : credits) {
            byte[] bytes = DemoPhotos.bytes(credit.file());
            assertThat(bytes.length).as(credit.file()).isLessThan(450 * 1024);
            assertThat(processor.process(bytes).contentType()).isEqualTo("image/jpeg");
        }
    }
}
