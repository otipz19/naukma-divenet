# Spec Delta

## ADDED Requirements

### Requirement: The profile page shows certificates
The profile page SHALL show the diver's certificates with their agency, level and status badge, unless `showCertificates` is false and the visitor is neither the owner nor an admin. In that case it SHALL show a notice and SHALL NOT request them. The owner SHALL see a link to `/profile/certificates`.

#### Scenario: Shown
- **WHEN** a visitor opens a profile with a verified and a pending certificate
- **THEN** both show, with "Verified" and "Pending verification"

#### Scenario: Hidden
- **WHEN** another visitor opens a profile with `showCertificates` false
- **THEN** the page shows the hidden-certificates notice of the active language, and makes no request for them

#### Scenario: Owner
- **WHEN** the owner opens their profile
- **THEN** they see their certificates and the link, even with `showCertificates` false

#### Scenario: Admin
- **WHEN** an admin opens a profile with `showCertificates` false
- **THEN** they see the certificates

#### Scenario: No certificates
- **WHEN** another visitor opens a profile with no certificates
- **THEN** no Certificates section is shown
