# shared/i18n Specification

## Purpose
Keeps the whole UI available in English and Ukrainian: which locales exist, which
one a visitor gets, and the checks that stop untranslated or hard-coded text.

## Requirements

### Requirement: The UI supports English and Ukrainian
The UI SHALL support exactly the locales `en` and `uk`. `en` SHALL be the default
and the fallback: a key missing from the active locale shows its `en` text.

#### Scenario: Ukrainian text is shown
- **WHEN** the active locale is `uk`
- **THEN** the home page shows the `uk` text of its strings

#### Scenario: Missing key falls back to English
- **WHEN** the active locale is `uk` and a key exists only in `en`
- **THEN** the `en` text of that key is shown

### Requirement: The initial language follows the saved choice or the browser
On start, the app SHALL use the saved language choice if it is a supported locale.
Otherwise it SHALL use `uk` when the browser's preferred language is Ukrainian,
and `en` in every other case.

#### Scenario: Saved choice wins
- **WHEN** the saved choice is `uk` and the browser prefers English
- **THEN** the active locale is `uk`

#### Scenario: Ukrainian browser
- **WHEN** there is no saved choice and the browser's preferred language is `uk-UA`
- **THEN** the active locale is `uk`

#### Scenario: Other browser language
- **WHEN** there is no saved choice and the browser's preferred language is `de-DE`
- **THEN** the active locale is `en`

#### Scenario: Unsupported saved choice is ignored
- **WHEN** the saved choice is `fr` and the browser prefers English
- **THEN** the active locale is `en`

### Requirement: A language change is saved and reflected in the document
When the active language changes, the app SHALL save the new choice for later
visits and SHALL set the `lang` attribute of the `<html>` element to the active locale.

#### Scenario: Change language
- **WHEN** the active language changes from `en` to `uk`
- **THEN** the saved choice is `uk`
- **AND** the `<html>` element has `lang="uk"`

#### Scenario: Language on start
- **WHEN** the app starts with active locale `en`
- **THEN** the `<html>` element has `lang="en"`

### Requirement: Both locale files have the same keys
The quality gate SHALL fail when a translation key exists in one locale file but
not the other, and its message SHALL name each missing key and the file it is missing from.

#### Scenario: Locales match
- **WHEN** the gate runs and `en` and `uk` contain the same set of keys
- **THEN** the parity check passes

#### Scenario: Key missing in Ukrainian
- **WHEN** the gate runs and the key `home.title` exists in `en` but not in `uk`
- **THEN** the parity check fails
- **AND** its message names `home.title` and the `uk` file

#### Scenario: Empty translation counts as missing
- **WHEN** the gate runs and a key's value in `uk` is an empty string
- **THEN** the parity check fails and names that key

### Requirement: User-visible text is never hard-coded
The quality gate SHALL fail when application source renders a literal text string
in JSX instead of a translated string. Tests are exempt.

#### Scenario: Literal JSX text is rejected
- **WHEN** the gate runs and an application component contains `<p>Hello</p>`
- **THEN** the lint step fails and names the file and line

#### Scenario: Translated text is accepted
- **WHEN** the gate runs and the component renders `{t("home.title")}`
- **THEN** the lint step passes for that line
