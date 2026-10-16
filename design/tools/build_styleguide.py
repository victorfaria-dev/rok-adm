"""Build design/styleguide.html: a self-contained style guide (tokens + logos inlined).

Self-contained so the same file opens from the repo and publishes as a claude.ai artifact.
Run after build_tokens.py.
"""
import base64
import re
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SVG = ROOT / "design/brand/svg"
tokens = (ROOT / "design/tokens/tokens.css").read_text()


def themed(name: str, uid: str) -> str:
    """Inline a dark-variant logo whose colors follow the theme tokens."""
    s = (SVG / name).read_text()
    s = re.sub(r"<title[^>]*>.*?</title><desc[^>]*>.*?</desc>", "<title>KingdomOps</title>", s, flags=re.S)
    s = s.replace('aria-labelledby="title desc"', "")
    s = s.replace('fill="#B58B59"', 'style="fill:var(--ko-bronze)"')
    s = s.replace('fill="#E8E3DA"', 'style="fill:var(--ko-text)"')
    return s.replace("<svg ", f'<svg class="{uid}" ', 1)


def img(name: str, cls: str, alt: str) -> str:
    b = base64.b64encode((SVG / name).read_bytes()).decode()
    return f'<img class="{cls}" src="data:image/svg+xml;base64,{b}" alt="{alt}">'


def var_hex(theme_block: str, key: str) -> str:
    m = re.search(rf"--ko-{key}: (#[0-9A-F]{{6}});", theme_block)
    return m.group(1) if m else ""


dark_block = tokens[tokens.index(':root, [data-theme="dark"]'):tokens.index('[data-theme="light"] {')]
light_block = tokens[tokens.index('[data-theme="light"] {'):tokens.index("@media")]
root_block = tokens[:tokens.index(':root, [data-theme="dark"]')]


def swatches(keys: list[str]) -> str:
    out = []
    for k in keys:
        d, l = var_hex(dark_block, k), var_hex(light_block, k)
        out.append(f'<div class="sw"><span class="chip" style="background:var(--ko-{k})"></span>'
                   f'<span class="sw-name">{k}</span><span class="sw-hex">{d} · {l}</span></div>')
    return "\n".join(out)


ALLY = ["crimson", "ember", "amber", "lime", "jade", "teal", "sky", "cobalt", "indigo", "violet", "orchid", "rose"]
TAGS = ["ABC", "WAR", "K9X", "OPS", "SUN", "RVN", "IRN", "TDE", "AXE", "LUX", "NOX", "FAE"]
alliance = "\n".join(
    f'<div class="ally"><span class="tag" style="background:var(--ko-alliance-{a})">[{t}]</span>'
    f'<span class="ring" style="--c:var(--ko-alliance-{a})"><b>G</b></span>'
    f'<span class="sw-name">{a}</span><span class="sw-hex">{var_hex(root_block, "alliance-" + a)}</span></div>'
    for a, t in zip(ALLY, TAGS))

TYPE = [("5xl", "display", "City Hall 22 → 25"), ("4xl", "display", "KvK 1 prep"),
        ("3xl", "display", "Daily routine · 45 min"), ("2xl", "display", "Farm targets"),
        ("xl", "body", "Gather 1.2M wood before the reset."), ("lg", "body", "Your profile: F2P, farm account, day 23."),
        ("md", "body", "Verified on patch 1.1.09. Two sources agree, one is older than the current season."),
        ("sm", "body", "Estimate: 6 min. Measure it in-game to replace this number."),
        ("xs", "mono", "A01-0014 · confidence medium · 2026-10-13")]
type_rows = "\n".join(
    f'<div class="trow"><span class="tmeta">{k} · {f}</span>'
    f'<span style="font:var(--ko-weight-{"bold" if f == "display" else "regular"}) var(--ko-text-{k})/var(--ko-leading-{k}) var(--ko-font-{f})">{t}</span></div>'
    for k, f, t in TYPE)

