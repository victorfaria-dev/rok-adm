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

sys.dont_write_bytecode = True
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import factlib  # noqa: E402

HERE = os.path.dirname(os.path.abspath(__file__))
GUIDES = os.path.abspath(os.path.join(HERE, ".."))

SECTIONS = [
    ("overview", "1. Visão geral e expectativas realistas"),
    ("day0", "2. Preparação dos dias 0–3: civilização e primeiras escolhas"),
    ("plan", "3. Plano fase a fase até a KvK1"),
    ("daily", "4. Rotina diária por tempo disponível"),
    ("events", "5. Calendário de eventos e preparação"),
    ("farms", "6. Farms"),
    ("mistakes", "7. Erros a evitar"),
    ("recovery", "8. Se você foi zerado"),
    ("open", "9. Perguntas em aberto e medições pendentes"),
]
PHASE_TITLES = {
    "day4-14": "Dias 4–14 (Prefeitura 8 → 12, aproximadamente)",
    "day15-40": "Dias 15–40 (Prefeitura 12 → 17, VIP 6, aproximadamente)",
    "day41-90": "Dias 41–90 (Prefeitura 17 → 21/22, T4)",
    "pre-kvk1": "Pré-KvK1 e KvK1 (aproximadamente dia 85–100+)",
}
PHASE_ORDER = ["overview", "day0-3", "day4-14", "day15-40", "day41-90", "pre-kvk1", "daily", "event", "anytime"]
PROFILE_NAMES = {"f2p": "F2P", "low": "Low", "medium": "Medium", "high": "High", "whale": "Whale", "kraken": "Kraken"}
CONFIDENCE_PT = {"high": "alta", "medium": "média", "low": "baixa", "pending": "pendente"}
CONSENSUS_PT = {"unanimous": "unânime", "majority": "maioria", "split": "dividido", "mechanic": "mecânica",
                "single_source": "fonte única", "single-source": "fonte única", "minority": "minoria", "n/a": "n/d"}


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
                               "(proposed gap, to be added by the research side)", "alto (proposed)")  # texto da pesquisa, mantido em inglês
    return out


def applies(b, perfil):
    return perfil in b["perfil"] or "todos" in b["perfil"]


def render_block(b, cards):
    L = [f"### {b['title']}", ""]
    meta = [f"**Confiança:** {CONFIDENCE_PT.get(b['confidence'], b['confidence'])}",
            f"**Consenso:** {CONSENSUS_PT.get(b['consensus'], b['consensus'])}",
            f"**Prioridade:** {b['priority']}/5"]
    if b["recommended_for"]:
        meta.append("**Recomendado para:** " + ", ".join(PROFILE_NAMES[p] for p in b["recommended_for"]))
    if b["ch_range"]:
        meta.append(f"**Prefeitura:** {b['ch_range'][0]}–{b['ch_range'][1]}")
    if b["hours_min_per_day"] is not None:
        meta.append(f"**Tempo disponível:** ≥ {int(round(b['hours_min_per_day'] * 60))} min/dia")
    if b["time_cost_min"] is not None:
        meta.append(f"**Custo de tempo:** {b['time_cost_min']} min (T0)")
    elif b["section"] == "daily":
        meta.append("**Custo de tempo:** pendente de T0 (L-A10-01)")
    meta.append(f"`{b['id']}`")
    L += [" · ".join(meta), "", link_cards(b["body_md"], cards), "",
          "**Por quê:** " + link_cards(b["why_md"], cards), ""]
    if b["split_views"]:
        L += ["**As duas visões (dividido):** " + link_cards(b["split_views"], cards), ""]
    if b["uncertain_notes"]:
        L += ["> **Incerto:** " + link_cards(b["uncertain_notes"], cards).replace("\n", " "), ">"]
    if b["patch_cards"]:
        L += ["> **Estado do patch:** " + ", ".join(link_cards(c, cards) for c in b["patch_cards"]) +
              " (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).", ">"]
    if b["gaps"]:
        L += ["> **Pendente de medição no jogo (T0):** " + ", ".join(b["gaps"]), ">"]
    while L and L[-1] == ">":
        L.pop()
    if b["low_spender_note"]:
        L += ["", "> **Nota para quem gasta pouco (Low):** " + link_cards(b["low_spender_note"], cards)]
    L.append("")
    return "\n".join(L)


