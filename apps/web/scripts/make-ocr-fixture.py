# Usage: python3 scripts/make-ocr-fixture.py e2e/fixtures/profile-synthetic.png
# Synthetic "profile screen" fixture for the OCR e2e test: plain text drawn on a flat background.
# No game art: only words and numbers in DejaVu Sans.
from PIL import Image, ImageDraw, ImageFont
import sys

out = sys.argv[1]
W, H = 720, 360
img = Image.new("RGB", (W, H), (32, 36, 44))
d = ImageDraw.Draw(img)
big = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 34)
mid = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 30)
d.text((40, 30), "Governor Profile", font=big, fill=(240, 240, 240))
d.text((40, 100), "Name: Test Governor", font=mid, fill=(230, 230, 230))
d.text((40, 150), "Power 45,678,901", font=mid, fill=(230, 230, 230))
d.text((40, 200), "VIP 12", font=mid, fill=(230, 230, 230))
d.text((40, 250), "City Hall Lv. 22", font=mid, fill=(230, 230, 230))
d.text((40, 300), "Kill Points 1,234,567", font=mid, fill=(230, 230, 230))
img.save(out, optimize=True)
