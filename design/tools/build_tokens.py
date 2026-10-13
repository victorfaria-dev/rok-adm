"""Build KingdomOps interface tokens on top of the brand kit.

Source of truth for brand + base theme colors: design/brand/palette/kingdomops-palette.json
(delivered by Victor, not edited here). This script adds what the kit does not cover:
domain colors (confidence, spending profiles, rarity, alliance palette), typography,
spacing, radii, elevation and motion. Domain colors are solved for contrast, not picked
by eye, so every pair in design/contrast-report.md passes by construction.

Run: python3 design/tools/build_tokens.py          (writes tokens + report)
     python3 design/tools/build_tokens.py --check  (fails if outputs are stale)
"""
from __future__ import annotations

import colorsys
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
KIT = ROOT / "design/brand/palette/kingdomops-palette.json"
OUT_CSS = ROOT / "design/tokens/tokens.css"
OUT_JSON = ROOT / "design/tokens/tokens.json"
OUT_REPORT = ROOT / "design/contrast-report.md"

TEXT_AA = 4.5   # WCAG 2.2 AA, normal text
UI_AA = 3.0     # WCAG 2.2 non-text contrast (borders, tag outlines)


# --- color math (WCAG relative luminance, sRGB) -----------------------------
def hex_to_rgb(h: str) -> tuple[float, float, float]:
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) / 255 for i in (0, 2, 4))  # type: ignore[return-value]


def rgb_to_hex(rgb: tuple[float, float, float]) -> str:
    return "#" + "".join(f"{round(max(0, min(1, c)) * 255):02X}" for c in rgb)


def luminance(h: str) -> float:
    def lin(c: float) -> float:
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    r, g, b = (lin(c) for c in hex_to_rgb(h))
    return 0.2126 * r + 0.7152 * g + 0.0722 * b


def contrast(a: str, b: str) -> float:
    la, lb = sorted((luminance(a), luminance(b)), reverse=True)
    return (la + 0.05) / (lb + 0.05)


def hsl(h: float, s: float, l: float) -> str:
    return rgb_to_hex(colorsys.hls_to_rgb(h / 360, l, s))


def solve_text(hue: float, sat: float, bgs: list[str], target: float, theme: str) -> str:
    """Lightness closest to mid-tone whose contrast against every bg is >= target."""
    steps = [i / 400 for i in range(401)]
    order = steps[200:] if theme == "dark" else list(reversed(steps[:201]))
    for l in order:
        c = hsl(hue, sat, l)
        if min(contrast(c, b) for b in bgs) >= target:
            return c
    raise ValueError(f"no solution for hue {hue} in {theme}")


def solve_fill(hue: float, sat: float, lum_lo: float, lum_hi: float) -> str:
    """Fill whose luminance sits in [lum_lo, lum_hi] (closest to the middle)."""
    mid = (lum_lo + lum_hi) / 2
    best = None
    for i in range(1001):
        c = hsl(hue, sat, i / 1000)
        L = luminance(c)
        if lum_lo <= L <= lum_hi and (best is None or abs(L - mid) < abs(luminance(best) - mid)):
            best = c
    if best is None:
        raise ValueError(f"no fill for hue {hue}")
    return best


# --- inputs -----------------------------------------------------------------
kit = json.loads(KIT.read_text())
THEMES = ("dark", "light")

def surfaces(theme: str) -> list[str]:
    t = kit[theme]
    return [t["background"], t["surface"], t["surface-raised"]]

# Spending profiles: hue walks green -> crimson as spending grows (order matters, not "good/bad").
PROFILES = {"f2p": (150, .45), "low": (190, .50), "medium": (215, .55),
            "high": (260, .50), "whale": (300, .45), "kraken": (345, .60)}
# Rarity (rarity v2 in produto/ideias-3d.md). Legendary is gold, distinct from brand bronze.
RARITY = {"common": (210, .06, 4.6), "rare": (210, .18, 8.0),
          "epic": (275, .55, TEXT_AA), "legendary": (44, .80, TEXT_AA)}
