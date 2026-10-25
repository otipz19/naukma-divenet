# Badge

A short uppercase label for a status or category: difficulty, moderation status, certificate verification, warning type, post status.

- **Tones:** `neutral` (default; categories such as region or gear), `accent` (selected or brand facts), `success` (Approved, Verified, Published), `caution` (Pending, Draft, minor warnings), `danger` (Rejected, Hazard), `info` (neutral notices).
- **Difficulty** uses tones by level and always shows the word: Beginner `success`, Intermediate `info`, Advanced `caution`, Technical `danger`. Colour never carries the meaning alone.
- **Text:** one or two words from the locale files; the uppercase transform is CSS, so the locale keeps sentence case ("Pending review").
- **Consumer provides:** the translated text and the tone.
