package ua.ukma.divenet.media.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.nio.charset.StandardCharsets;
import org.junit.jupiter.api.Test;

class VideoSnifferTest {

    private static byte[] ftyp(String brand) {
        return ("\0\0\0\u0018ftyp" + brand + "\0\0\0\0").getBytes(StandardCharsets.ISO_8859_1);
    }

    private static byte[] ebml(String docType) {
        return ("\u001AEß£ B\u0082\u0004" + docType).getBytes(StandardCharsets.ISO_8859_1);
    }

    @Test
    void mp4Brands() {
        assertThat(VideoSniffer.contentType(ftyp("isom"))).hasValue("video/mp4");
        assertThat(VideoSniffer.contentType(ftyp("mp42"))).hasValue("video/mp4");
    }

    @Test
    void quickTimeIsRefused() {
        assertThat(VideoSniffer.contentType(ftyp("qt  "))).isEmpty();
    }

    @Test
    void webm() {
        assertThat(VideoSniffer.contentType(ebml("webm"))).hasValue("video/webm");
    }

    @Test
    void matroskaIsRefused() {
        assertThat(VideoSniffer.contentType(ebml("matroska"))).isEmpty();
    }

    @Test
    void shortAndUnknownFiles() {
        assertThat(VideoSniffer.contentType(new byte[0])).isEmpty();
        assertThat(VideoSniffer.contentType(new byte[] {0x1A, 0x45})).isEmpty();
        assertThat(VideoSniffer.contentType("plain text, not a video".getBytes(StandardCharsets.UTF_8)))
                .isEmpty();
    }
}
