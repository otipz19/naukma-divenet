# Spec Delta

## Purpose

Defines how paged collection endpoints accept page parameters and shape their
responses, so every list in the API pages the same way.

## ADDED Requirements

### Requirement: Paged responses use one envelope
A paged collection endpoint SHALL return a body of the form
`{ "content": [...], "page": { "number", "size", "totalElements", "totalPages" } }`,
with `number` zero-based.

#### Scenario: First page of a collection
- **WHEN** a client requests a paged collection of 25 items with `?page=0&size=10`
- **THEN** `content` holds 10 items
- **AND** `page` is `{ "number": 0, "size": 10, "totalElements": 25, "totalPages": 3 }`

### Requirement: Page size has a default and a maximum
When `size` is omitted, a paged endpoint SHALL use a page size of 20. A
requested `size` above 100 SHALL be capped at 100.

#### Scenario: Size omitted
- **WHEN** a client requests a paged collection without `size`
- **THEN** `page.size` is 20

#### Scenario: Size above the maximum
- **WHEN** a client requests a paged collection with `?size=500`
- **THEN** `page.size` is 100
