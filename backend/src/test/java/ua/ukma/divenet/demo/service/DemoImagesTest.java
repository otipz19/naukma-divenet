package ua.ukma.divenet.demo.service;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import ua.ukma.divenet.media.service.ImageProcessor;

/** Design D5: generated pictures are deterministic and pass the upload's checks. */
class DemoImagesTest {

    private final ImageProcessor processor = new ImageProcessor();

    @Test
    void sameSeedGivesSameBytes() {
        assertThat(DemoImages.jpeg(7, 640, 480)).isEqualTo(DemoImages.jpeg(7, 640, 480));
        assertThat(DemoImages.jpeg(7, 640, 480)).isNotEqualTo(DemoImages.jpeg(8, 640, 480));
    }

    @Test
    void uploadAcceptsBothSizes() {
        ImageProcessor.ProcessedImage photo = processor.process(DemoImages.jpeg(1, 640, 480));
        assertThat(photo.contentType()).isEqualTo("image/jpeg");
        assertThat(photo.width()).isEqualTo(640);
        ImageProcessor.ProcessedImage avatar = processor.process(DemoImages.jpeg(2, 256, 256));
        assertThat(avatar.height()).isEqualTo(256);
    }
}
