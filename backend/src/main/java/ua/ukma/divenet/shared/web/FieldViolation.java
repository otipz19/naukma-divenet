package ua.ukma.divenet.shared.web;

/** One entry of the {@code errors} list in a 400 problem detail. */
public record FieldViolation(String field, String message) {}
