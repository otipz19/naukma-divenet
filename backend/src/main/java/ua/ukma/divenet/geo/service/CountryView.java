package ua.ukma.divenet.geo.service;

import java.util.List;

public record CountryView(String code, String name, List<RegionView> regions) {}
