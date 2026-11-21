# F-02 Inlined font subsets are blocked by the CSP

- **Area:** Fonts / CSP
- **Status:** done: PR #38
- **Delivered by:** `fix/ui-defects`

## Seen
About 9 console errors on every page:
`Loading the font 'data:font/woff2;base64,…' violates … "font-src 'self'"`.

## Cause
Vite inlines assets under 4 KB as `data:` URIs. The smallest Fontsource subset files
fall under that limit: the `cyrillic-ext` subset of Manrope 600/700/800 and of
JetBrains Mono 500, and the `vietnamese` subset of JetBrains Mono. The strict CSP
from `harden-security` (`frontend/nginx.conf`) allows fonts only from `'self'`.

## Impact
Characters in U+0460–052F, and the hryvnia sign U+20B4, fall back to a system
font in headings (Manrope) and code (JetBrains Mono). Ukrainian **ґ/Ґ
(U+0490/0491) is in that range**, so a `uk` heading containing ґ mixes two fonts.
Body text (Golos Text) is not affected.

## Fix
Do not inline fonts. In `frontend/vite.config.ts`, set `build.assetsInlineLimit`
to a function that returns `false` for `.woff`/`.woff2` files. Keep `font-src 'self'`;
do not add `data:`. No new check (F-05 declined); verify by hand that the console
has no CSP errors on the built stack.

## Result (fix/ui-defects)
Reproduced on the stack (:8080): the console showed `font-src 'self'` violations for
`data:font/woff2` and `data:font/woff` URIs. After the fix, the built stylesheet holds no
`data:font/` URI and 14 Cyrillic `.woff2` URLs, and `document.fonts.load('700 32px Manrope', 'ґ₴')`
loads the Manrope Cyrillic faces.
