"""Build the final report: REPORT.md -> DiveNet_звіт.docx.

Run from this folder with the local venv (see README.md):
    .venv/Scripts/python build.py
"""

import re
import shutil
import tempfile
import zipfile
from pathlib import Path

import docx
import pypandoc
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.shared import Cm, Pt

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "REPORT.md"
OUTPUT = HERE / "DiveNet_звіт.docx"
MAX_IMAGE_HEIGHT = Cm(22.5)

# Page and paragraph defaults, matching the earlier course reports:
# Times New Roman 14, 1.5 lines, 1.25 cm first-line indent, justified.
DOC_DEFAULTS = (
    '<w:docDefaults><w:rPrDefault><w:rPr>'
    '<w:rFonts w:ascii="Times New Roman" w:eastAsia="Times New Roman" '
    'w:hAnsi="Times New Roman" w:cs="Times New Roman"/>'
    '<w:sz w:val="28"/><w:szCs w:val="28"/><w:lang w:val="uk-UA"/>'
    '</w:rPr></w:rPrDefault><w:pPrDefault><w:pPr>'
    '<w:spacing w:after="0" w:line="360" w:lineRule="auto"/>'
    '<w:ind w:firstLine="709"/><w:jc w:val="both"/>'
    '</w:pPr></w:pPrDefault></w:docDefaults>'
)

FLAT = '<w:ind w:firstLine="0"/>'


def style(style_id, name, ppr="", rpr="", based_on="Normal", kind="paragraph", extra=""):
    return (
        f'<w:style w:type="{kind}" w:customStyle="1" w:styleId="{style_id}">'
        f'<w:name w:val="{name}"/><w:basedOn w:val="{based_on}"/>{extra}'
        f"<w:pPr>{ppr}</w:pPr><w:rPr>{rpr}</w:rPr></w:style>"
    )


HEADING_RPR = '<w:rFonts w:ascii="Times New Roman" w:hAnsi="Times New Roman" w:cs="Times New Roman"/><w:b/><w:bCs/><w:i w:val="0"/><w:color w:val="000000"/>'

STYLES = {
    "Normal": style("Normal", "Normal", based_on=""),
    "BodyText": style("BodyText", "Body Text"),
    "FirstParagraph": style("FirstParagraph", "First Paragraph", based_on="BodyText"),
    "Compact": style("Compact", "Compact", based_on="BodyText"),
    "Heading1": style(
        "Heading1",
        "heading 1",
        '<w:keepNext/><w:pageBreakBefore/><w:spacing w:before="0" w:after="240"/>'
        + FLAT
        + '<w:jc w:val="center"/><w:outlineLvl w:val="0"/>',
        HEADING_RPR + '<w:caps/><w:sz w:val="28"/>',
    ),
    "Heading2": style(
        "Heading2",
        "heading 2",
        '<w:keepNext/><w:spacing w:before="240" w:after="120"/><w:ind w:firstLine="709"/>'
        '<w:jc w:val="left"/><w:outlineLvl w:val="1"/>',
        HEADING_RPR + '<w:sz w:val="28"/>',
    ),
    "Heading3": style(
        "Heading3",
        "heading 3",
        '<w:keepNext/><w:spacing w:before="200" w:after="80"/><w:ind w:firstLine="709"/>'
        '<w:jc w:val="left"/><w:outlineLvl w:val="2"/>',
        HEADING_RPR + '<w:sz w:val="28"/>',
    ),
    "ImageCaption": style(
        "ImageCaption",
        "Image Caption",
        '<w:spacing w:before="60" w:after="240" w:line="240" w:lineRule="auto"/>' + FLAT + '<w:jc w:val="center"/>',
        '<w:i w:val="0"/>',
    ),
    "CaptionedFigure": style(
        "CaptionedFigure",
        "Captioned Figure",
        '<w:keepNext/><w:spacing w:before="120"/>' + FLAT + '<w:jc w:val="center"/>',
    ),
    "Figure": style("Figure", "Figure", '<w:keepNext/>' + FLAT + '<w:jc w:val="center"/>'),
    "BlockText": style(
        "BlockText",
        "Block Text",
        '<w:pBdr><w:left w:val="single" w:sz="18" w:space="8" w:color="7F7F7F"/></w:pBdr>'
        '<w:spacing w:before="60" w:after="60"/><w:ind w:left="284" w:firstLine="0"/>',
        '<w:sz w:val="26"/><w:szCs w:val="26"/>',
        based_on="BodyText",
    ),
    "ReportTitle": style(
        "ReportTitle",
        "Report Title",
        '<w:spacing w:before="4000" w:after="480" w:line="240" w:lineRule="auto"/>' + FLAT + '<w:jc w:val="center"/>',
        '<w:b/><w:bCs/><w:sz w:val="36"/><w:szCs w:val="36"/>',
    ),
    "ReportSubtitle": style(
        "ReportSubtitle",
        "Report Subtitle",
        '<w:spacing w:after="240" w:line="240" w:lineRule="auto"/>' + FLAT + '<w:jc w:val="center"/>',
    ),
    "TOCHeading": style(
        "TOCHeading",
        "TOC Heading",
        '<w:pageBreakBefore/><w:spacing w:after="240"/>' + FLAT + '<w:jc w:val="center"/>',
        '<w:b/><w:bCs/><w:caps/>',
    ),
    "TOC1": style("TOC1", "toc 1", FLAT + '<w:jc w:val="left"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs>'),
    "TOC2": style(
        "TOC2",
        "toc 2",
        '<w:ind w:left="284" w:firstLine="0"/><w:jc w:val="left"/><w:tabs><w:tab w:val="right" w:leader="dot" w:pos="9628"/></w:tabs>',
    ),
}


