package ua.ukma.divenet.geo.web;

import io.swagger.v3.oas.annotations.media.Schema;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import ua.ukma.divenet.geo.service.CountryView;
import ua.ukma.divenet.geo.service.GeoService;

/** Spec geo: every country with its regions. */
@RestController
@RequestMapping("/api/v1/countries")
class CountryController {

    private final GeoService geoService;

    CountryController(GeoService geoService) {
        this.geoService = geoService;
    }

    @GetMapping
    List<CountryResponse> countries() {
        return geoService.countries().stream().map(CountryResponse::of).toList();
    }

    /** Every property is always present, so the generated front-end types are not optional. */
    @Schema(requiredProperties = {"code", "name"})
    record RegionResponse(String code, String name) {}

    @Schema(requiredProperties = {"code", "name", "regions"})
    record CountryResponse(String code, String name, List<RegionResponse> regions) {

        static CountryResponse of(CountryView country) {
            List<RegionResponse> regions = country.regions().stream()
                    .map(region -> new RegionResponse(region.code(), region.name()))
                    .toList();
            return new CountryResponse(country.code(), country.name(), regions);
        }
    }
}
