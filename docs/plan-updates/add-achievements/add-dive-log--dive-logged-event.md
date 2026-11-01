---
target: add-achievements
source: add-dive-log
kind: add-scope
stories: [US-10]
created: 2026-11-01
---
## What changes for the target
Publish `DiveLogged` from `DiveLogService` when an entry is created, and show the achievement-unlocked banner of
`design/screens/DiveLog.html` in the dive log form after a save that earns one.

## Why
An event with no consumer would be dead code, so `add-dive-log` leaves both to the change that first uses them.

## What the source already built
`DiveLogService` in `ua.ukma.divenet.divelog.service` and the form in `frontend/src/features/divelog/`. Decide there how a deleted
entry affects progress towards a rule.

## Roadmap edit when absorbed
Delivers: add "publishes DiveLogged; the dive log form shows the unlocked banner".
