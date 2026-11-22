## ADDED Requirements

### Requirement: The table header spans every column
The dive log table's header row SHALL have a header cell for every column, the Edit and
Delete column included, so the header background runs the full width of the table. The
actions column's header SHALL be hidden from sight and SHALL be read by screen readers
as "Actions" in the active language.

#### Scenario: Header cell over the actions
- **WHEN** the user's own dive log table shows a dive with Edit and Delete
- **THEN** the header row has as many cells as the dive's row
- **AND** the last header cell is a column header named "Actions"
