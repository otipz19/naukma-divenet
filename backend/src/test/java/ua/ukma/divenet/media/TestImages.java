package ua.ukma.divenet.media;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.ByteBuffer;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.zip.CRC32;
import javax.imageio.ImageIO;

/** Fixture images, generated in memory so the repository holds no binary test files. */
public final class TestImages {

    /** A valid 1×1 lossless WebP; ImageIO cannot write WebP, so this one is a constant. */
    private static final String WEBP_1X1 = "UklGRhoAAABXRUJQVlA4TA0AAAAvAAAAEAcQERGIiP4HAA==";

    private TestImages() {}

    public static byte[] jpeg(int width, int height) {
        return write(opaque(width, height), "jpeg");
    }

    public static byte[] png(int width, int height) {
        return write(opaque(width, height), "png");
    }

    public static byte[] gif(int width, int height) {
        return write(opaque(width, height), "gif");
    }

    public static byte[] webp() {
        return Base64.getDecoder().decode(WEBP_1X1);
    }

    /** Every pixel has alpha 0. */
    public static byte[] transparentPng(int width, int height) {
        return write(new BufferedImage(width, height, BufferedImage.TYPE_INT_ARGB), "png");
    }

    /** A PNG signature and an IHDR that declares the size, with no pixel data at all. */
    public static byte[] pngHeaderOnly(int width, int height) {
        ByteBuffer ihdr = ByteBuffer.allocate(13)
                .putInt(width)
                .putInt(height)
                .put((byte) 8) // bit depth
                .put((byte) 2) // truecolour
                .put((byte) 0)
                .put((byte) 0)
                .put((byte) 0);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        out.writeBytes(new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A});
        chunk(out, "IHDR", ihdr.array());
        chunk(out, "IEND", new byte[0]);
        return out.toByteArray();
    }

    /** Starts with the JPEG signature; the rest is not JPEG. */
    public static byte[] corruptJpeg() {
        byte[] bytes = new byte[2048];
        bytes[0] = (byte) 0xFF;
        bytes[1] = (byte) 0xD8;
        bytes[2] = (byte) 0xFF;
        for (int i = 3; i < bytes.length; i++) {
            bytes[i] = (byte) (i * 31);
        }
        return bytes;
    }

    public static byte[] pdf() {
        return "%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\ntrailer << /Root 1 0 R >>\n%%EOF\n"
                .getBytes(StandardCharsets.US_ASCII);
    }

    /** A valid JPEG padded after its end-of-image marker to exactly {@code size} bytes. */
    public static byte[] jpegOfSize(int size) {
        byte[] image = jpeg(64, 48);
        byte[] padded = new byte[size];
        System.arraycopy(image, 0, padded, 0, image.length);
        return padded;
    }

    public static BufferedImage read(byte[] bytes) {
        try {
            return ImageIO.read(new ByteArrayInputStream(bytes));
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
    }

    private static BufferedImage opaque(int width, int height) {
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        g.setColor(new Color(0x1E6F8C));
        g.fillRect(0, 0, width, height);
        g.setColor(new Color(0xF2C14E));
        g.fillOval(width / 4, height / 4, width / 2, height / 2);
        g.dispose();
        return image;
    }

    private static byte[] write(BufferedImage image, String format) {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            if (!ImageIO.write(image, format, out)) {
                throw new IllegalStateException("No ImageIO writer for " + format);
            }
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return out.toByteArray();
    }

    private static void chunk(ByteArrayOutputStream out, String type, byte[] data) {
        byte[] typeBytes = type.getBytes(StandardCharsets.US_ASCII);
        CRC32 crc = new CRC32();
        crc.update(typeBytes);
        crc.update(data);
        out.writeBytes(ByteBuffer.allocate(4).putInt(data.length).array());
        out.writeBytes(typeBytes);
        out.writeBytes(data);
        out.writeBytes(ByteBuffer.allocate(4).putInt((int) crc.getValue()).array());
    }
}
