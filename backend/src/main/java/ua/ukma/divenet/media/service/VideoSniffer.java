package ua.ukma.divenet.media.service;

import java.nio.charset.StandardCharsets;
import java.util.Optional;

/** Decides a video's type from its container signature; nothing else in the file is parsed (ADR-0011). */
final class VideoSniffer {

    private static final int WEBM_DOC_TYPE_WINDOW = 64;

    private VideoSniffer() {}

    static Optional<String> contentType(byte[] bytes) {
        if (isMp4(bytes)) {
            return Optional.of("video/mp4");
        }
        return isWebm(bytes) ? Optional.of("video/webm") : Optional.empty();
    }

    /** {@code ftyp} at offset 4. The brand {@code qt} is QuickTime, which browsers do not all play. */
    private static boolean isMp4(byte[] bytes) {
        return bytes.length >= 12
                && text(bytes, 4, 8).equals("ftyp")
                && !text(bytes, 8, 12).equals("qt  ");
    }

    /** The EBML magic, shared with Matroska, and the doc type that tells them apart. */
    private static boolean isWebm(byte[] bytes) {
        return bytes.length >= 4
                && bytes[0] == 0x1A
                && bytes[1] == 0x45
                && bytes[2] == (byte) 0xDF
                && bytes[3] == (byte) 0xA3
                && text(bytes, 4, Math.min(bytes.length, WEBM_DOC_TYPE_WINDOW)).contains("webm");
    }

    private static String text(byte[] bytes, int from, int to) {
        return new String(bytes, from, to - from, StandardCharsets.ISO_8859_1);
    }
}
