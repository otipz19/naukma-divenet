# F-04 Password field narrower than the email field

- **Area:** Auth UI (`/login`, `/register`)
- **Status:** decided
- **Delivered by:** `fix/ui-defects`

## Seen
The password input is narrower than the email input above it.

## Cause
`frontend/src/components/PasswordField/PasswordField.module.css` came with the
show/hide toggle from `audit-modern-web`. It sets
`.field { display: grid; justify-items: start }`, which shrinks the wrapped
`TextField` to its content width.

## Fix
Remove `justify-items: start` from `.field` and add `justify-self: start` to `.toggle`.
No behaviour change. No new check (F-05 declined); verify by hand on `/login` and
`/register`.
