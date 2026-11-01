package ua.ukma.divenet.media.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.awt.image.BufferedImage;
import org.junit.jupiter.api.Test;
import ua.ukma.divenet.media.TestImages;
import ua.ukma.divenet.media.service.ImageProcessor.ProcessedImage;
import ua.ukma.divenet.media.service.MediaExceptions.InvalidImageException;
import ua.ukma.divenet.media.service.MediaExceptions.UnsupportedImageException;

/** Spec media/uploads: type detection, size limits and thumbnails (design D4). */
class ImageProcessorTest {

    private final ImageProcessor processor = new ImageProcessor();

    @Test
    void jpegUpload() {
        ProcessedImage image = processor.process(TestImages.jpeg(1200, 800));

        assertThat(image.contentType()).isEqualTo("image/jpeg");
        assertThat(image.width()).isEqualTo(1200);
        assertThat(image.height()).isEqualTo(800);
    }

    @Test
    void pngAndWebpUploads() {
        assertThat(processor.process(TestImages.png(40, 30)).contentType()).isEqualTo("image/png");

        ProcessedImage webp = processor.process(TestImages.webp());
        assertThat(webp.contentType()).isEqualTo("image/webp");
        assertThat(webp.width()).isEqualTo(1);
        assertThat(webp.height()).isEqualTo(1);
    }

    @Test
    void gif() {
        assertThatThrownBy(() -> processor.process(TestImages.gif(40, 30)))
                .isInstanceOf(UnsupportedImageException.class);
    }

    @Test
    void otherFileTypeWithAnImageName() {
        // The processor never sees a name or declared type; only the bytes decide.
        assertThatThrownBy(() -> processor.process(TestImages.pdf())).isInstanceOf(UnsupportedImageException.class);
    }

    @Test
    void imageSentWithAWrongContentType() {
        assertThat(processor.process(TestImages.png(40, 30)).contentType()).isEqualTo("image/png");
    }

    @Test
    void emptyFileIsUnsupported() {
        assertThatThrownBy(() -> processor.process(new byte[0])).isInstanceOf(UnsupportedImageException.class);
    }

    @Test
    void corruptImage() {
        assertThatThrownBy(() -> processor.process(TestImages.corruptJpeg())).isInstanceOf(InvalidImageException.class);
    }

    @Test
    void tooManyPixels() {
        // The file has no pixel data, so a decode would fail differently: the header alone decides.
        assertThatThrownBy(() -> processor.process(TestImages.pngHeaderOnly(10000, 6000)))
                .isInstanceOf(InvalidImageException.class)
                .hasMessageContaining("50 million pixels");
    }

    @Test
    void largeImageIsScaledDown() {
        BufferedImage thumbnail =
                TestImages.read(processor.process(TestImages.jpeg(1200, 800)).thumbnail());

        assertThat(thumbnail.getWidth()).isEqualTo(640);
        assertThat(thumbnail.getHeight()).isEqualTo(427);
    }

    @Test
    void portraitImageIsScaledByItsLongerSide() {
        BufferedImage thumbnail =
                TestImages.read(processor.process(TestImages.png(800, 1600)).thumbnail());

        assertThat(thumbnail.getWidth()).isEqualTo(320);
        assertThat(thumbnail.getHeight()).isEqualTo(640);
    }

    @Test
    void smallImageIsNotEnlarged() {
        BufferedImage thumbnail =
                TestImages.read(processor.process(TestImages.jpeg(300, 200)).thumbnail());

        assertThat(thumbnail.getWidth()).isEqualTo(300);
        assertThat(thumbnail.getHeight()).isEqualTo(200);
    }

    @Test
    void transparentPng() {
        BufferedImage thumbnail = TestImages.read(
                processor.process(TestImages.transparentPng(64, 48)).thumbnail());

        for (int y = 0; y < thumbnail.getHeight(); y++) {
            for (int x = 0; x < thumbnail.getWidth(); x++) {
                int rgb = thumbnail.getRGB(x, y);
                int darkest = Math.min((rgb >> 16) & 0xFF, Math.min((rgb >> 8) & 0xFF, rgb & 0xFF));
                assertThat(darkest).as("pixel %d,%d", x, y).isGreaterThanOrEqualTo(250);
            }
        }
    }

    @Test
    void thumbnailIsAJpeg() {
        byte[] thumbnail = processor.process(TestImages.png(40, 30)).thumbnail();

        assertThat(processor.process(thumbnail).contentType()).isEqualTo("image/jpeg");
    }
}
