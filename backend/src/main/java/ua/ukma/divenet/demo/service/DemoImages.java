package ua.ukma.divenet.demo.service;

import java.awt.Color;
import java.awt.GradientPaint;
import java.awt.Graphics2D;
import java.awt.Polygon;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.io.UncheckedIOException;
import java.util.Random;
import javax.imageio.ImageIO;

/** Deterministic underwater-coloured JPEGs for the demo content (design D5): no photos in the repository. */
final class DemoImages {

    private DemoImages() {}

    /** The same seed and size always give the same picture. */
    static byte[] jpeg(long seed, int width, int height) {
        Random random = new Random(seed);
        BufferedImage image = new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
        Graphics2D g = image.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            float hue = 0.47f + random.nextFloat() * 0.12f;
            g.setPaint(new GradientPaint(
                    0,
                    0,
                    Color.getHSBColor(hue, 0.55f, 0.85f),
                    0,
                    height,
                    Color.getHSBColor(hue + 0.04f, 0.9f, 0.25f)));
            g.fillRect(0, 0, width, height);
            // Light rays from the surface.
            for (int i = 0; i < 4; i++) {
                int x = random.nextInt(width);
                int spread = width / 10 + random.nextInt(width / 6);
                g.setColor(new Color(255, 255, 255, 18 + random.nextInt(18)));
                g.fillPolygon(new Polygon(
                        new int[] {x - spread / 4, x + spread / 4, x + spread, x - spread / 2},
                        new int[] {0, 0, height, height},
                        4));
            }
            // Bubbles and soft shapes.
            for (int i = 0; i < 14; i++) {
                int size = 4 + random.nextInt(Math.max(5, width / 8));
                g.setColor(new Color(255, 255, 255, 25 + random.nextInt(60)));
                g.fillOval(random.nextInt(width), random.nextInt(height), size, size);
            }
            // A reef along the bottom.
            g.setColor(Color.getHSBColor(0.05f + random.nextFloat() * 0.1f, 0.5f, 0.35f));
            int[] xs = new int[12];
            int[] ys = new int[12];
            for (int i = 0; i < 10; i++) {
                xs[i] = i * width / 9;
                ys[i] = height - height / 8 - random.nextInt(height / 5);
            }
            xs[10] = width;
            ys[10] = height;
            xs[11] = 0;
            ys[11] = height;
            g.fillPolygon(xs, ys, 12);
        } finally {
            g.dispose();
        }
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        try {
            ImageIO.write(image, "jpeg", out);
        } catch (IOException e) {
            throw new UncheckedIOException(e);
        }
        return out.toByteArray();
    }
}
