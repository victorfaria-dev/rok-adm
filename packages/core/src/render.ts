// Markdown rendering of a structured guide, in the style of
// guides/f2p-early-kingdom-guide.md (guides/tools/assemble_guide.py). Used by
// tests and as a no-JS fallback. The fact-card appendix needs card metadata
// (status/confidence) that blocks do not carry, so it is not rendered here.

import { CONFIDENCE_LABELS, CONSENSUS_LABELS, PHASE_TITLES, PROFILE_NAMES } from "./blocks";
import type { SelectedBlock, StructuredGuide } from "./blocks";
import type { GuidePhase, SpendingProfile } from "./types";

export interface RenderOptions {
  /**
   * Link target for a fact-card id, or null for no link. Default:
   * `../research/facts/<domain>/<id>.md` for ids listed in the block's `cards`.
   */
  cardHref?: (cardId: string) => string | null;
  /** Document title. */
  title?: string;
  /** Render the "Already done?" list. Default true. */
  includeAlreadyDone?: boolean;
  /**
   * When set, each block gets a badge line (Recommended for this profile, Upcoming).
   * `renderGuideMarkdown` sets it from the guide's profile; leave it unset to get
   * exactly the assemble_guide.py block format.
   */
  profile?: SpendingProfile;
}

const CARD_RE = /\b(?:A\d{2}|B\d{2}|C\d{2})-\d{4}\b/g;
const PLAN_PHASES: GuidePhase[] = ["day4-14", "day15-40", "day41-90", "pre-kvk1"];

export const defaultCardHref = (id: string): string => `../research/facts/${id.slice(0, 3)}/${id}.md`;

function anchor(title: string): string {
  return "#" + title.toLowerCase().replace(/[^\p{L}\p{N}_ -]/gu, "").replace(/ /g, "-");
}

function makeLinker(s: SelectedBlock, opts: RenderOptions): (text: string) => string {
  const known = new Set(s.block.cards);
  const href = opts.cardHref ?? ((id: string) => (known.has(id) ? defaultCardHref(id) : null));
  return (text: string) =>
    text.replace(CARD_RE, (c) => {
      const h = href(c);
      return h === null ? c : `[${c}](${h})`;
    });
}

/** Render one selected block (heading level 3 by default, as in the assembled guide). */
export function renderBlockMarkdown(s: SelectedBlock, opts: RenderOptions = {}, headingLevel = 3): string {
  const b = s.block;
  const link = makeLinker(s, opts);
  const L: string[] = [`${"#".repeat(headingLevel)} ${b.title}`, ""];
  const meta = [
    `**Confiança:** ${CONFIDENCE_LABELS[b.confidence] ?? b.confidence}`,
    `**Consenso:** ${CONSENSUS_LABELS[b.consensus] ?? b.consensus}`,
    `**Prioridade:** ${b.priority}/5`,
  ];
  if (b.recommended_for.length > 0) {
    meta.push("**Recomendado para:** " + b.recommended_for.map((p) => PROFILE_NAMES[p]).join(", "));
  }
  if (b.ch_range) meta.push(`**Prefeitura:** ${b.ch_range[0]}–${b.ch_range[1]}`);
  if (b.hours_min_per_day !== null) meta.push(`**Tempo disponível:** ≥ ${Math.round(b.hours_min_per_day * 60)} min/dia`);
  if (b.time_cost_min !== null) meta.push(`**Custo de tempo:** ${b.time_cost_min} min (T0)`);
  else if (b.section === "daily") meta.push("**Custo de tempo:** pendente de T0 (L-A10-01)");
  meta.push(`\`${b.id}\``);

  const badges: string[] = [];
  if (opts.profile && s.flags.recommended) badges.push(`**Recomendado** para ${PROFILE_NAMES[opts.profile]}`);
  if (opts.profile && s.flags.upcoming && b.ch_range) badges.push(`Em breve (a partir da Prefeitura ${b.ch_range[0]})`);

  L.push(meta.join(" · "), "");
  if (badges.length > 0) L.push(`*${badges.join(" · ")}*`, "");
  L.push(link(b.body_md), "", "**Por quê:** " + link(b.why_md), "");
  if (typeof b.split_views === "string" && b.split_views !== "") {
    L.push("**As duas visões (dividido):** " + link(b.split_views), "");
  }
  if (b.uncertain_notes) L.push("> **Incerto:** " + link(b.uncertain_notes).replace(/\n/g, " "), ">");
  if (b.patch_cards.length > 0) {
    L.push(
      "> **Estado do patch:** " + b.patch_cards.map(link).join(", ") +
        " (fichas de mudança de patch, C04: notas oficiais ou fontes de acompanhamento de patches, ainda sem verificação formal).",
      ">",
    );
  }
  if (b.gaps.length > 0) L.push("> **Pendente de medição no jogo (T0):** " + b.gaps.join(", "), ">");
  while (L.length > 0 && L[L.length - 1] === ">") L.pop();
  if (s.lowSpenderNote) L.push("", "> **Nota para quem gasta pouco (Low):** " + link(s.lowSpenderNote));
  L.push("");
  return L.join("\n");
}

