# Design

## Context

- **Photos.** Review thumbnails are plain links to the image file in the same tab
  (`features/review/ReviewCard.tsx`). Post images (`features/post/PostPage.tsx`) and the
  certificate photo in the moderation queue (`features/user/CertificateQueue.tsx`) open
  the file in a new tab. The app has no viewer.
- **Difficulty.** A declared difficulty is stored as 1–5. The UI shows four words
  (`components/Badge/DifficultyBadge.tsx`: `difficultyWord`, `levelsOf`). The map filter and
  the review form use the words, and the review form sends `levelsOf(word)[0]`. Only
  `features/site/SubmitSitePage.tsx` lists the levels with numbers.
- **Map.** `features/site/SiteClusterLayer.tsx` rebuilds the marker layer when `sites`
  changes. The map view is never moved after the first render. The search and filters
  live in the URL (`features/site/siteSearch.ts`).
- **Seed pictures.** `demo/service/DemoSeeder.java` `Images` draws every picture with
  `DemoImages.jpeg(seed, w, h)`: avatars at 256×256, covers and photos at 640×480.
  It uploads 12 new covers and makes 35 reused copies, plus 16 post photos and 20 review
  photos. `MediaService.upload` stores the bytes as uploaded and makes a thumbnail.
- **Moderation.** `ModerationPage.tsx` and `CertificateQueue.tsx` refresh the queue after
  a decision. The shell's `useToast()` (`components/Toast/Toast.tsx`) is used only by the
  dive log.
- **Visitor actions.** "Log a dive here" and "Write a review" (`features/site/SitePage.tsx`),
  "Report a warning" (`features/warning/SiteWarnings.tsx`) and "Add a site"
  (`features/site/MapPage.tsx`) are `Link`s into routes wrapped in `RequireAuth`. That
  wrapper sends a signed-out visitor to `/login` with `state.from`, and the login page
  returns there after logging in.
- **Content Security Policy** (`frontend/nginx.conf`): `style-src 'self' 'unsafe-inline'`,
  `img-src 'self' data: blob: …`. The tokens-only CSS check reads `frontend/src` only.

## Goals / Non-Goals

**Goals:**
- Each finding F-25 to F-31 is fixed as the owner decided, with tests for every new or
  changed scenario.
- No API, database or stored-data change.

**Non-Goals:**
- Zoom, download or captions in the viewer. A viewer for avatars or post covers.
- Changing the 1–5 difficulty model, the badges or the filter chips.
- Site photos, or real photos for avatars.
- Toasts for other actions, and unifying confirmation styles (declined).
- Changing what `RequireAuth` does for a direct URL.

## Decisions

### D1 Photo viewer: `yet-another-react-lightbox` behind one component
The owner asked for a library. `yet-another-react-lightbox` (MIT) supports React 19. It
gives an overlay with close, previous, next, Escape, arrow keys and swipe, renders in a
portal and adds no extra network calls. It goes in `frontend/package.json` at an exact
version published at least two weeks before apply. Its stylesheet is imported once from
`node_modules`, so the tokens-only CSS check (`src/` only) is not affected. Its inline
styles are allowed by the CSP's `'unsafe-inline'`.

One wrapper, `components/PhotoViewer`, owns the library. It takes `photos: {url, alt}[]`,
the open index and `onClose`. It passes translated button labels (`labels` prop), and
it hides previous and next when there is a single photo. It turns off the closing
animation under `prefers-reduced-motion`, and returns focus to the thumbnail that opened
it (the library does not). A hook, `usePhotoViewer(photos)`, returns an `open(index)`
function to use on the thumbnail's click and the viewer element.

Each thumbnail stays an `<a href={photo.url}>`. A plain left click calls
`preventDefault()` and opens the viewer. A modified click (Ctrl, Cmd, Shift, middle
button) is left to the browser. The current `target="_blank"` on post and certificate
photos is removed, so all three behave the same.

Alternatives: PhotoSwipe needs its own image sizes up front. A home-made viewer on our
`Dialog` was rejected because the owner asked for a library.

### D2 Difficulty: the submit form lists `DIFFICULTY_WORDS`
The Difficulty select's options become the four words, with values
`levelsOf(word)[0]` (1, 2, 4, 5), as the review form's chips do (design D6 there). The
select keeps its "Choose…" placeholder and its validation. Level 3 can still exist in
seeded data and shows as Intermediate, as before.

### D3 Map fit: fit on a new search key once its markers arrive
`MapPage` passes `SiteClusterLayer` a `fitKey`: the URL's search and filter parameters,
without `sort`. When the markers for a new non-empty `fitKey` arrive and are not empty,
the layer calls `map.fitBounds(bounds, { maxZoom: 9, padding })`. On a phone the padding
also covers the results sheet's peek height, so markers are not hidden under the sheet.
An empty key (no search and no filters, which includes "Clear all") and an empty result
leave the view alone. Changing only the sort changes nothing. A key is fitted once, so
the map does not jump back while the user pans.

