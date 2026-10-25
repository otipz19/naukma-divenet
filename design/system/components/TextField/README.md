# TextField

A labelled single- or multi-line input with optional hint and error text, used in every form (login, review, dive log, post editor, site submission).

- **Structure:** label above the input, hint below it, error replaces the hint. Never use the placeholder as the label.
- **Units:** measured values put the unit in the label ("Max depth (m)", "Water temperature (°C)") and use `inputmode="decimal"`.
- **Errors:** set `aria-invalid="true"`, link the message with `aria-describedby`, and show the server's field error from `ApiError.problem.errors` under the matching field. The border becomes 2px `danger`.
- **Multi-line:** `textarea.dn-input` for review text, post body and notes; at least 120px high, resizable vertically.
- **Consumer provides:** a translated label, the field name (matching the API field for error mapping), value and change handler (React Hook Form `register`), optional hint and error.
