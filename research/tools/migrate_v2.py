#!/usr/bin/env python3
"""One-off migration of A01-A14 and B01-05xx fact cards from schema v1 to v2 (wave 2, 2026-10-13).

What it does per card:
  * source IDs (S0x/SPxx/SAxx — colliding between agents) -> slugs, resolved by URL host;
  * fills publicado_em from Fandom revision timestamps / official forum post dates when missing;
  * copia_de per citation; n_fontes_pro (independent slugs) / n_fontes_contra;
  * data_referencia -> data_fonte / data_validade; versao_minima; invalidado_por;
  * tipo derivado + metodo for arithmetic cards; funcao (farm moved out of perfil);
  * applies wave-2 verification decisions from wave2_overrides.py (status, confidence, corrections,
    new T1/T4 sources, verbatim quote replacements) and the automatic quote check
    (tools/data/quote_check_wave2.json, produced by re-fetching every cited URL with curl).
Idempotent only on v1 input: run once. Usage: python3 tools/migrate_v2.py [--dry-run]
"""
import glob, json, os, re, sys
from urllib.parse import urlparse, unquote

import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import wave2_overrides as W  # noqa: E402

REVS = json.load(open(os.path.join(HERE, "data/fandom_revs.json")))
POSTS = json.load(open(os.path.join(HERE, "data/forum_dates.json")))
QC = json.load(open(os.path.join(HERE, "data/quote_check_wave2.json")))
QCI = {(q["card"], q["i"]): q for q in QC}
TODAY = "2026-10-13"

HOSTS = [
    ("riseofkingdomsguides.com/lyceum", "src:rkg-lyceum"), ("riseofkingdomsguides.com", "src:rkg"),
    ("fandom.com", "src:fandom"), ("forum-global.lilithgame.com", "src:lilith-forum"),
    ("gamerempire", "src:gamerempire"), ("bluestacks", "src:bluestacks"), ("lootbar", "src:lootbar"),
    ("allclash", "src:allclash"), ("heaven-guardian", "src:heaven-guardian"), ("pocketgamer", "src:pocketgamer"),
    ("theriagames", "src:theriagames"), ("packsify", "src:packsify"), ("oldmanduck", "src:oldmanduck"),
    ("appgamer", "src:appgamer"), ("boostroom", "src:boostroom"), ("onechilledgamer", "src:onechilledgamer"),
    ("ldshop", "src:ldshop"), ("youtubesummary", "src:youtube-summary"), ("ajackof", "src:ajackof"),
    ("reddit.com", "src:reddit"), ("nedese", "src:nedese"), ("heroscroll", "src:heroscroll"),
]
DEFAULT_PUB = {  # visible dates when the card did not record one
    "gamerempire.net": "2024-05-24", "rok-free-to-play-guide-en": "2021-03-02", "rok-faqs-en": "2021-02-10",
    "daily-routine-guide-rise-of-kingdoms": "2026-06-30", "free-to-play-progression-guide": "2026-06-22",
    "the-only-rise-of-kingdoms-gathering-guide": "2026-08-23", "lyceum-of-wisdom-rok-answers": "2026-10-01",
    "riseofkingdomsguides.com": "2026-01-02",
}
ORDER = ["id", "dominio", "titulo", "tipo", "metodo", "afirmacao", "valores", "tabela", "custo_tempo_min",
         "custo_tempo_origem", "perfil", "funcao", "estagio_reino", "fontes", "versao_jogo", "data_fonte",
         "data_validade", "versao_minima", "invalidado_por", "confianca", "status", "conflitos", "consenso",
         "n_fontes_pro", "n_fontes_contra", "notas"]
TABELA = {
    "A01-0001": "facts/A01/data/city-hall.csv", "A01-0002": "facts/A01/data/city-hall-rewards.csv",
    "A01-0004": "facts/A01/data/buildings/", "A01-0005": "facts/A01/data/buildings/",
    "A01-0008": "facts/A01/data/buildings/hospital.csv", "A10-0003": "facts/A01/data/buildings/tavern.csv",
    "A05-0001": "facts/A05/data/vip-levels.csv", "A04-0007": "facts/A04/data/vip-shop.csv",
    "A03-0002": "facts/A03/data/resource-buildings.csv", "A03-0003": "facts/A03/data/resource-buildings.csv",
    "A03-0004": "facts/A03/data/resource-buildings.csv", "A03-0006": "facts/A01/data/buildings/storehouse.csv",
    "A03-0024": "facts/A03/data/trading-post.csv", "A03-0025": "facts/A03/data/trading-post.csv",
    "A10-0006": "facts/A01/data/buildings/alliance-center.csv",
}
TIER = {"src:lilith-forum": 1, "src:fandom": 2, "src:rkg-lyceum": 2, "src:reddit": 4, "src:youtube-summary": 3}


