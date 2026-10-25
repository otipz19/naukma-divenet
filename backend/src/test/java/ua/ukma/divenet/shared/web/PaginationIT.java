package ua.ukma.divenet.shared.web;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;
import java.util.stream.IntStream;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PagedModel;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.TestcontainersConfiguration;

/** Spec shared/pagination. */
@SpringBootTest
@AutoConfigureMockMvc
@Import({TestcontainersConfiguration.class, PaginationIT.ItemsTestController.class})
class PaginationIT {

    private static final String ITEMS = "/api/v1/test-support/items";

    @Autowired
    MockMvc mvc;

    @Test
    void firstPageOfACollection() throws Exception {
        mvc.perform(get(ITEMS).param("page", "0").param("size", "10"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(10))
                .andExpect(jsonPath("$.page.number").value(0))
                .andExpect(jsonPath("$.page.size").value(10))
                .andExpect(jsonPath("$.page.totalElements").value(25))
                .andExpect(jsonPath("$.page.totalPages").value(3));
    }

    @Test
    void sizeOmitted() throws Exception {
        mvc.perform(get(ITEMS))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.size").value(20));
    }

    @Test
    void sizeAboveTheMaximum() throws Exception {
        mvc.perform(get(ITEMS).param("size", "500"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page.size").value(100));
    }

    /** Pages over 25 in-memory items. Nested in a test class, so component scanning never picks it up. */
    @RestController
    static class ItemsTestController {

        private static final List<String> DATA =
                IntStream.rangeClosed(1, 25).mapToObj(i -> "item-" + i).toList();

        @GetMapping(ITEMS)
        PagedModel<String> items(Pageable pageable) {
            int from = (int) Math.min(pageable.getOffset(), DATA.size());
            int to = Math.min(from + pageable.getPageSize(), DATA.size());
            Page<String> page = new PageImpl<>(DATA.subList(from, to), pageable, DATA.size());
            return new PagedModel<>(page);
        }
    }
}
