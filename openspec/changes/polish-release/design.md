# Design

## Context

See proposal.md for the motivation. These parts of the current code shape the
approach:

- **Router.** `src/app/router.tsx` has one layout route (`AppLayout`). Its children
  come from `features/*/routes.tsx`, and `*` is the not-found page. No route has an
  `errorElement`, so a render error drops the whole tree.
- **Loading.** Pages render nothing until their `useQuery` has data. For example,
  `SitePage` returns `{site.data && …}`, and `FeedPage` shows its list only after
  `isSuccess`. No shared loading component exists, and `design/system/components/`
  has none either.
- **Titles.** The title is the static `<title>DiveNet</title>` in
  `frontend/index.html` and never changes.
- **Theme.** `src/app/theme.ts` `watchSystemTheme()` is called once in `main.tsx`.
  It mirrors `prefers-color-scheme` into `<html data-theme>`. `tokens.css` already
  supports both paths. `[data-theme="light"]` and `[data-theme="dark"]` pin a
  theme. The `@media (prefers-color-scheme: dark) :root:not([data-theme="light"])`
  block covers the no-JS case.
- **Header.** `LanguageSwitch` is a labelled group of `aria-pressed` buttons, used
  by `AppHeader` and `NavDrawer`.
- **CSP.** `nginx.conf` sets `script-src 'self'`, so the page cannot run an inline
  script in `index.html`.
- **Seed.**
  - `demo.json` has 12 posts, 10 of them published. James, Ingrid and Nomvula
    have none.
  - `DemoSeeder` uploads a new generated JPEG (`DemoImages.jpeg(seed, w, h)`) for
    every cover and photo.
  - An upload can be attached only once (`MediaRepository` attach rule).

## Goals / Non-Goals

**Goals:**
- One mechanism for each concern (error, loading, title, theme), which pages adopt
  with a line or two.
- No back-end API change.

**Non-Goals:**
- An i18n audit and the F-01 `204` refresh answer. The owner dropped both on
  2026-11-22.
- New placeholders on secondary pages: the forms, the editor, login and register.
  Those pages have no main data to wait for, or they show their form at once.
- Error reporting to the server.

## Decisions

### D1. Error page through a pathless route with `errorElement`

`router.tsx` wraps every child of the layout in one pathless route
`{ errorElement: <ErrorPage />, children: [...] }`. A render error then replaces
only the outlet, so the header stays. React Router resets the error on the next
navigation, so following a header link works with no extra code.
`src/app/routes/ErrorPage.tsx` uses `useRouteError()` only to log the error with
`console.error`. It renders translated copy, a "Reload page" button
(`window.location.reload()`) and a link to `/`. It never renders the error text.

*Alternative:* a class `ErrorBoundary` component around `<Outlet />`. It needs
its own reset-on-navigation logic, and React Router already provides that.

*Test:* the router test builds a memory router from `routes`. It injects one
extra test-only child that throws, through an exported helper that adds children
to the same pathless route. It checks the banner, the copy, the link and that
"boom" is absent. Then it navigates with the header Feed link.

### D2. Shared `Skeleton` and a `PagePlaceholder` wrapper

- `components/Skeleton/Skeleton` is a block with tokens only: `--surface-2`
  background, `--radius-md`, `width`/`height` as props in token units or
  percentages. It has a shimmer keyframe animation that is turned off under
  `prefers-reduced-motion: reduce`.
- `components/Skeleton/PagePlaceholder` wraps a page's skeleton layout in
  `<div aria-busy="true">`. That div holds a visually hidden
  `<span role="status">{t("shell.loading")}</span>`.
- Each main page renders its own placeholder shape. Shapes are kept simple
  (heading bar plus a few blocks or cards):

  | Page | Placeholder shape |
  | --- | --- |
  | Map results | 3 SiteCard-shaped rows |
  | Site | title, meta line, 2 column blocks |
  | Feed | 3 PostCard shapes |
  | Post | title, cover block, 4 text lines |
  | Profile | avatar circle, name, 3 section blocks |
  | Dive log | table header and 5 rows |
  | Certificates | 3 rows |
  | Moderation | 3 queue rows |