# 12 alliance colors: hue, saturation. Names are what the picker shows.
ALLIANCE = [("crimson", 355, .70), ("ember", 18, .80), ("amber", 38, .85), ("lime", 80, .60),
            ("jade", 145, .55), ("teal", 175, .65), ("sky", 200, .75), ("cobalt", 222, .75),
            ("indigo", 245, .60), ("violet", 275, .55), ("orchid", 305, .50), ("rose", 335, .65)]
ALLIANCE_INK = "#101214"   # text/tag color on top of any alliance fill

# Fill luminance window: dark ink on it >= 4.5:1 and the fill as a border >= 3:1 on every surface of both themes.
ink_L = luminance(ALLIANCE_INK)
lo = TEXT_AA * (ink_L + 0.05) - 0.05
all_surf = surfaces("dark") + surfaces("light")
lo = max(lo, max(UI_AA * (luminance(s) + 0.05) - 0.05 for s in all_surf if luminance(s) < 0.1))
hi = min((luminance(s) + 0.05) / UI_AA - 0.05 for s in all_surf if luminance(s) > 0.1)

colors: dict[str, dict[str, str]] = {t: {} for t in THEMES}
for t in THEMES:
    for k, v in kit[t].items():
        colors[t][k] = v
    for k, v in kit[f"status-{t}"].items():
        colors[t][k] = v
    # Confidence reuses status hues so the app has one color language.
    colors[t].update({"confidence-high": kit[f"status-{t}"]["success"],
                      "confidence-medium": kit[f"status-{t}"]["info"],
                      "confidence-low": kit[f"status-{t}"]["warning"],
                      "confidence-pending": kit[t]["text-muted"]})
    for name, (h, s) in PROFILES.items():
        colors[t][f"profile-{name}"] = solve_text(h, s, surfaces(t), TEXT_AA, t)
    for name, (h, s, target) in RARITY.items():
        colors[t][f"rarity-{name}"] = solve_text(h, s, surfaces(t), target, t)

alliance = {name: solve_fill(h, s, lo, hi) for name, h, s in ALLIANCE}


def solve_away(base: str, bgs: list[str], target: float, theme: str) -> str:
    """Keep base's hue/saturation, move lightness away from the theme background
    (lighter on dark, darker on light) until contrast against every bg >= target."""
    hh, ll, ss = colorsys.rgb_to_hls(*hex_to_rgb(base))
    steps = [i / 1000 for i in range(1001)]
    order = [l for l in steps if l >= ll] if theme == "dark" else [l for l in reversed(steps) if l <= ll]
    for l in order:
        c = rgb_to_hex(colorsys.hls_to_rgb(hh, l, ss))
        if min(contrast(c, b) for b in bgs) >= target:
            return c
    raise ValueError(f"no solution near {base} in {theme}")


for t in THEMES:
    # Form-control borders (inputs, radio rows): >= 3:1 on every surface (WCAG 1.4.11).
    # `border` stays the kit's quiet color for decorative dividers.
    colors[t]["control-border"] = solve_away(kit[t]["border"], surfaces(t), UI_AA, t)
    # Focus ring: the kit's focus equals the accent in light (invisible on primary buttons),
    # so it is solved for >= 3:1 against every surface AND the accent button fill.
    colors[t]["focus"] = solve_away(kit[t]["focus"], surfaces(t) + [kit[t]["accent"]], UI_AA, t)

FONTS = {
    "display": "'Chakra Petch', 'Segoe UI', system-ui, sans-serif",
    "body": "'IBM Plex Sans', 'Segoe UI', system-ui, sans-serif",
    "mono": "'IBM Plex Mono', ui-monospace, 'SFMono-Regular', Menlo, monospace",
}
TYPE_SCALE = {  # size px, line-height
    "xs": (12, 1.4), "sm": (14, 1.45), "md": (16, 1.5), "lg": (18, 1.45), "xl": (20, 1.4),
    "2xl": (24, 1.3), "3xl": (30, 1.2), "4xl": (36, 1.15), "5xl": (48, 1.05)}