### D4 Seed photos: a credited set in `seed/photos/`, used round-robin
The photos go in `backend/src/main/resources/seed/photos/` as `NN-<slug>.jpg`. There
are about 20 of them, at most 1280 px on the long side and about 300 KB each, which is
under the 10 MB upload limit. `seed/photos/credits.json` lists `{file, title, author,
source, licence}` for each one.

Source: Wikimedia Commons. Public-domain works (for example NOAA and other US
government photos) come first, then CC0, CC BY or CC BY-SA, so every licence allows
reuse with credit. Files are downloaded from Commons' own resized copies (the
`/thumb/…/1280px-…` URLs), so no local image tool is needed.

**Gate:** during apply, the candidate list (title, Commons page, licence, what it shows)
is shown to the owner. Nothing is downloaded until the owner approves it.

`DemoSeeder.Images` gets a `photo()` that returns the next photo of the set,
round-robin, for covers, post images and review photos. The "reuse a cover" path
disappears: reuse is now simply the round-robin, while each picture is still a new
upload, because an upload can be attached only once. The `cover: "reuse"` field in
`seed/demo.json` is kept and ignored, so the JSON does not churn. Avatars keep
`DemoImages`.

### D5 Moderation toasts
After a successful approve, reject or verify, the page calls `toast.show` with a title
from new keys, for example `site.moderation.toast.approved: "{{name}} approved"`. No
toast is shown on a field error or a 409.

### D6 Log-in prompt: `<DiverActionLink>` and one dialog
`features/auth/DiverActionLink` renders the same `Link` as today and takes an
`action: "logDive" | "review" | "warning" | "addSite"`. For a signed-out session, a
plain click calls `preventDefault()` and opens `LoginPromptDialog`, built on the shared
`Dialog` (title "Log in to continue", the text for that action, and Cancel / Log in).
Log in runs `navigate("/login", { state: { from: to } })`, the same `FromState` that
`RequireAuth` uses, so the login page returns to the action. While the session is still
loading, the click goes through and `RequireAuth` handles it. A signed-in user sees no
change. The "Edit your review" variant is only shown to signed-in users, so it is not
affected.

### D7 Privacy hint copy
The key `user.profile.edit.privacyHint` gets new `en` and `uk` text. No spec covers the
string, so no delta is needed.

### New i18n keys
These go under the existing namespaces, in `en` and `uk`:
- `media.viewer.{close,previous,next}`
- `auth.loginPrompt.{title,login,cancel}` and `auth.loginPrompt.actions.{logDive,review,warning,addSite}`
- `site.moderation.toast.{approved,rejected}`
- `user.certificates.queue.toast.{verified,rejected}`, or the queue's existing namespace

There are no new REST endpoints, no Flyway migrations and no ADR.

### Design docs
`design/system/components/` gains a short `PhotoViewer/README.md`, and the Dialog
README names the log-in prompt. `docs/DESIGN.md` lists both.

### Tests
- **Vitest:**
  - The viewer opens from a review, post or certificate thumbnail. It moves next and
    previous, closes on Escape and returns focus. A single photo shows no previous or
    next. Labels are in `uk`.
  - The submit form's difficulty options and the levels it sends.
  - `fitBounds` is called for a new key with markers, and not for an empty key, an
    empty result or a sort change. This uses a spy on `L.Map.prototype.fitBounds`,
    because jsdom has no layout.
  - Moderation toasts, and no toast on a 409.
  - The login prompt for each action, Cancel, Log in passing `from`, and no prompt
    when signed in.
- **Back-end:** `DemoPhotosTest` checks that the credits and the files match one to one
  and that no field is empty. `DemoSeederIT` checks that covers, post images and review
  photos match the bytes of set photos, and that at least 15 distinct photos are used.
- **E2E (CI):** a visitor's "Write a review" opens the dialog, and Log in leads to the
  form. A review photo opens the viewer. The admin sees the approve toast. The existing
  accessibility audits cover the open viewer and the dialog.

## Risks / Trade-offs

- **Library accessibility.** The lightbox is not a native `<dialog>`, so the "page behind is
  inert" rule in `shared/dialogs` does not apply to it automatically. Mitigation: the
  E2E accessibility audit includes the open viewer. If it flags focus escaping, the
  wrapper sets `inert` on the app root while the viewer is open.
- **Repository size.** About 20 photos add about 4–6 MB to the repository and the
  back-end jar. This is acceptable for a demo seed and is listed in the proposal.
- **Licences.** A wrong licence would be a real problem. Mitigation: only public-domain
  and CC licences, each recorded in `credits.json`, a test that every file is credited,
  and the owner's approval of the list before download.
- **Map jumps.** Fitting on every key change could fight a user who is exploring.
  Mitigation: each key fits once, panning is never undone, and a sort change does not fit.
- **The seed's reused-cover field becomes dead data.** It is kept on purpose to avoid churn
  in `demo.json`, and the seeder's comment says it is ignored.
