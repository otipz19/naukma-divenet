package ua.ukma.divenet.media.service;

import java.awt.Color;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Iterator;
import javax.imageio.IIOImage;
import javax.imageio.ImageIO;
import javax.imageio.ImageReadParam;
import javax.imageio.ImageReader;
import javax.imageio.ImageWriteParam;
import javax.imageio.ImageWriter;
import javax.imageio.stream.ImageInputStream;
import javax.imageio.stream.ImageOutputStream;
import org.springframework.stereotype.Component;
import ua.ukma.divenet.media.service.MediaExceptions.InvalidImageException;
import ua.ukma.divenet.media.service.MediaExceptions.UnsupportedImageException;

/**
 * Checks an upload and makes its thumbnail (design D4). The type comes from the file's first bytes,
 * the size from the header, and pixels are decoded subsampled, so memory stays small for any upload.
 */
@Component
public class ImageProcessor {

    public static final long MAX_PIXELS = 50_000_000;
    public static final int THUMBNAIL_SIZE = 640;
    private static final float THUMBNAIL_QUALITY = 0.85f;

    /** The checked upload: its type and size, and the JPEG thumbnail. */
    public record ProcessedImage(String contentType, int width, int height, byte[] thumbnail) {}

    private enum Format {
        JPEG("image/jpeg", "jpeg"),
        PNG("image/png", "png"),
        WEBP("image/webp", "webp");

        final String contentType;
        final String readerName;

        Format(String contentType, String readerName) {
            this.contentType = contentType;
            this.readerName = readerName;
        }
    }

    public ProcessedImage process(byte[] bytes) {
        Format format = detect(bytes);
        ImageReader reader = reader(format);
        try (ImageInputStream input = ImageIO.createImageInputStream(new ByteArrayInputStream(bytes))) {
            reader.setInput(input, true, true);
            int width;
            int height;
            try {
                width = reader.getWidth(0);
                height = reader.getHeight(0);
            } catch (IOException | RuntimeException e) {
                throw unreadable();
            }
            if (width <= 0 || height <= 0) {
                throw unreadable();
            }
            if ((long) width * height > MAX_PIXELS) {
                throw new InvalidImageException("The image has more than 50 million pixels.");
            }
            BufferedImage decoded;
            try {
                ImageReadParam param = reader.getDefaultReadParam();
                int step = Math.max(1, Math.max(width, height) / (2 * THUMBNAIL_SIZE));
                param.setSourceSubsampling(step, step, 0, 0);
                decoded = reader.read(0, param);
            } catch (IOException | RuntimeException e) {
                throw unreadable();
            }
            return new ProcessedImage(format.contentType, width, height, thumbnail(decoded, width, height));
        } catch (IOException e) {
            throw unreadable();
        } finally {
            reader.dispose();
        }
    }

    private static Format detect(byte[] b) {
        if (b.length >= 3 && (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF) {
            return Format.JPEG;
        }
        if (startsWith(b, 0, new byte[] {(byte) 0x89, 'P', 'N', 'G', 0x0D, 0x0A, 0x1A, 0x0A})) {
            return Format.PNG;
        }
        if (startsWith(b, 0, new byte[] {'R', 'I', 'F', 'F'}) && startsWith(b, 8, new byte[] {'W', 'E', 'B', 'P'})) {
            return Format.WEBP;
        }
        throw new UnsupportedImageException();
    }

    private static boolean startsWith(byte[] bytes, int offset, byte[] prefix) {
        if (bytes.length < offset + prefix.length) {
            return false;
        }
        for (int i = 0; i < prefix.length; i++) {
            if (bytes[offset + i] != prefix[i]) {
                return false;
            }
        }
        return true;
    }

    private static ImageReader reader(Format format) {
        Iterator<ImageReader> readers = ImageIO.getImageReadersByFormatName(format.readerName);
        if (!readers.hasNext()) {
            throw new IllegalStateException("No ImageIO reader for " + format.readerName);
        }
        return readers.next();
    }

    /** Longer side {@code min(640, longer side)}, bicubic, on white, JPEG at quality 0.85. */
    private static byte[] thumbnail(BufferedImage source, int width, int height) {
        double scale = Math.min(1.0, (double) THUMBNAIL_SIZE / Math.max(width, height));
        int targetWidth = Math.max(1, (int) Math.round(width * scale));
        int targetHeight = Math.max(1, (int) Math.round(height * scale));
        BufferedImage target = new BufferedImage(targetWidth, targetHeight, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = target.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BICUBIC);
            g.setRenderingHint(RenderingHints.KEY_RENDERING, RenderingHints.VALUE_RENDER_QUALITY);
            g.setColor(Color.WHITE);
            g.fillRect(0, 0, targetWidth, targetHeight);
            g.drawImage(source, 0, 0, targetWidth, targetHeight, null);
        } finally {
            g.dispose();
        }
        return jpeg(target);
    }

    private static byte[] jpeg(BufferedImage image) {
        ImageWriter writer = ImageIO.getImageWritersByFormatName("jpeg").next();
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try (ImageOutputStream output = ImageIO.createImageOutputStream(out)) {
            writer.setOutput(output);
            ImageWriteParam param = writer.getDefaultWriteParam();
            param.setCompressionMode(ImageWriteParam.MODE_EXPLICIT);
            param.setCompressionQuality(THUMBNAIL_QUALITY);
            writer.write(null, new IIOImage(image, null, null), param);
        } catch (IOException e) {
            throw new UncheckedIOException("Could not write a thumbnail", e);
        } finally {
            writer.dispose();
        }
        return out.toByteArray();
    }

    private static InvalidImageException unreadable() {
        return new InvalidImageException("The image cannot be read.");
    }
}
