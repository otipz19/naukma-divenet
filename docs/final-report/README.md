# Final report

`REPORT.md` is the source of the course's final report. `build.py` turns it into
`DiveNet_звіт.docx` with pandoc. Figures come from `lab_5/screenshots/` and `../uml/png/`.

Build (Windows, from this folder):

```powershell
python -m venv .venv
.venv\Scripts\python -m pip install pypandoc_binary python-docx
.venv\Scripts\python build.py
```

Open the `.docx` in Word, update the table of contents (Word offers to on open), then
save as PDF to get `DiveNet_звіт.pdf`. The title page is a placeholder until the course
template is available.
