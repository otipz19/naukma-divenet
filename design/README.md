# design/

The DiveNet UI design: the design system (`system/`) and screen mockups
(`screens/`). The rules for using it are in [docs/DESIGN.md](../docs/DESIGN.md);
read that first.

## Commands

```sh
node design/build-tokens.mjs           # regenerate system/tokens.css after editing tokens.json
node design/build-tokens.mjs --check   # exit 1 if tokens.css is stale
node design/serve.mjs                  # then open http://127.0.0.1:4789/screens/Map.html
```

## Refreshing the Claude Design mirrors

Only Claude Code, signed in to the claude.ai account that owns the mirrors, can
do this. The links are in [docs/DESIGN.md](../docs/DESIGN.md#claude-design-mirrors).
Other agents skip this section; the repository files are complete without it.

**Design system** (Design System artifact type):
1. Copy `design/system/` into a staging folder as `project/`.
2. `read` the artifact's `project/design-system.json`, update its `lastChange`,
   and put it in the staging folder.
3. Publish the changed `project/…` files, with the index in the last call.
   Never publish `api/` or `manifest.json`: the page generates them.

**Screens canvas** (Design artifact type):
1. Run `node design/build-canvas.mjs <staging-dir> --created-at <the canvas's createdOnFiles.at> --ds-url <design-system link> --ds-version <its current version id>`.
2. Publish `project/canvas.json` with `project/Main.dc.html`. Add the
   `project/ds/divenet/{tokens.json,tokens.css,components/bundle.css}` entries,
   copied server-side from the design-system artifact, whenever the tokens or
   `bundle.css` changed.
3. Publish the other `project/*.dc.html` files.

**Pulling edits made on claude.ai back into the repository:**
1. `read` the changed artifact files.
2. Copy their content into the matching files here:
   - design system: `project/<path>` maps to `design/system/<path>`;
   - canvas: `project/<Screen>.dc.html` maps to the body of `design/screens/<Screen>.html`, and `Main.dc.html` is `Map.html`.
3. Run `node design/build-tokens.mjs`.
4. Commit in the same PR as the code that follows the change.
