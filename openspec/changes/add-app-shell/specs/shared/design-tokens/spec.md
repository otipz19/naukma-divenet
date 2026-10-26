# Spec Delta

## Purpose

Keeps the front-end's visual values tied to the design system in `design/`: the
app uses the generated tokens directly, the generated stylesheet never drifts
from its source, and front-end styles use tokens instead of literal values.

## ADDED Requirements

### Requirement: The app uses the repository's design tokens
The web app SHALL load the design tokens from the generated stylesheet in
`design/system/` itself, not from a copy, so a token change in `design/` reaches
the app without editing front-end code.

#### Scenario: Token stylesheet is the design file
- **WHEN** the gate checks the front-end production build
- **THEN** the output stylesheet defines the custom properties of `design/system/tokens.css`, such as `--accent` and `--space-4`

#### Scenario: A redefined token is rejected
- **WHEN** the gate runs and a stylesheet under `frontend/src/` declares `--accent: …`
- **THEN** the tokens-only check fails and names that file and line

### Requirement: A stale token stylesheet fails the gate
The quality gate SHALL fail when `design/system/tokens.css` differs from what the
generator produces from `design/system/tokens.json`, and its message SHALL name
the command that regenerates it. A gate run SHALL never write the file.

#### Scenario: Tokens are current
- **WHEN** the gate runs and `tokens.css` equals the generator output
- **THEN** the tokens check passes

#### Scenario: Tokens are stale
- **WHEN** the gate runs after a value in `tokens.json` changed and `tokens.css` was not regenerated
- **THEN** the tokens check fails
- **AND** its message names `node design/build-tokens.mjs`
- **AND** `tokens.css` is unchanged afterwards

### Requirement: Front-end styles use tokens, not literal values
The quality gate SHALL fail when a stylesheet under `frontend/src/` contains a
literal colour (hex, `rgb()`, `hsl()` or a named colour other than `transparent`
and `currentColor`) or a px length other than `1px` or `2px`. Media query
conditions are exempt, since custom properties cannot be used there. The
failure SHALL name the file and line.

#### Scenario: Tokens only
- **WHEN** the gate runs and every stylesheet uses `var(--…)` values, hairlines of 1–2 px and px values only inside media query conditions
- **THEN** the tokens-only check passes

#### Scenario: Literal colour is rejected
- **WHEN** the gate runs and a stylesheet contains `color: #0b5bb0;`
- **THEN** the tokens-only check fails and names that file and line

#### Scenario: Literal size is rejected
- **WHEN** the gate runs and a stylesheet contains `padding: 12px;`
- **THEN** the tokens-only check fails and names that file and line