/** Render a whole structured guide as Markdown. */
export function renderGuideMarkdown(guide: StructuredGuide, opts: RenderOptions = {}): string {
  const p = guide.profile;
  const profileName = PROFILE_NAMES[p.spending];
  const title = opts.title ?? `Rise of Kingdoms — Guia ${profileName} para o reino inicial`;
  const withTitle: RenderOptions = { ...opts, title, profile: opts.profile ?? p.spending };
  const out: string[] = [];

  out.push(`# ${title}`, "");
  const asOf = guide.meta.asOf ? `Atualizado em ${guide.meta.asOf}. ` : "";
  const patch = guide.meta.patchRef ? `Conferido com as notas oficiais de patch até ${guide.meta.patchRef}. ` : "";
  out.push(
    `*${asOf}${patch}Perfil: **${profileName}** · ${p.minutesPerDay} min/dia · função \`${p.role}\` · ` +
      `etapa \`${p.kingdomStage}\` · Prefeitura ${p.cityHall}` +
      (p.kingdomDay !== null ? ` · dia ${p.kingdomDay} do reino` : "") +
      (p.civilization ? ` · ${p.civilization}` : "") +
      `. ${guide.meta.shownBlocks} de ${guide.meta.totalBlocks} blocos se aplicam a você.*`,
    "",
  );

  out.push("## Sumário", "");
  for (const s of guide.sections) out.push(`- [${s.title}](${anchor(s.title)})`);
  if ((opts.includeAlreadyDone ?? true) && guide.alreadyDone.length > 0) out.push(`- [Já feito?](#já-feito)`);
  out.push("");

  const renderWithFolded = (s: SelectedBlock, level: number): string[] => [
    renderBlockMarkdown(s, withTitle, level),
    ...s.folded.map((f) => renderBlockMarkdown(f, withTitle, level + 1)),
  ];

  for (const sec of guide.sections) {
    out.push(`## ${sec.title}`, "");
    if (sec.id === "plan") {
      for (const ph of PLAN_PHASES) {
        const sub = sec.blocks.filter((b) => b.block.phase === ph);
        if (sub.length === 0) continue;
        out.push(`### ${PHASE_TITLES[ph] ?? ph}`, "");
        for (const b of sub) out.push(...renderWithFolded(b, 4));
      }
      const other = sec.blocks.filter((b) => !PLAN_PHASES.includes(b.block.phase));
      for (const b of other) out.push(...renderWithFolded(b, 3));
      continue;
    }
    if (sec.id === "farms") {
      out.push("*Apenas um resumo. O guia dedicado a farms (F-03: farms de recurso único, gerais e de par de recursos) vai substituir esta seção.*", "");
    }
    for (const b of sec.blocks) out.push(...renderWithFolded(b, 3));
  }

  if ((opts.includeAlreadyDone ?? true) && guide.alreadyDone.length > 0) {
    out.push("## Já feito?", "", "*Passos de uma Prefeitura ou fase do reino anterior. Confira se você não deixou nenhum para trás.*", "");
    for (const s of guide.alreadyDone) {
      const range = s.block.ch_range ? ` (Prefeitura ${s.block.ch_range[0]}–${s.block.ch_range[1]})` : "";
      out.push(`- **${s.block.title}**${range} · \`${s.block.id}\``);
    }
    out.push("");
  }

  return out.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
}
