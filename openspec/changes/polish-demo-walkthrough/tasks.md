# Tasks

## 1. Photo viewer (F-25)

- [ ] 1.1 Add `yet-another-react-lightbox` at an exact version at least two weeks old to `frontend/package.json` and `pnpm-lock.yaml` (owner-approved dependency, design D1). Verify: `pnpm install` succeeds and the build output check passes.
- [ ] 1.2 Add `components/PhotoViewer` (wrapper and `usePhotoViewer`): translated labels, no previous or next for one photo, focus returned to the opener, reduced motion respected. Add `media.viewer.{close,previous,next}` to `en` and `uk`. Vitest `PhotoViewer.test.tsx`: opens at an index, Next, left arrow key, Escape closes and returns focus, single photo has no previous or next, `uk` labels.
- [ ] 1.3 Use it in `ReviewCard.tsx` (thumbnail stays a link, a plain click opens the viewer, a modified click is left to the browser). Vitest in the review card or site page tests: "Photo opens in the viewer", and keep "thumbnail linking to the photo's `url`".
- [ ] 1.4 Use it for post images in `PostPage.tsx` and the certificate photo in `CertificateQueue.tsx`, and remove `target="_blank"`. Vitest: "Post image" (Next moves to the second image; the cover does not open the viewer) and "Certificate photo".
- [ ] 1.5 Design docs: `design/system/components/PhotoViewer/README.md` and an entry in `docs/DESIGN.md`. Verify: `node design/build-tokens.mjs --check` stays green.

## 2. Difficulty as words in the submit form (F-26)

- [ ] 2.1 `SubmitSitePage.tsx`: the Difficulty options are `DIFFICULTY_WORDS` with values `levelsOf(word)[0]` (design D2). Vitest in `SubmitSitePage.test.tsx`: "Difficulty offered as words" (four options, no digits), "A word sends its lowest level" (1, 2, 4, 5). Update the existing successful-submission test that sends `difficulty: 3`.

## 3. The map fits the matching sites (F-27)

- [ ] 3.1 `MapPage` passes a `fitKey` (the search and filter parameters without `sort`), and `SiteClusterLayer` fits the bounds once per new non-empty key with results (`maxZoom` 9, with phone padding for the results sheet; design D3).
- [ ] 3.2 Vitest in `MapPage.test.tsx`, with a spy on `L.Map.prototype.fitBounds`: "Filter narrows the sites", "One matching site" (`maxZoom` passed), "Opened from a shared link", "Filters cleared", "Nothing found" and "No search on first load" (no fit), plus a sort change (no fit).

## 4. Real photos in the demo seed (F-28)

- [ ] 4.1 Build the candidate list of about 20 underwater photos from Wikimedia Commons: reefs, wrecks, caves, sharks, mantas, turtles, divers. Prefer public domain (NOAA or US government), else CC0, CC BY or CC BY-SA. Record the title, Commons page, author, licence and what each shows. **Show the list to the owner and wait for approval before downloading anything.**
- [ ] 4.2 Download the approved files as Commons' 1280 px copies into `backend/src/main/resources/seed/photos/NN-<slug>.jpg`, and write `seed/photos/credits.json` with `{file, title, author, source, licence}`. Verify: every file is at most about 400 KB and the total is under 8 MB.
- [ ] 4.3 `DemoSeeder.Images.photo()`: round-robin over the set for covers, post images and review photos. Avatars keep `DemoImages`. The `cover: "reuse"` value is now ignored, and a comment says so (design D4). Add a back-end unit test `DemoPhotosTest`: files and credits match one to one, and no entry has an empty field ("Every photo is credited").
- [ ] 4.4 Extend `DemoSeederIT`: every published post's cover, every post image and every review photo equals the bytes of a photo in the set ("Pictures come from the photo set"), and at least 15 distinct photos are used ("The set covers the seed"). Keep "Seeded content has images" green.

## 5. Moderation toasts (F-29)

- [ ] 5.1 `ModerationPage.tsx`: show a toast after approve or reject succeeds. Add `site.moderation.toast.{approved,rejected}` to `en` ("{{name}} approved", "{{name}} rejected") and `uk`. Vitest in `ModerationPage.test.tsx`: the toast for Approve and for Reject, the `uk` toast, and no toast on a field error or a 409.
- [ ] 5.2 `CertificateQueue.tsx`: show a toast after verify or reject ("Verified {{certificate}} for {{holder}}", "Rejected {{certificate}} for {{holder}}"), in `en` and `uk`. Vitest: Verify and Reject toasts, and no toast on a 409.
- [ ] 5.3 E2E `admin-moderation.spec.ts`: the approve toast is shown.

## 6. Privacy hint (F-30)

- [ ] 6.1 Replace `user.profile.edit.privacyHint` in `en` ("Choose what other divers see on your profile.") and `uk` ("Оберіть, що інші дайвери бачать у вашому профілі."). Verify: the i18n parity check, and the edit page test still passes.

## 7. Log-in dialog for visitor actions (F-31)

- [ ] 7.1 Add `features/auth/DiverActionLink` and `LoginPromptDialog` on the shared `Dialog`: a plain click by a signed-out visitor opens the dialog, and Log in goes to `/login` with `state.from` set to the action's target (design D6). Add `auth.loginPrompt.{title,login,cancel}` and `auth.loginPrompt.actions.{logDive,review,warning,addSite}` to `en` and `uk`. Vitest `DiverActionLink.test.tsx`: "Visitor presses an action", "Each action names itself", "Cancel" (focus returns), "Signed-in diver" (no dialog), and Log in passing `from`.
- [ ] 7.2 Use it for "Log a dive here" and "Write a review" (`SitePage.tsx`), "Report a warning" (`SiteWarnings.tsx`) and "Add a site" (`MapPage.tsx`). Keep the existing link-target tests green.
- [ ] 7.3 Vitest or route test: "Log in and continue" (after logging in from the dialog opened by "Write a review", the review form is shown), "Add a site after login", and "Direct URL keeps the redirect".
- [ ] 7.4 E2E `anonymous-browse.spec.ts`: a visitor's "Write a review" opens the dialog. Log in, with a seeded diver, then lands on the review form. The accessibility audit includes the open dialog and the open photo viewer.

## 8. Findings, docs and gate

- [ ] 8.1 Set F-25 to F-31 to `done: polish-demo-walkthrough` in `docs/review-findings/README.md` and in each finding file.
- [ ] 8.2 Run `pnpm check` from the repository root. It must pass. The local Feed test flake is handled as the memory note says.
- [ ] 8.3 Update `docs/ROADMAP.md` (`polish-demo-walkthrough` set to `in-progress`, then `archived` at archive) and `docs/HANDOFF.yaml`.

## Workflow follow-up

- Sync the delta specs into `openspec/specs/` and run `openspec validate --all --strict`.
- Archive on `change/polish-demo-walkthrough`, push, and open the PR to `master`. E2E and the accessibility audits run in CI.