def build_reference(path: Path) -> None:
    """Write pandoc's default reference.docx with the report's styles patched in."""
    default = Path(tempfile.mkdtemp()) / "default.docx"
    pandoc = pypandoc.get_pandoc_path()
    import subprocess

    subprocess.run([pandoc, "-o", str(default), "--print-default-data-file", "reference.docx"], check=True)

    with zipfile.ZipFile(default) as zin, zipfile.ZipFile(path, "w", zipfile.ZIP_DEFLATED) as zout:
        for item in zin.infolist():
            data = zin.read(item.filename)
            if item.filename == "word/styles.xml":
                xml = data.decode("utf-8")
                xml = re.sub(r"<w:docDefaults>.*?</w:docDefaults>", DOC_DEFAULTS, xml, flags=re.S)
                for style_id, definition in STYLES.items():
                    pattern = rf'<w:style [^>]*w:styleId="{style_id}"[^>]*>.*?</w:style>'
                    if re.search(pattern, xml, flags=re.S):
                        definition = definition.replace(' w:customStyle="1"', "")
                        xml = re.sub(pattern, lambda _: definition, xml, count=1, flags=re.S)
                    else:
                        xml = xml.replace("</w:styles>", definition + "</w:styles>")
                xml = xml.replace('<w:basedOn w:val=""/>', "")
                data = xml.encode("utf-8")
            zout.writestr(item, data)


def post_process(path: Path) -> None:
    document = docx.Document(str(path))

    section = document.sections[0]
    section.page_width, section.page_height = Cm(21.0), Cm(29.7)
    section.left_margin, section.right_margin = Cm(3.0), Cm(1.5)
    section.top_margin, section.bottom_margin = Cm(2.0), Cm(2.0)

    # Tables: 12 pt, single spacing, no first-line indent, visible borders.
    for table in document.tables:
        table.style = document.styles["Table"]
        tbl_pr = table._tbl.tblPr
        qn = docx.oxml.ns.qn
        for old in tbl_pr.findall(qn("w:tblW")) + tbl_pr.findall(qn("w:tblLayout")):
            tbl_pr.remove(old)
        width = docx.oxml.OxmlElement("w:tblW")
        width.set(qn("w:w"), "5000")
        width.set(qn("w:type"), "pct")
        tbl_pr.append(width)
        layout = docx.oxml.OxmlElement("w:tblLayout")
        layout.set(qn("w:type"), "autofit")
        tbl_pr.append(layout)
        borders = tbl_pr.find(docx.oxml.ns.qn("w:tblBorders"))
        if borders is None:
            borders = docx.oxml.OxmlElement("w:tblBorders")
            tbl_pr.append(borders)
        for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
            element = docx.oxml.OxmlElement(f"w:{edge}")
            element.set(docx.oxml.ns.qn("w:val"), "single")
            element.set(docx.oxml.ns.qn("w:sz"), "4")
            element.set(docx.oxml.ns.qn("w:color"), "000000")
            borders.append(element)
        for row in table.rows:
            for cell in row.cells:
                for paragraph in cell.paragraphs:
                    fmt = paragraph.paragraph_format
                    fmt.first_line_indent = Cm(0)
                    fmt.line_spacing = 1.0
                    fmt.alignment = WD_ALIGN_PARAGRAPH.LEFT
                    for run in paragraph.runs:
                        run.font.size = Pt(12)

    # Tall diagrams: scale down to fit the page height.
    for shape in document.inline_shapes:
        if shape.height > MAX_IMAGE_HEIGHT:
            ratio = MAX_IMAGE_HEIGHT / shape.height
            shape.height = MAX_IMAGE_HEIGHT
            shape.width = int(shape.width * ratio)

    # Page numbers in the footer, centred.
    footer = section.footer.paragraphs[0]
    footer.alignment = WD_ALIGN_PARAGRAPH.CENTER
    footer.paragraph_format.first_line_indent = Cm(0)
    run = footer.add_run()
    for kind, text in (("begin", None), (None, " PAGE "), ("end", None)):
        if kind:
            element = docx.oxml.OxmlElement("w:fldChar")
            element.set(docx.oxml.ns.qn("w:fldCharType"), kind)
        else:
            element = docx.oxml.OxmlElement("w:instrText")
            element.text = text
        run._r.append(element)
    section.different_first_page_header_footer = True

    # Ask Word to refresh the table of contents on open.
    settings = document.settings.element
    update = docx.oxml.OxmlElement("w:updateFields")
    update.set(docx.oxml.ns.qn("w:val"), "true")
    settings.append(update)

    document.save(str(path))


def main() -> None:
    work = Path(tempfile.mkdtemp())
    reference = work / "reference.docx"
    build_reference(reference)
    pypandoc.convert_file(
        str(SOURCE),
        "docx",
        format="markdown",
        outputfile=str(OUTPUT),
        extra_args=[f"--reference-doc={reference}", f"--resource-path={HERE}"],
        cworkdir=str(HERE),
    )
    post_process(OUTPUT)
    shutil.rmtree(work, ignore_errors=True)
    print(f"Wrote {OUTPUT}".encode("ascii", "backslashreplace").decode())


if __name__ == "__main__":
    main()
