"""Contact sheet of rendered stills: python3 promo/render/contact.py build/stills out.jpg"""
import sys
from pathlib import Path
from PIL import Image, ImageDraw
src, out = Path(sys.argv[1]), sys.argv[2]
fs = sorted(src.glob('t-*.png'))
W, H, cols = 640, 360, 3
rows = (len(fs) + cols - 1) // cols
sheet = Image.new('RGB', (W * cols, (H + 24) * rows), 'white')
d = ImageDraw.Draw(sheet)
for i, f in enumerate(fs):
    x, y = (i % cols) * W, (i // cols) * (H + 24)
    sheet.paste(Image.open(f).convert('RGB').resize((W, H)), (x, y + 24))
    d.text((x + 6, y + 6), f.stem, fill='black')
sheet.save(out, quality=85)
