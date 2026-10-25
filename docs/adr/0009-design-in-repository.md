# 0009. UI design kept in the repository, Claude Design as a mirror

Status: Accepted
Date: 2026-10-25

## Context
ADR-0005 says that the visual design is produced with Claude Design and recorded in
`docs/DESIGN.md`. Claude Design artifacts live in one person's claude.ai account and
are private by default. DiveNet is built by several agents (Claude Code, Codex,
Gemini CLI) and several teammates. Most of them cannot open those artifacts, and
CI never can. A design that only exists on claude.ai cannot be the source of
truth that AGENTS.md says it is.

## Decision
- The design lives in the repository:
  - `design/system/` holds the brand book, `tokens.json` (the only source of
    visual values), the generated `tokens.css`, component specs and the
    reference `bundle.css`;
  - `design/screens/` holds one plain-HTML mockup per screen;
  - `docs/DESIGN.md` holds the rules and the index.
- The file formats match the Claude Design "Design System" and "Design"
  artifact types (`tokens.json` grammar, component `README.md` and
  `preview.html`), so the repository can be published to claude.ai and read
  back without conversion. Two scripts handle the parts that differ:
  `design/build-tokens.mjs` and `design/build-canvas.mjs`.
- The claude.ai artifacts are mirrors for viewing and visual editing. Edits
  made there must be pulled back into the repository. When the two differ,
  the repository wins.
- The front-end imports `design/system/tokens.css` instead of copying values.

## Consequences
- Any agent or teammate can read and render the design without a claude.ai account.
- Design changes are reviewed in PRs like code.
- Refreshing the mirrors needs the owner's claude.ai account. A stale mirror
  is harmless, because nothing reads it as the source.
- `tokens.css` can go stale. `node design/build-tokens.mjs --check` detects
  this; adding it to the quality gate is left to `add-app-shell`, the first
  change that imports the tokens.
