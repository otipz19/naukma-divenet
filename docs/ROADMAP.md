# DiveNet — Roadmap

This file sets the order of work. Each item is one OpenSpec change; the change
ID is the folder name under `openspec/changes/`. Story IDs refer to
[PRODUCT.md](PRODUCT.md#backlog). Every change follows the rules in
[ARCHITECTURE.md](ARCHITECTURE.md).

## How to use this file

1. **Pick:** take the first item with status `planned` whose dependencies are all `archived`.
   Items in the same milestone with no dependency between them may run in parallel.
2. **Propose:** run `/opsx:propose <change-id>` (Codex: `$openspec-propose`), then
   set the item's status to `proposed`. The proposal cites the story IDs and
   lists anything it defers.
3. **Apply:** run `/opsx:apply`, then set the status to `in-progress`.
4. **Archive:** once the change is merged and `pnpm check` passes, run `/opsx:archive`.
   Set the status to `archived` in the same PR.
5. **Scope changes:** to split, add or reorder items, edit this file in its own small
   PR, or in the PR of the change that discovered the need, and say so in that
   change's proposal. Never silently drop a story; move it to *Stretch* or *Out
   of scope* in PRODUCT.md instead.

Statuses: `planned` → `proposed` → `in-progress` → `archived`; `dropped` (with reason).

## M0 — Foundation

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `bootstrap-backend` | Maven wrapper project, Boot 4.1 / Java 25, Spring Modulith verify test, Flyway + PostGIS + Testcontainers, ProblemDetail handler, springdoc and the `api/openapi.json` snapshot check, Spotless; back-end step added to `pnpm check`; CI installs Java 25 | — | — | in-progress |
| `switch-to-layered-monolith` | Replace Spring Modulith with a plain layered monolith: feature packages, ArchUnit layer test, ADR-0008 superseding ADR-0002 | — | `bootstrap-backend` | proposed |
| `bootstrap-frontend` | Vite + React + TS app as a pnpm workspace member, router, TanStack Query, i18n `en`/`uk` with the key-parity check, ESLint/Prettier, Vitest, generated API types, app shell with disclaimer footer; front-end step added to `pnpm check` | — | `bootstrap-backend` | planned |
| `add-local-stack` | `compose.yaml` (db, backend, frontend/nginx), Dockerfiles, `.env.example` | — | `bootstrap-backend`, `bootstrap-frontend` | planned |
| `add-authentication` | Register, login, refresh, logout, roles, admin bootstrap from env; login/register UI | — | `bootstrap-frontend` | planned |

## M1 — Sites and map

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `add-reference-data` | Countries, regions and gear catalog (migrations + read endpoints) | US-05, US-15 (data) | `bootstrap-backend` | planned |
| `add-dive-site-catalog` | Site entity with PostGIS location, site page, markers endpoint, map page with clustering, `demo`-profile seeder with ~50 real sites | US-01, US-02 | `add-reference-data`, `bootstrap-frontend` | planned |
| `add-site-search-and-filters` | Name/region search plus combinable filters, reflected on the map and in a result list | US-05, US-06 | `add-dive-site-catalog` | planned |
| `add-site-submission-and-moderation` | Submit a site, admin queue with approve/reject, author sees status | US-07, US-08 | `add-dive-site-catalog`, `add-authentication` | planned |

## M2 — Reviews, media, safety

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `add-media-uploads` | Upload endpoint, `MediaStorage` on local disk, thumbnails, orphan cleanup, front-end upload component | — | `add-authentication` | planned |
| `add-site-reviews` | Reviews with rating, difficulty rating and photos; aggregates on the site; edit/delete own review | US-03, US-04 | `add-dive-site-catalog`, `add-media-uploads` | planned |
| `add-site-warnings` | Post, list and hide warnings on a site | US-S1 | `add-dive-site-catalog`, `add-authentication` | planned |

## M3 — Divers

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `add-diver-profile` | Public profile, avatar, bio, privacy settings | US-11 | `add-authentication`, `add-media-uploads` | planned |
| `add-dive-log` | Dive log entries with parameters, shown on the profile | US-09 | `add-diver-profile`, `add-dive-site-catalog` | planned |
| `add-certificates` | Declare certificates, admin verification, badge on profile | US-C1 | `add-diver-profile` | planned |

## M4 — Posts and feeds

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `add-posts` | Create/edit/delete posts with images, draft/published, author blog, site/region links | US-12 | `add-diver-profile`, `add-reference-data` | planned |
| `add-feeds` | Global feed, region/country filter, site feed on the site page | US-13, US-15, US-16 | `add-posts` | planned |

## M5 — Gamification

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `add-achievements` | Rule engine driven by domain events, awards, progress on profile | US-10 | `add-dive-log`, `add-posts`, `add-site-submission-and-moderation` | planned |

## M6 — Release readiness

| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| `apply-ui-design` | Apply `docs/DESIGN.md` (produced separately with Claude Design) across all pages | — | `docs/DESIGN.md` exists | planned |
| `complete-demo-seed` | Full demo dataset: users, reviews, dive logs, posts, warnings, media | — | M1–M5 | planned |
| `add-e2e-suite` | Playwright journeys against the compose stack; CI job | — | `add-local-stack`, M1–M5 | planned |
| `polish-release` | i18n completeness, accessibility pass, empty/error states, README with run instructions | — | M1–M5 | planned |

## Stretch

| Change ID | Delivers | Status |
| --- | --- | --- |
| `add-gear-locker` | Personal equipment inventory on the profile | planned |
| `add-video-media` | Video attachments for reviews and posts | planned |
| `add-object-storage` | MinIO implementation of `MediaStorage` | planned |
