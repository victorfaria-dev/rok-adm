#!/usr/bin/env python3
"""Small machine-readable tables for wave-2 cards (2026-10-13).

- facts/A05/data/vip-levels.csv     <- A05-0001 (Fandom VIP page, rev 2026-08-02; cumulative reading = T4-supported)
- facts/A04/data/vip-shop.csv       <- Fandom Buildings/Shop wikitext (rev 2023-10-12), VIP Shop section.
                                       Needs the wikitext file path as argv[1] (MediaWiki API, action=parse&prop=wikitext).
- facts/A01/data/city-hall-rewards.csv <- A01-0002 valores (Fandom CH Rewards rev 2023-03-24 + gamerempire)
Usage: python3 tools/extra_tables.py <Buildings__Shop wikitext file>
"""
import csv, os, re, sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

VIP = [(1, 200), (2, 400), (3, 1200), (4, 3500), (5, 6000), (6, 11500), (7, 17500), (8, 35000), (9, 75000),
       (10, 150000), (11, 250000), (12, 350000), (13, 500000), (14, 750000), (15, 1000000), (16, 1500000),
       (17, 2500000), (18, 4000000)]


def write(path, cols, rows):
    path = os.path.join(ROOT, path)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(cols)
        w.writerows(rows)
    print(path, len(rows))


def main():
    write("facts/A05/data/vip-levels.csv", ["vip_level", "vip_points_threshold", "reading", "source_url"],
          [(l, p, "cumulative total (T4-supported, T0 pending)", "https://riseofkingdoms.fandom.com/wiki/VIP") for l, p in VIP])
    rewards = [
        (2, "10K food, 10K wood", "1x Universal 5m", 0), (3, "20K food, 20K wood", "2x Universal 5m", 0),
        (4, "30K food, 30K wood", "3x Universal 5m", 0), (5, "40K food/wood/stone", "1x Universal 30m", 0),
        (6, "50K food/wood/stone", "2x Universal 30m", 0), (7, "50K food/wood/stone", "5x Universal 30m", 0),
        (8, "50K food/wood/stone", "2x Universal 8h", 0), (9, "50K food/wood/stone", "1x Universal 24h", 0),
        (10, "50K food/wood/stone, 10K gold", "1x Civilization Change", 0),
        (16, "100K stone, 20K gold", "1x Universal 7d", 100), (21, "100K food/wood (gamerempire)", "1x Universal 7d", 200),
        (25, "200K stone, 50K gold", "1x Master's Blueprint", 500)]
    for n in list(range(11, 16)) + list(range(17, 21)) + list(range(22, 25)):
        rewards.append((n, "50K-150K resources", f"{n}x Building 10m + {n}x Training 10m", 0))
    rewards.sort()
    write("facts/A01/data/city-hall-rewards.csv", ["ch_level", "resources", "items", "gems", "source_url"],
          [r + ("https://riseofkingdoms.fandom.com/wiki/Buildings/City_Hall/Rewards",) for r in rewards])
    if len(sys.argv) > 1:
        t = open(sys.argv[1], encoding="utf-8").read()
        sec = t.split("==VIP Shop==", 1)[1]
        sec = sec.split("\n|}", 1)[0]
        rows = []
        for blk in sec.split("|-")[1:]:
            cells = [c.strip() for c in blk.strip().split("\n| ")]
            cells = [re.sub(r"^\|\s*", "", c) for c in blk.strip().split("\n")]
            if len(cells) < 5:
                continue
            name = re.search(r"name=([^|}]+)", cells[0])
            cost = re.search(r"BuildingResources\|([^}]*)", cells[1])
            parts = (cost.group(1).split("|") + [""] * 5)[:5] if cost else [""] * 5
            currency = ["food", "wood", "stone", "gold", "gems"]
            price = next(((parts[i], currency[i]) for i in range(5) if parts[i]), ("", ""))
            rows.append((name.group(1).strip() if name else cells[0], price[0].replace(",", ""), price[1],
                         cells[2].replace("VIP", "").strip(), re.sub(r".*\}\}\s*", "", cells[3]).strip(), cells[4].strip(),
                         "https://riseofkingdoms.fandom.com/wiki/Buildings/Shop"))
        write("facts/A04/data/vip-shop.csv", ["item", "price", "currency", "vip_required", "discount", "qty_per_week", "source_url"], rows)


if __name__ == "__main__":
    main()