INTRO = """# Rise of Kingdoms — Guia F2P para o reino inicial (reino novo → KvK1), v1

*Atualizado em {as_of}. Conferido com as notas oficiais de patch até {patch}. Perfil: **F2P**. Montado automaticamente a partir de `guides/data/blocks.f2p.json` ({n} blocos) por `guides/tools/assemble_guide.py`: edite os blocos, não este arquivo.*

## Como ler este guia

- **Todo número e toda recomendação citam fichas de fatos** (p. ex. [A01-0001](../research/facts/A01/A01-0001.md)). As afirmações firmes usam apenas fichas com status `verificado` e confiança `media` ou `alta`.
- **Incerto**: a afirmação se apoia em uma ficha mais fraca, contestada ou parcialmente desatualizada; a nota explica o motivo.
- **Pendente de medição no jogo (T0)**: ninguém mediu ainda; o ID da lacuna aponta para `research/facts/<domínio>/_lacunas.md` e para o diário T0 (`research/protocolos/t0-medicao.md`).
- **Estado do patch**: algumas fichas de mudança de patch (C04) vêm de notas oficiais mas ainda não passaram pela verificação formal; aparecem como estado do patch.
- **Consenso**: *unânime* / *maioria* / *dividido* (as duas visões são mostradas) / *mecânica* (regra do jogo, não opinião).
- **Recomendado** marca a opção padrão para o perfil F2P. As **notas para quem gasta pouco (Low)** indicam onde gastar um pouco muda bastante o conselho (um guia delta completo para o perfil Low virá depois).
- **Custos de tempo**: nenhuma fonte publica minutos por tarefa; eles aguardam o cronômetro do T0 (L-A10-01).
- Os IDs dos blocos (`como-este`) são o que o futuro questionário usa para filtrar o guia.

## Sumário

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

    toc = "\n".join(f"- [{t}](#{re.sub(r'[^\w -]', '', t.lower()).replace(' ', '-')})" for _, t in SECTIONS)
    toc += "\n- [Apêndice: fontes e confiança](#apêndice-fontes-e-confiança)"
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
            parts.append("*Apenas um resumo. O guia dedicado a farms (F-03: farms de recurso único, gerais e de par de recursos) vai substituir esta seção.*\n")
        parts.extend(render_block(b, cards) for b in sec)

    # Appendix
    cited = {}
    for b in blocks:
        for c in b["cards"]:
            cited.setdefault(c, []).append(b["id"])
    firm = [c for c in cited if c in cards and factlib.is_firm(cards[c])]
    A = ["## Apêndice: fontes e confiança", "",
         f"**{len(cited)} fichas de fatos citadas**; {len(firm)} passam no filtro firme (`verificado` + `media`/`alta`). "
         "As demais aparecem apenas dentro das notas *Incerto* ou como *Estado do patch*.", "",
         "| Ficha | Título | Status | Confiança | Consenso | Firme? | Usada em |", "|---|---|---|---|---|---|---|"]
    for c in sorted(cited):
        m = cards[c]
        title = m["titulo"].replace("|", "/")[:90]
        A.append(f"| {link_cards(c, cards)} | {title} | {m['status']} | {m['confianca']} | {m['consenso'] or 'n/a'} | "
                 f"{'sim' if factlib.is_firm(m) else 'não'} | {', '.join('`'+x+'`' for x in cited[c])} |")
    used_gaps = {}
    for b in blocks:
        for g in b["gaps"]:
            used_gaps.setdefault(g, []).append(b["id"])
    A += ["", "### Lacunas referenciadas (medição ou pesquisa pendente)", "",
          "| Lacuna | Descrição | Impacto | Blocos |", "|---|---|---|---|"]
    for g in sorted(used_gaps):
        d, imp = gaps.get(g, ("(descrição não encontrada)", ""))
        A.append(f"| {g} | {d.replace('|', '/')} | {imp} | {', '.join('`'+x+'`' for x in used_gaps[g])} |")
    conf = {}
    for b in blocks:
        conf[b["confidence"]] = conf.get(b["confidence"], 0) + 1
    A += ["", "### Confiança dos blocos", "", ", ".join(f"{CONFIDENCE_PT.get(k, k)}: {v}" for k, v in sorted(conf.items())), "",
          "### Contradições conhecidas na pesquisa (nesta versão)", "",
          "- **Tempo até o T4:** relatos de jogadores de 2026 dizem que o T4 chega \"por volta do dia 30\" ([B01-0700](../research/facts/B01/B01-0700.md)), "
          "mas o orçamento bruto derivado de construção até a Prefeitura 21 (desbloqueio do T4) é de cerca de 163 dias de construtor "
          "([A01-0005](../research/facts/A01/A01-0005.md)). Ambos são `baixa`; o T0 resolve (L-A02-03).",
          "- **Níveis de desbloqueio iniciais:** Academia e primeira Pedreira na Prefeitura 4 ou 6, Entreposto Comercial na 10 ou 12 "
          "([A01-0009](../research/facts/A01/A01-0009.md), [A03-0025](../research/facts/A03/A03-0025.md)); a tabela de Prefeituras do Fandom ainda lista o Entreposto Comercial na 10.",
          "- **Duração da KvK:** 60 dias (T3 de 2024) contra 50 dias (T4 de 2026) ([B01-0502](../research/facts/B01/B01-0502.md)).",
          "- **Gastar gemas em VIP:** maioria diz que sim, AllClash (2020) diz que não ([A05-0008](../research/facts/A05/A05-0008.md)).",
          "- **Valor da coleta diária de PA:** 500 PA segundo a 1.0.41 oficial (2020); a nota da 1.1.02 não o repete "
          "([A09-0006](../research/facts/A09/A09-0006.md), L-A09-02).",
          "- **As fichas de estado de patch** (C04) ainda são `bruto`, embora os pacotes de contexto tratem a maioria delas como fatos T1.", ""]
    parts.append("\n".join(A))
    with open(out, "w", encoding="utf-8") as fh:
        fh.write("\n".join(parts).rstrip() + "\n")
    print(f"wrote {os.path.relpath(out)} ({len(blocks)} blocks, {len(cited)} cards, {len(used_gaps)} gaps)")


if __name__ == "__main__":
    main(sys.argv)
