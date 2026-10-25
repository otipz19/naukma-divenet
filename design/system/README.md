DiveNet is a calm, map-first place for divers: find a site, judge whether it suits you, read what others found there, log your dive. The interface stays quiet so that the map, the site facts and other divers' words carry the page.

## Content fundamentals

- **Voice:** a knowledgeable dive buddy: plain, factual, safety-minded, never hype. "Strong current at the arch", not "Epic drift dive!!!". No emoji in UI copy.
- **Address:** second person ("Log your dive"), sentence case for every label, button and title ("Write a review", "Dive log"). Uppercase only through the `caption` badge style.
- **Numbers carry units, metric only:** metres, °C, bar. Ranges with an en dash and no spaces: "6–110 m". Coordinates in decimal degrees with hemisphere: "28.5722° N, 34.5372° E". Set them in `data`.
- **Dates:** relative for recent activity ("3 days ago"), absolute for dives ("12 May 2026"), formatted with `Intl` for the active locale.
- **Every string exists in English and Ukrainian.** Ukrainian runs about 15–25% longer: never size buttons, tabs or badges to the English text.
- **Safety copy** (the disclaimer, hazard warnings) is direct and never playful. The disclaimer reads: "Information on DiveNet is for reference only and does not replace dive planning according to your agency's standards."

## Visual foundations

- **Colour.** Neutral surfaces (`surface-0` page, `surface-1` cards, `surface-2` sunken areas) with `ink` text carry most of the screen. `brand` (deep-water navy) is reserved for the header, the footer band and map cluster bubbles, with `on-brand` text. `accent` (teal) marks what you can act on: primary buttons, links, active navigation, map markers, selected filters; `on-accent` sits on accent fills. `rating` is only for stars. Status colours (`success`, `caution`, `danger`, `info`, each with a `-soft` background) appear only in badges and banners and always come with a word or icon.
- **Themes.** Light and dark share every token name; components never hard-code a theme value. The app follows the system preference by setting `data-theme` on `<html>`.
- **Contrast.** Every text token reaches 4.5:1 on the surfaces its usage note names, in both themes; `border-strong` and `focus` reach 3:1. Interactive elements show a solid 2px `focus` ring with a 2px offset; on `brand` surfaces the ring uses `focus-inverse`.
- **Type.** Manrope (`display`, `h1`–`h3`) for headings, Golos Text (`body`, `body-sm`, `label`, `caption`) for everything you read, JetBrains Mono (`data`) for measured values. All three cover Cyrillic. One `display` per page at most. Body text never goes below 14px.
- **Spacing.** A 4px base: `space-1` (4) to `space-8` (64). Cards use `space-5` padding on desktop and `space-4` on mobile; page sections are `space-6` apart; page gutters are `space-6` on desktop and `space-4` on mobile.
- **Shape.** Small radii on controls (`radius-sm`), medium on cards and banners (`radius-md`), large on dialogs and the map frame (`radius-lg`), full on avatars and cluster bubbles. Cards have a `border` hairline plus `shadow-1`; floating layers (popups, menus, dialogs) use `shadow-2`. No gradients, no coloured left-border cards.
- **Layout.** Content is centred at `content-max`; long text (posts, the review form) stays within `reading-max`. Below `bp-md` everything is one column and navigation lives in a drawer. The map page is the exception: the map fills the viewport under the header, with a `sidebar-width` panel for search, filters and results from `bp-lg` up, and a bottom sheet below it.
- **Imagery.** User photos of sites, shown 3:2 with `radius-md`, cropped with `object-fit: cover`. Without a photo, show a `surface-2` block with the site's initial in `h2`, never a stock picture.
- **Motion.** Functional only: 150 ms ease-out for hover and menu fades, 200 ms for drawers and sheets. Honour `prefers-reduced-motion` by removing transitions.

## Iconography

- **Lucide** icons (ISC licence) at 20px with 2px stroke in `currentColor`; 16px inside dense rows and badges. Common ones: `map`, `search`, `sliders-horizontal` (filters), `star`, `triangle-alert`, `info`, `circle-check`, `waves`, `anchor`, `thermometer`, `gauge` (depth), `calendar`, `camera`, `user`, `log-out`, `menu`, `x`.
- Icons accompany text; an icon-only button gets an `aria-label`. Never use emoji as icons.
- **Map markers:** a 28px teardrop in `accent` with a white `waves` glyph; selected markers grow to 36px and use `accent-strong`. Clusters are `brand` circles (`radius-full`) with the count in `on-brand` `label` text, sized 32/40/48px by count.

## Components

Button, TextField, Chip, Badge, Rating, SiteCard, Alert, AppHeader and AppFooter are specified here: each component's README says when to use it and what the consumer provides; `components/bundle.css` holds the reference styles, using only tokens.
