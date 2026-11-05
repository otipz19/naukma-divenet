# Design: complete-demo-seed

## Context

`SiteDemoSeeder` (package `site`) loads `seed/sites.json` into an empty database under the `demo` profile, writing entities directly. Everything else a demo needs is created by services: `AuthService.register`, `ProfileService.update`, `MediaService.upload`, `CertificateService`, `DiveLogService`, `ReviewService`, `WarningService`, `PostService`, `SiteCatalogService.submit`, `SiteModerationService` and `LockerService`. Those services validate input, keep site rating aggregates up to date and publish `DiveLogged`, `PostPublished` and `SiteApproved`. `AchievementListener` consumes those events after commit, in a new transaction.

## Goals / Non-Goals

**Goals:** a demo that shows every M1–M5 feature with data on first start, valid by the same rules as user input, and seeded once.

**Non-goals:** videos, backdated review and post times, a demo admin, a reset command.

## Decisions

### D1. Seed through the services, not the repositories

The seeder calls the services above, with the demo diver's id where a service asks who acts. Validation, rating aggregates, media attachment and events then work as they do for a real user, and a seed entry that breaks a rule fails startup instead of creating impossible data. Moderation calls (`approve`, `reject`, `verify`) take no admin id, so no admin account is needed.

*Alternative:* write rows directly, as `SiteDemoSeeder` does. That would duplicate the aggregates, the media attach and the events, and those copies would drift.

### D2. A `demo` feature package with one service class

`ua.ukma.divenet.demo.service.DemoSeeder` is an `ApplicationRunner` under `@Profile("demo")`. It has no `web` or `domain` layer. ARCHITECTURE.md lets a service call other features' services, and the ArchUnit rule allows a service-only package. `SiteDemoSeeder` gets `@Order(1)` and `DemoSeeder` gets `@Order(2)`, so sites exist when the content refers to them.

### D3. Content in `seed/demo.json`, sites by name

The file holds a list of divers, and each diver holds their own content: profile, certificates, dives, reviews, warnings, posts, submissions and locker items. A site is referenced by its seeded name. An unknown name fails startup with that name, like an unknown region code does in `SiteDemoSeeder`. Dive dates are stored as days before the seeding date (`daysAgo`), so the log looks the same whenever the stack starts. Text is in English and Ukrainian, as real users would write it. Divers have stable emails under `@demo.divenet.test`. `.test` is reserved, so no mail can leave.

### D4. Times are the seeding time, except dive dates

Services stamp `created_at` and `published_at` from the application `Clock`. Making them vary would need a second clock or direct updates after the services return. Neither earns its complexity: the feed's and reviews' order still comes from the order of seeding, which the file controls. Dive dates are user-entered, so they spread over the past two years.

### D5. Images are generated, not committed

`DemoImages` draws a deterministic JPEG with Java's `ImageIO` and `Graphics2D`, from a seed number. It paints a vertical water gradient, light rays and a few soft shapes: 640×480 for covers and photos, and 256×256 for avatars. The result goes through `MediaService.upload` like any upload, so thumbnails and storage (local or MinIO) work unchanged. This needs no binary files in the repository and no licences, and keeps the JAR small.

*Alternative:* commit CC0 photos. They look better, but they add megabytes, and each needs its licence checked and recorded.

### D6. One transaction, then achievements

The seeding runs inside one `TransactionTemplate`. The guard is "does the first diver's email exist", so a partly seeded database cannot occur. If a step fails, everything rolls back and startup fails. Uploaded files may remain in storage without rows; they are invisible, and a later successful seed creates new ones. After the commit, `AchievementListener` awards from the events. The seeder then also calls `AchievementService.evaluate(userId)` for every demo diver, as the absorbed note asks. Evaluation reads live data and inserts idempotently, so the second call is harmless, and awards do not depend on whether every path publishes an event.

### D7. One demo password, documented

Every demo diver has the password `divenet-demo`. It lives in the seed file and is listed in the README with the demo emails. The divers are ordinary users with no admin rights, and they exist only under the `demo` profile. A deployment that must not have them runs without that profile, as `.env.example` already explains.

## API, migrations, i18n

None. No endpoint, Flyway migration or locale key changes.

## Risks / Trade-offs

- [The seed breaks when a validation rule tightens] → `DemoSeederIT` seeds the whole file under the `demo` profile on every gate run, so the break shows up in that change.
- [Startup is slower on first start] → about 60 generated images plus their thumbnails, a few seconds once. Restarts skip at the guard.
- [Every published post has the same publication time] → the feed still orders by seeding order, and the dates read "today", which is acceptable for a demo (D4).
- [Generated images look abstract] → they are recognisably "water", and real photos can replace them later without touching the code.
