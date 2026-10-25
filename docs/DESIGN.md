# DiveNet — UI design

This is the UI source of truth (AGENTS.md, source of truth #7). Read it before
any UI change. It wins over existing UI code for visual decisions. When the code
and this design disagree, fix the code, or change the design here first in the
same PR.

The design was produced with Claude Design and is **kept in this repository**
(ADR-0009). Every agent (Claude Code, Codex, Gemini CLI) and every teammate
works from the files below. The claude.ai artifacts are only mirrors for viewing
and visual editing, so nobody needs a claude.ai account to use the design.

## Where things are

| Path | What | Who reads it |
| --- | --- | --- |
| [design/system/README.md](../design/system/README.md) | Brand book: voice, colour, type, spacing, shape, layout, imagery, motion, icons | Read it first, before any UI work |
| [design/system/tokens.json](../design/system/tokens.json) | **The tokens**: every colour (light and dark), type style, spacing, radius, shadow and layout value, each with a usage note | The single source of every visual value |
| [design/system/tokens.css](../design/system/tokens.css) | CSS custom properties and type classes, generated from `tokens.json` | The front-end imports it |
| [design/system/components/](../design/system/components/) | One folder per component: `README.md` (when to use it, states, what the consumer provides) and `preview.html` | Before building or changing that component |
| [design/system/components/bundle.css](../design/system/components/bundle.css) | Reference CSS for the components (`dn-*` classes), using only tokens | The exact paddings, sizes and states to reproduce |
| [design/screens/](../design/screens/) | One HTML mockup per screen, desktop at 1280 px plus two phone screens | Before building or changing that page |
| [design/build-tokens.mjs](../design/build-tokens.mjs), [design/build-canvas.mjs](../design/build-canvas.mjs), [design/serve.mjs](../design/serve.mjs) | Generate `tokens.css`; wrap the screens as Claude Design artboards; serve the mockups locally | When the design changes |

To view a screen with its styles, run the dependency-free server, then open
`http://127.0.0.1:4789/screens/<Screen>.html`:

```sh
node design/serve.mjs
```

Opening the file directly also works in a normal browser. Agents that cannot
render read the HTML: every value is a `var(--token)` or a `dn-*` class from the
files above.

## Screens

| Screen file | What it shows | Built by (roadmap) |
| --- | --- | --- |
| `Map.html` | Header, search, combinable filters, result list, map with clusters, markers and a popup, disclaimer strip | `add-app-shell` (header), `add-dive-site-catalog`, `add-site-search-and-filters` |
| `Site.html` | Photos, facts card, required and recommended gear, disclaimer box, recent warnings, description, reviews (own review with edit and delete), linked posts, footer | `add-dive-site-catalog`, `add-site-reviews`, `add-site-warnings`, M5 site feed |
| `ReviewForm.html` | Rating input with "No rating", community difficulty, text, photos | `add-site-reviews`, `add-media-uploads` |
| `Auth.html` | Log in with a failed-login banner, sign up with a field error | `add-authentication` |
| `SubmitSite.html` | Site submission with a location picker, plus the author's submissions with their statuses | `add-site-submission-and-moderation` |
| `DiveLog.html` | Dive table, log-a-dive form, an achievement-unlocked banner | M3 dive log and achievements |
| `Profile.html` | Profile header with stats, certificates with verification status, earned and locked achievements with progress, visited sites, privacy notice | M3 profile, certificates, achievements |
| `Feed.html` | Feed with country and region filters, post cards, pagination, drafts | M5 posts and feeds |
| `PostEditor.html` | Title, cover, text, region and site links, publish, save draft, delete | M5 posts |
| `Moderation.html` | Admin queues (sites, certificates, warnings), approve or reject with a reason | `add-site-submission-and-moderation`, certificate verification |
| `MobileMap.html` | Phone: map with the search bar, filter button and a results bottom sheet | Every map change |
| `MobileSite.html` | Phone: site page in the **dark theme** and **Ukrainian** | Every site-page change |

The screens show layout, hierarchy, states and copy tone. They are not pixel
specs for data. Names, numbers and photos are sample content. A
`[bracketed text]` block is an image placeholder.

## Rules for implementation

1. **Tokens only.**
   - Every colour, size, radius, shadow and font comes from `tokens.css`
     (`var(--accent)`, `var(--space-4)`, the `.h1`/`.body`/`.data` classes or
     their values). A literal hex or px value in component CSS is a review
     defect.
   - The only exceptions are 1–2 px hairlines, and the icon sizes stated in the
     README.
2. **Import the tokens from here, never copy them.**
   - The front-end imports `design/system/tokens.css` directly. Vite can
     import from the repository root.
   - Components are React components in `frontend/src/components/` (shared)
     or a feature folder. Each uses a CSS module that reproduces the matching
     `dn-*` rules from `bundle.css`.
   - The `dn-*` class names are a spec, not an API.
3. **Themes.**
   - Light is the default.
   - The app sets `data-theme="dark"` on `<html>` when
     `prefers-color-scheme: dark` matches.
   - Components never branch on the theme.
4. **Fonts.**
   - Manrope (headings), Golos Text (text) and JetBrains Mono (measured values),
     all with Cyrillic.
   - The app self-hosts them through `@fontsource` packages, with no Google
     Fonts request at runtime.
   - The mockups load Google Fonts only for convenience.
5. **Icons.** Lucide (`lucide-react`), as listed in the README's Iconography
   section. No emoji.
6. **Accessibility.**
   - Use real `button`, `a`, `label` and `input` elements, and a visible
     `focus` ring (`focus-inverse` on the navy bars).
   - Text contrast is 4.5:1, already true for every documented token pair in
     both themes.
   - Statuses always carry a word or icon, never colour alone.
   - Touch targets are at least 44 px on phones.
7. **i18n.**
   - All copy comes from the locale files.
   - Ukrainian runs 15–25% longer, so never size controls to the English text.
     `MobileSite.html` shows the Ukrainian layout.
8. **Safety disclaimer.**
   - It appears in the footer of every page. On the map page, which has no
     footer, it is the strip under the results.
   - The site page also has it in a box.
   - It is never dismissible.
9. **Responsive.**
   - Below `bp-md` (768 px): one column, navigation in a drawer.
   - Below `bp-lg` (1100 px) the map's side panel becomes a bottom sheet.

## Changing the design

The repository is the source. A design change is a normal PR. It needs no
OpenSpec change unless behaviour changes too.

1. Edit the files under `design/`:
   - tokens: `design/system/tokens.json`, then run `node design/build-tokens.mjs`;
   - a component: its folder and `bundle.css`;
   - a page: `design/screens/<Screen>.html`.
2. Update this file if a rule, screen or component list changes.
3. Optionally refresh the claude.ai mirrors (below), so people who review
   visually see the change.

Visual editing in Claude Design is welcome, but the edits must come back into
the repository in the same PR. Ask Claude Code to "pull the design mirrors into
`design/`". It reads the artifact files and rewrites the matching repository
files. If the two differ and nobody pulled, the repository wins.

### Claude Design mirrors

| Mirror | Link | Built from |
| --- | --- | --- |
| Design system "DiveNet" | <https://claude.ai/artifact/JGAiWB3Eii3sxezwjwU43k> | `design/system/` (published as `project/<same path>`, plus the index `project/design-system.json`) |
| Canvas "DiveNet Screens" | <https://claude.ai/artifact/45deQtPyvwNzShCiJcS9f6> | `design/screens/`, wrapped by `node design/build-canvas.mjs <out-dir> --ds-url <design-system link> --ds-version <its version>` |

These links are private to their owner until shared from each page's Share
menu. Claude Code can update them only from the owner's claude.ai account; the
procedure is in [design/README.md](../design/README.md). Everyone else uses the
repository files and loses nothing.
