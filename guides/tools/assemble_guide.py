#!/usr/bin/env python3
"""Assemble the human-readable guide from a blocks file (stdlib only).

Usage:
    python3 guides/tools/assemble_guide.py [--perfil f2p] [blocks.json] [out.md]

Defaults: guides/data/blocks.f2p.json -> guides/f2p-early-kingdom-guide.md.
The same filter logic is what the questionnaire (F-01) will apply in the browser;
here only the spending profile is used.
"""
import glob
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import factlib  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
GUIDES = os.path.abspath(os.path.join(HERE, ".."))

SECTIONS = [
    ("overview", "1. Overview and realistic expectations"),
    ("day0", "2. Day 0–3 setup: civilization and first choices"),
    ("plan", "3. Phase-by-phase plan to KvK1"),
    ("daily", "4. Daily routine by time budget"),
    ("events", "5. Events calendar and preparation"),
    ("farms", "6. Farms"),
    ("mistakes", "7. Mistakes to avoid"),
    ("recovery", "8. If you got zeroed"),
    ("open", "9. Open questions and pending measurements"),
]
PHASE_TITLES = {
    "day4-14": "Days 4–14 (about CH8 → CH12)",
    "day15-40": "Days 15–40 (about CH12 → CH17, VIP 6)",
    "day41-90": "Days 41–90 (CH17 → CH21/22, T4)",
    "pre-kvk1": "Pre-KvK1 and KvK1 (about day 85–100+)",
}
PHASE_ORDER = ["overview", "day0-3", "day4-14", "day15-40", "day41-90", "pre-kvk1", "daily", "event", "anytime"]
PROFILE_NAMES = {"f2p": "F2P", "low": "Low", "medium": "Medium", "high": "High", "whale": "Whale", "kraken": "Kraken"}


def link_cards(text, cards):
    def rep(m):
        c = m.group(0)
        if c in cards:
            return f"[{c}](../{cards[c]['path']})"
        return c
    return factlib.CARD_RE.sub(rep, text)


def gap_descriptions():
    out = {}
    for path in glob.glob(os.path.join(factlib.FACTS, "*", "_lacunas.md")):
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                m = re.match(r"\|\s*(L-[A-C]\d{2}-\d{2})\s*\|\s*([^|]+)\|\s*([^|]+)\|", line)
                if m:
                    out[m.group(1)] = (m.group(2).strip(), m.group(3).strip())
    out["PROPOSED-SHIELDS"] = ("Shield durations/costs and beginner protection rules: no fact card exists yet "
                               "(proposed gap, to be added by the research side)", "alto (proposed)")
    return out


def applies(b, perfil):
    return perfil in b["perfil"] or "todos" in b["perfil"]


def render_block(b, cards):
    L = [f"### {b['title']}", ""]
    meta = [f"**Confidence:** {b['confidence']}", f"**Consensus:** {b['consensus']}",
            f"**Priority:** {b['priority']}/5"]
    if b["recommended_for"]:
        meta.append("**Recommended for:** " + ", ".join(PROFILE_NAMES[p] for p in b["recommended_for"]))
    if b["ch_range"]:
        meta.append(f"**CH:** {b['ch_range'][0]}–{b['ch_range'][1]}")
    if b["hours_min_per_day"] is not None:
        meta.append(f"**Time budget:** ≥ {int(round(b['hours_min_per_day'] * 60))} min/day")
    if b["time_cost_min"] is not None:
        meta.append(f"**Time cost:** {b['time_cost_min']} min (T0)")
    elif b["section"] == "daily":
        meta.append("**Time cost:** pending T0 (L-A10-01)")
    meta.append(f"`{b['id']}`")
    L += [" · ".join(meta), "", link_cards(b["body_md"], cards), "",
          "**Why:** " + link_cards(b["why_md"], cards), ""]
    if b["split_views"]:
        L += ["**Both views (split):** " + link_cards(b["split_views"], cards), ""]
    if b["uncertain_notes"]:
        L += ["> **Uncertain:** " + link_cards(b["uncertain_notes"], cards).replace("\n", " "), ">"]
    if b["patch_cards"]:
        L += ["> **Patch state:** " + ", ".join(link_cards(c, cards) for c in b["patch_cards"]) +
              " (patch-change cards, C04: official notes or patch-tracking sources, not yet through formal verification).", ">"]
    if b["gaps"]:
        L += ["> **Pending in-game measurement (T0):** " + ", ".join(b["gaps"]), ">"]
    while L and L[-1] == ">":
        L.pop()
    if b["low_spender_note"]:
        L += ["", "> **Low spender note:** " + link_cards(b["low_spender_note"], cards)]
    L.append("")
    return "\n".join(L)


INTRO = """# Rise of Kingdoms — F2P early-kingdom guide (new kingdom → KvK1), v1

*As of {as_of}. Checked against official patch notes up to {patch}. Profile: **F2P**. Assembled automatically from `guides/data/blocks.f2p.json` ({n} blocks) by `guides/tools/assemble_guide.py`: edit the blocks, not this file.*

## How to read this guide

- **Every number and recommendation cites fact cards** (e.g. [A01-0001](../research/facts/A01/A01-0001.md)). Firm statements use only cards with status `verificado` and confidence `media` or `alta`.
- **Uncertain**: the claim relies on a weaker, contested or partly outdated card; the note says why.
- **Pending in-game measurement (T0)**: nobody has measured it yet; the gap ID points to `research/facts/<domain>/_lacunas.md` and the T0 diary (`research/protocolos/t0-medicao.md`).
- **Patch state**: some patch-change cards (C04) come from official notes but have not yet been through the formal verification pass; they are shown as patch state.
- **Consensus**: *unanimous* / *majority* / *split* (both views shown) / *mechanic* (a game rule, not an opinion).
- **Recommended** marks the default option for the F2P profile. **Low spender notes** flag where spending a little changes the advice materially (a full Low-spender delta guide comes later).
- **Time costs**: no source publishes minutes per task; they are pending the T0 stopwatch (L-A10-01).
- Block IDs (`like-this`) are what the future questionnaire uses to filter the guide.

## Contents

{toc}
"""


