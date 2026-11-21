# Final report

The final report for the course "Проектування програмних систем". It compiles the earlier
lab reports into one document, updated to the delivered product.

## Files

| Path | What it is |
| --- | --- |
| `REPORT.md` | The source of the report (Ukrainian, pandoc Markdown). Edit this. |
| `build.py` | Builds `DiveNet_звіт.docx` from `REPORT.md` with pandoc and patches the styles. |
| `DiveNet_звіт.docx`, `DiveNet_звіт.pdf` | The generated report. Rebuild them after every edit. |
| `lab_5/screenshots/` | Wrike screenshots used as figures 4.1–4.6. |
| `../uml/png/` | UML diagrams used as figures 5.1–5.26 (built from `../uml/src`). |
| `Практична*.pdf`, `lab_5/*.pdf`, `lab_5/ЗВІТ_ППС.docx` | The original lab reports: reference only, not part of the build. |

## Build

On Windows, from this folder:

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install pypandoc_binary python-docx
.venv\Scripts\python build.py
```

`.venv/` is gitignored; `pypandoc_binary` bundles pandoc. To get the PDF with an up-to-date
table of contents, export through Word:

```powershell
$d = (Resolve-Path .).Path; $w = New-Object -ComObject Word.Application; $doc = $w.Documents.Open("$d\DiveNet_звіт.docx"); $doc.TablesOfContents | ForEach-Object { $_.Update() }; $doc.SaveAs2("$d\DiveNet_звіт.pdf", 17); $doc.Close(0); $w.Quit()
```

Check the result by rendering pages (for example with PyMuPDF) before committing.

## Structure

Title page (placeholder) → contents → Вступ → 1. Планування проєкту (lab 1, updated) →
2. Вимоги до системи (labs 2–3, updated: users, user stories US-01–US-20, functional and
non-functional requirements) → 3. Системні вимоги (lab 4, updated) → 4. План проєкту у Wrike
(lab 5) → 5. Проєктування програмного продукту (lab 6, from `../uml/REPORT.md`) → Висновки →
Перелік скорочень → Список джерел.

## Rules agreed for the text

- Never mention AI tools or how the code was produced: no agents, assistants, generated
  specs or workflow tooling. Describe the process only as iterations, pull requests and CI,
  and the UI design only as the design system and mockups in `design/`.
- Impersonal voice: "було обрано", "розробка велася", never "ми" or "команда вирішила".
  User stories keep the standard "Як дайвер, я хочу…".
- Describe the system as it is now. A change from the original plan gets a sentence or two
  of ordinary prose in its own section (microservices → monolith in 1.1, scope in 1.5,
  iterations in 1.6). No callout boxes, bold labels like "Зміна плану", or a separate
  "planned vs delivered" table.
- Keep only requirements the system actually meets. Requirements from the old labs that were
  never targeted (500 users, 99 % uptime, backups, 100 000 sites, GDPR, rate limiting, HTTPS,
  WCAG 2.2, subtitles) were dropped rather than explained.
- Labs 5 and 6 stay as written, apart from heading and figure numbering and the removal of
  OpenSpec mentions.
- Use en dashes (–), never em dashes (—).
- Facts (limits, counts, thresholds) come from `openspec/specs/`, `docs/ARCHITECTURE.md` and
  the code; check them there before changing a number.

## Formatting

Set in `build.py`: A4, margins left 2 cm, right 1.5 cm, top and bottom 2 cm; Times New Roman
14 pt, 1.5 line spacing, 1.25 cm first-line indent, justified; space after paragraphs and
headings; chapters start on a new page; tables full width in 12 pt; figures captioned
"Рисунок N.M – …" from the image alt text; page numbers in the footer; Word refreshes the
table of contents on open.

## Open items

- The title page is a placeholder until the course template is available.
