# Plan-update notes

A plan-update note records that one change (the *source*) found work that changes
the plan of another roadmap item (the *target*). The source writes a note here
instead of editing the target's row in [ROADMAP.md](../ROADMAP.md) or the target's
change folder. The target absorbs the note when it is proposed, or when it next
merges `master`. See [ADR-0010](../adr/0010-plan-update-notes.md) for why.

A note is open while its file exists. `pnpm check` (step "plan updates: notes")
fails when a note is malformed or still open for an `archived` or `dropped` item,
and lists the open notes for `proposed` and `in-progress` items.

## Where a note lives

```
docs/plan-updates/<target-change-id>/<source-change-id>--<slug>.md
```

- Only the source writes its file, so parallel branches never edit the same note.
- `<slug>` is short kebab-case: `rating-filter`, `reuse-photo-field`.
- The target must have a row in ROADMAP.md. For a new item (`kind: new-item`), the
  source adds that row; any other row it leaves alone.
- The source must be a roadmap item or an OpenSpec change.

## Format

```markdown
---
target: add-site-reviews
source: add-site-search-and-filters
kind: add-scope
stories: [US-05]
created: 2026-11-01
---
## What changes for the target
The minimum-rating filter and sorting by rating on the map.

## Why
No ratings exist before reviews; until then results are sorted by name.

## What the source already built
Filters are query parameters of GET /api/v1/sites/markers (design D1); add `minRating`
there. The filter chips are in frontend/src/site/search/.

## Roadmap edit when absorbed
Delivers: add "minimum-rating filter and sorting by rating on the map".
Stories: add "US-05 (rating)".
```

Front matter (a small YAML subset: `key: value`, `[a, b]` lists, `#` comments):

| Field | Required | Value |
| --- | --- | --- |
| `target` | yes | Change ID of the item whose plan changes; equals the folder name |
| `source` | yes | Change ID that wrote the note; the file name starts with it |
| `kind` | yes | One of the kinds below |
| `stories` | no | Story IDs that move or change, e.g. `[US-05]` |
| `created` | yes | `YYYY-MM-DD` |

Kinds:

| Kind | The target must |
| --- | --- |
| `add-scope` | Deliver more: a story, endpoint, field or UI moved from the source |
| `remove-scope` | Deliver less: the source already built it, or it moves elsewhere |
| `depends-on` | Wait for another item; the pick rule treats it as a dependency |
| `constraint` | Follow a rule the source set (a contract, a data shape, a limit) |
| `reuse` | Use something the source built instead of building its own |
| `new-item` | Exist: a new roadmap item, whose row the source adds |
| `split` | Be split into several items |
| `drop` | Be dropped, with the reason |

Body sections: `## What changes for the target` and `## Why` are required.
`## What the source already built` (paths, endpoints, decisions to reuse or undo) and
`## Roadmap edit when absorbed` are recommended: they spare the target from rebuilding
what the source knew.

## Lifecycle

1. **Write.** During propose or apply, when the work changes another item's plan, the
   source writes a note and commits it with its change. It does not edit the target's
   roadmap row, PRODUCT.md stories or change folder. A change that needs to change its
   own plan uses `/opsx:update` instead.
2. **Read before picking.** Before picking an item, read its folder here: a
   `depends-on` note counts as a dependency.
3. **Absorb.** When the target is proposed, fold every note in its folder into the
   proposal, design, tasks and specs, and list the note files under a
   `## Plan updates absorbed` heading in `proposal.md`. In the same change, apply the
   roadmap and PRODUCT.md edits the notes ask for, and delete the notes.
4. **Absorb late.** A note can land on `master` after the target was proposed or
   applied. After merging `master`, and before archiving, the target checks its folder
   and absorbs any new note with `/opsx:update`, then implements it. If it is not
   absorbed, the gate fails on the target's PR once its status is `archived`.
5. **Retarget or decline.** To hand a note to another item, move the file to that
   folder and change `target`. To decline it, delete it and give the reason under
   `## Plan updates absorbed`. A note is never deleted without that record.
