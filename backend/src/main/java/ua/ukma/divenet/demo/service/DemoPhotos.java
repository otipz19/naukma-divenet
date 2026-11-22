package ua.ukma.divenet.demo.service;

import java.io.IOException;
import java.io.InputStream;
import java.io.UncheckedIOException;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import tools.jackson.databind.json.JsonMapper;

/**
 * The credited underwater photographs of the demo seed (spec demo/seed, design D4): the files in
 * {@code seed/photos/} and one {@code credits.json} entry for each.
 */
final class DemoPhotos {

    static final String DIRECTORY = "seed/photos/";
    static final String CREDITS = DIRECTORY + "credits.json";

    /** One photo's credit: its file in the set, and the title, author, source page and licence. */
    record Credit(String file, String title, String author, String source, String licence) {}

    private DemoPhotos() {}

    static List<Credit> credits(JsonMapper jsonMapper) {
        try (InputStream in = new ClassPathResource(CREDITS).getInputStream()) {
            return List.of(jsonMapper.readValue(in, Credit[].class));
        } catch (IOException e) {
            throw new UncheckedIOException("The demo photo credits cannot be read", e);
        }
    }

    /** The bytes of each credited photo, in the credits' order. */
    static List<byte[]> load(JsonMapper jsonMapper) {
        return credits(jsonMapper).stream().map(credit -> bytes(credit.file())).toList();
    }

    static byte[] bytes(String file) {
        try (InputStream in = new ClassPathResource(DIRECTORY + file).getInputStream()) {
            return in.readAllBytes();
        } catch (IOException e) {
            throw new UncheckedIOException("The demo photo " + file + " cannot be read", e);
        }
    }
}
