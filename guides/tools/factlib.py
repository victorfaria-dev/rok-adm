"""Shared helpers (stdlib only): read fact-card front matter and gap IDs from research/."""
import glob
import os
import re

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
FACTS = os.path.join(ROOT, "research", "facts")
CARD_RE = re.compile(r"\b(?:A\d{2}|B\d{2}|C\d{2})-\d{4}\b")
GAP_RE = re.compile(r"\bL-[A-C]\d{2}-\d{2}\b")
FIRM_STATUS = {"verificado"}
FIRM_CONF = {"media", "alta"}


def _field(fm, key):
    m = re.search(r"^" + key + r":\s*(.*)$", fm, re.M)
    return m.group(1).strip().strip("'\"") if m else ""


def load_cards():
    """Return {card_id: {status, confianca, consenso, titulo, path}}."""
    cards = {}
    for path in glob.glob(os.path.join(FACTS, "*", "*-[0-9][0-9][0-9][0-9].md")):
        with open(path, encoding="utf-8") as fh:
            text = fh.read()
        m = re.match(r"---\n(.*?)\n---", text, re.S)
        if not m:
            continue
        fm = m.group(1)
        cid = _field(fm, "id")
        if cid:
            cards[cid] = {
                "status": _field(fm, "status"),
                "confianca": _field(fm, "confianca"),
                "consenso": _field(fm, "consenso"),
                "titulo": _field(fm, "titulo"),
                "path": os.path.relpath(path, ROOT),
            }
    return cards


def is_firm(card):
    return card["status"] in FIRM_STATUS and card["confianca"] in FIRM_CONF


def load_gap_ids():
    ids = set()
    for path in glob.glob(os.path.join(FACTS, "*", "_lacunas.md")):
        with open(path, encoding="utf-8") as fh:
            ids |= set(GAP_RE.findall(fh.read()))
    return ids
