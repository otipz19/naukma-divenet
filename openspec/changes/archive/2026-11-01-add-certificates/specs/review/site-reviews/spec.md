# Spec Delta

## ADDED Requirements

### Requirement: A review's author shows a verified badge
A review's `author` in the API SHALL carry `verifiedCertificate`, the agency and level of the author's most recently verified certificate, or null. It SHALL be null when the author's `showCertificates` is false. The review card SHALL show it as a success badge.

#### Scenario: Verified author
- **WHEN** a review's author has a verified PADI "Advanced Open Water" certificate
- **THEN** `author.verifiedCertificate` is "PADI Advanced Open Water", and the card shows "Verified PADI Advanced Open Water"

#### Scenario: Several verified
- **WHEN** the author has two verified certificates
- **THEN** the one verified last is shown

#### Scenario: Unverified author
- **WHEN** the author has only pending or rejected certificates
- **THEN** the field is null, and the card shows no badge

#### Scenario: Hidden certificates
- **WHEN** the author has a verified certificate and `showCertificates` false
- **THEN** the field is null

#### Scenario: Other agency
- **WHEN** the verified certificate's agency is `OTHER` and its level is "Rescue Diver"
- **THEN** the field is "Rescue Diver"
