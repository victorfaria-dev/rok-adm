#!/usr/bin/env python3
"""Convert the Fandom building tables (raw/A-pilot/fandom-building-tables.md, pipe rows
extracted from MediaWiki wikitext on 2026-10-13) into machine-readable CSVs.

Output: facts/A01/data/buildings/<building>.csv (original columns + parsed cost and time),
facts/A01/data/city-hall.csv (copy of the City Hall table with parsed columns), and
facts/A03/data/resource-buildings.csv + facts/A03/data/trading-post.csv for A03 cards.

Values are not edited; malformed wiki cells are kept as-is. Parsed columns:
food, wood, stone, gold (absolute numbers), extra_cost, time_raw, time_seconds.
Usage: python3 tools/raw_tables_to_csv.py   (run from research/)
"""
import csv, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RAW = os.path.join(ROOT, "raw/A-pilot/fandom-building-tables.md")
OUT = os.path.join(ROOT, "facts/A01/data/buildings")
UNITS = {"K": 1e3, "M": 1e6, "B": 1e9}


def num(s):
    s = s.strip().replace(",", "")
    if re.fullmatch(r"[0-9]{1,3}(?:\.[0-9]{3}){2,}", s):  # European thousands separators in the wiki
        s = s.replace(".", "")
    s = re.sub(r"(?<=[KMB])1x$", "", s)  # '36.0M1x' = value glued to '1x Master's Blueprint'
    if s == "-1x":
        return ""
    if s in ("", "-", "?"):
        return ""
    m = re.fullmatch(r"([0-9]+(?:\.[0-9]+)?)([KMB]?)", s)
    if not m:
        return "MALFORMED:" + s
    v = float(m.group(1)) * UNITS.get(m.group(2), 1)
    return str(int(round(v)))


def secs(t):
    t = t.strip()
    if not t or t in ("None", "?"):
        return ""
    total, found = 0, False
    for n, u in re.findall(r"([0-9]+)\s*([dhms])", t):
        total += int(n) * {"d": 86400, "h": 3600, "m": 60, "s": 1}[u]
        found = True
    return str(total) if found else ""


def slug(name):
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def main():
    text = open(RAW, encoding="utf-8").read()
    blocks = re.findall(r"^## (.+?)\nURL: (\S+)\n\n```\n(.*?)```", text, re.S | re.M)
    os.makedirs(OUT, exist_ok=True)
    written = []
    for name, url, body in blocks:
        lines = [l for l in body.strip("\n").split("\n") if l.strip()]
        header = [h.strip().replace(" + ", " ") for h in lines[0].split("|")]
        rows, age = [], ""
        for l in lines[1:]:
            if "|" not in l:
                age = l.strip()
                continue
            cells = [c.strip() for c in l.split("|")]
            cells += [""] * (len(header) - len(cells))
            rec = dict(zip(header, cells[: len(header)]))
            if name == "City Hall":
                rec["Age"] = age
            cost = rec.get("Cost", "") or rec.get("Resources", "")
            m = re.search(r"F/W/S/G=([^ ]+)", cost)
            fw = (m.group(1).split("/") + ["", "", "", ""])[:4] if m else ["", "", "", ""]
            rec["food"], rec["wood"], rec["stone"], rec["gold"] = [num(x) for x in fw]
            rec["extra_cost"] = re.sub(r"F/W/S/G=[^ ]+", "", cost).strip()
            if re.search(r"[KMB]1x", cost):
                rec["extra_cost"] = (rec["extra_cost"] + " 1x Master's Blueprint (glued to cost cell in wiki)").strip()
            rec["time_raw"] = rec.get("Time", "")
            rec["time_seconds"] = secs(rec.get("Time", ""))
            rec["source_url"] = url
            rows.append(rec)
        cols = list(rows[0].keys())
        fn = os.path.join(OUT, slug(name) + ".csv")
        if name in ("City Hall", "Trading Post"):
            fn = os.path.join(ROOT, "facts/A01/data/city-hall.csv" if name == "City Hall" else "facts/A03/data/trading-post.csv")
            os.makedirs(os.path.dirname(fn), exist_ok=True)
        with open(fn, "w", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=cols)
            w.writeheader()
            w.writerows(rows)
        written.append((name, fn, len(rows)))
    # resource buildings: long format
    res = []
    for name, fn, _ in written:
        if name not in ("Farm", "Lumber Mill", "Quarry", "Goldmine"):
            continue
        for r in csv.DictReader(open(fn, encoding="utf-8")):
            per_h = next((r[k] for k in r if k.lower().endswith("/hr")), "")
            res.append({"building": name, "level": r["Level"], "per_hour": per_h.replace(",", ""),
                        "capacity": r.get("Capacity", "").replace(",", ""), "requirements": r.get("Requirements", ""),
                        "food": r["food"], "wood": r["wood"], "stone": r["stone"], "gold": r["gold"],
                        "time_raw": r["time_raw"], "time_seconds": r["time_seconds"],
                        "roi_days": r.get("ROI days", r.get("ROI Days", "")), "source_url": r["source_url"]})
    with open(os.path.join(ROOT, "facts/A03/data/resource-buildings.csv"), "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(res[0].keys()))
        w.writeheader()
        w.writerows(res)
    for n, fn, k in written:
        print(f"{n}: {k} rows -> {os.path.relpath(fn, ROOT)}")


if __name__ == "__main__":
    main()
