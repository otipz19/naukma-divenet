package ua.ukma.divenet.user.domain;

import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {

    /** {@code email} must already be lower case. */
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);
}
