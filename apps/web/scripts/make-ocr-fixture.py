# Usage: python3 scripts/make-ocr-fixture.py e2e/fixtures
# Synthetic screenshots for the OCR e2e test, drawn with plain shapes and DejaVu Sans: no game art, no
# real account. They copy only the LAYOUT of the real 1560x720 screens (where each value sits), with
# fake values and English labels:
#   profile-synthetic.png  Governor Profile: "(ID: n)" in pale blue, name, label row / value row x2
#   vip-synthetic.png      VIP screen: "label: n" pairs, the points bar "a/b", two "VIP n" titles
import os
import sys
from PIL import Image, ImageDraw, ImageFont

out = sys.argv[1]
os.makedirs(out, exist_ok=True)
W, H = 1560, 720
DARK, PANEL, WHITE, PALE = (24, 30, 38), (26, 148, 202), (245, 250, 255), (88, 194, 233)
reg = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", s)
bold = lambda s: ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", s)

# Governor Profile
img = Image.new("RGB", (W, H), DARK)
d = ImageDraw.Draw(img)
d.rectangle((225, 45, 1335, 675), fill=(18, 92, 140))
d.rectangle((590, 130, 1290, 540), fill=PANEL)
d.text((610, 146), "Governor", font=reg(18), fill=WHITE)
d.text((702, 146), "(ID: 123456789)", font=reg(18), fill=PALE)
d.text((610, 176), "Governor123456789", font=bold(22), fill=WHITE)
for x, t in ((612, "Alliance"), (846, "Kill Points"), (1061, "Power")):
    d.text((x, 224), t, font=reg(17), fill=WHITE)
for x, t in ((613, "-"), (846, "1,234,567"), (1061, "45,678,901")):
    d.text((x, 247), t, font=bold(21), fill=WHITE)
for x, t in ((612, "Civilization"), (846, "Merit Points"), (1061, "Highest Merit")):
    d.text((x, 288), t, font=reg(17), fill=WHITE)
for x, t in ((612, "France"), (846, "0"), (1061, "0")):
    d.text((x, 309), t, font=bold(23), fill=WHITE)
img.save(os.path.join(out, "profile-synthetic.png"), optimize=True)

# VIP screen
img = Image.new("RGB", (W, H), DARK)
d = ImageDraw.Draw(img)
d.rectangle((292, 55, 1268, 668), fill=(18, 92, 140))
d.rectangle((470, 130, 1085, 215), fill=PANEL)
d.text((508, 140), "Today's points: 40", font=reg(18), fill=WHITE)
d.text((830, 140), "Login streak: 3", font=reg(18), fill=WHITE)
d.rectangle((480, 177, 1040, 203), fill=(14, 40, 60))
d.rectangle((480, 177, 780, 203), fill=(240, 196, 20))
d.text((690, 179), "6,080/11,500", font=bold(19), fill=WHITE)
d.rectangle((316, 240, 1245, 640), fill=PANEL)
d.text((470, 256), "EXCLUSIVE BUFFS VIP 5", font=bold(20), fill=WHITE)
d.text((870, 256), "EXCLUSIVE CHESTS VIP 5", font=bold(20), fill=WHITE)
img.save(os.path.join(out, "vip-synthetic.png"), optimize=True)