WEIGHTS = {"regular": 400, "medium": 500, "semibold": 600, "bold": 700}
SPACE = {str(n): f"{n * 4}px" for n in (0, 1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24)}
RADIUS = {"none": "0", "sm": "2px", "md": "4px", "lg": "8px", "pill": "999px"}
CHAMFER = {"sm": "6px", "md": "10px", "lg": "16px"}  # cut corners, echo the lettering
BORDER = {"thin": "1px", "thick": "2px"}
SHADOW = {
    "dark": {"1": "0 1px 0 rgb(255 255 255 / .04) inset, 0 1px 2px rgb(0 0 0 / .5)",
             "2": "0 1px 0 rgb(255 255 255 / .05) inset, 0 6px 16px rgb(0 0 0 / .45)",
             "3": "0 1px 0 rgb(255 255 255 / .06) inset, 0 16px 40px rgb(0 0 0 / .55)"},
    "light": {"1": "0 1px 2px rgb(25 27 29 / .08)",
              "2": "0 6px 16px rgb(25 27 29 / .10)",
              "3": "0 16px 40px rgb(25 27 29 / .14)"}}
DURATION = {"instant": "80ms", "fast": "140ms", "base": "200ms", "slow": "320ms"}
EASING = {"out": "cubic-bezier(0.23, 1, 0.32, 1)", "in-out": "cubic-bezier(0.77, 0, 0.175, 1)",
          "drawer": "cubic-bezier(0.32, 0.72, 0, 1)"}


# --- outputs ----------------------------------------------------------------
def css() -> str:
    L = ["/* KingdomOps interface tokens. Generated by design/tools/build_tokens.py, do not edit. */",
         "/* Brand + base theme colors come from design/brand/palette (Victor's kit). */",
         "", ":root {"]
    for k, v in kit["brand"].items():
        L.append(f"  --ko-{k}: {v};")
    for k, v in alliance.items():
        L.append(f"  --ko-alliance-{k}: {v};")
    L.append(f"  --ko-alliance-ink: {ALLIANCE_INK};")
    for k, v in FONTS.items():
        L.append(f"  --ko-font-{k}: {v};")
    for k, (px, lh) in TYPE_SCALE.items():
        L.append(f"  --ko-text-{k}: {px / 16:g}rem;")
        L.append(f"  --ko-leading-{k}: {lh};")
    for k, v in WEIGHTS.items():
        L.append(f"  --ko-weight-{k}: {v};")
    for k, v in SPACE.items():
        L.append(f"  --ko-space-{k}: {v};")
    for k, v in RADIUS.items():
        L.append(f"  --ko-radius-{k}: {v};")
    for k, v in CHAMFER.items():
        L.append(f"  --ko-chamfer-{k}: {v};")
    for k, v in BORDER.items():
        L.append(f"  --ko-border-{k}: {v};")
    for k, v in DURATION.items():
        L.append(f"  --ko-duration-{k}: {v};")
    for k, v in EASING.items():
        L.append(f"  --ko-ease-{k}: {v};")
    L.append("}")

    def theme_block(t: str) -> list[str]:
        out = [f"  --ko-{k}: {v};" for k, v in colors[t].items()]
        out += [f"  --ko-shadow-{k}: {v};" for k, v in SHADOW[t].items()]
        out.append(f"  color-scheme: {t};")
        return out

    # Dark is the default; light via attribute or OS preference (attribute wins).
    L += ["", ":root, [data-theme=\"dark\"] {"] + theme_block("dark") + ["}"]
    L += ["", "[data-theme=\"light\"] {"] + theme_block("light") + ["}"]
    L += ["", "@media (prefers-color-scheme: light) {", "  :root:not([data-theme]) {"]
    L += ["  " + x for x in theme_block("light")] + ["  }", "}"]
    L += ["", "@media (prefers-reduced-motion: reduce) {", "  :root {"]
    L += [f"    --ko-duration-{k}: 0ms;" for k in DURATION] + ["  }", "}", ""]
    return "\n".join(L)


