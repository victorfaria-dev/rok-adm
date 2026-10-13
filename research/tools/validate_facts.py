#!/usr/bin/env python3
"""Validate fact cards against schemas/fato.md (v2, 2026-10-13).

Usage (from anywhere):
    python3 research/tools/validate_facts.py                 # all cards under research/facts
    python3 research/tools/validate_facts.py A01 A03 B01     # only these domains
    python3 research/tools/validate_facts.py --strict ...    # warnings count as failures
Exit code 1 if any ERROR (or any WARNING with --strict).

Dependencies: Python 3 stdlib; uses PyYAML when installed, otherwise a minimal built-in
front-matter parser (enough for the flow/block style written by tools/migrate_v2.py).
"""
import glob, os, re, sys
from collections import Counter, defaultdict

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
try:
    import yaml  # type: ignore
except Exception:  # pragma: no cover
    yaml = None

TIPOS = {"mecanica", "estrategia", "evento", "regra", "ferramenta", "derivado"}
PERFIS = {"todos", "f2p", "low", "medium", "high", "whale", "kraken"}
FUNCOES = {"todas", "lutador", "farm", "rally", "guarnicao", "lider"}
ESTAGIOS = {"todos", "pre_kvk", "kvk1", "kvk2", "kvk3", "soc"}
CONF = {"baixa", "media", "alta"}
STATUS = {"bruto", "organizado", "verificado", "contestado", "parcialmente_obsoleto", "obsoleto"}
CONSENSO = {"unanime", "majoritario", "dividido", "minoritario", "fonte_unica", "n/a"}
ORIGEM = {None, "medido", "fonte", "estimado"}
REQUIRED = ["id", "dominio", "titulo", "tipo", "afirmacao", "perfil", "estagio_reino", "fontes", "versao_jogo",
            "data_fonte", "data_validade", "confianca", "status", "conflitos", "consenso", "n_fontes_pro",
            "n_fontes_contra", "notas"]
V2_ONLY = ["metodo", "tabela", "custo_tempo_min", "custo_tempo_origem", "funcao", "versao_minima", "invalidado_por"]
KNOWN = set(REQUIRED + V2_ONLY + ["valores"])
SRC_KEYS = {"id", "url", "trecho", "acessado_em", "publicado_em", "publicado_em_tipo", "citacao_literal", "copia_de"}
PUB_TIPOS = {None, "revisao", "publicacao", "modificado", "modificado_em_massa"}
TIER_HI = {"src:lilith-forum": "T1", "src:lilith-tos": "T1", "src:rok-official-site": "T1", "src:t0-victor": "T0",
           "src:x-riseofkingdoms": "T1", "src:lilith-forum-legacy": "T1"}
TIER_T2 = {"src:fandom", "src:rkg-lyceum", "src:davor-toolkit", "src:justia", "src:ajackof"}
DATE = re.compile(r"^\d{4}(-\d{2}(-\d{2})?)?$")
ID = re.compile(r"^[ABC]\d{2}-\d{4}$")


# ---------------------------------------------------------------- minimal YAML fallback
def _scalar(s):
    s = s.strip()
    if s in ("null", "~", ""):
        return None
    if s in ("true", "false"):
        return s == "true"
    if re.fullmatch(r"-?\d+", s):
        return int(s)
    if len(s) >= 2 and s[0] == s[-1] and s[0] in "'\"":
        return s[1:-1].replace("''", "'") if s[0] == "'" else s[1:-1]
    if s.startswith("[") and s.endswith("]"):
        return [_scalar(x) for x in _split(s[1:-1])] if s[1:-1].strip() else []
    if s.startswith("{") and s.endswith("}"):
        out = {}
        for part in _split(s[1:-1]):
            k, _, v = part.partition(":")
            out[k.strip()] = _scalar(v)
        return out
    return s


def _split(s):
    parts, depth, cur, q = [], 0, "", None
    i = 0
    while i < len(s):
        ch = s[i]
        i += 1
        if q:
            cur += ch
            if ch == q and q == "'" and i < len(s) and s[i] == "'":  # '' escape inside single quotes
                cur += s[i]
                i += 1
            elif ch == q:
                q = None
            continue
        if ch in "'\"" and (not cur.strip() or cur.rstrip().endswith(":")):
            q = ch
        elif ch in "[{":
            depth += 1
        elif ch in "]}":
            depth -= 1
        if ch == "," and depth == 0:
            parts.append(cur)
            cur = ""
        else:
            cur += ch
    if cur.strip():
        parts.append(cur)
    return parts


