# Empty-state audit

This audit checks every list against the `shared/web-app` requirement "Every list has
an empty state". A list shows a translated empty message when it has no items. It may
leave out its section only when that section offers the viewer no way to add an item.
No list shows its empty message while its data is loading.

| Page | List | When empty | Shown while loading | Verdict |
| --- | --- | --- | --- | --- |
| Map (desktop and phone sheet) | Results | `site.search.nothingFound` (after `isSuccess`; the phone sheet renders the same results) | placeholder | ok |
| Site | Reviews | `review.empty` | — | ok |
| Site | Warnings | `warning.empty` | — | ok |
| Site | Posts about this site | section left out; it has no add control, and the archived `site/details` spec asks for this | — | ok |
| Site | Gear chips | section left out; site data only, no add control | — | ok |
| Feed | Posts | `post.feed.empty` (after `isSuccess`) | placeholder | ok |
| Feed | Drafts aside | left out; no add control in the aside, "Write a post" is in the feed head | — | ok |
| Post | Region and site links | not lists, but optional links that are absent when unset | placeholder | ok |
| Dive log | Dives | `divelog.empty` (after `isSuccess`) | placeholder | ok |
| Dive form | Site picker | `divelog.form.noSites` | — | ok |
| Certificates | Own certificates | `user.certificates.none` (after `isSuccess`) | placeholder | ok |
| Moderation | Sites queue | `site.moderation.empty` (after `isSuccess`) | placeholder | ok |
| Moderation | Certificates queue | `site.moderation.certificates.empty` (after `isSuccess`) | placeholder | ok |
| Profile | Certificates | owner: `user.certificates.none`; others: left out (no add control) | page placeholder | ok |
| Profile | Gear locker | owner: `user.gear.none`; others: left out | page placeholder | ok |
| Profile | Achievements | always lists the whole catalogue (earned and unearned); left out only if the catalogue were empty, and nobody can add to it | page placeholder | ok |
| Profile | Dives | `divelog.profile.none` when the log is visible to the viewer | page placeholder | ok |
| Profile | Posts | owner: `post.profile.none`; others: left out | page placeholder | ok |
| Submit site | My submissions | `site.submit.none` | — | ok |

Result: no gaps, so no new empty message is needed.

Items named in design D5 that do not exist in the app:

- **Moderation Warnings tab.** The moderation page has only the Sites and
  Certificates tabs. Admins hide warnings on the site page instead. The "Accepted
  differences" note in `docs/DESIGN.md` still mentions a Warnings tab. That is a
  documentation mismatch outside this change, and it is reported rather than fixed
  here.
- **Site page photo gallery.** The site page has no gallery. Photos belong to
  reviews and posts, and each shows its own photos only when it has some.

Tests for the rule's scenarios:

- "Empty list with an empty message": `DiveLogPage.test.tsx` ("Every list has an
  empty state (dive log)").
- "Section left out when it offers no way to add": `Post.test.tsx` ("shows no
  section when there are no posts" on another diver's profile).
- "No empty message while loading": `Feed.test.tsx` and `DiveLogPage.test.tsx`,
  in their placeholder cases.
