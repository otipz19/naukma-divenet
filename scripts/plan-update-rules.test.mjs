// Tests for scripts/plan-update-rules.mjs (docs/plan-updates/README.md, ADR-0010).
// Run: node --test "scripts/**/*.test.mjs"
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { findNoteProblems, parseNote, parseRoadmap } from "./plan-update-rules.mjs";

const ROADMAP = `
| Change ID | Delivers | Stories | Depends on | Status |
| --- | --- | --- | --- | --- |
| \`add-media-uploads\` | Upload endpoint | — | \`add-authentication\` | archived |
| \`add-site-reviews\` | Reviews | US-03 | \`add-media-uploads\` | planned |
| \`add-site-warnings\` | Warnings | US-S1 | — | proposed |
| \`add-dive-log\` | Log | US-09 | — | in-progress |
| \`add-gear-locker\` | Equipment | dropped (out of time) |
`;
const roadmap = parseRoadmap(ROADMAP);
const changes = new Set(["add-media-uploads", "add-site-warnings"]);

/**
 * A valid note text; `overrides` replace front-matter lines, `null` removes one.
 * @param {Record<string, string | null>} overrides
 * @param {string} body
 */
function noteText(overrides = {}, body = "## What changes for the target\nMore.\n\n## Why\nBecause.\n") {
  /** @type {Record<string, string | null>} */
  const fields = {
    target: "add-site-reviews",
    source: "add-media-uploads",
    kind: "add-scope   # what the note asks for",
    stories: "[US-03, US-04]",
    created: "2026-11-01",
    ...overrides,
  };
  const lines = Object.entries(fields)
    .filter(([, value]) => value !== null)
    .map(([key, value]) => `${key}: ${value}`);
  return `---\n${lines.join("\n")}\n---\n${body}`;
}

/**
 * @param {string} text
 * @param {string} path
 */
const check = (text, path = "add-site-reviews/add-media-uploads--photos.md") =>
  findNoteProblems([{ path, text }], roadmap, changes);

describe("parseRoadmap", () => {
  it("reads each item's ID and status, including a dropped item's reason", () => {
    assert.deepEqual(
      [...roadmap],
      [
        ["add-media-uploads", "archived"],
        ["add-site-reviews", "planned"],
        ["add-site-warnings", "proposed"],
        ["add-dive-log", "in-progress"],
        ["add-gear-locker", "dropped"],
      ],
    );
  });
});

