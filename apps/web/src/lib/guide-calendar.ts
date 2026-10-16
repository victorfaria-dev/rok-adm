// BUILD-TIME ONLY (imports the fact dataset). Kingdom-day calendar of the guide (wave VG): each milestone
// takes its day from a dated fact card. A milestone whose card is missing, has no source or is outdated
// is shipped as pending (day null), never with a made-up date. The unit test checks that every day below
// is written in its card, so the dates cannot drift from the research.
import { getFact } from "@rokadm/data";
import { cardBadge } from "./guide-payload";
import type { CalendarMilestone } from "./guide-types";

export interface MilestoneSpec {
  id: string;
  title: string;
  day: [number, number] | null;
  approx: boolean;
  kind: CalendarMilestone["kind"];
  facts: string[];
  /** Text that must appear in the first card (statement, title or a value) to back `day`. */
  evidence: string | null;
  gaps?: string[];
  note?: string;
}

export const MILESTONES: readonly MilestoneSpec[] = [
  { id: "pelagius", title: "Abre o evento do lendário Pelágio", day: [5, 5], approx: false, kind: "event", facts: ["C04-0005"], evidence: "day 5" },
  { id: "pioneer", title: "Pioneiro / Caminho do Renascimento", day: [20, 23], approx: true, kind: "event", facts: ["A11-0510"], evidence: "day 20–23" },
  { id: "more-than-gems", title: "More Than Gems pode começar (reinos com mais de ~21 dias)", day: [21, 21], approx: true, kind: "event", facts: ["A11-0502"], evidence: "older than ~21 days" },
  { id: "first-wheel", title: "Primeira Roda da Fortuna", day: [24, 24], approx: true, kind: "event", facts: ["A11-0503"], evidence: "24" },
  { id: "t4", title: "T4 geralmente alcançado (relatos de jogadores)", day: [30, 30], approx: true, kind: "checkpoint", facts: ["B01-0700"], evidence: "~day 30" },
  { id: "pre-kvk", title: "Pré-KvK: Véspera da Cruzada", day: [85, 95], approx: true, kind: "kvk", facts: ["B01-0500"], evidence: "day 85–95" },
  { id: "ysg-wheel", title: "Yi Seong-Gye na Roda da Fortuna", day: [94, 94], approx: true, kind: "event", facts: ["A06-0502"], evidence: "day 94" },
  { id: "kvk1", title: "Começa o KvK1 (Temporada 1)", day: [100, 100], approx: true, kind: "kvk", facts: ["B01-0500"], evidence: "day 100" },
  {
    id: "kvk1-length", title: "O KvK1 dura cerca de 60 dias", day: [100, 160], approx: true, kind: "kvk", facts: ["B01-0502"], evidence: "~60 days",
    note: "As fontes divergem: uma diz 60 dias, um jogador de 2026 diz 50.",
  },
  { id: "monument", title: "Datas das etapas das Crônicas do Reino (Monumento)", day: null, approx: false, kind: "checkpoint", facts: ["B01-0505"], evidence: null, gaps: ["L-B01-01"] },
  { id: "event-firsts", title: "Primeiro dia de cada evento recorrente (MGE, Arca de Osíris, Lohar…)", day: null, approx: false, kind: "event", facts: ["A11-0512"], evidence: null, gaps: ["L-A11-01"] },
  { id: "lost-kingdom", title: "Entrada no Reino Perdido e horário da Véspera na Temporada 1", day: null, approx: false, kind: "kvk", facts: ["B01-0503"], evidence: null, gaps: ["L-B01-03"] },
  { id: "barbarians", title: "Desbloqueio dos níveis de bárbaros", day: null, approx: false, kind: "checkpoint", facts: ["A09-0004"], evidence: null, gaps: ["L-A09-05"] },
];

/** True when a card may date a milestone: it exists, cites a source and is not outdated. */
export function canDate(id: string): boolean {
  const f = getFact(id);
  return !!f && f.sources.length > 0 && f.status !== "obsoleto";
}

export function buildCalendar(specs: readonly MilestoneSpec[] = MILESTONES): CalendarMilestone[] {
  return specs.map((s) => {
    const badges = s.facts.map(cardBadge);
    const dated = s.day !== null && s.facts.every(canDate);
    const order = ["high", "medium", "low", "pending"] as const;
    // The weakest card sets the milestone's confidence.
    const confidence = dated ? badges.reduce((w, b) => (order.indexOf(b.confidence) > order.indexOf(w) ? b.confidence : w), "high" as CalendarMilestone["confidence"]) : "pending";
    return {
      id: s.id,
      title: s.title,
      day: dated ? s.day : null,
      approx: dated && s.approx,
      kind: s.kind,
      facts: [...s.facts],
      confidence,
      label: badges.map((b) => b.label).join("; "),
      sources: [...new Set(badges.flatMap((b) => b.sources))],
      gaps: s.gaps ? [...s.gaps] : [],
      note: s.note ?? null,
    };
  });
}
