#!/usr/bin/env python3
"""Validate guide blocks against blocks.schema.json and against research/facts.

Stdlib only. Usage:
    python3 guides/tools/validate_blocks.py [guides/data/blocks.f2p.json ...]

Part 1 - JSON Schema (the subset used by blocks.schema.json: type, enum, required,
properties, additionalProperties, items, minItems, maxItems, uniqueItems,
minLength, pattern, minimum, maximum).

Part 2 - editorial rules (from the Guide Writer brief and research/schemas/fato.md):
  R1  ids are unique.
  R2  every card ID that appears in body_md / why_md / uncertain_notes / split_views /
      low_spender_note is listed in `cards`, and every listed card exists in research/facts.
  R3  every cited card below the firm filter (status verificado AND confianca >= media)
      is either a patch card (C04, confianca >= media, listed in patch_cards) or is named
      in uncertain_notes ("Uncertain").
  R4  confidence high/medium needs at least one firm or patch card; confidence high needs
      no non-firm card outside patch_cards.
  R5  consensus 'split' needs split_views.
  R6  every gap ID exists in research/facts/*/_lacunas.md (PROPOSED-* allowed, warned).
  R7  time_cost_min must be null unless a measured (T0) value exists -> warn when set.
  R8  every block that has no time_cost_min and is in the daily section lists L-A10-01.
Exit code 1 on any error.
"""
import json
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import factlib  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.join(HERE, "..", "data")
TYPES = {"string": str, "integer": int, "number": (int, float), "array": list,
         "object": dict, "boolean": bool, "null": type(None)}


def type_ok(value, t):
    if t == "integer":
        return isinstance(value, int) and not isinstance(value, bool)
    if t == "number":
        return isinstance(value, (int, float)) and not isinstance(value, bool)
    return isinstance(value, TYPES[t])


def check(schema, value, path, errors):
    t = schema.get("type")
    if t is not None:
        ts = t if isinstance(t, list) else [t]
        if not any(type_ok(value, x) for x in ts):
            errors.append(f"{path}: expected type {t}, got {type(value).__name__}")
            return
    if "enum" in schema and value not in schema["enum"]:
        errors.append(f"{path}: {value!r} not in {schema['enum']}")
    if isinstance(value, str):
        if len(value) < schema.get("minLength", 0):
            errors.append(f"{path}: shorter than {schema['minLength']}")
        if "pattern" in schema and not re.search(schema["pattern"], value):
            errors.append(f"{path}: {value!r} does not match {schema['pattern']}")
    if isinstance(value, (int, float)) and not isinstance(value, bool):
        if "minimum" in schema and value < schema["minimum"]:
            errors.append(f"{path}: {value} < {schema['minimum']}")
        if "maximum" in schema and value > schema["maximum"]:
            errors.append(f"{path}: {value} > {schema['maximum']}")
    if isinstance(value, list):
        if len(value) < schema.get("minItems", 0):
            errors.append(f"{path}: fewer than {schema['minItems']} items")
        if "maxItems" in schema and len(value) > schema["maxItems"]:
            errors.append(f"{path}: more than {schema['maxItems']} items")
        if schema.get("uniqueItems"):
            seen = [json.dumps(v, sort_keys=True) for v in value]
            if len(seen) != len(set(seen)):
                errors.append(f"{path}: duplicate items")
        if "items" in schema:
            for i, v in enumerate(value):
                check(schema["items"], v, f"{path}[{i}]", errors)
    if isinstance(value, dict):
        for req in schema.get("required", []):
            if req not in value:
                errors.append(f"{path}: missing required '{req}'")
        props = schema.get("properties", {})
        for k, v in value.items():
            if k in props:
                check(props[k], v, f"{path}.{k}", errors)
            elif schema.get("additionalProperties") is False:
                errors.append(f"{path}: unexpected property '{k}'")


def editorial(blocks, cards, gap_ids, errors, warnings):
    ids = [b.get("id") for b in blocks]
    for dup in {i for i in ids if ids.count(i) > 1}:
        errors.append(f"R1 duplicate id {dup}")
    for b in blocks:
        bid = b.get("id", "?")
        text_fields = [b.get(k) or "" for k in
                       ("body_md", "why_md", "uncertain_notes", "split_views", "low_spender_note")]
        mentioned = set(factlib.CARD_RE.findall(" ".join(text_fields)))
        listed = set(b.get("cards", []))
        for c in sorted(mentioned - listed):
            errors.append(f"R2 {bid}: card {c} cited in text but not in 'cards'")
        for c in sorted(listed - mentioned):
            warnings.append(f"R2 {bid}: card {c} listed but never cited in text")
        firm, patch, weak = [], [], []
        for c in sorted(listed):
            if c not in cards:
                errors.append(f"R2 {bid}: card {c} not found in research/facts")
                continue
            if factlib.is_firm(cards[c]):
                firm.append(c)
            elif c in b.get("patch_cards", []):
                if not c.startswith("C04") or cards[c]["confianca"] not in factlib.FIRM_CONF:
                    errors.append(f"R3 {bid}: {c} cannot be a patch card "
                                  f"({cards[c]['status']}/{cards[c]['confianca']})")
                patch.append(c)
            else:
                weak.append(c)
                if c not in (b.get("uncertain_notes") or ""):
                    errors.append(f"R3 {bid}: {c} is {cards[c]['status']}/{cards[c]['confianca']} "
                                  f"but not named in uncertain_notes")
        for c in b.get("patch_cards", []):
            if c not in listed:
                errors.append(f"R3 {bid}: patch card {c} not in cards")
        conf = b.get("confidence")
        if conf in ("high", "medium") and not (firm or patch):
            errors.append(f"R4 {bid}: confidence {conf} without any firm/patch card")
        if conf == "high" and weak:
            errors.append(f"R4 {bid}: confidence high but cites non-firm cards {weak}")
        if b.get("consensus") == "split" and not b.get("split_views"):
            errors.append(f"R5 {bid}: consensus split without split_views")
        for g in b.get("gaps", []):
            if g.startswith("PROPOSED-"):
                warnings.append(f"R6 {bid}: proposed gap {g} (not yet in research/facts/_lacunas.md)")
            elif g not in gap_ids:
                errors.append(f"R6 {bid}: gap {g} not found in research/facts/*/_lacunas.md")
        if b.get("time_cost_min") is not None:
            warnings.append(f"R7 {bid}: time_cost_min set; make sure it is a T0 measurement")
        elif b.get("section") == "daily" and "L-A10-01" not in b.get("gaps", []):
            errors.append(f"R8 {bid}: daily block without time cost must list gap L-A10-01")


def main(argv):
    paths = argv[1:] or [os.path.join(DATA, "blocks.f2p.json")]
    with open(os.path.join(DATA, "blocks.schema.json"), encoding="utf-8") as fh:
        schema = json.load(fh)
    cards = factlib.load_cards()
    gap_ids = factlib.load_gap_ids()
    failed = False
    for p in paths:
        errors, warnings = [], []
        with open(p, encoding="utf-8") as fh:
            blocks = json.load(fh)
        check(schema, blocks, "$", errors)
        if isinstance(blocks, list):
            editorial(blocks, cards, gap_ids, errors, warnings)
        print(f"== {os.path.relpath(p)}: {len(blocks)} blocks, "
              f"{len(errors)} errors, {len(warnings)} warnings")
        for w in warnings:
            print("  WARN ", w)
        for e in errors:
            print("  ERROR", e)
        failed |= bool(errors)
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
