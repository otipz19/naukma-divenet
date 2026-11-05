# Proposal: complete-demo-seed

## Why

A fresh stack under the `demo` profile shows 51 dive sites and nothing else. There are no reviews or ratings, no warnings, no feed and no diver profiles. Every feature from M1 to M5 works, but a demo has to create its own data first, live. PRODUCT.md asks for seed data, so that the demo is never empty. This is the second M6 item, and the planned E2E suite will also run against this data.

## What Changes

A new `demo` feature package with one seeder. It runs under the `demo` profile after the site seeder and creates a demo community through the existing services:

- **Divers:** 8 demo divers with English and Ukrainian names, bios and generated avatars. They all share one documented password, which lets a demo log in as any of them. Some hide their dive log or statistics, so the privacy settings show.
- **Certificates:** verified and pending ones, plus one that was rejected, so the moderation queue has work.
- **Dive log:** about 60 dives across the divers, dated over the past two years and spread over many sites and countries.
- **Reviews:** about 30 reviews with ratings and difficulty on the popular sites, some with photos. The site ratings come from them.
- **Warnings:** 6 warnings on sites, of different types.
- **Posts:** about 10 published posts with covers and photos, tied to regions and sites, so the feed and its filters show. Two posts stay drafts.
- **Site submissions:** one approved, two pending (for the moderation queue) and one rejected.
- **Gear locker:** a few items per diver.
- **Achievements:** each demo diver's achievements are evaluated after seeding, so the profiles show earned awards (absorbed note).

The images are generated at seed time, so the repository holds no binary photos and no third-party licences. They are deterministic underwater-coloured pictures. The content lives in `backend/src/main/resources/seed/demo.json`, and sites are referenced by name. The README lists the demo accounts.

Out of scope or deferred:
- Videos: none are seeded, because a generated video needs ffmpeg or a committed binary.
- Backdated timestamps: reviews, posts and warnings carry the seeding time, as the services set it (design D4). Only dive dates are spread over the past.
- Comments, likes and follows: they do not exist in the product.
- An admin demo account: the existing `ADMIN_EMAIL`/`ADMIN_PASSWORD` bootstrap stays the only way to get one.

Stories: none of its own. It shows US-01 to US-10 and the M5 stretch items with data (roadmap row: "—").

## Capabilities

### New Capabilities

- `demo/seed`: under the `demo` profile, startup fills an empty community with demo divers and their content once, and evaluates their achievements.

### Modified Capabilities

None. `site/catalog` "The demo profile seeds real sites" is unchanged. The new seeder runs after it.

## Plan updates absorbed

- `docs/plan-updates/complete-demo-seed/add-achievements--award-seeded-users.md`: absorbed. The seeder calls `AchievementService.evaluate` for every demo diver after its transaction commits, and the roadmap row gains "seeded users have their achievements".

## Impact

- Back-end: a new package `ua.ukma.divenet.demo.service` (`DemoSeeder`, `DemoImages`). `@Order` goes on `SiteDemoSeeder`, so sites exist first. A new seed file, `seed/demo.json`. A new integration test, `DemoSeederIT`.
- No REST, schema, migration, front-end or i18n change. Nothing changes in `api/openapi.json`.
- Docs: README "Running the app" lists the demo accounts and their password. ROADMAP row.
- Architecture: none departed from. `demo` is a feature package with only a `service` layer, and it calls other features' services, as ARCHITECTURE.md allows.
