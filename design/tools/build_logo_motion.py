"""Render the KingdomOps logo motion (intro + short sting) from the brand kit vectors.

Geometry is copied from design/brand/svg/kingdomops-horizontal-dark.svg (unchanged shapes).
Script and timings: design/motion/roteiro.md.

Run: python3 design/tools/build_logo_motion.py [--frames-dir DIR]
Outputs (design/motion/): keyframes/*.png, storyboard.png, kingdomops-intro.mp4, kingdomops-sting.mp4
Needs: cairosvg, Pillow, ffmpeg.
"""
from __future__ import annotations

import math
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

import cairosvg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "design/motion"
W, H, FPS = 1920, 1080, 30
BG, BRONZE, IVORY = "#101214", "#B58B59", "#E8E3DA"

K = ["M0,39 L64,0 L64,59 L0,102 Z",                                        # facet A (top block)
     "M0,120 L141,16 L215,16 L108,102 L82,102 L43,140 L43,173 L0,198 Z",   # facet B (stem + arm)
     "M60,138 L87,112 L113,112 L215,198 L132,198 Z"]                       # facet C (leg)
KINGDOM = [(0, "M0,0 L30,0 L30,33 L61,0 L101,0 L54,49 L108,100 L67,100 L30,65 L30,100 L0,100 Z"),
           (116, "M0,0 L30,0 L30,100 L0,76 Z"),
           (154, "M0,0 L30,0 L64,43 L64,0 L94,0 L94,100 L66,100 L30,54 L30,100 L0,100 Z"),
           (256, "M16,0 L94,0 L77,26 L33,26 L29,30 L29,70 L33,74 L63,74 L63,63 L37,63 L54,40 L93,40 L93,85 L76,100 L16,100 L0,84 L0,16 Z"),
           (358, "M0,0 L70,0 L90,20 L90,80 L69,100 L0,100 Z M30,26 L55,26 L61,32 L61,68 L55,74 L30,74 Z"),
           (456, "M16,0 L74,0 L90,16 L90,84 L74,100 L16,100 L0,84 L0,16 Z M35,26 L55,26 L60,31 L60,69 L55,74 L35,74 L30,69 L30,31 Z"),
           (554, "M0,0 L30,0 L59,35 L88,0 L119,0 L119,100 L89,100 L89,53 L59,86 L30,53 L30,100 L0,100 Z")]
OPS = [(0, "M16,0 L74,0 L90,16 L90,84 L74,100 L16,100 L0,84 L0,16 Z M35,26 L55,26 L60,31 L60,69 L55,74 L35,74 L30,69 L30,31 Z"),
       (98, "M0,0 L71,0 L89,16 L89,52 L73,71 L30,71 L30,100 L0,100 Z M30,26 L55,26 L60,31 L60,42 L47,43 L30,70 Z"),
       (195, "M16,0 L82,0 L65,26 L31,26 L30,30 L80,58 L80,83 L65,100 L0,100 L17,74 L47,74 L48,70 L0,43 L0,16 Z")]
WORD_X, OPS_X, WORD_Y = 260, 941, 49
LOCKUP_W, K_W, K_H = 1218, 215, 198
S = 1.15                                   # logo units -> px
FINAL_X = (W - LOCKUP_W * S) / 2           # K position in the final lockup
CENTER_X = (W - K_W * S) / 2               # K alone, centered
TOP_Y = (H - K_H * S) / 2


# --- easing -----------------------------------------------------------------
def clamp(x: float) -> float:
    return max(0.0, min(1.0, x))

def prog(t: float, a: float, b: float) -> float:
    return clamp((t - a) / (b - a))

def out_cubic(x: float) -> float:
    return 1 - (1 - x) ** 3

def out_quint(x: float) -> float:
    return 1 - (1 - x) ** 5

def in_out_cubic(x: float) -> float:
    return 4 * x ** 3 if x < .5 else 1 - (-2 * x + 2) ** 3 / 2

def out_back(x: float, s: float = 1.6) -> float:
    return 1 + (s + 1) * (x - 1) ** 3 + s * (x - 1) ** 2


