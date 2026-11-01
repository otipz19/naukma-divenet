// Plan-update notes check (gate step; docs/plan-updates/README.md, ADR-0010). Reads every note
// under docs/plan-updates/, the roadmap and the OpenSpec change folders, and checks the rules in
// plan-update-rules.mjs. Fails on a malformed note or an open note for an archived or dropped item;
// lists open notes for proposed and in-progress items without failing.
// Usage: node scripts/check-plan-updates.mjs   (exits 1 and lists each problem)
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { findNoteProblems, parseRoadmap } from "./plan-update-rules.mjs";

const ROOT = fileURLToPath(new URL("../", import.meta.url));
const NOTES_DIR = join(ROOT, "docs", "plan-updates");
const CHANGES_DIR = join(ROOT, "openspec", "changes");
// Archived change folders are named YYYY-MM-DD-<change-id>.
const ARCHIVED = /^\d{4}-\d{2}-\d{2}-(.+)$/;

/** @param {string} dir */
const subfolders = (dir) =>
  existsSync(dir)
    ? readdirSync(dir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
    : [];

/** Every file under docs/plan-updates except its README, with paths relative to that folder. */
function readNotes() {
  if (!existsSync(NOTES_DIR)) return [];
  return readdirSync(NOTES_DIR, { recursive: true, withFileTypes: true })
    .filter((entry) => entry.isFile())
    .map((entry) => join(entry.parentPath, entry.name))
    .map((path) => ({ path: relative(NOTES_DIR, path).split("\\").join("/"), text: readFileSync(path, "utf8") }))
    .filter((note) => note.path !== "README.md");
}

function main() {
  const roadmap = parseRoadmap(readFileSync(join(ROOT, "docs", "ROADMAP.md"), "utf8"));
  const changes = new Set([
    ...subfolders(CHANGES_DIR).filter((name) => name !== "archive"),
    ...subfolders(join(CHANGES_DIR, "archive")).map((name) => ARCHIVED.exec(name)?.[1] ?? name),
  ]);
  const notes = readNotes();
  const { problems, notices } = findNoteProblems(notes, roadmap, changes);
  for (const notice of notices) console.log(`notice: ${notice}`);
  if (problems.length > 0) {
    console.error(`Plan-update notes: ${problems.length} problem(s):`);
    for (const problem of problems) console.error(`- ${problem}`);
    process.exit(1);
  }
  console.log(`Plan-update notes: ${notes.length} open note(s), no problems.`);
}

main();
