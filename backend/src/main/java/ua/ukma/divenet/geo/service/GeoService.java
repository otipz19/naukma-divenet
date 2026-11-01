package ua.ukma.divenet.geo.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import ua.ukma.divenet.geo.domain.Country;
import ua.ukma.divenet.geo.domain.CountryRepository;

/** Reads the fixed country and region hierarchy (spec geo). */
@Service
public class GeoService {

    private final CountryRepository countries;

    public GeoService(CountryRepository countries) {
        this.countries = countries;
    }

    @Transactional(readOnly = true)
    public List<CountryView> countries() {
        return countries.findAllWithRegions().stream().map(GeoService::view).toList();
    }

    private static CountryView view(Country country) {
        List<RegionView> regions = country.getRegions().stream()
                .map(region -> new RegionView(region.getCode(), region.getName()))
                .toList();
        return new CountryView(country.getCode(), country.getName(), regions);
    }
}
