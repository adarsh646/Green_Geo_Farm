import fitz
import sys

def extract_text(pdf_path, start_page=0):
    doc = fitz.open(pdf_path)
    text = ""
    start_idx = max(0, start_page - 1)
    for i in range(start_idx, len(doc)):
        text += f"\n--- Page {i+1} ---\n"
        text += doc[i].get_text()
    
    with open('output_2.txt', 'w', encoding='utf-8') as f:
        f.write(text)

if __name__ == '__main__':
    extract_text('Assessment of Bio-CNG as a Vehicular Fuel in India_260517_103637.pdf', 1)
