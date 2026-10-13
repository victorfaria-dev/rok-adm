"""Export favicon and app icon PNGs from Victor's brand kit SVGs (design/brand/svg)."""
from pathlib import Path

import cairosvg

ROOT = Path(__file__).resolve().parents[2]
SVG = ROOT / "design/brand/svg"
OUT = ROOT / "design/brand/export"
OUT.mkdir(parents=True, exist_ok=True)

app = (SVG / "kingdomops-app-icon.svg").read_bytes()
for size, name in [(32, "favicon-32.png"), (180, "apple-touch-icon.png"),
                   (192, "icon-192.png"), (512, "icon-512.png")]:
    cairosvg.svg2png(bytestring=app, write_to=str(OUT / name), output_width=size, output_height=size)
# 16 px and the SVG favicon use the app icon (graphite plate): the bare bronze K
# disappears on light browser tabs.
cairosvg.svg2png(bytestring=app, write_to=str(OUT / "favicon-16.png"), output_width=16, output_height=16)
(OUT / "favicon.svg").write_bytes(app)
print("icons written to", OUT.relative_to(ROOT))