space = "\n".join(f'<div class="sp"><span class="bar" style="width:var(--ko-space-{n})"></span><span class="sw-hex">space-{n} · {int(n) * 4}px</span></div>'
                  for n in ("1", "2", "3", "4", "6", "8", "12", "16"))

page = f"""<title>KingdomOps Style Guide</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:wght@400;500;600&display=swap">
<style>
{tokens}
/* Page layout: single column of labelled specimen sections; dark-first, follows the viewer theme. */
* {{ box-sizing: border-box; }}
body {{ margin: 0; background: var(--ko-background); color: var(--ko-text); font: var(--ko-weight-regular) var(--ko-text-md)/var(--ko-leading-md) var(--ko-font-body); }}
.wrap {{ max-width: 1040px; margin: 0 auto; padding-inline: 16px; padding-block: var(--ko-space-8) var(--ko-space-16); display: grid; grid-template-columns: minmax(0, 1fr); gap: var(--ko-space-12); }}
img, svg {{ max-width: 100%; }}
header {{ display: grid; gap: var(--ko-space-4); }}
.top {{ display: flex; justify-content: space-between; align-items: center; gap: var(--ko-space-4); flex-wrap: wrap; }}
.hero {{ width: min(100%, 640px); height: auto; display: block; }}
.top > svg {{ flex: 1 1 260px; min-width: 0; }}
.lede {{ color: var(--ko-text-muted); max-width: 62ch; margin: 0; }}
h2 {{ font: var(--ko-weight-bold) var(--ko-text-xl)/1.2 var(--ko-font-display); letter-spacing: .06em; text-transform: uppercase; margin: 0; text-wrap: balance; }}
h2 small {{ display: block; font: var(--ko-weight-regular) var(--ko-text-sm)/1.4 var(--ko-font-body); letter-spacing: 0; text-transform: none; color: var(--ko-text-muted); margin-top: var(--ko-space-1); }}
section {{ display: grid; gap: var(--ko-space-5); }}
.btn {{ font: var(--ko-weight-semibold) var(--ko-text-sm)/1 var(--ko-font-display); letter-spacing: .08em; text-transform: uppercase; border: 0; cursor: pointer;
  padding: var(--ko-space-3) var(--ko-space-5); background: var(--ko-accent); color: var(--ko-on-accent);
  clip-path: polygon(var(--ko-chamfer-sm) 0, 100% 0, 100% calc(100% - var(--ko-chamfer-sm)), calc(100% - var(--ko-chamfer-sm)) 100%, 0 100%, 0 var(--ko-chamfer-sm));
  transition: background var(--ko-duration-fast) var(--ko-ease-out), transform var(--ko-duration-fast) var(--ko-ease-out); }}
.btn:hover {{ background: var(--ko-accent-hover); }}
.btn:active {{ background: var(--ko-accent-pressed); transform: scale(.97); }}
.btn.ghost {{ background: transparent; color: var(--ko-text); box-shadow: inset 0 0 0 1px var(--ko-border); }}
.btn:focus-visible, button:focus-visible {{ outline: 2px solid var(--ko-focus); outline-offset: 3px; }}
.panels {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: var(--ko-space-4); }}
.panel {{ background: var(--ko-background); color: var(--ko-text); border: 1px solid var(--ko-border); padding: var(--ko-space-6); display: grid; gap: var(--ko-space-5); align-content: start; }}
.panel .cap {{ font: var(--ko-text-xs)/1.4 var(--ko-font-mono); color: var(--ko-text-muted); }}
.panel img.h {{ width: 100%; height: auto; }}
.row {{ display: flex; gap: var(--ko-space-5); align-items: end; flex-wrap: wrap; }}
.row img {{ display: block; }}
.grid {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 210px), 1fr)); gap: var(--ko-space-3) var(--ko-space-5); }}
.sw {{ display: grid; grid-template-columns: 36px 1fr; column-gap: var(--ko-space-3); align-items: center; }}
.chip {{ grid-row: span 2; width: 36px; height: 36px; border: 1px solid var(--ko-border); }}
.sw-name {{ font: var(--ko-weight-medium) var(--ko-text-sm)/1.3 var(--ko-font-body); }}
.sw-hex {{ font: var(--ko-text-xs)/1.3 var(--ko-font-mono); color: var(--ko-text-muted); font-variant-numeric: tabular-nums; }}
.pills {{ display: flex; flex-wrap: wrap; gap: var(--ko-space-2); }}
.pill {{ font: var(--ko-weight-semibold) var(--ko-text-xs)/1 var(--ko-font-display); letter-spacing: .08em; text-transform: uppercase; padding: 6px 10px; border: 1px solid currentColor; }}
.pill.pend {{ border-style: dashed; }}
.card {{ background: var(--ko-surface); border: 1px solid var(--ko-border); padding: var(--ko-space-5); display: grid; gap: var(--ko-space-3); box-shadow: var(--ko-shadow-2);
  clip-path: polygon(0 0, calc(100% - var(--ko-chamfer-md)) 0, 100% var(--ko-chamfer-md), 100% 100%, 0 100%); }}
.card h3 {{ margin: 0; font: var(--ko-weight-bold) var(--ko-text-lg)/1.2 var(--ko-font-display); }}
.task {{ display: grid; grid-template-columns: 1fr auto; gap: var(--ko-space-2); padding-block: var(--ko-space-2); border-top: 1px solid var(--ko-border); font-size: var(--ko-text-sm); }}
.task span:last-child {{ font-family: var(--ko-font-mono); font-variant-numeric: tabular-nums; color: var(--ko-text-muted); }}
.ally {{ display: grid; grid-template-columns: auto auto 1fr; grid-template-rows: auto auto; column-gap: var(--ko-space-3); align-items: center; }}
.ally .tag, .ally .ring {{ grid-row: span 2; }}
.tag {{ color: var(--ko-alliance-ink); font: var(--ko-weight-bold) var(--ko-text-sm)/1 var(--ko-font-mono); padding: 6px 8px; }}
.ring {{ width: 40px; height: 40px; border-radius: 50%; border: 3px solid var(--c); display: grid; place-items: center; background: var(--ko-surface-raised); font-family: var(--ko-font-display); }}
.trow {{ display: grid; gap: var(--ko-space-1); padding-block: var(--ko-space-3); border-top: 1px solid var(--ko-border); min-width: 0; overflow-wrap: anywhere; }}
.tmeta {{ font: var(--ko-text-xs)/1 var(--ko-font-mono); color: var(--ko-text-muted); }}
.sp {{ display: flex; align-items: center; gap: var(--ko-space-3); }}
.bar {{ height: 12px; background: var(--ko-accent); }}
.shapes {{ display: flex; gap: var(--ko-space-4); flex-wrap: wrap; }}
.shape {{ width: 96px; height: 64px; background: var(--ko-surface-raised); border: 1px solid var(--ko-border); display: grid; place-items: center; font: var(--ko-text-xs)/1 var(--ko-font-mono); color: var(--ko-text-muted); }}
.shape.ch {{ border: 0; clip-path: polygon(var(--ko-chamfer-md) 0, 100% 0, 100% calc(100% - var(--ko-chamfer-md)), calc(100% - var(--ko-chamfer-md)) 100%, 0 100%, 0 var(--ko-chamfer-md)); }}
.elev {{ width: 120px; height: 72px; background: var(--ko-surface); display: grid; place-items: center; font: var(--ko-text-xs)/1 var(--ko-font-mono); color: var(--ko-text-muted); }}
.note {{ font-size: var(--ko-text-sm); color: var(--ko-text-muted); max-width: 70ch; margin: 0; }}
.motion {{ display: flex; gap: var(--ko-space-3); flex-wrap: wrap; align-items: center; }}
.dot {{ width: 28px; height: 28px; background: var(--ko-bronze); transition: transform var(--ko-duration-slow) var(--ko-ease-out); }}
.motion:hover .dot, .motion:focus-within .dot {{ transform: translateX(120px); }}
</style>

<div class="wrap">
<header>
  <div class="top">
    {themed("kingdomops-horizontal-dark.svg", "hero")}
    <button class="btn ghost" id="theme" type="button">Switch theme</button>
  </div>
  <p class="lede">Brand and interface tokens for KingdomOps, the account and kingdom planner. Logos and brand colors come from the approved kit; everything else is generated from it with contrast checked (0 failures, see <code>design/contrast-report.md</code>).</p>
</header>

<section>
  <h2>Logo<small>Use the dark version on dark grounds and the light version on light grounds. Never stretch, rotate or add bevels.</small></h2>
  <div class="panels">
    <div class="panel" data-theme="dark">{img("kingdomops-horizontal-dark.svg", "h", "KingdomOps horizontal, dark")}
      <div class="row">{img("kingdomops-compact-dark.svg", "", "compact").replace("<img", "<img width=\"240\"")}</div>
      <span class="cap">horizontal ≥ 240px · compact ≥ 180px</span></div>
    <div class="panel" data-theme="light">{img("kingdomops-horizontal-light.svg", "h", "KingdomOps horizontal, light")}
      <div class="row">{img("kingdomops-compact-light.svg", "", "compact").replace("<img", "<img width=\"240\"")}</div>
      <span class="cap">bronze kept on light grounds (logo only)</span></div>
  </div>
  <div class="row">
    {img("kingdomops-app-icon.svg", "", "app icon 96").replace("<img", "<img width=\"96\"")}
    {img("kingdomops-app-icon.svg", "", "app icon 48").replace('<img', '<img width="48"')}
    {img("kingdomops-app-icon.svg", "", "app icon 32").replace('<img', '<img width="32"')}
    {img("kingdomops-app-icon.svg", "", "app icon 16").replace('<img', '<img width="16"')}
    <span class="sw-hex">app icon · 96 / 48 / 32 / 16 px</span>
  </div>
</section>

<section>
  <h2>Brand colors<small>Graphite, bronze and ivory. Bronze #B58B59 is a logo color; for small text and buttons on light grounds use the functional bronze.</small></h2>
  <div class="grid">
    <div class="sw"><span class="chip" style="background:var(--ko-graphite)"></span><span class="sw-name">graphite</span><span class="sw-hex">#191B1D</span></div>
    <div class="sw"><span class="chip" style="background:var(--ko-bronze)"></span><span class="sw-name">bronze</span><span class="sw-hex">#B58B59</span></div>
    <div class="sw"><span class="chip" style="background:var(--ko-ivory)"></span><span class="sw-name">ivory</span><span class="sw-hex">#E8E3DA</span></div>
  </div>
</section>

<section>
  <h2>Interface<small>Swatches follow the current theme. Hex pairs read dark · light.</small></h2>
  <div class="grid">{swatches(["background", "surface", "surface-raised", "border", "text", "text-muted", "accent", "accent-hover", "focus"])}</div>
  <div class="grid">{swatches(["success", "warning", "error", "info"])}</div>
  <p class="note">The brand has no red, so <b>error</b> never competes with the logo. Pair every state color with a label or icon.</p>
</section>

<section>
  <h2>Data confidence<small>Every number in a guide carries one of these.</small></h2>
  <div class="pills">
    <span class="pill" style="color:var(--ko-confidence-high)">High</span>
    <span class="pill" style="color:var(--ko-confidence-medium)">Medium</span>
    <span class="pill" style="color:var(--ko-confidence-low)">Low</span>
    <span class="pill pend" style="color:var(--ko-confidence-pending)">Pending · measure in-game</span>
  </div>
</section>

<section>
  <h2>Spending profiles<small>Hue walks from green to crimson as spending grows. It marks order, not good or bad.</small></h2>
  <div class="pills">
    <span class="pill" style="color:var(--ko-profile-f2p)">F2P</span><span class="pill" style="color:var(--ko-profile-low)">Low</span>
    <span class="pill" style="color:var(--ko-profile-medium)">Medium</span><span class="pill" style="color:var(--ko-profile-high)">High</span>
    <span class="pill" style="color:var(--ko-profile-whale)">Whale</span><span class="pill" style="color:var(--ko-profile-kraken)">Kraken</span>
  </div>
</section>

<section>
  <h2>Profile rarity<small>By City Hall: 1–16 Common, 17–21 Rare, 22–24 Epic, 25 Legendary.</small></h2>
  <div class="pills">
    <span class="pill" style="color:var(--ko-rarity-common)">Common</span><span class="pill" style="color:var(--ko-rarity-rare)">Rare</span>
    <span class="pill" style="color:var(--ko-rarity-epic)">Epic</span><span class="pill" style="color:var(--ko-rarity-legendary)">Legendary</span>
  </div>
</section>

<section>
  <h2>Alliance colors<small>Twelve choices for tags and avatar rings. Each one passes as a border on every surface in both themes, with dark ink for the tag text.</small></h2>
  <div class="grid">{alliance}</div>
</section>

<section>
  <h2>Typography<small>Chakra Petch for headings and labels (its cut corners echo the lettering), IBM Plex Sans for reading, IBM Plex Mono for IDs and numbers. All OFL.</small></h2>
  <div>{type_rows}</div>
</section>

<section>
  <h2>Components preview<small>A first look at the tokens working together. Real components come with the app.</small></h2>
  <div class="panels">
    <div class="card"><h3>Today · 45 min</h3>
      <div class="task"><span>Collect VIP chest and daily quests</span><span>~4 min</span></div>
      <div class="task"><span>Send gatherers, wood first</span><span>~3 min</span></div>
      <div class="task"><span>Alliance help and gifts</span><span>~2 min</span></div>
      <div class="row"><button class="btn" type="button">Start routine</button><span class="pill pend" style="color:var(--ko-confidence-pending)">Times pending</span></div>
    </div>
    <div class="card"><h3>Governor card</h3>
      <div class="row"><span class="ring" style="--c:var(--ko-alliance-cobalt);width:56px;height:56px"><b>V</b></span>
      <div><div style="font:var(--ko-weight-semibold) var(--ko-text-md)/1.3 var(--ko-font-display)">[OPS] Victor</div>
      <div class="sw-hex">City Hall 22 · day 23</div></div></div>
      <div class="pills"><span class="pill" style="color:var(--ko-rarity-epic)">Epic</span><span class="pill" style="color:var(--ko-profile-f2p)">F2P</span></div>
    </div>
  </div>
</section>

<section>
  <h2>Space, shape, depth<small>4 px spacing scale. Corners are cut (chamfer) for brand moments, small radii elsewhere.</small></h2>
  <div style="display:grid;gap:var(--ko-space-2)">{space}</div>
  <div class="shapes"><div class="shape" style="border-radius:var(--ko-radius-sm)">radius-sm</div><div class="shape" style="border-radius:var(--ko-radius-md)">radius-md</div>
    <div class="shape" style="border-radius:var(--ko-radius-lg)">radius-lg</div><div class="shape ch">chamfer-md</div></div>
  <div class="shapes"><div class="elev" style="box-shadow:var(--ko-shadow-1)">shadow-1</div><div class="elev" style="box-shadow:var(--ko-shadow-2)">shadow-2</div><div class="elev" style="box-shadow:var(--ko-shadow-3)">shadow-3</div></div>
</section>

<section>
  <h2>Motion<small>Short and decisive: 140 ms for controls, 200 ms default, 320 ms for panels. Ease-out on entry. Turned off with reduced motion.</small></h2>
  <div class="motion" tabindex="0"><span class="dot"></span><span class="sw-hex">hover or focus: slow · ease-out</span></div>
</section>
</div>
<script>
(function () {{
  var root = document.documentElement, btn = document.getElementById('theme');
  function current() {{ return root.getAttribute('data-theme') || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'); }}
  btn.addEventListener('click', function () {{ root.setAttribute('data-theme', current() === 'dark' ? 'light' : 'dark'); }});
}})();
</script>
"""
(ROOT / "design/styleguide.html").write_text(page)
print("styleguide written")