# --- one frame ----------------------------------------------------------------
def frame(t: float, sting: bool = False) -> str:
    # K travel: centered until 1.30 s, then slides to the lockup position.
    kx = CENTER_X if sting else CENTER_X + (FINAL_X - CENTER_X) * in_out_cubic(prog(t, 1.30, 1.95))
    # Lock impact (1.05 s): small scale pop around the K center.
    pop = 1 + 0.045 * math.sin(math.pi * prog(t, 1.02, 1.22))
    # OPS impact (2.42 s): decaying 2-axis shake.
    sh = prog(t, 2.40, 2.75)
    shake = 0 if sting or sh in (0, 1) else 6 * (1 - sh) * math.sin(sh * 40)
    cx, cy = K_W / 2, K_H / 2

    p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" viewBox="0 0 {W} {H}">',
         f'<defs><radialGradient id="v" cx="50%" cy="50%" r="75%"><stop offset="0" stop-color="#1B1E21"/>'
         f'<stop offset="1" stop-color="{BG}"/></radialGradient>',
         '<linearGradient id="g" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity="0"/>'
         '<stop offset=".5" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></linearGradient>']
    # Clip paths for the light sweeps (K only, then whole lockup).
    p.append('<clipPath id="ck">' + "".join(f'<path d="{d}"/>' for d in K) + '</clipPath>')
    p.append('<clipPath id="cl">' + "".join(f'<path d="{d}"/>' for d in K)
             + "".join(f'<path transform="translate({WORD_X + x} {WORD_Y})" d="{d}"/>' for x, d in KINGDOM)
             + "".join(f'<path transform="translate({OPS_X + x} {WORD_Y})" d="{d}"/>' for x, d in OPS) + '</clipPath>')
    p.append(f'</defs><rect width="{W}" height="{H}" fill="url(#v)"/>')
    p.append(f'<g transform="translate({kx + shake:.2f} {TOP_Y + shake * .5:.2f}) scale({S})">')

    # Scene 1: the cut line along the arm's diagonal (215,16)->(108,102), extended.
    dl = out_cubic(prog(t, 0.05, 0.55)); fade = 1 - prog(t, 0.75, 1.05)
    if dl > 0 and fade > 0:
        ux, uy = (108 - 215), (102 - 16); n = math.hypot(ux, uy); ux, uy = ux / n, uy / n
        x0, y0 = 215 + ux * -900, 16 + uy * -900
        x1, y1 = x0 + ux * 1900 * dl, y0 + uy * 1900 * dl
        p.append(f'<line x1="{x0:.1f}" y1="{y0:.1f}" x2="{x1:.1f}" y2="{y1:.1f}" stroke="{BRONZE}" '
                 f'stroke-width="1.6" opacity="{fade:.3f}"/>')

    # Scene 2: facets slide in along their own axes and lock.
    starts = [(0.45, (0, -230)), (0.35, (300, -240)), (0.55, (250, 200))]
    p.append(f'<g transform="translate({cx} {cy}) scale({pop:.4f}) translate({-cx} {-cy})">')
    for d, (t0, (ox, oy)) in zip(K, starts):
        e = prog(t, t0, t0 + 0.55)
        if e <= 0:
            continue
        k = 1 - out_back(e, 1.2)
        p.append(f'<path d="{d}" fill="{BRONZE}" opacity="{clamp(e * 3):.3f}" transform="translate({ox * k:.2f} {oy * k:.2f})"/>')
    # Scene 3: lock flash, a light band crossing the K.
    sw = prog(t, 1.02, 1.40)
    if 0 < sw < 1:
        bx = -120 + 460 * out_cubic(sw)
        p.append(f'<g clip-path="url(#ck)"><rect x="{bx:.1f}" y="-60" width="90" height="320" fill="url(#g)" '
                 f'transform="skewX(-30)"/></g>')
    p.append('</g>')

    if not sting:
        # Scene 4: KINGDOM letters rise out of a baseline cut, staggered.
        for i, (x, d) in enumerate(KINGDOM):
            e = out_quint(prog(t, 1.55 + i * 0.06, 1.55 + i * 0.06 + 0.45))
            if e <= 0:
                continue
            gx = WORD_X + x
            p.append(f'<svg x="{gx}" y="{WORD_Y}" width="130" height="100" overflow="hidden">'
                     f'<path d="{d}" fill="{IVORY}" transform="translate(0 {100 * (1 - e):.2f})"/></svg>')
        # Scene 5: OPS slams in with two ghost trails.
        for i, (x, d) in enumerate(OPS):
            t0 = 2.20 + i * 0.07
            e = prog(t, t0, t0 + 0.22)
            if e <= 0:
                continue
            for ghost, lag, op in ((2, .10, .18), (1, .05, .35), (0, 0, 1)):
                ge = out_cubic(prog(t, t0 - lag, t0 - lag + 0.22)) if ghost else out_cubic(e)
                if ghost and e >= 1:
                    continue
                sc = 1.35 - 0.35 * ge
                ox, oy = OPS_X + x + 45, WORD_Y + 50
                p.append(f'<path d="{d}" fill="{BRONZE}" fill-rule="evenodd" opacity="{op * clamp(ge * 2):.3f}" '
                         f'transform="translate({ox} {oy}) scale({sc:.4f}) translate(-45 -50)"/>')
        # Scene 6: signature sweep across the whole lockup.
        sw2 = prog(t, 2.95, 3.65)
        if 0 < sw2 < 1:
            bx = -200 + 1700 * in_out_cubic(sw2)
            p.append(f'<g clip-path="url(#cl)"><rect x="{bx:.1f}" y="-80" width="140" height="360" fill="url(#g)" '
                     f'transform="skewX(-30)"/></g>')
    p.append('</g></svg>')
    return "".join(p)