def mini_yaml(text):
    data, key, lines = {}, None, text.split("\n")
    i = 0
    while i < len(lines):
        ln = lines[i]
        if not ln.strip() or ln.lstrip().startswith("#"):
            i += 1
            continue
        if not ln.startswith(" ") and not ln.startswith("-"):
            key, _, rest = ln.partition(":")
            key, rest = key.strip(), rest.strip()
            if rest in ("|", ">", "|-", ">-"):
                buf = []
                i += 1
                while i < len(lines) and (lines[i].startswith("  ") or not lines[i].strip()):
                    buf.append(lines[i][2:])
                    i += 1
                data[key] = "\n".join(buf)
                continue
            if rest and rest[0] in "'\"" and not (len(rest) > 1 and rest.endswith(rest[0])):
                buf = [rest]
                i += 1
                while i < len(lines) and not (lines[i].rstrip().endswith(rest[0])):
                    buf.append(lines[i].strip())
                    i += 1
                if i < len(lines):
                    buf.append(lines[i].strip())
                data[key] = _scalar(" ".join(buf))
                i += 1
                continue
            data[key] = _scalar(rest) if rest else []
        elif ln.lstrip().startswith("- ") and key:
            item = ln.lstrip()[2:]
            if not isinstance(data.get(key), list):
                data[key] = []
            if ":" in item and not item.startswith("{"):
                d = {}
                k, _, v = item.partition(":")
                d[k.strip()] = _scalar(v)
                while i + 1 < len(lines) and lines[i + 1].startswith("    ") and ":" in lines[i + 1]:
                    i += 1
                    k, _, v = lines[i].strip().partition(":")
                    d[k.strip()] = _scalar(v)
                data[key].append(d)
            else:
                data[key].append(_scalar(item))
        i += 1
    return data


def load(path):
    raw = open(path, encoding="utf-8").read()
    m = re.match(r"---\n(.*?)\n---\n?", raw, re.S)
    if not m:
        raise ValueError("no YAML front matter")
    return (yaml.safe_load(m.group(1)) if yaml else mini_yaml(m.group(1))), raw


def registry():
    txt = open(os.path.join(ROOT, "fontes.md"), encoding="utf-8").read()
    return set(re.findall(r"`(src:[a-z0-9-]+)`", txt))


def d2s(v):
    return None if v is None else str(v)


