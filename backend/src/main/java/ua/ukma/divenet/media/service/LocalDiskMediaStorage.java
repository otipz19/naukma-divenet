package ua.ukma.divenet.media.service;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.util.Optional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Component;

/**
 * Stores media under {@code divenet.media.dir}, in a subfolder named after the key's first two
 * characters, so no folder grows past a few hundred files (design D3).
 */
@Component
@ConditionalOnProperty(name = "divenet.media.storage", havingValue = "local", matchIfMissing = true)
public class LocalDiskMediaStorage implements MediaStorage {

    private final Path root;

    public LocalDiskMediaStorage(@Value("${divenet.media.dir}") Path root) {
        this.root = root.toAbsolutePath().normalize();
    }

    @Override
    public void write(String key, byte[] bytes) {
        Path target = path(key);
        try {
            Files.createDirectories(target.getParent());
            // A temporary file in the same folder, then a rename: readers never see a partial file.
            Path temp = Files.createTempFile(target.getParent(), ".upload-", ".tmp");
            try {
                Files.write(temp, bytes);
                Files.move(temp, target, StandardCopyOption.ATOMIC_MOVE, StandardCopyOption.REPLACE_EXISTING);
            } finally {
                Files.deleteIfExists(temp);
            }
        } catch (IOException e) {
            throw new UncheckedIOException("Could not write media " + key, e);
        }
    }

    @Override
    public Optional<Resource> read(String key) {
        Path file = path(key);
        return Files.isRegularFile(file) ? Optional.of(new FileSystemResource(file)) : Optional.empty();
    }

    @Override
    public void delete(String key) {
        try {
            Files.deleteIfExists(path(key));
        } catch (IOException e) {
            throw new UncheckedIOException("Could not delete media " + key, e);
        }
    }

    /** Keys come from UUIDs, but anything that could leave the root is refused all the same. */
    Path path(String key) {
        if (key.length() < 2 || !key.matches("[A-Za-z0-9.-]+") || key.contains("..")) {
            throw new IllegalArgumentException("Invalid media key: " + key);
        }
        return root.resolve(key.substring(0, 2)).resolve(key);
    }
}
