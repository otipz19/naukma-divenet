# shared/app-shell

## ADDED Requirements

### Requirement: Controls are large enough to touch on phones

Below `bp-md`, buttons, chips and icon buttons SHALL be at least `--touch-target` (44 px) tall, and icon buttons at least as wide, as the design's accessibility rule asks.

#### Scenario: Shared controls
- **WHEN** the stylesheets of the Button and Chip components are checked
- **THEN** each sets a minimum height of `var(--touch-target)` below `bp-md`

#### Scenario: Token
- **WHEN** the generated tokens are read
- **THEN** `--touch-target` is 44 px
