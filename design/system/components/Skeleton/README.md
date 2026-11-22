# Skeleton

A grey block in the shape of content that is still loading: a heading bar, text lines, a card, an avatar.

- **Look:** `surface-2` fill, `radius-md` (`radius-full` for an avatar or a chip), no border. Blocks sit on the page's own surface and take the size of the content they stand for, so nothing jumps when the content arrives.
- **Motion:** a slow opacity pulse (1.6 s, ease-in-out). Under `prefers-reduced-motion: reduce` the block does not animate.
- **Page placeholder:** a page wraps its skeleton blocks in one region with `aria-busy="true"` and a visually hidden `role="status"` text from the locale ("Loading…"). The blocks themselves are `aria-hidden`.
- **Shapes:** keep them simple: a heading bar, a meta line and a few blocks or cards, matching the page's layout (one column on phones).
- **Consumer provides:** the width and height of each block (token or percentage), and the round variant for avatars.
