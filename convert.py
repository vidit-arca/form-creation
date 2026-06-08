import markdown
from fpdf import FPDF
import sys
import os
import re

class ProfessionalPDF(FPDF):
    def header(self):
        if self.page_no() > 1:
            self.set_font('Helvetica', 'I', 8)
            self.set_text_color(150, 150, 150)
            self.cell(0, 10, 'HaloFormCraft: Technical Specification', align='R')
            self.ln(10)

    def footer(self):
        self.set_y(-15)
        self.set_font('Helvetica', 'I', 8)
        self.set_text_color(150, 150, 150)
        self.cell(0, 10, f'Page {self.page_no()}', align='C')

def convert_md_to_pdf(md_file_path, pdf_file_path):
    if not os.path.exists(md_file_path):
        print(f"Error: {md_file_path} not found")
        return

    with open(md_file_path, 'r', encoding='utf-8') as f:
        md_text = f.read()

    # 1. SANITIZE: Use ASCII-safe versions of characters for standard PDF fonts
    # This prevents the "Not enough space" and "Unicode" errors in fpdf2
    clean_text = md_text.replace('\u2013', '-').replace('\u2014', '--')
    clean_text = clean_text.replace('\u2019', "'").replace('\u201c', '"').replace('\u201d', '"')
    clean_text = clean_text.replace('\u2022', '*')
    # Sanitize any remaining non-ascii characters to avoid parser crashes
    clean_text = clean_text.encode('ascii', 'ignore').decode('ascii')
    
    # 2. CONVERT: Markdown to HTML
    html_content = markdown.markdown(clean_text, extensions=['extra', 'tables'])

    # 3. SCALE: Ensure images fit the page width
    # We inject a width attribute to constrain large diagrams
    html_content = re.sub(r'<img (.*?)src="(.*?)"(.*?)>', r'<img \1src="\2" width="480" \3>', html_content)

    # 4. GENERATE: Create PDF
    pdf = ProfessionalPDF()
    pdf.set_margins(20, 20, 20)
    
    # Title Page
    pdf.add_page()
    pdf.ln(50)
    pdf.set_font('Helvetica', 'B', 24)
    pdf.set_text_color(44, 62, 80)
    pdf.multi_cell(0, 15, "HaloFormCraft\nTechnical Documentation", align='C')
    pdf.ln(10)
    pdf.set_font('Helvetica', '', 14)
    pdf.set_text_color(127, 140, 141)
    pdf.cell(0, 10, "Current Application & System Specification", align='C')
    pdf.ln(100)
    pdf.set_font('Helvetica', 'I', 10)
    pdf.cell(0, 10, "Generated for Internal Audit - May 2026", align='C')
    
    pdf.add_page()
    
    # Reset fonts and colors for content
    pdf.set_font('Helvetica', '', 10)
    pdf.set_text_color(51, 51, 51)
    
    try:
        # Native write_html supports <b>, <i>, <h1>..<h6>, <ul>, <li>, and <table>
        pdf.write_html(html_content)
    except Exception as e:
        print(f"HTML Parser Alert: {e}. Falling back to clean text mode.")
        pdf.add_page()
        pdf.multi_cell(0, 5, clean_text)

    pdf.output(pdf_file_path)
    print(f"Successfully generated Professional PDF: {pdf_file_path}")

if __name__ == "__main__":
    input_file = "/Users/apple/Desktop/form-creation/Diagrams/high_level_design.md"
    output_file = "/Users/apple/Desktop/form-creation/Diagrams/high_level_design.pdf"
    convert_md_to_pdf(input_file, output_file)