- A page shows the placeholder while the query that the page cannot render
  without is pending. For pages that wait for the session (`enabled:` gated on
  `session.status !== "loading"`), that also covers the session wait. The query is
  then disabled, and TanStack reports `isPending` for it.
- The design gets a matching spec: `design/system/components/Skeleton/README.md`
  and a `dn-skeleton` rule in `bundle.css`. `docs/DESIGN.md` lists the component.
- *Test:*
  - A `Skeleton.test.ts` reads the CSS module and checks the reduced-motion
    rule, the same way `touchTarget.test.ts` does.
  - Each page test gets one case with a never-resolving fetch mock. It asserts
    `aria-busy` and the status, and the site and feed cases also check that the
    placeholder is replaced.

*Alternative:* a single spinner. It was rejected because the content jumps when
data arrives, and the roadmap row asks for placeholders.

### D3. `useDocumentTitle(page?: string)`

The hook is in `src/app/documentTitle.ts`. It sets
`document.title = t("shell.title", { page })`, with `shell.title` =
`"{{page}} · DiveNet"`. When `page` is undefined it sets "DiveNet", which is only
a transient state on data pages. It re-runs on `[page, i18n.language]`.

- Static pages pass their translated heading. They reuse each page's existing
  heading key where one exists (for example `post.feed.title`, `divelog.title`).
- New keys go under `shell.pageTitle.*` only where a page has no heading key.
- Data pages pass the loaded name, or the generic key (`shell.pageTitle.site`,
  `.post`, `.profile`) while loading.
- The router test renders every route path and checks the "ends with · DiveNet"
  scenario. Each path gets a param value, and protected routes run with a mocked
  session.

*Alternative:* a `handle.title` on each route object, read in `AppLayout` through
`useMatches()`. It was rejected because data-driven titles still need the page,
so there would be two mechanisms.

### D4. Theme preference

`src/app/theme.ts` becomes:

- **Storage.** `ThemeChoice = "system" | "light" | "dark"` is stored in
  `localStorage` under `divenet.theme`. Any other value reads as `system`, and so
  does a storage error.
- **`startTheme()`.** It replaces `watchSystemTheme` in `main.tsx`. It applies the
  saved choice before the first render. For `system` it subscribes to the media
  query, as now. For `light` or `dark` it sets the attribute and does not
  subscribe.
- **`setThemeChoice(choice)`.** It saves the choice, re-applies the theme and
  re-subscribes, and notifies React through a small external store
  (`useSyncExternalStore`), so every `ThemeSwitch` instance stays in sync.
- **System sets the attribute.** With `system`, the attribute is still set to the
  resolved theme. It is not removed, as F-08 suggested. This keeps the existing
  spec scenarios and the E2E theme audit valid: both read `data-theme`. Visually
  the two are the same.
- **`components/ThemeSwitch`.**
  - It copies `LanguageSwitch`: a labelled group with three `aria-pressed` buttons
    showing the Lucide `Monitor`, `Sun` and `Moon` icons, each with
    `aria-label={t("shell.theme.system|light|dark")}`.
  - It uses the same CSS module styles as `LanguageSwitch`, on the navy bar with
    `focus-inverse`.
  - `AppHeader` places it after the language switch. `NavDrawer` places it after
    the language switch.

*Flash of the wrong theme:* the CSP forbids an inline script. So the attribute
is set by the module script, which runs before React's first paint, but after the
first CSS paint. A visitor who picked Light on a dark OS can see the dark theme for
one frame. This is accepted for a demo. The no-JS path is unchanged.

The documentation changes: `docs/DESIGN.md` rule 3, `design/system/README.md`
(Themes), the AppHeader component README (order: … · EN/UK · theme · account),
and `docs/ARCHITECTURE.md`, whose bullet "there is no manual toggle" becomes the
new rule. No ADR records the old rule, and F-08 is an owner decision, so no new
ADR is needed.

### D5. Empty-state audit

The audit was done while planning, against the rule in the `shared/web-app` delta.

Lists that already follow the rule:

