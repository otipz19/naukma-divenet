package ua.ukma.divenet.user.domain;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface LockerItemRepository extends JpaRepository<LockerItem, Long> {

    @Query("select i from LockerItem i where i.user.id = :userId order by lower(i.name), i.id")
    List<LockerItem> findOrderedByName(long userId);

    long countByUser_Id(long userId);

    Optional<LockerItem> findByIdAndUser_Id(long id, long userId);
}
