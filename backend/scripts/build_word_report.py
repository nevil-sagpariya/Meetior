import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def set_cell_background(cell, hex_color):
    shading_xml = f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>'
    cell._tc.get_or_add_tcPr().append(parse_xml(shading_xml))

def set_table_borders(table):
    tblPr = table._tbl.tblPr
    borders_xml = f'''
    <w:tblBorders {nsdecls("w")}>
        <w:top w:val="single" w:sz="6" w:space="0" w:color="333333"/>
        <w:left w:val="single" w:sz="6" w:space="0" w:color="333333"/>
        <w:bottom w:val="single" w:sz="6" w:space="0" w:color="333333"/>
        <w:right w:val="single" w:sz="6" w:space="0" w:color="333333"/>
        <w:insideH w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
        <w:insideV w:val="single" w:sz="4" w:space="0" w:color="CCCCCC"/>
    </w:tblBorders>
    '''
    tblPr.append(parse_xml(borders_xml))

def build_docx():
    md_path = os.path.join(r"d:\Project Sem -7", "PROJECT_REPORT_MEETIOR.md")
    docx_path = os.path.join(r"d:\Project Sem -7", "PROJECT_REPORT_MEETIOR.docx")

    with open(md_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    doc = Document()

    # 1. Page Margins (1.25 inch Left for Spiral Binding, 1.0 inch Top/Bottom/Right)
    for section in doc.sections:
        section.top_margin = Inches(1.0)
        section.bottom_margin = Inches(1.0)
        section.left_margin = Inches(1.25)
        section.right_margin = Inches(1.0)
        section.different_first_page_header_footer = False

    # 2. Configure Normal Style (Times New Roman, 12pt, Justified)
    normal_style = doc.styles['Normal']
    normal_font = normal_style.font
    normal_font.name = 'Times New Roman'
    normal_font.size = Pt(12)
    normal_font.color.rgb = RGBColor(0x11, 0x11, 0x11)
    normal_style.paragraph_format.line_spacing = 1.15
    normal_style.paragraph_format.space_after = Pt(6)
    normal_style.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

    # Parser State Machine
    in_code_block = False
    code_lines = []
    code_lang = ""
    in_table = False
    table_rows = []

    def flush_table():
        nonlocal in_table, table_rows
        if not table_rows:
            in_table = False
            return

        # Parse markdown table
        parsed_rows = []
        for r in table_rows:
            # Skip separator line | :--- | :--- |
            if re.match(r'^\s*\|?[\s\-:]+\|[\s\-:|]+\s*$', r):
                continue
            cells = [c.strip() for c in r.strip().strip('|').split('|')]
            parsed_rows.append(cells)

        if not parsed_rows:
            in_table = False
            table_rows = []
            return

        num_cols = max(len(row) for row in parsed_rows)
        # Normalize rows to same column count
        for r in parsed_rows:
            while len(r) < num_cols:
                r.append("")

        table = doc.add_table(rows=len(parsed_rows), cols=num_cols)
        table.alignment = WD_TABLE_ALIGNMENT.CENTER
        set_table_borders(table)

        for row_idx, row_data in enumerate(parsed_rows):
            row = table.rows[row_idx]
            is_header = (row_idx == 0)
            for col_idx, cell_value in enumerate(row_data):
                cell = row.cells[col_idx]
                set_cell_margins(cell, top=120, bottom=120, left=140, right=140)
                cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER

                # Clean cell text (remove bold stars, math delimiters)
                clean_val = cell_value.replace('**', '').replace('\\$', '$').replace('`', '')
                clean_val = clean_val.replace('\\ge', '≥').replace('\\le', '≤').replace('\\rightarrow', '→')

                p = cell.paragraphs[0]
                p.alignment = WD_ALIGN_PARAGRAPH.CENTER if (is_header or col_idx == 0 or len(clean_val) < 8) else WD_ALIGN_PARAGRAPH.LEFT
                p.paragraph_format.space_after = Pt(2)
                p.paragraph_format.line_spacing = 1.05
                run = p.add_run(clean_val)
                run.font.name = 'Times New Roman'
                run.font.size = Pt(10) if num_cols > 3 else Pt(11)

                if is_header:
                    run.font.bold = True
                    set_cell_background(cell, "EAECEE")
                elif row_idx % 2 == 1:
                    set_cell_background(cell, "FBFBFC")

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(6)
        in_table = False
        table_rows = []

    def flush_code():
        nonlocal in_code_block, code_lines, code_lang
        if not code_lines:
            in_code_block = False
            return

        full_code = "".join(code_lines).strip()
        # Add a shaded single cell table for code block
        tbl = doc.add_table(rows=1, cols=1)
        tbl.alignment = WD_TABLE_ALIGNMENT.CENTER
        cell = tbl.rows[0].cells[0]
        set_cell_background(cell, "F4F6F7")
        set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
        
        tcPr = cell._tc.get_or_add_tcPr()
        borders_xml = f'''
        <w:tcBorders {nsdecls("w")}>
            <w:top w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>
            <w:left w:val="single" w:sz="18" w:space="0" w:color="2980B9"/>
            <w:bottom w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>
            <w:right w:val="single" w:sz="6" w:space="0" w:color="BDC3C7"/>
        </w:tcBorders>
        '''
        tcPr.append(parse_xml(borders_xml))

        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.line_spacing = 1.15
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        run = p.add_run(full_code)
        run.font.name = 'Consolas'
        run.font.size = Pt(9.5)
        run.font.color.rgb = RGBColor(0x2C, 0x3E, 0x50)

        p_spacer = doc.add_paragraph()
        p_spacer.paragraph_format.space_after = Pt(6)
        in_code_block = False
        code_lines = []
        code_lang = ""

    # Parse lines
    for line in lines:
        stripped = line.strip()

        # Handle Code Fences
        if stripped.startswith("```"):
            if in_code_block:
                flush_code()
            else:
                if in_table:
                    flush_table()
                in_code_block = True
                code_lang = stripped[3:].strip()
                code_lines = []
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        # Handle Table Rows
        if stripped.startswith("|") and stripped.endswith("|"):
            if not in_table:
                in_table = True
                table_rows = []
            table_rows.append(stripped)
            continue
        elif in_table:
            flush_table()

        # Handle Empty Lines
        if not stripped:
            continue

        # Handle Headings
        if stripped.startswith("# "):
            title_text = stripped[2:].strip()
            # If main chapter, add page break
            if doc.paragraphs and len(doc.paragraphs) > 5 and ("CHAPTER" in title_text.upper() or "ROMAN" in title_text.upper() or "INDEX" in title_text.upper()):
                doc.add_page_break()
            
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            p.paragraph_format.space_before = Pt(18)
            p.paragraph_format.space_after = Pt(10)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(title_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(16)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

        elif stripped.startswith("## "):
            sub_text = stripped[3:].strip()
            if doc.paragraphs and len(doc.paragraphs) > 5 and ("CHAPTER" in sub_text.upper() or "ROMAN" in sub_text.upper()):
                doc.add_page_break()

            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(14)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(sub_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(14)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x00, 0x00, 0x00)

        elif stripped.startswith("### "):
            sub3_text = stripped[4:].strip()
            p = doc.add_paragraph()
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            p.paragraph_format.space_before = Pt(10)
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.keep_with_next = True
            run = p.add_run(sub3_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(13)
            run.font.bold = True
            run.font.color.rgb = RGBColor(0x1B, 0x3A, 0x4B)

        elif stripped.startswith("> "):
            # Blockquote
            quote_text = stripped[2:].strip().replace('**', '')
            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.4)
            p.paragraph_format.right_indent = Inches(0.4)
            p.paragraph_format.space_before = Pt(6)
            p.paragraph_format.space_after = Pt(8)
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
            run = p.add_run(quote_text)
            run.font.name = 'Times New Roman'
            run.font.size = Pt(11.5)
            run.font.italic = True
            run.font.color.rgb = RGBColor(0x44, 0x44, 0x44)

        elif stripped.startswith("* ") or stripped.startswith("- "):
            # Bullet point
            item_text = stripped[2:].strip()
            p = doc.add_paragraph(style='List Bullet')
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            # Parse bold spans
            parts = re.split(r'(\*\*.*?\*\*)', item_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(12)
                    r.font.bold = True
                else:
                    clean = part.replace('\\$', '$').replace('`', '')
                    r = p.add_run(clean)
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(12)

        elif re.match(r'^\d+\.\s', stripped):
            # Numbered list
            m = re.match(r'^(\d+)\.\s(.*)$', stripped)
            num = m.group(1)
            item_text = m.group(2)

            p = doc.add_paragraph()
            p.paragraph_format.left_indent = Inches(0.25)
            p.paragraph_format.space_after = Pt(4)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            r_num = p.add_run(f"{num}. ")
            r_num.font.name = 'Times New Roman'
            r_num.font.size = Pt(12)
            r_num.font.bold = True

            parts = re.split(r'(\*\*.*?\*\*)', item_text)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(12)
                    r.font.bold = True
                else:
                    clean = part.replace('\\$', '$').replace('`', '')
                    r = p.add_run(clean)
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(12)

        elif stripped == "---":
            # Section divider / horizontal rule
            continue
        else:
            # Regular paragraph
            p = doc.add_paragraph()
            p.paragraph_format.space_after = Pt(6)
            p.paragraph_format.line_spacing = 1.15
            p.paragraph_format.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY

            parts = re.split(r'(\*\*.*?\*\*)', stripped)
            for part in parts:
                if part.startswith('**') and part.endswith('**'):
                    r = p.add_run(part[2:-2])
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(12)
                    r.font.bold = True
                else:
                    clean = part.replace('\\$', '$').replace('`', '').replace('\\ge', '≥').replace('\\le', '≤').replace('\\rightarrow', '→')
                    r = p.add_run(clean)
                    r.font.name = 'Times New Roman'
                    r.font.size = Pt(12)

    if in_table:
        flush_table()
    if in_code_block:
        flush_code()

    doc.save(docx_path)
    print(f"WORD REPORT GENERATED SUCCESSFULLY: {docx_path}")

if __name__ == '__main__':
    build_docx()
