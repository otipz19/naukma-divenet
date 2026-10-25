# Rating

Five stars plus the numeric value, for a site's average rating and a single review's rating; an input variant sets a review's rating.

- **Display:** filled stars in `rating`, empty stars outlined in `border-strong`; the number in `data` style with one decimal ("4.6"); the count in muted text ("(128)"). Half stars are not drawn: round the stars, keep the exact number.
- **Accessibility:** the group has `role="img"` and an `aria-label` from the locale ("Rated 4.6 out of 5, 128 reviews"). The stars are decorative.
- **Input:** five radio buttons styled as 24px stars, labelled "1 star" … "5 stars", plus a "No rating" option, because a review may be text only.
- **No reviews yet:** show "No ratings yet" in muted text instead of empty stars.
- **Consumer provides:** value (0–5, nullable), optional count, and for the input an `onChange`.