describe("parseNote", () => {
  it("reads fields, strips comments and splits lists", () => {
    const parsed = parseNote(noteText());
    assert.deepEqual(parsed?.fields, {
      target: "add-site-reviews",
      source: "add-media-uploads",
      kind: "add-scope",
      stories: ["US-03", "US-04"],
      created: "2026-11-01",
    });
    assert.match(parsed?.body ?? "", /^## What changes/);
  });

  it("reads Windows line endings", () => {
    assert.equal(parseNote(noteText().replaceAll("\n", "\r\n"))?.fields.kind, "add-scope");
  });

  it("returns null without front matter", () => {
    assert.equal(parseNote("# Just a heading\n"), null);
  });
});

describe("findNoteProblems", () => {
  it("accepts a valid note for a planned item", () => {
    assert.deepEqual(check(noteText()), { problems: [], notices: [] });
  });

  it("fails an open note for an archived item, so a missed note cannot be lost", () => {
    const text = noteText({ target: "add-media-uploads", source: "add-site-warnings" });
    assert.deepEqual(check(text, "add-media-uploads/add-site-warnings--late.md").problems, [
      "docs/plan-updates/add-media-uploads/add-site-warnings--late.md: target add-media-uploads is archived but this note is still open; absorb it into add-media-uploads or retarget it",
    ]);
  });

  it("fails an open note for a dropped item", () => {
    const text = noteText({ target: "add-gear-locker" });
    assert.match(check(text, "add-gear-locker/add-media-uploads--x.md").problems[0], /add-gear-locker is dropped/);
  });

  it("lists, without failing, open notes for proposed and in-progress items", () => {
    for (const [target, status] of [
      ["add-site-warnings", "proposed"],
      ["add-dive-log", "in-progress"],
    ]) {
      const findings = check(noteText({ target }), `${target}/add-media-uploads--x.md`);
      assert.deepEqual(findings.problems, []);
      assert.deepEqual(findings.notices, [
        `docs/plan-updates/${target}/add-media-uploads--x.md: open note for ${target} (${status}); absorb it before ${target} is archived`,
      ]);
    }
  });

  it("fails a target that is not on the roadmap", () => {
    const text = noteText({ target: "add-dive-buddies", kind: "new-item" });
    assert.deepEqual(check(text, "add-dive-buddies/add-media-uploads--x.md").problems, [
      "docs/plan-updates/add-dive-buddies/add-media-uploads--x.md: target add-dive-buddies is not in docs/ROADMAP.md; add its row",
    ]);
  });

  it("fails a note without front matter", () => {
    assert.deepEqual(check("## Why\n").problems, [
      "docs/plan-updates/add-site-reviews/add-media-uploads--photos.md: no front matter (--- ... ---)",
    ]);
  });

  it("names missing fields", () => {
    assert.deepEqual(check(noteText({ kind: null, created: null })).problems, [
      "docs/plan-updates/add-site-reviews/add-media-uploads--photos.md: missing kind, created",
    ]);
  });

  it("fails a target that does not match the folder", () => {
    assert.deepEqual(check(noteText({ target: "add-dive-log" })).problems, [
      "docs/plan-updates/add-site-reviews/add-media-uploads--photos.md: target add-dive-log does not match its folder add-site-reviews",
    ]);
  });

  it("fails a file name that does not start with the source", () => {
    assert.deepEqual(check(noteText(), "add-site-reviews/photos.md").problems, [
      "docs/plan-updates/add-site-reviews/photos.md: file name must be add-media-uploads--<slug>.md",
    ]);
  });

  it("fails an unknown source, an unknown kind, a bad date and a story that is not a list", () => {
    const text = noteText({ source: "add-nothing", kind: "maybe", created: "1 Nov", stories: "US-03" });
    assert.deepEqual(check(text, "add-site-reviews/add-nothing--x.md").problems, [
      "docs/plan-updates/add-site-reviews/add-nothing--x.md: source add-nothing is neither a roadmap item nor an OpenSpec change",
      "docs/plan-updates/add-site-reviews/add-nothing--x.md: kind maybe is not one of add-scope, remove-scope, depends-on, constraint, reuse, new-item, split, drop",
      "docs/plan-updates/add-site-reviews/add-nothing--x.md: created must be YYYY-MM-DD",
      "docs/plan-updates/add-site-reviews/add-nothing--x.md: stories must be a list, e.g. [US-05]",
    ]);
  });

  it("fails a note that targets its own source", () => {
    const text = noteText({ target: "add-site-reviews", source: "add-site-reviews" });
    assert.deepEqual(check(text, "add-site-reviews/add-site-reviews--x.md").problems, [
      "docs/plan-updates/add-site-reviews/add-site-reviews--x.md: source and target are both add-site-reviews",
    ]);
  });

  it("names each missing required section", () => {
    assert.deepEqual(check(noteText({}, "Text without sections.\n")).problems, [
      'docs/plan-updates/add-site-reviews/add-media-uploads--photos.md: no "## What changes for the target" section',
      'docs/plan-updates/add-site-reviews/add-media-uploads--photos.md: no "## Why" section',
    ]);
  });

  it("fails a file outside a target folder", () => {
    assert.deepEqual(check(noteText(), "loose.md").problems, [
      "docs/plan-updates/loose.md: a note must be docs/plan-updates/<target>/<source>--<slug>.md",
    ]);
  });
});