def w3c() -> dict:
    def c(v: str) -> dict:
        return {"$type": "color", "$value": v}
    return {
        "brand": {k: c(v) for k, v in kit["brand"].items()},
        "theme": {t: {k: c(v) for k, v in colors[t].items()} for t in THEMES},
        "alliance": {**{k: c(v) for k, v in alliance.items()}, "ink": c(ALLIANCE_INK)},
        "font": {"family": {k: {"$type": "fontFamily", "$value": v} for k, v in FONTS.items()},
                 "size": {k: {"$type": "dimension", "$value": f"{px}px"} for k, (px, _) in TYPE_SCALE.items()},
                 "lineHeight": {k: {"$type": "number", "$value": lh} for k, (_, lh) in TYPE_SCALE.items()},
                 "weight": {k: {"$type": "fontWeight", "$value": v} for k, v in WEIGHTS.items()}},
        "space": {k: {"$type": "dimension", "$value": v} for k, v in SPACE.items()},
        "radius": {k: {"$type": "dimension", "$value": v} for k, v in RADIUS.items()},
        "chamfer": {k: {"$type": "dimension", "$value": v} for k, v in CHAMFER.items()},
        "border": {k: {"$type": "dimension", "$value": v} for k, v in BORDER.items()},
        "shadow": {t: {k: {"$type": "string", "$value": v} for k, v in SHADOW[t].items()} for t in THEMES},
        "duration": {k: {"$type": "duration", "$value": v} for k, v in DURATION.items()},
        "easing": {k: {"$type": "cubicBezier",
                       "$value": [float(x) for x in v[v.index("(") + 1:-1].split(",")]}
                   for k, v in EASING.items()},
    }


def report() -> tuple[str, int]:
    rows, fails = [], 0

    def add(theme: str, fg_name: str, fg: str, bg_name: str, bg: str, need: float) -> None:
        nonlocal fails
        r = contrast(fg, bg)
        ok = r >= need
        fails += not ok
        rows.append(f"| {theme} | `{fg_name}` {fg} | `{bg_name}` {bg} | {r:.2f}:1 | {need:g} | {'ok' if ok else '**FAIL**'} |")

    for t in THEMES:
        tc = colors[t]
        bgs = {"background": tc["background"], "surface": tc["surface"], "surface-raised": tc["surface-raised"]}
        text_keys = ["text", "text-muted", "accent", "success", "warning", "error", "info"]
        text_keys += [k for k in tc if k.startswith(("confidence-", "profile-", "rarity-"))]
        for k in text_keys:
            for bn, bv in bgs.items():
                add(t, k, tc[k], bn, bv, TEXT_AA)
        add(t, "on-accent", tc["on-accent"], "accent", tc["accent"], TEXT_AA)
        for bn, bv in {**bgs, "accent": tc["accent"]}.items():
            add(t, "focus", tc["focus"], bn, bv, UI_AA)
        for bn, bv in bgs.items():
            add(t, "control-border", tc["control-border"], bn, bv, UI_AA)
        for k, v in alliance.items():
            for bn, bv in bgs.items():
                add(t, f"alliance-{k} (border)", v, bn, bv, UI_AA)
    for k, v in alliance.items():
        add("both", "alliance-ink", ALLIANCE_INK, f"alliance-{k}", v, TEXT_AA)

    head = ["# Contrast report", "",
            "Generated by `design/tools/build_tokens.py`. WCAG 2.2: 4.5:1 for text, 3:1 for borders/focus (non-text).",
            "Passing pairs validate these color combinations only, not the accessibility of a full screen.",
            "Brand colors used as-is on light backgrounds are logo-only (the kit says: small text uses `accent` #79582F).",
            "", f"Pairs: {len(rows)}. Failures: {fails}.", "",
            "| Theme | Foreground | Background | Ratio | Min | Result |",
            "|---|---|---|---|---|---|"]
    return "\n".join(head + rows) + "\n", fails


def main() -> int:
    outputs = {OUT_CSS: css(), OUT_JSON: json.dumps(w3c(), indent=2) + "\n"}
    rep, fails = report()
    outputs[OUT_REPORT] = rep
    if "--check" in sys.argv:
        stale = [str(p.relative_to(ROOT)) for p, txt in outputs.items() if not p.exists() or p.read_text() != txt]
        if stale:
            print("stale tokens, run python3 design/tools/build_tokens.py:", *stale)
            return 1
    else:
        for p, txt in outputs.items():
            p.parent.mkdir(parents=True, exist_ok=True)
            p.write_text(txt)
    print(f"tokens ok: {len(colors['dark'])} theme colors, {len(alliance)} alliance colors, contrast failures: {fails}")
    return 1 if fails else 0


if __name__ == "__main__":
    sys.exit(main())
