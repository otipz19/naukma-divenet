# F-28 Seed pictures are drawn placeholders

- **Area:** Demo seed
- **Status:** taken: polish-demo-walkthrough (owner decided 2026-11-22)
- **Delivered by:** `polish-demo-walkthrough` (see the index)

## Seen
Every post cover and review photo is the same kind of flat drawing: a blue gradient,
light rays, bubbles and a brown reef. It works, but looks generated in a showcase.

## Cause
`backend/.../demo/service/DemoImages.java` draws the pictures on purpose
("no photos in the repository", `complete-demo-seed` design D5).

## Fix (owner's decision)
The demo seed uses real underwater photos: reefs, wrecks, caves and marine life. They
only need to fit the topic, not show the exact site. The photos are freely licensed,
kept in the repository with a credits file, and used for post covers, post photos and
review photos. Sites get no photos (owner: not needed). Before anything is downloaded,
the owner approves the photo list and its source.
