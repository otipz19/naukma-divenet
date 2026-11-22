# F-01 Signed-out visit logs a refresh 401

- **Area:** Auth
- **Status:** declined (owner, 2026-11-22: the signed-out 401 stays; it is by design, ADR-0004)
- **Delivered by:** none

## Seen
On every visit while signed out, DevTools shows
`401 POST /api/v1/auth/refresh`.

## Cause
This is by design. The access token lives only in memory (ADR-0004), so on every
page load `restoreSession()` (`frontend/src/app/AppLayout.tsx`) posts the
HttpOnly refresh cookie. JavaScript cannot tell whether that cookie exists, so a
visitor who has none gets a 401. The app correctly treats them as signed out. The
browser logs every failed request, and a page cannot hide that.

## Impact
None for users. To a reviewer with DevTools open, it looks like an error.

## Proposed fix (declined by the owner, 2026-11-22)
When the request carries **no** refresh cookie, the back-end answers `204 No Content`.
A cookie that is present but invalid, expired or replayed still gets `401`.
`refreshSession()` in `frontend/src/api/session.ts` treats 204 as signed out. This
changes the `auth` spec: add a scenario for "no cookie", and keep the 401 scenarios
for a bad cookie.

Rejected alternative: a `localStorage` marker that says "a session may exist". It
can disagree with the cookie, for example after site data is cleared.
