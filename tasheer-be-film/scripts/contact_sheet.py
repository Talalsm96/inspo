#!/usr/bin/env python3
"""Tile stills/*.png into one sheet you can LOOK at. Usage: contact_sheet.py [stills-dir] [out.png]"""
import glob, sys
from pathlib import Path
from PIL import Image

d = Path(sys.argv[1] if len(sys.argv) > 1 else 'stills')
out = Path(sys.argv[2] if len(sys.argv) > 2 else d / 'sheet.png')
files = sorted(glob.glob(str(d / 'still_*.png')))
if not files:
    sys.exit('no stills found')
w, h, cols, pad = 640, 360, 3, 6
rows = (len(files) + cols - 1) // cols
sheet = Image.new('RGB', (cols * (w + pad), rows * (h + pad)), '#c8c8c8')
for i, f in enumerate(files):
    sheet.paste(Image.open(f).convert('RGB').resize((w, h)), ((i % cols) * (w + pad), (i // cols) * (h + pad)))
sheet.save(out)
print(out, f'({len(files)} stills)')
