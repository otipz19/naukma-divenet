// Rules for plan-update notes (docs/plan-updates/README.md, ADR-0010), used by the gate step
// scripts/check-plan-updates.mjs. Pure functions: no file access.

export const KINDS = ["add-scope", "remove-scope", "depends-on", "constraint", "reuse", "new-item", "split", "drop"];
export const REQUIRED_FIELDS = ["target", "source", "kind", "created"];
export const REQUIRED_SECTIONS = ["## What changes for the target", "## Why"];
// A note for an item in one of these statuses was missed: the item can no longer absorb it.
const CLOSED_STATUSES = ["archived", "dropped"];
// A note for an item in one of these statuses must be absorbed before the item is archived.
const ACTIVE_STATUSES = ["proposed", "in-progress"];
const CHANGE_ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Change IDs and statuses from the roadmap tables: the first cell holds `id`, the last the status.
 * @param {string} markdown docs/ROADMAP.md
 * @returns {Map<string, string>}
 */
export function parseRoadmap(markdown) {
  const items = new Map();
  for (const line of markdown.split(/\r?\n/)) {
    const cells = line.split("|").slice(1, -1).map((cell) => cell.trim());
    const id = /^`([^`]+)`$/.exec(cells[0] ?? "");
    if (id && cells.length >= 2) items.set(id[1], cells[cells.length - 1].split(/\s/)[0]);
  }
  return items;
}

/**
 * Splits a note into its front matter and body. The front matter is a small YAML subset:
 * `key: value` lines, `# comments`, and `[a, b]` lists.
 * @param {string} text
 * @returns {{ fields: Record<string, string | string[]>, body: string } | null} null without front matter
 */
export function parseNote(text) {
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/.exec(text);
  if (!match) return null;
  /** @type {Record<string, string | string[]>} */
  const fields = {};
  for (const raw of match[1].split(/\r?\n/)) {
    const line = raw.replace(/\s+#.*$/, "").trim();
    if (line === "" || line.startsWith("#")) continue;
    const pair = /^([a-z_]+):\s*(.*)$/.exec(line);
    if (!pair) continue;
    const list = /^\[(.*)\]$/.exec(pair[2]);
    fields[pair[1]] = list
      ? list[1]
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      : pair[2];
  }
  return { fields, body: match[2] };
}

/**
 * @typedef {{ path: string, text: string }} NoteFile path relative to docs/plan-updates, with `/`
 * @typedef {{ problems: string[], notices: string[] }} Findings
 */

/**
 * Checks every note against the roadmap and the known change IDs.
 * @param {NoteFile[]} notes every file under docs/plan-updates except the README
 * @param {Map<string, string>} roadmap from parseRoadmap
 * @param {Set<string>} changes IDs of active and archived OpenSpec changes
 * @returns {Findings}
 */
export function findNoteProblems(notes, roadmap, changes) {
  /** @type {Findings} */
  const findings = { problems: [], notices: [] };
  for (const note of notes) checkNote(note, roadmap, changes, findings);
  return findings;
}

/**
 * @param {NoteFile} note
 * @param {Map<string, string>} roadmap
 * @param {Set<string>} changes
 * @param {Findings} findings
 */
function checkNote(note, roadmap, changes, { problems, notices }) {
  const where = `docs/plan-updates/${note.path}`;
  const parts = note.path.split("/");
  if (parts.length !== 2 || !parts[1].endsWith(".md")) {
    problems.push(`${where}: a note must be docs/plan-updates/<target>/<source>--<slug>.md`);
    return;
  }
  const [folder, file] = parts;
  const parsed = parseNote(note.text);
  if (!parsed) {
    problems.push(`${where}: no front matter (--- ... ---)`);
    return;
  }
  const { fields, body } = parsed;
  const missing = REQUIRED_FIELDS.filter((field) => typeof fields[field] !== "string" || fields[field] === "");
  if (missing.length > 0) {
    problems.push(`${where}: missing ${missing.join(", ")}`);
    return;
  }
  const target = /** @type {string} */ (fields.target);
  const source = /** @type {string} */ (fields.source);
  const kind = /** @type {string} */ (fields.kind);

  if (target !== folder) problems.push(`${where}: target ${target} does not match its folder ${folder}`);
  if (!CHANGE_ID.test(target)) problems.push(`${where}: target ${target} is not a change ID`);
  if (source === target) problems.push(`${where}: source and target are both ${target}`);
  if (!file.startsWith(`${source}--`) || !CHANGE_ID.test(file.slice(source.length + 2, -3))) {
    problems.push(`${where}: file name must be ${source}--<slug>.md`);
  }
  if (!roadmap.has(source) && !changes.has(source)) {
    problems.push(`${where}: source ${source} is neither a roadmap item nor an OpenSpec change`);
  }
  if (!KINDS.includes(kind)) problems.push(`${where}: kind ${kind} is not one of ${KINDS.join(", ")}`);
  if (!DATE.test(/** @type {string} */ (fields.created))) problems.push(`${where}: created must be YYYY-MM-DD`);
  if (fields.stories !== undefined && !Array.isArray(fields.stories)) {
    problems.push(`${where}: stories must be a list, e.g. [US-05]`);
  }
  for (const section of REQUIRED_SECTIONS) {
    if (!body.split(/\r?\n/).some((line) => line.trim() === section)) problems.push(`${where}: no "${section}" section`);
  }

  const status = roadmap.get(target);
  if (status === undefined) {
    problems.push(`${where}: target ${target} is not in docs/ROADMAP.md; add its row`);
  } else if (CLOSED_STATUSES.includes(status)) {
    problems.push(`${where}: target ${target} is ${status} but this note is still open; absorb it into ${target} or retarget it`);
  } else if (ACTIVE_STATUSES.includes(status)) {
    notices.push(`${where}: open note for ${target} (${status}); absorb it before ${target} is archived`);
  }
}
