# divelog/log-page

## ADDED Requirements

### Requirement: The header offers to log a new dive

The dive log page's header SHALL offer a Log a dive button that starts a new, empty entry, leaving any edit, and moves focus to the form's first field.

#### Scenario: While editing
- **WHEN** the user is editing a dive and chooses Log a dive in the header
- **THEN** the form is empty, titled "Log a dive", and its site field has focus