def slug_for(url):
    for k, v in HOSTS:
        if k in url:
            return v
    return "src:unknown"


def norm_date(v):
    if v is None:
        return None
    s = str(v)
    m = re.search(r"(\d{4}-\d{2}-\d{2})", s)
    if m:
        return m.group(1)
    m = re.search(r"(\d{4}-\d{2})", s)
    if m:
        return m.group(1)
    m = re.search(r"\b(20\d{2})\b", s)
    return m.group(1) if m else None


def default_pub(url):
    if "fandom.com/wiki/" in url:
        t = unquote(url.split("/wiki/")[1]).replace("_", " ").split("#")[0]
        return REVS.get(t)
    m = re.search(r"/post/(\d+)", url)
    if m:
        return POSTS.get(m.group(1))
    for k, v in DEFAULT_PUB.items():
        if k in url:
            return v
    return None


def dkey(d):
    return (d + "-01-01")[:10] if d and len(d) == 4 else ((d + "-01")[:10] if d and len(d) == 7 else d)


def clean_trecho(t, status):
    t = str(t)
    if status in ("verbatim", "near"):
        t = re.sub(r"\s*\((?:WebFetch[^)]*|tool paraphrase)\)", "", t).strip()
    return t


def migrate(path, dry):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n?(.*)", raw, re.S)
    d, body = yaml.safe_load(m.group(1)), m.group(2)
    cid = d["id"]
    ov = W.O.get(cid, {})
    old_afirm = d["afirmacao"]
    notes_add = []

    # ---- sources
    fontes, qstat = [], []
    for i, s in enumerate(d.get("fontes", [])):
        url = s["url"]
        q = QCI.get((cid, i), {})
        st = q.get("status", "unchecked")
        trecho = s.get("trecho", "")
        if (cid, i) in W.QUOTE_FIX:
            trecho, st = W.QUOTE_FIX[(cid, i)], "fixed"
        elif st in ("partial", "not_found"):
            trecho = str(trecho) + " [wave2: paraphrase — literal text not located on re-fetch 2026-10-13]"
        trecho = clean_trecho(trecho, st if st != "fixed" else "verbatim")
        pub = norm_date(s.get("publicado_em")) or default_pub(url)
        f = {"id": slug_for(url), "url": url, "trecho": trecho, "acessado_em": str(s.get("acessado_em", TODAY)),
             "publicado_em": pub, "copia_de": W.COPIA.get((cid, i))}
        fontes.append(f)
        qstat.append(st)
    for extra in W.ADD_SOURCES.get(cid, []):
        fontes.append(dict(extra))
        qstat.append("added")

    # ---- independence / counts
    contra_slugs = W.CONTRA_SLUGS.get(cid, set())
    pro = {f["id"] for f in fontes if not f["copia_de"] and f["id"] not in contra_slugs}
    n_pro = len(pro)
    n_contra = W.CONTRA.get(cid, len(contra_slugs))

    # ---- tipo / metodo
    tipo = d["tipo"]
    metodo = ""
    if cid in W.DERIVED:
        tipo, metodo = "derivado", W.DERIVED[cid]
    elif cid in W.METODO_EXTRA:
        metodo = W.METODO_EXTRA[cid]

    # ---- perfil / funcao
    pmap = {"baixo": "low", "medio": "medium", "alto": "high"}
    raw_perfil = [pmap.get(p, p) for p in d.get("perfil", ["todos"])]
    moved = [p for p in raw_perfil if p in ("farm", "lider", "lutador", "rally", "guarnicao")]
    perfil = [p for p in raw_perfil if p not in moved] or ["todos"]
    funcao = W.FUNCAO.get(cid) or moved or ["todas"]

    # ---- dates
    pro_dates = [dkey(f["publicado_em"]) for f in fontes if f["publicado_em"] and f["id"] not in contra_slugs]
    data_fonte = max(pro_dates) if pro_dates else None
    data_validade = ov.get("data_validade", data_fonte)

    # ---- status & confidence
    status = d.get("status", "organizado")
    bad = [i for i, s in enumerate(qstat) if s in ("partial", "not_found")]
    unreach = [i for i, s in enumerate(qstat) if s == "unreachable"]
    if status == "organizado":
        status = "verificado" if not bad else "organizado"
    status = ov.get("status", status)
    conf = ov.get("confianca", d.get("confianca", "baixa"))
    tiers = [TIER.get(f["id"], 3) for f in fontes if f["id"] in pro]
    if conf == "alta" and tiers and min(tiers) >= 3:
        conf = "media"
        notes_add.append("confidence capped at media (no T0/T1/T2 among supporting sources)")

    consenso = ov.get("consenso", d.get("consenso", "n/a"))
    if tipo == "derivado":
        consenso = "n/a"
    if tipo == "estrategia" and n_pro <= 1 and n_contra == 0:
        consenso = "fonte_unica"
    if consenso == "unanime" and n_pro < 2:
        consenso = "fonte_unica"

    # ---- notes
    notas = str(d.get("notas", ""))
    notas = re.sub(r"\s*Quotes extracted via WebFetch summarizer; verify literally\.", "", notas)
    n_ok = sum(1 for s in qstat if s in ("verbatim", "near", "fixed"))
    n_old = sum(1 for s in qstat if s != "added")
    qnote = f"Quote re-check 2026-10-13 (curl/API + local parsing): {n_ok}/{n_old} located literally"
    if any(s == "fixed" for s in qstat):
        qnote += f" ({sum(1 for s in qstat if s == 'fixed')} replaced by the literal sentence found on the page)"
    if bad:
        qnote += f"; not literal: source #{', #'.join(str(i + 1) for i in bad)}"
    if unreach:
        qnote += f"; unreachable on re-fetch: source #{', #'.join(str(i + 1) for i in unreach)}"
    added = sum(1 for s in qstat if s == "added")
    if added:
        qnote += f"; {added} source(s) added in wave 2"
    qnote += "."
    w2 = [qnote] + notes_add
    if ov.get("nota"):
        w2.insert(0, ov["nota"])
    if d.get("data_referencia"):
        w2.append(f"v1 data_referencia was {d['data_referencia']}.")
    notas = (notas.strip() + "\n[wave2 2026-10-13] " + " ".join(w2)).strip()

    new = {
        "id": cid, "dominio": d["dominio"], "titulo": ov.get("titulo", d["titulo"]), "tipo": tipo, "metodo": metodo,
        "afirmacao": ov.get("afirmacao", d["afirmacao"]), "valores": ov.get("valores", d.get("valores") or []),
        "tabela": TABELA.get(cid, ""), "custo_tempo_min": None, "custo_tempo_origem": None,
        "perfil": perfil, "funcao": funcao, "estagio_reino": d.get("estagio_reino", ["todos"]),
        "fontes": fontes, "versao_jogo": str(d.get("versao_jogo", "desconhecida")),
        "data_fonte": data_fonte, "data_validade": data_validade, "versao_minima": W.VERSAO_MIN.get(cid),
        "invalidado_por": W.INVALIDADO.get(cid), "confianca": conf, "status": status,
        "conflitos": d.get("conflitos", []) or [], "consenso": consenso,
        "n_fontes_pro": n_pro, "n_fontes_contra": n_contra, "notas": notas,
    }
    if "titulo" in ov and body.strip().startswith("# "):
        body = re.sub(r"^# .*", "# " + new["titulo"], body.strip(), count=1) + "\n"
    if new["afirmacao"] != old_afirm and old_afirm in body:
        body = body.replace(old_afirm, new["afirmacao"])
    fm = yaml.safe_dump({k: new[k] for k in ORDER}, sort_keys=False, allow_unicode=True, width=4096, default_flow_style=None)
    out = "---\n" + fm + "---\n" + (("\n" + body.lstrip("\n")) if body.strip() else "")
    if not dry:
        open(path, "w", encoding="utf-8").write(out)
    return new


def main():
    dry = "--dry-run" in sys.argv
    files = sorted(glob.glob(os.path.join(ROOT, "facts/A*/A*-*.md")) + glob.glob(os.path.join(ROOT, "facts/B01/B01-05*.md")))
    summary = []
    for p in files:
        n = migrate(p, dry)
        summary.append({k: n[k] for k in ("id", "tipo", "confianca", "status", "n_fontes_pro", "n_fontes_contra", "invalidado_por")})
    json.dump(summary, open(os.path.join(HERE, "data/migration_summary_wave2.json"), "w"), indent=1)
    print(len(summary), "cards migrated", "(dry run)" if dry else "")


if __name__ == "__main__":
    main()