def check(path, slugs, all_ids):
    E, Wn = [], []
    try:
        d, raw = load(path)
    except Exception as e:
        return [f"YAML parse error: {e}"], [], None
    if not isinstance(d, dict):
        return ["front matter is not a mapping"], [], None
    for k in REQUIRED:
        if k not in d:
            E.append(f"missing field '{k}'")
    for k in V2_ONLY:
        if k not in d:
            Wn.append(f"missing v2 field '{k}'")
    for k in d:
        if k not in KNOWN:
            (E if k == "data_referencia" else Wn).append(f"unknown field '{k}'" + (" (v1; migrate to data_validade)" if k == "data_referencia" else ""))
    cid = d.get("id", "")
    if not ID.match(str(cid)):
        E.append(f"bad id '{cid}'")
    if os.path.basename(path)[:-3] != cid:
        E.append("file name does not match id")
    if str(cid)[:3] != str(d.get("dominio")):
        E.append("dominio does not match id prefix")
    tipo = d.get("tipo")
    if tipo not in TIPOS:
        E.append(f"tipo '{tipo}' not in {sorted(TIPOS)}")
    if tipo == "derivado" and not str(d.get("metodo") or "").strip():
        E.append("tipo=derivado requires metodo")
    for fld, allowed in (("perfil", PERFIS), ("funcao", FUNCOES), ("estagio_reino", ESTAGIOS)):
        v = d.get(fld)
        if v is None and fld == "funcao":
            continue
        if not isinstance(v, list) or not v:
            E.append(f"{fld} must be a non-empty list")
            continue
        bad = [x for x in v if x not in allowed]
        if bad:
            E.append(f"{fld} has invalid values {bad}")
    conf, st, cons = d.get("confianca"), d.get("status"), d.get("consenso")
    if conf not in CONF:
        E.append(f"confianca '{conf}' invalid (old low/medium/high must be migrated)")
    if st not in STATUS:
        E.append(f"status '{st}' invalid")
    if cons not in CONSENSO:
        E.append(f"consenso '{cons}' invalid")
    if tipo == "estrategia" and cons in (None, "n/a"):
        E.append("estrategia requires consenso")
    if d.get("custo_tempo_origem") not in ORIGEM:
        E.append("custo_tempo_origem invalid")
    if d.get("custo_tempo_min") is not None and d.get("custo_tempo_origem") is None:
        Wn.append("custo_tempo_min without custo_tempo_origem")
    for k in ("n_fontes_pro", "n_fontes_contra"):
        if k in d and not isinstance(d[k], int):
            E.append(f"{k} must be an integer")
    for k in ("data_fonte", "data_validade"):
        v = d2s(d.get(k))
        if v is not None and not DATE.match(v):
            E.append(f"{k} '{v}' is not YYYY[-MM[-DD]]")
    if st in ("obsoleto", "parcialmente_obsoleto") and not d.get("invalidado_por"):
        E.append(f"status {st} requires invalidado_por")
    if d.get("invalidado_por") and st not in ("obsoleto", "parcialmente_obsoleto", "contestado"):
        Wn.append("invalidado_por set but status is not (parcialmente_)obsoleto")
    tab = d.get("tabela") or ""
    if tab and not os.path.exists(os.path.join(ROOT, tab)):
        E.append(f"tabela path not found: {tab}")
    fontes = d.get("fontes") or []
    if not fontes:
        E.append("no fontes")
    tiers, indep = [], set()
    for j, s in enumerate(fontes, 1):
        if not isinstance(s, dict):
            E.append(f"fonte #{j} is not a mapping")
            continue
        sid = str(s.get("id", ""))
        if not sid.startswith("src:"):
            E.append(f"fonte #{j} id '{sid}' is not a slug (src:...)")
        elif sid not in slugs:
            E.append(f"fonte #{j} slug '{sid}' not registered in fontes.md")
        for k in ("url", "trecho"):
            if not str(s.get(k) or "").strip():
                (E if st != "bruto" else Wn).append(f"fonte #{j} missing {k}")
        if not s.get("acessado_em"):
            Wn.append(f"fonte #{j} missing acessado_em")
        for k in s:
            if k not in SRC_KEYS:
                Wn.append(f"fonte #{j} unknown key '{k}'")
        cp = s.get("copia_de")
        if cp and cp not in slugs:
            E.append(f"fonte #{j} copia_de '{cp}' not registered")
        if s.get("publicado_em_tipo") not in PUB_TIPOS:
            E.append(f"fonte #{j} publicado_em_tipo '{s.get('publicado_em_tipo')}' invalid")
        if s.get("citacao_literal") not in (None, True, False):
            E.append(f"fonte #{j} citacao_literal must be true, false or null")
        if s.get("citacao_literal") is False and st == "verificado":
            E.append(f"fonte #{j} citacao_literal=false but status is verificado")
        if "WebFetch" in str(s.get("trecho", "")):
            Wn.append(f"fonte #{j} trecho still marked WebFetch (not verified literally)")
        if not cp:
            indep.add(sid)
        tiers.append(TIER_HI.get(sid, "T2" if sid in TIER_T2 else "T3+"))
    if conf == "alta":
        if not any(t in ("T0", "T1") for t in tiers) and sum(1 for s in indep if s in TIER_T2) < 2:
            E.append("confianca=alta needs a T0/T1 source or two independent T2 sources")
    if tipo == "estrategia" and conf == "alta":
        Wn.append("estrategia with confianca=alta (review)")
    if isinstance(d.get("n_fontes_pro"), int) and d["n_fontes_pro"] > len(indep):
        Wn.append("n_fontes_pro larger than number of independent slugs cited")
    if cons == "unanime" and isinstance(d.get("n_fontes_pro"), int) and d["n_fontes_pro"] < 2:
        E.append("consenso=unanime with fewer than 2 supporting sources (use fonte_unica)")
    for c in d.get("conflitos") or []:
        if c not in all_ids:
            Wn.append(f"conflito '{c}' not found among cards")
    return E, Wn, d


def main():
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    strict = "--strict" in sys.argv
    files = sorted(glob.glob(os.path.join(ROOT, "facts/*/*-[0-9][0-9][0-9][0-9].md")))
    all_ids = {os.path.basename(f)[:-3] for f in files}
    if args:
        files = [f for f in files if os.path.basename(os.path.dirname(f)) in args]
    slugs = registry()
    tot_e = tot_w = 0
    per_dom = defaultdict(Counter)
    cards = {}
    for f in files:
        E, Wn, d = check(f, slugs, all_ids)
        dom = os.path.basename(os.path.dirname(f))
        per_dom[dom]["cards"] += 1
        per_dom[dom]["err_cards"] += bool(E)
        per_dom[dom]["warn_cards"] += bool(Wn)
        if d:
            cards[d.get("id")] = d
        for e in E:
            print(f"ERROR   {os.path.relpath(f, ROOT)}: {e}")
        for w in Wn:
            print(f"WARNING {os.path.relpath(f, ROOT)}: {w}")
        tot_e += len(E)
        tot_w += len(Wn)
    # reciprocity of conflicts (warning only)
    for cid, d in cards.items():
        for c in d.get("conflitos") or []:
            if c in cards and cid not in (cards[c].get("conflitos") or []):
                print(f"WARNING {cid}: conflict with {c} is not reciprocal")
                tot_w += 1
    print("\nSummary per domain (cards / with errors / with warnings):")
    for dom in sorted(per_dom):
        c = per_dom[dom]
        print(f"  {dom}: {c['cards']} / {c['err_cards']} / {c['warn_cards']}")
    print(f"\nTOTAL: {len(files)} cards, {tot_e} errors, {tot_w} warnings (PyYAML={'yes' if yaml else 'no, fallback parser'})")
    sys.exit(1 if tot_e or (strict and tot_w) else 0)


if __name__ == "__main__":
    main()
