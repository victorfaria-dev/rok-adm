// Guide directory (client-safe: no data imports). One entry per guide page; the
// /guides/ index lists them, the static guide pages are generated from the
// entries with a `slug`, and the personal guide links them from "Guides for you".
import { deltaSetsFor, guidesForProfile, type AccountProfile, type GuideSetId, type GuideSituation } from "@rokadm/core";

export interface GuidePage {
  /** Blocks set in guides/data (`blocks.<set>.json`). */
  set: GuideSetId | "farms";
  href: string;
  /** Path segment under /guides/ for the static guide pages built by guides/[slug].astro. */
  slug?: string;
  title: string;
  /** One line: what the guide is. */
  summary: string;
  /** One line: who it is for. */
  audience: string;
}

export const GUIDE_PAGES: readonly GuidePage[] = [
  {
    set: "f2p",
    href: "/guide/",
    title: "Seu guia",
    summary: "O plano passo a passo do dia 0 até o KvK1, com um teste de realidade do orçamento.",
    audience: "Toda conta. Ele se ajusta ao seu gasto, tempo de jogo e Prefeitura depois de 5 perguntas rápidas.",
  },
  {
    set: "latestage",
    href: "/guides/late-game/",
    slug: "late-game",
    title: "Guia do fim de jogo",
    summary: "Depois do KvK1: T5 como projeto de pesquisa, cura e o Salão dos Heróis, trocas e reservas de comandantes, equipamentos por temporada.",
    audience: "Jogadores cujo reino está no KvK2, no KvK3 ou na Temporada de Conquista.",
  },
  {
    set: "newkingdom",
    href: "/guides/new-kingdom/",
    title: "Guia do reino novo",
    summary: "Sobreviva ao dia 1 de um reino novo e organize as duas primeiras semanas.",
    audience: "Jogadores num reino que abriu nos últimos 14 dias.",
  },
  {
    set: "first30",
    href: "/guides/first-30-days/",
    slug: "first-30-days",
    title: "Seus primeiros 30 dias",
    summary: "Metas e um conceito-chave para cada trecho do seu primeiro mês.",
    audience: "Jogadores novos, até cerca da Prefeitura 16.",
  },
  {
    set: "low",
    href: "/guides/low-spender/",
    slug: "low-spender",
    title: "Guia para quem gasta pouco",
    summary: "O que muda quando você compra só o Fundo de Crescimento e o suprimento de gemas de 30 dias.",
    audience: "Quem gasta pouco e compra só os passes. Estes passos acrescentam ou substituem passos do seu guia.",
  },
  {
    set: "returning",
    href: "/guides/returning/",
    slug: "returning",
    title: "Voltando ao jogo",
    summary: "O que mudou enquanto você esteve fora, um plano de 14 dias para se atualizar, e ficar, migrar ou recomeçar.",
    audience: "Jogadores que voltam depois de uma pausa de semanas ou mais.",
  },
  {
    set: "recovery",
    href: "/guides/recovery/",
    slug: "recovery",
    title: "Recuperação depois de ser zerado",
    summary: "A primeira hora, as duas primeiras semanas e uma lista de riscos ao sair do jogo.",
    audience: "Quem acabou de perder a maior parte das tropas ou dos recursos num ataque.",
  },
  {
    set: "kingdomadmin",
    href: "/guides/kingdom-admin/",
    slug: "kingdom-admin",
    title: "Administração do reino",
    summary: "Regras, DKP, preparação de KvK e MGE, migração e pontos de falha.",
    audience: "Reis, conselheiros e líderes de aliança.",
  },
  {
    set: "farms",
    href: "/guides/farms/",
    title: "Contas farm",
    summary: "Se vale ter uma farm, qual, como montar e como enviar recursos.",
    audience: "Jogadores pensando numa segunda conta para abastecer a principal.",
  },
];

/** The guide pages built from guides/[slug].astro. */
export const STATIC_GUIDES: readonly (GuidePage & { slug: string })[] = GUIDE_PAGES.filter(
  (g): g is GuidePage & { slug: string } => g.slug !== undefined,
);

export function guidePage(set: GuidePage["set"]): GuidePage {
  const g = GUIDE_PAGES.find((p) => p.set === set);
  if (!g) throw new Error(`no guide page for ${set}`);
  return g;
}

export interface GuideLink {
  set: GuidePage["set"];
  href: string;
  title: string;
  /** Por que é oferecido. */
  reason: string;
  /** Steps already merged into the guide on this page (shown apart, after the matches). */
  included?: boolean;
}

/**
 * "Guides for you" on the personal guide: core's guidesForProfile without the base
 * guide (that is the page the strip sits on), most specific first (a returning
 * player sees Returning first). A farm account also gets the farm guides (Q2 P2-8).
 * Low and higher profiles also get the Low spender page, whose steps their guide
 * already merges in: it is marked `included` and always listed last, and for Medium
 * and above it is labelled as steps inside their guide, never as "Guia para quem gasta pouco".
 */
export function guidesForYou(profile: AccountProfile, situation: GuideSituation = {}): GuideLink[] {
  const out: GuideLink[] = guidesForProfile(profile, situation)
    .filter((g) => g.set.kind === "guide")
    .map((g) => {
      const page = guidePage(g.set.id);
      // Late game (KvK2+): core lists it right after the reported situations; on /guide/ it is also the main plan.
      const reason = g.set.id === "latestage" ? `${g.reason} Os passos dele são o plano principal desta página; leia-os separados aqui.` : g.reason;
      return { set: page.set, href: page.href, title: page.title, reason };
    });
  if (profile.role === "farm") {
    const page = guidePage("farms");
    out.push({ set: "farms", href: page.href, title: page.title, reason: "Você disse que esta é uma conta farm: o que construir e como enviar recursos para a principal." });
  }
  if (hasLowDelta(profile)) {
    const page = guidePage("low");
    out.push(profile.spending === "low"
      ? { set: "low", href: page.href, title: page.title, reason: "Os passos dele já estão incorporados ao seu guia abaixo; leia-os separados aqui.", included: true }
      : { set: "low", href: page.href, title: "Passos só do passe (página de quem gasta pouco)", reason: "Seu guia já inclui estes passos, pois valem para todo jogador que compra o Fundo de Crescimento e o suprimento de gemas. Leia-os separados aqui.", included: true });
  }
  return out;
}

/** True when the profile's guide merges the Low spender delta (Low and every profile above it). */
export function hasLowDelta(profile: AccountProfile): boolean {
  return deltaSetsFor(profile.spending).some((d) => d.id === "low");
}

/** Without a profile (the default guide): the situational guides, each with who it is for. */
export function defaultGuideLinks(): GuideLink[] {
  return (["newkingdom", "first30", "returning", "recovery"] as const).map((set) => {
    const p = guidePage(set);
    return { set, href: p.href, title: p.title, reason: p.audience };
  });
}