| List | Today | Verdict |
| --- | --- | --- |
| Map results | `site.search.nothingFound` | ok |
| Site reviews | `review.empty` | ok |
| Site warnings | `warning.empty` | ok |
| Site posts | section left out | ok (no add from that section) |
| Feed | `post.feed.empty`, after `isSuccess` | ok |
| Drafts aside | left out when empty | ok |
| Dive log | `divelog.empty` | ok |
| Moderation sites / certificates | `site.moderation.empty` / `.certificates.empty` | ok |
| Certificates page | `user.certificates.none` | ok |
| Profile certificates, gear, posts | message for the owner, left out for others | ok |
| Profile dives | `divelog.profile.none` when the log is visible | ok |
| My submissions | `site.submit.none` | ok |

Still to check during apply:
- the moderation Warnings tab;
- the phone results sheet on the map;
- the site page photo gallery;
- the post page's linked site and region chips;
- the profile achievements (left out when the catalogue is empty, which cannot
  happen in practice).

A gap found there gets a translated message, or the section is left out where the
viewer cannot add, plus one test. The final table goes into this change as
`audit.md`, as `apply-ui-design` did.

### D6. More seeded posts, reusing the existing pictures

- **Posts.** About 35 new published posts are added to `demo.json`, so there are
  at least 45. James, Ingrid and Nomvula get at least 3 each, and the others get
  more.
  - Each post links to a site from `sites.json`, or to a region only. That gives
    at least 8 sites and 5 regions.
  - The text is in the diver's language (Ukrainian for Yaryna and Bohdan, English
    for the others, as now) and is 2 to 4 short paragraphs long.
  - `photos: 0` is set for every new post.
- **Pictures.** The owner asked to reuse the pictures already present. All demo
  pictures are generated from a seed number (`DemoImages.jpeg(seed, …)`), and an
  upload can be attached only once. So `Images` gets
  `reuseCover(userId, index)`:
  - It uploads a new copy of the bytes of one of the existing post-cover
    pictures, with seed numbers taken round-robin from the covers the current 12
    posts get.
  - It does not draw a new picture.
  - The existing content keeps its pictures, because the new posts' covers no
    longer take `next++` numbers.

  The seed format gains an optional field `"cover": "reuse"`; a missing field
  means a new picture, as today. The seeder still goes through `PostService`, as
  `complete-demo-seed` requires.
- **Feed order.** The feed is newest first, and posts are created in seed order.
  Created per diver, page 1 would hold only the last diver's posts. So the seeder
  moves post creation out of the per-diver pass. After all divers and their other
  content exist, it creates the posts in one round-robin pass: the first post of
  each diver, then the second of each, and so on. Drafts take part in the same
  pass.
- *Test:* `DemoSeederIT` gets the new counts (45 published) and a `GET
  /api/v1/posts` page-count check of at least 3. It also checks one post per diver
  and the distinct sites and regions. It checks that the first feed page holds
  posts by at least 4 divers.

*Alternative:* uploading one picture and pointing many posts at it. The attach
rule forbids that, and changing a media rule for seed data was rejected.

## Risks / Trade-offs

- **Seed text volume.** About 35 posts of hand-written text make a large JSON
  diff. → Keep each post short, and review only for language and links.
- **Startup time.** More uploads on the demo start make startup slower. → Each
  cover is a 640×480 JPEG generated in memory. This adds about 35 uploads to the
  roughly 100 the seed already makes. The `measure-performance` budgets do not
  cover startup.
- **Placeholder flicker on fast responses.** → This is accepted. The placeholder
  needs no delay, because the content keeps its shape.
- **Theme flash for a pinned theme opposite to the OS.** → See D4. This is accepted.
- **Title test brittleness across routes.** → Assert only the suffix and the
  difference from "DiveNet", not each title's text.

## Migration Plan

No migration. Existing demo databases keep their content, because the seeder skips
when a demo diver exists. Running `docker compose down -v` and starting again
gives the new posts.

## Changed interfaces

- **REST endpoints:** none. `api/openapi.json` is unchanged.
- **Flyway migrations:** none.
- **i18n keys** (`en` and `uk`), all in the existing `shell` namespace:
  - `shell.loading`;
  - `shell.title`;
  - `shell.pageTitle.*` (site, post, profile and any page without a heading key);
  - `shell.error.{heading,text,reload,home}`;
  - `shell.theme.{label,system,light,dark}`;
  - plus whatever empty messages the D5 checks add.
