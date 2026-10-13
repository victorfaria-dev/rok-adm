"""Build the KingdomOps logo masters (SVG) from simple geometry + OFL font outlines.

Run: python3 design/tools/build_logo.py  (needs fonttools)
Outputs to design/logo/. Everything is vector paths: no live text.
"""
from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "logo"
OUT.mkdir(exist_ok=True)

RED = "#D1242F"      # Ops Red
STEEL = "#D5DAE1"    # Steel
IRON = "#15181E"     # Iron (dark background)

# --- Symbol: castle-top shield with a wedge K (256 grid, unit 4) -------------
SHIELD = "M40 24 H80 V52 H108 V24 H148 V52 H176 V24 H216 V150 L128 238 L40 150 Z"
# K: stem + 45° arms joined to the stem (classic K, legible at 16 px)
K = "M80 72 H108 V112 L148 72 H180 L128 124 L180 176 H148 L108 136 V176 H80 Z"


def svg(view_w, view_h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {view_w} {view_h}" '
            f'width="{view_w}" height="{view_h}" role="img" aria-labelledby="title">\n'
            f'  <title id="title">{title}</title>\n{body}\n</svg>\n')


def symbol_body(shield_fill, k_fill, cutout=False):
    if cutout:  # one-colour: K is negative space
        return f'  <path fill="{shield_fill}" fill-rule="evenodd" d="{SHIELD} {K}"/>'
    return f'  <path fill="{shield_fill}" d="{SHIELD}"/>\n  <path fill="{k_fill}" d="{K}"/>'


# --- Wordmark from font outlines ---------------------------------------------
def wordmark_path(font_file, text, cap_px):
    font = TTFont(font_file)
    gs = font.getGlyphSet()
    cmap = font.getBestCmap()
    upm = font["head"].unitsPerEm
    cap = getattr(font["OS/2"], "sCapHeight", 0) or int(upm * 0.7)
    s = cap_px / cap
    x = 0.0
    pen = SVGPathPen(gs)
    for ch in text:
        g = cmap[ord(ch)]
        tp = TransformPen(pen, (s, 0, 0, -s, x, cap_px))
        gs[g].draw(tp)
        x += gs[g].width * s
    return pen.getCommands(), x


def write(name, content):
    (OUT / name).write_text(content)


FONTS = {
    "russo": ROOT / "fonts/RussoOne-Regular.ttf",
    "chakra": ROOT / "fonts/ChakraPetch-Bold.ttf",
}

if __name__ == "__main__":
    write("symbol.svg", svg(256, 256, symbol_body(RED, STEEL), "KingdomOps symbol"))
    write("symbol-on-dark.svg", svg(256, 256,
          f'  <rect width="256" height="256" rx="48" fill="{IRON}"/>\n' + symbol_body(RED, STEEL), "KingdomOps symbol on dark"))
    write("symbol-black.svg", svg(256, 256, symbol_body("#000", None, cutout=True), "KingdomOps symbol, black"))
    write("symbol-white.svg", svg(256, 256, symbol_body("#FFF", None, cutout=True), "KingdomOps symbol, white"))
    for key, f in FONTS.items():
        d, w = wordmark_path(f, "KingdomOps", 96)
        pad = 8
        write(f"wordmark-{key}.svg", svg(int(w) + 2 * pad, 128,
              f'  <path fill="{IRON}" transform="translate({pad} 16)" d="{d}"/>', f"KingdomOps wordmark ({key})"))
        # horizontal lockup: symbol 256 tall + wordmark
        lw = 256 + 32 + int(w) + pad
        body = symbol_body(RED, STEEL) + f'\n  <path fill="{IRON}" transform="translate(288 80)" d="{d}"/>'
        write(f"lockup-horizontal-{key}.svg", svg(lw, 256, body, f"KingdomOps horizontal lockup ({key})"))
        # stacked lockup (like the reference): symbol centred over wordmark
        sw = max(int(w) + 2 * pad, 256)
        sx = (sw - 256) / 2
        body = (f'  <g transform="translate({sx} 0)">\n' + symbol_body(RED, STEEL) + '\n  </g>\n'
                f'  <path fill="{IRON}" transform="translate({(sw - w) / 2} 264)" d="{d}"/>')
        write(f"lockup-stacked-{key}.svg", svg(sw, 384, body, f"KingdomOps stacked lockup ({key})"))
    print("ok")


def metal():
    """Hero-only rendition (gradients + bevel). Never used below 64 px."""
    defs = f'''  <defs>
    <linearGradient id="red" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#F0444C"/><stop offset="0.55" stop-color="{RED}"/><stop offset="1" stop-color="#7E1118"/>
    </linearGradient>
    <linearGradient id="steel" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#FFFFFF"/><stop offset="0.45" stop-color="#C3C9D2"/><stop offset="0.55" stop-color="#8E96A3"/><stop offset="1" stop-color="#E6EAF0"/>
    </linearGradient>
  </defs>'''
    body = (defs + f'\n  <path fill="#5A0B10" transform="translate(4 6)" d="{SHIELD}"/>'
            f'\n  <path fill="url(#red)" stroke="url(#steel)" stroke-width="8" stroke-linejoin="miter" d="{SHIELD}"/>'
            f'\n  <path fill="#2A2E36" transform="translate(3 4)" d="{K}"/>'
            f'\n  <path fill="url(#steel)" d="{K}"/>')
    write("symbol-metal.svg", svg(256, 256, body, "KingdomOps symbol, metal (hero only)"))


metal()
