package ua.ukma.divenet.media.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.atomic.AtomicBoolean;
import java.util.stream.IntStream;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.core.io.Resource;

/** Design D3: the local-disk storage. */
class LocalDiskMediaStorageTest {

    @TempDir
    Path root;

    @Test
    void writesReadsAndDeletes() throws IOException {
        LocalDiskMediaStorage storage = new LocalDiskMediaStorage(root);
        String key = UUID.randomUUID().toString();
        byte[] bytes = {1, 2, 3};

        storage.write(key, bytes);
        Resource resource = storage.read(key).orElseThrow();
        assertThat(resource.getContentAsByteArray()).isEqualTo(bytes);

        storage.delete(key);
        assertThat(storage.read(key)).isEmpty();
        storage.delete(key); // deleting a missing key is not an error
    }

    @Test
    void readOfAnUnknownKeyIsEmpty() {
        assertThat(new LocalDiskMediaStorage(root).read("ab-unknown")).isEmpty();
    }

    @Test
    void storesUnderTheKeysFirstTwoCharacters() {
        LocalDiskMediaStorage storage = new LocalDiskMediaStorage(root);
        String id = "3fa85f64-5717-4562-b3fc-2c963f66afa6";

        storage.write(id, new byte[] {1});
        storage.write(id + ".thumb.jpg", new byte[] {2});

        assertThat(root.resolve("3f").resolve(id)).isRegularFile();
        assertThat(root.resolve("3f").resolve(id + ".thumb.jpg")).isRegularFile();
    }

    @Test
    void refusesKeysThatCouldLeaveTheRoot() {
        LocalDiskMediaStorage storage = new LocalDiskMediaStorage(root);

        assertThatThrownBy(() -> storage.write("../escape", new byte[] {1}))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> storage.read("ab/../../x")).isInstanceOf(IllegalArgumentException.class);
    }

    /** Keys are written once, so the property is that a new key appears complete or not at all. */
    @Test
    void readerNeverSeesAPartialFile() throws Exception {
        LocalDiskMediaStorage storage = new LocalDiskMediaStorage(root);
        List<String> keys = IntStream.range(0, 20).mapToObj(i -> "ab-" + i).toList();
        byte[] bytes = new byte[4 * 1024 * 1024];
        Arrays.fill(bytes, (byte) 7);
        AtomicBoolean writing = new AtomicBoolean(true);

        CompletableFuture<Void> writer = CompletableFuture.runAsync(() -> {
            try {
                keys.forEach(key -> storage.write(key, bytes));
            } finally {
                writing.set(false);
            }
        });
        int reads = 0;
        while (writing.get()) {
            for (String key : keys) {
                var resource = storage.read(key);
                if (resource.isPresent()) {
                    assertThat(resource.get().getContentAsByteArray()).isEqualTo(bytes);
                    reads++;
                }
            }
        }
        writer.join();

        assertThat(reads).isPositive();
        try (Stream<Path> files = Files.list(root.resolve("ab"))) {
            assertThat(files.map(p -> p.getFileName().toString()).sorted().toList())
                    .isEqualTo(keys.stream().sorted().toList());
        }
    }
}
