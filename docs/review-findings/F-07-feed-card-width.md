# F-07 Feed cards in a left column with empty space on the right

- **Area:** Feed (`/feed`)
- **Status:** declined (owner, 2026-11-21: the card width is fine as is)
- **Delivered by:** none

## Seen
The post cards take all the width they can in their column and sit on the left.

## Cause
This follows the design on purpose. `design/screens/Feed.html` caps the post column
at `--reading-max` (720 px) inside the 1200 px page, with a drafts aside on the right.
`frontend/src/features/post/Post.module.css` (`.section`, `.columns`) does the same.
The aside shows only for a signed-in user who has drafts. For a visitor, the right
part of the page stays empty, so the column looks pushed to the left.

## Options
1. *(Recommended)* Keep the 720 px reading column, which suits long excerpts, and
   centre it when there is no aside.
2. A responsive card grid (2–3 columns of cover-led cards), like a magazine. Better use
   of a wide screen, but it departs from the mockup and needs a design update.
3. Keep as is.
