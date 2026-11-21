# F-09 Visitors see actions that need an account

- **Area:** Auth UX (site page and others)
- **Status:** declined (owner, 2026-11-21: keep the actions visible as they are, no hint)
- **Delivered by:** none

## Seen
A signed-out visitor sees "Write a review", "Report a warning" and "Log a dive",
which they cannot complete without signing in.

## Cause
This is deliberate and specified. `site/details` shows "Write a review" to
"an anonymous visitor, or a signed-in user who has not reviewed" the site.
`warning/site-warnings` shows "Report a warning" to everyone, and "the form page asks
anonymous users to sign in". After sign-in, the user returns to where they were
(`features/auth/redirect`, `FromState`). This is the common "show the action, gate it
at use" pattern: it tells visitors what an account is for.

## Problem
Nothing tells the visitor in advance that the action needs an account, so the
redirect to the login page comes as a surprise.

## Options
1. *(Recommended)* Keep the actions, and mark them for visitors with a short hint
   under the button group, for example "Log in to review or report". The link label
   stays the same, so specs and tests keep their names.
2. Hide them for visitors. This is simpler, but it hides what the product does from a
   demo audience, and two specs need changing.
3. Keep as is.
