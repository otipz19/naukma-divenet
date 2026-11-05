## 0. Plan updates

- [x] 0.1 Absorb `docs/plan-updates/complete-demo-seed/add-achievements--award-seeded-users.md`: add "seeded users have their achievements" to the roadmap row's Delivers, and delete the note.

## 1. Seeder

- [x] 1.1 Add `@Order(1)` to `SiteDemoSeeder`. Create `ua.ukma.divenet.demo.service.DemoImages`, which draws a deterministic JPEG (design D5). Unit test `DemoImagesTest`: the same seed gives the same bytes, and `ImageProcessor` accepts the output at both sizes.
- [x] 1.2 Create `DemoSeeder` (`@Profile("demo")`, `@Order(2)`, design D1–D3, D6). It reads `seed/demo.json` into records. It skips when the first diver's email exists. Otherwise it seeds every diver in one transaction through the services, failing with the name of an unknown site, and after the commit evaluates each diver's achievements. The work goes in a package-private `seed(DemoSeed)`, so a test can pass a broken seed.
- [x] 1.3 Write `backend/src/main/resources/seed/demo.json`:
  - 8 divers, with English and Ukrainian names and bios, and privacy settings that vary;
  - certificates: verified, pending and one rejected;
  - at least 60 dives over 2 years, across at least 5 countries, one of them deeper than 40 m;
  - at least 30 reviews on popular sites, some with photos;
  - 6 warnings covering all four types;
  - 10 published posts and 2 drafts, with regions and sites;
  - submissions: 1 approved, 2 pending and 1 rejected;
  - locker items.

  Every value follows the services' rules.
- [x] 1.4 Integration test `DemoSeederIT` (demo profile, Testcontainers), one test per scenario of `demo/seed`:
  - an empty database gets the counts, the logins and both moderation queues;
  - ratings match the reviews;
  - the images are served;
  - a context without the profile has no demo diver;
  - a rerun changes nothing;
  - a seed naming a missing site fails, names the site and creates none of its divers;
  - the awards are there.

## 2. Docs

- [x] 2.1 README "Running the app": list the demo divers' emails and the shared password, and say they exist only under the `demo` profile.
- [x] 2.2 Bring up the stack on a fresh volume (`docker compose down -v`, then `up`). Check in the browser: the map ratings, a site with reviews and warnings, the feed, a demo profile with awards and statistics, a demo login, and the admin moderation queues for sites and certificates.

## 3. Integration

- [x] 3.1 Run `pnpm check` from the repository root with the stack stopped and confirm it exits 0.
- [x] 3.2 Update `docs/ROADMAP.md` status and `docs/HANDOFF.yaml`; verify `next` is set and the handoff stays under 40 lines.

## Workflow follow-up

- Merge `master`, and absorb any new note in `docs/plan-updates/complete-demo-seed/` with `/opsx:update`.
- Sync the delta specs into `openspec/specs/` and validate.
- Archive on `change/complete-demo-seed` and set the roadmap status to `archived` in that commit.
- Push the branch and open the PR to `master`.
