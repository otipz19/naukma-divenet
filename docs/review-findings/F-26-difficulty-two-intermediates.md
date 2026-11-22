# F-26 The submit-site form lists "Intermediate" twice

- **Area:** Site submission
- **Status:** done: polish-demo-walkthrough (owner decided 2026-11-22, option A)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
The Difficulty select on "Submit a dive site" offers "1 · Beginner, 2 · Intermediate,
3 · Intermediate, 4 · Advanced, 5 · Technical". Two different choices read the same.

## Cause
A site's declared difficulty is a level from 1 to 5, while the design shows four words
(`components/Badge/DifficultyBadge.tsx`: levels 2 and 3 are both "intermediate"). The
map filter and the review form already offer only the four words; the submit form is
the one place that lists the numbers.

## Fix (owner's decision, option A)
The submit form offers the four words, as the map filter and the review form do, with
no numbers. A word sends the lowest level it stands for, as the review form's chips do.
No data, API or badge change.
