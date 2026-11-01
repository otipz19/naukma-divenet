# Tasks

## 1. Back-end

- [ ] 1.1 Add `V13__create_certificates.sql` and the `user.domain` entity and repository (design D1); verify with `DatabaseBaselineIT` and the `ddl-auto=validate` startup.
- [ ] 1.2 Add `CertificateService` writes and reads with privacy, and the controller (design D3, D5). Add `CertificateApiIT` covering every server scenario of spec `user/certificates`; verify it and `LayeredArchitectureTest` pass.
- [ ] 1.3 Add the admin queue, verify and reject (design D2). Add `CertificateVerificationApiIT` covering every server scenario of spec `user/certificate-verification`; verify it passes.
- [ ] 1.4 Add `verifiedBadges` and the review author's `verifiedCertificate` (design D4). Cover the API scenarios of the `review/site-reviews` delta, and assert one query for a page, in the review API tests; verify they pass.
- [ ] 1.5 Regenerate `api/openapi.json` and `frontend/src/api/schema.gen.ts`; verify with `ApiContractTest` and `api:types:check`.

## 2. Diver pages

- [ ] 2.1 Add `CertificatesPage` with `en` and `uk` strings. Add Vitest tests with MSW covering every page scenario of spec `user/certificates`; verify they pass.
- [ ] 2.2 Add `ProfileCertificates` to `ProfilePage`. Add Vitest tests covering every scenario of the `user/profile` delta, asserting that a hidden section makes no request; verify they and the existing profile tests pass.
- [ ] 2.3 Show the badge in `ReviewCard`. Add Vitest tests covering "Verified author" and "Unverified author"; verify they and the existing review tests pass.

## 3. Moderation

- [ ] 3.1 Split `ModerationPage` into tabs, and add `CertificateQueue` with `en` and `uk` strings. Add Vitest tests with MSW covering the page scenarios of spec `user/certificate-verification` and the `site/moderation` delta; verify they and the existing moderation tests pass.

## 4. Integration

- [ ] 4.1 Update `docs/ARCHITECTURE.md` (existing tables, and the certificate privacy rule); verify against design D1 and D3.
- [ ] 4.2 On the running stack, in a browser at 1280 px and 375 px, in `en` and `uk` and both themes, with real clicks where the page allows: declare a certificate with a photo as a test user, verify it as the demo admin, reject another, check the badge on a review, the owner's page and an anonymous profile, and turn off `showCertificates`. Fix any gaps; verify with screenshots.
- [ ] 4.3 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [ ] 4.4 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/add-certificates/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/add-certificates` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
