// Self-hosted fonts (docs/DESIGN.md). Each file declares every subset, Cyrillic included, with
// `unicode-range`, so a browser downloads only what a page needs. Import exactly the weights in use.
// Manrope: headings (h3 600; display, h1, h2 700; the wordmark 800).
import "@fontsource/manrope/600.css";
import "@fontsource/manrope/700.css";
import "@fontsource/manrope/800.css";
// Golos Text: body and body-sm 400; label and caption 500; strong text 600.
import "@fontsource/golos-text/400.css";
import "@fontsource/golos-text/500.css";
import "@fontsource/golos-text/600.css";
// JetBrains Mono: data 500.
import "@fontsource/jetbrains-mono/500.css";
