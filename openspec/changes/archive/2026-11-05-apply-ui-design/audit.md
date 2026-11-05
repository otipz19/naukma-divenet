# UI audit (apply-ui-design)

Each screen of `design/screens/` against its app page, on the compose stack
(2026-11-05), with demo data and a test user who has dives, a certificate, a
review, a warning, a post, a draft and a pending site. The test user's display
name is long and in Ukrainian, to stress wrapping.

Variants: `D` = 1280 px, `P` = 375 px; `L`/`K` = light/dark; `en`/`uk`.
Every page was checked at `D-L-en`, `P-K-uk` and `D-K-uk`, plus `P-L-en` for the
map, site and dive log. The other variants differ only in tokens (theme) or
text (language), which the gate's i18n parity and tokens-only CSS checks cover.
Checks at each variant: horizontal page overflow, clipped text, untranslated
keys, English text in `uk`, and on phones controls under 44 px tall.
Screenshots were taken but are not committed (design D1).

## Findings

| Screen | Page | Finding | Variant | Result |
| --- | --- | --- | --- | --- |
| all | header | Buttons, chips, the logo link and inputs under 44 px on phones | P | fixed: `--touch-target` token (44 px) and phone rules in Button, Chip, TextField, AppHeader |
| Map, MobileMap | `/` | Filter count on the phones' Filters button | P | ok: already built (spec site/search "Narrow screens show a filters toggle") |
| Map, MobileMap | `/` | Leaflet zoom buttons 30 px on phones | P | fixed: phone rule in MapPage.module.css |
| Map | `/` | Visually hidden `h1` reported as clipped | all | ok: screen-reader heading |
| Site, MobileSite | `/sites/:id` | Disclaimer box starts lower-case (footer text reused) | all | fixed: own key `site.details.disclaimer` |
| Site | `/sites/:id` | English "the", "and" in `uk` | uk | accepted: seed site descriptions are user content |
| Site | `/sites/:id` | "Type" field | all | accepted: sample-only content, no story asks for it |
| ReviewForm | `/sites/:id/review` | Rating stars 32 px and No-rating 30 px on phones | P | fixed: phone rule in Rating.module.css |
| ReviewForm | `/sites/:id/review` | "← Back to …" text link under 44 px | P | ok: inline text link |
| SubmitSite | `/sites/new` | No Cancel action | all | fixed: Cancel link back to the map (spec site/submission) |
| SubmitSite | `/sites/new` | Leaflet zoom buttons 30 px on phones | P | fixed: phone rule in SubmitSitePage.module.css |
| DiveLog | `/dive-log` | No header "Log a dive" button | all | fixed: header button empties and focuses the form (spec divelog/log-page) |
| DiveLog | `/dive-log` | Table wider than the phone | P | accepted: scrolls inside its own wrapper; no phone mockup |
| Profile | `/users/:id` | Dive statistics below the header, not in it | D | fixed: statistics in the header (spec user/profile) |
| Profile | `/users/:id` | Certificate "Issued" year; Wreck Explorer and Reviewer achievements | all | accepted: sample-only content |
| Profile | `/profile/edit` | Settings checkbox labels 24 px on phones | P | fixed: phone rule in ProfileEditPage.module.css |
| Feed | `/feed` | Card title links 30 px on phones | P | fixed: phone rule in Post.module.css |
| Feed | `/feed` | "6 min read" sample | all | ok: app shows its own reading time |
| PostEditor | `/posts/new` | Title in body type | all | fixed: title field in `h2` type (spec post/editor) |
| Moderation | `/moderation` | Extra Warnings tab | all | accepted: built by add-site-warnings, which the mockup predates |
| Auth | `/login`, `/signup` | Two pages instead of one with tabs | all | accepted: separate routes since add-authentication |
| all | all | Inputs report scrolled values as clipped | all | ok: native input scrolling |

No horizontal page overflow, untranslated keys or clipped labels were found at
any variant.