def render(t: float, path: Path, sting: bool = False, width: int = W) -> None:
    cairosvg.svg2png(bytestring=frame(t, sting).encode(), write_to=str(path), output_width=width,
                     output_height=round(width * H / W))


def video(name: str, dur: float, sting: bool, tmp: Path) -> None:
    d = tmp / name; d.mkdir()
    for i in range(round(dur * FPS)):
        render(i / FPS, d / f"{i:04d}.png", sting)
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-framerate", str(FPS), "-i", str(d / "%04d.png"),
                    "-c:v", "libx264", "-pix_fmt", "yuv420p", "-crf", "20", "-movflags", "+faststart",
                    str(OUT / f"{name}.mp4")], check=True)


KEYS = [(0.30, "01 Corte", "A bronze cut line draws across the dark."),
        (0.70, "02 Montagem", "The three K facets slide in on their own axes."),
        (1.12, "03 Trava", "The K locks: small pop and a light flash."),
        (1.80, "04 Desliza", "K moves left; KINGDOM rises from a baseline cut."),
        (2.36, "05 OPS", "OPS slams in bronze with a short shake."),
        (3.30, "06 Assinatura", "A light sweep crosses the lockup, then hold.")]


def storyboard() -> None:
    kd = OUT / "keyframes"; kd.mkdir(parents=True, exist_ok=True)
    tw, th, pad, cap = 640, 360, 24, 64
    sheet = Image.new("RGB", (pad + 2 * (tw + pad), pad + 3 * (th + cap + pad)), "#191B1D")
    dr = ImageDraw.Draw(sheet)
    try:
        f1 = ImageFont.truetype("DejaVuSans-Bold.ttf", 20); f2 = ImageFont.truetype("DejaVuSans.ttf", 16)
    except OSError:
        f1 = f2 = ImageFont.load_default()
    for i, (t, title, desc) in enumerate(KEYS):
        fp = kd / f"{title.split()[0]}-{title.split()[1].lower()}.png"
        render(t, fp)
        im = Image.open(fp).convert("RGB").resize((tw, th), Image.LANCZOS)
        x, y = pad + (i % 2) * (tw + pad), pad + (i // 2) * (th + cap + pad)
        sheet.paste(im, (x, y))
        dr.text((x, y + th + 10), f"{title}  ·  {t:.2f} s", fill=BRONZE, font=f1)
        dr.text((x, y + th + 36), desc, fill=IVORY, font=f2)
    sheet.save(OUT / "storyboard.png")


def main() -> int:
    OUT.mkdir(parents=True, exist_ok=True)
    storyboard()
    if shutil.which("ffmpeg"):
        with tempfile.TemporaryDirectory() as tmp:
            video("kingdomops-intro", 4.2, False, Path(tmp))
            video("kingdomops-sting", 1.6, True, Path(tmp))
    else:
        print("ffmpeg not found: videos skipped")
    print("motion written to", OUT.relative_to(ROOT))
    return 0


if __name__ == "__main__":
    sys.exit(main())