def main(argv):
    args = argv[1:]
    perfil = "f2p"
    if args[:1] == ["--perfil"]:
        perfil, args = args[1], args[2:]
    src = args[0] if args else os.path.join(GUIDES, "data", "blocks.f2p.json")
    out = args[1] if len(args) > 1 else os.path.join(GUIDES, "f2p-early-kingdom-guide.md")
    with open(src, encoding="utf-8") as fh:
        blocks = [b for b in json.load(fh) if applies(b, perfil)]
    cards = factlib.load_cards()
    gaps = gap_descriptions()
    blocks.sort(key=lambda b: (PHASE_ORDER.index(b["phase"]), b["order"]))

    toc = "\n".join(f"- [{t}](#{re.sub(r'[^a-z0-9 -]', '', t.lower()).replace(' ', '-')})" for _, t in SECTIONS)
    toc += "\n- [Appendix: Sources and confidence](#appendix-sources-and-confidence)"
    parts = [INTRO.format(as_of=blocks[0]["as_of"], patch=blocks[0]["patch_ref"], n=len(blocks), toc=toc)]

    for key, title in SECTIONS:
        sec = [b for b in blocks if b["section"] == key]
        if not sec:
            continue
        parts.append(f"## {title}\n")
        if key == "plan":
            for ph in ["day4-14", "day15-40", "day41-90", "pre-kvk1"]:
                sub = [b for b in sec if b["phase"] == ph]
                if sub:
                    parts.append(f"### {PHASE_TITLES[ph]}\n")
                    parts.extend(render_block(b, cards).replace("### ", "#### ", 1) for b in sub)
            continue
        if key == "farms":
            parts.append("*Brief only. The dedicated farm guide (F-03: single-resource, general and resource-pair farms) will replace this section.*\n")
        parts.extend(render_block(b, cards) for b in sec)

    # Appendix
    cited = {}
    for b in blocks:
        for c in b["cards"]:
            cited.setdefault(c, []).append(b["id"])
    firm = [c for c in cited if c in cards and factlib.is_firm(cards[c])]
    A = ["## Appendix: Sources and confidence", "",
         f"**{len(cited)} fact cards cited**; {len(firm)} pass the firm filter (`verificado` + `media`/`alta`). "
         "The others appear only inside *Uncertain* notes or as *Patch state*.", "",
         "| Card | Title | Status | Confidence | Consensus | Firm? | Used in |", "|---|---|---|---|---|---|---|"]
    for c in sorted(cited):
        m = cards[c]
        title = m["titulo"].replace("|", "/")[:90]
        A.append(f"| {link_cards(c, cards)} | {title} | {m['status']} | {m['confianca']} | {m['consenso'] or 'n/a'} | "
                 f"{'yes' if factlib.is_firm(m) else 'no'} | {', '.join('`'+x+'`' for x in cited[c])} |")
    used_gaps = {}
    for b in blocks:
        for g in b["gaps"]:
            used_gaps.setdefault(g, []).append(b["id"])
    A += ["", "### Gaps referenced (pending measurement or research)", "",
          "| Gap | Description | Impact | Blocks |", "|---|---|---|---|"]
    for g in sorted(used_gaps):
        d, imp = gaps.get(g, ("(description not found)", ""))
        A.append(f"| {g} | {d.replace('|', '/')} | {imp} | {', '.join('`'+x+'`' for x in used_gaps[g])} |")
    conf = {}
    for b in blocks:
        conf[b["confidence"]] = conf.get(b["confidence"], 0) + 1
    A += ["", "### Block confidence", "", ", ".join(f"{k}: {v}" for k, v in sorted(conf.items())), "",
          "### Known contradictions in the research (as of this version)", "",
          "- **Time to T4:** 2026 player reports say T4 \"around day 30\" ([B01-0700](../research/facts/B01/B01-0700.md)), "
          "but the derived raw build budget to CH21 (T4 unlock) is about 163 builder-days "
          "([A01-0005](../research/facts/A01/A01-0005.md)). Both are `baixa`; T0 settles it (L-A02-03).",
          "- **Early unlock levels:** Academy and first Quarry at CH4 vs CH6, Trading Post at CH10 vs CH12 "
          "([A01-0009](../research/facts/A01/A01-0009.md), [A03-0025](../research/facts/A03/A03-0025.md)); the Fandom CH table still lists the Trading Post at CH10.",
          "- **KvK durations:** 60 days (2024 T3) vs 50 days (2026 T4) ([B01-0502](../research/facts/B01/B01-0502.md)).",
          "- **Spending gems on VIP:** majority yes, AllClash (2020) no ([A05-0008](../research/facts/A05/A05-0008.md)).",
          "- **Daily AP claim amount:** 500 AP per official 1.0.41 (2020); the 1.1.02 note does not restate it "
          "([A09-0006](../research/facts/A09/A09-0006.md), L-A09-02).",
          "- **Patch-state cards** (C04) are still `bruto` although the context packs treat most of them as T1 facts.", ""]
    parts.append("\n".join(A))
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts).rstrip() + "\n")
    print(f"wrote {os.path.relpath(out)} ({len(blocks)} blocks, {len(cited)} cards, {len(used_gaps)} gaps)")


if __name__ == "__main__":
    main(sys.argv)
