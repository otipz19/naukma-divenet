package ua.ukma.divenet.site.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.site.service.GearCatalogService;

/** Spec site/gear-catalog: every gear item. */
@RestController
@RequestMapping("/api/v1/gear-items")
class GearItemController {

    private final GearCatalogService gearCatalogService;

    GearItemController(GearCatalogService gearCatalogService) {
        this.gearCatalogService = gearCatalogService;
    }

    @GetMapping
    List<GearItemResponse> gearItems() {
        return gearCatalogService.gearItems().stream()
                .map(item -> new GearItemResponse(item.code(), item.name()))
                .toList();
    }

    /** Every property is always present, so the generated front-end types are not optional. */
    @Schema(requiredProperties = {"code", "name"})
    record GearItemResponse(String code, String name) {}
}
