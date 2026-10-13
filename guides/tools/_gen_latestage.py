#!/usr/bin/env python3
"""One-off generator for guides/data/staging/blocks.latestage.json (wave J).
Kept so the director can regenerate after edits; the JSON is the source of truth once rendered."""
import json, os, re

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, "..", "data", "staging", "blocks.latestage.json")
AS_OF = "2026-10-13"
PATCH = "1.1.09 (latest official EN notes); 1.1.12 reported live (T3)"
LATE = ["kvk2", "kvk3", "soc"]

BLOCKS = []


def block(id, title, section, order, body, why, *, phase="anytime", stage=LATE, perfil=("todos",),
          funcao=("todas",), priority=3, recommended=("f2p", "low"), consensus="majority", split=None,
          patch_cards=(), confidence="medium", uncertain="", gaps=(), low=None, ch=None):
    cards = sorted(set(re.findall(r"\b[A-C]\d{2}-\d{4}\b", body + why + (split or "") + uncertain + (low or ""))))
    BLOCKS.append({
        "id": id, "title": title, "phase": phase, "section": section, "order": order,
        "stage": list(stage), "perfil": list(perfil), "funcao": list(funcao),
        "hours_min_per_day": None, "time_cost_min": None, "priority": priority,
        "recommended_for": list(recommended), "ch_range": ch, "civ": [],
        "consensus": consensus, "split_views": split, "body_md": body, "why_md": why,
        "cards": cards, "patch_cards": sorted(patch_cards), "confidence": confidence,
        "uncertain_notes": uncertain, "gaps": list(gaps), "low_spender_note": low,
        "as_of": AS_OF, "patch_ref": PATCH,
    })


exec(open(os.path.join(HERE, "_latestage_content.py"), encoding="utf-8").read())

os.makedirs(os.path.dirname(OUT), exist_ok=True)
with open(OUT, "w", encoding="utf-8") as fh:
    json.dump(BLOCKS, fh, ensure_ascii=False, indent=2)
    fh.write("\n")
print(f"wrote {len(BLOCKS)} blocks to {os.path.relpath(OUT)}")
