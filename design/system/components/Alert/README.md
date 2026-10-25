# Alert

An inline banner with an icon, an optional bold title and body text: site warnings, the safety disclaimer, form-level errors and success confirmations.

- **Tones:** `info` (the safety disclaimer on the site page, neutral notices), `caution` (site warnings of type "changed conditions" and "marine life"), `danger` (site warnings of type "hazard" and "incident", form errors such as a failed login), `success` (saved, submitted for review).
- **Site warnings:** the newest warnings sit at the top of the site page, before the description; each shows type (title), text, date and author. More than two collapse behind "Show all warnings (n)".
- **Disclaimer text** comes from the locale key for the safety disclaimer; it is never dismissible.
- **Icons:** Lucide `triangle-alert` for caution and danger, `info` for info, `circle-check` for success. The icon is decorative (`aria-hidden`); the title carries the meaning.
- **Live errors:** a form-level error banner gets `role="alert"`.
- **Consumer provides:** tone, optional title, body text.
