package ua.ukma.divenet.user.service;

import java.time.Clock;
import java.time.temporal.ChronoUnit;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.http.ProblemDetail;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.ErrorResponseException;
import ua.ukma.divenet.shared.web.FieldViolation;
import ua.ukma.divenet.user.domain.LockerItem;
import ua.ukma.divenet.user.domain.LockerItemRepository;
import ua.ukma.divenet.user.domain.UserRepository;

/** Spec user/gear-locker. */
@Service
public class LockerService {

    private static final int MAX_ITEMS = 100;

    private final LockerItemRepository items;
    private final UserRepository users;
    private final Clock clock;

    public LockerService(LockerItemRepository items, UserRepository users, Clock clock) {
        this.items = items;
        this.users = users;
        this.clock = clock;
    }

    public record LockerItemView(long id, String name) {}

    private static ErrorResponseException notFound(String detail) {
        HttpStatus status = HttpStatus.NOT_FOUND;
        return new ErrorResponseException(status, ProblemDetail.forStatusAndDetail(status, detail), null);
    }

    @Transactional(readOnly = true)
    public List<LockerItemView> list(long userId) {
        if (!users.existsById(userId)) {
            throw notFound("User not found.");
        }
        return items.findOrderedByName(userId).stream().map(LockerService::view).toList();
    }

    /** shortcut: concurrent adds can pass the cap by a few, which is harmless (design D3). */
    @Transactional
    public LockerItemView add(long userId, String name) {
        if (items.countByUser_Id(userId) >= MAX_ITEMS) {
            ProblemDetail problem =
                    ProblemDetail.forStatusAndDetail(HttpStatus.BAD_REQUEST, "Invalid request content.");
            problem.setProperty("errors", List.of(new FieldViolation("name", "The locker is full.")));
            throw new ErrorResponseException(HttpStatus.BAD_REQUEST, problem, null);
        }
        LockerItem item = new LockerItem(
                users.getReferenceById(userId), name.strip(), clock.instant().truncatedTo(ChronoUnit.MICROS));
        return view(items.save(item));
    }

    /** Someone else's item answers as if it did not exist (design D3). */
    @Transactional
    public void remove(long id, long userId) {
        items.delete(items.findByIdAndUser_Id(id, userId).orElseThrow(() -> notFound("Locker item not found.")));
    }

    private static LockerItemView view(LockerItem item) {
        return new LockerItemView(item.getId(), item.getName());
    }
}
