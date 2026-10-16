// The Guides tab (/guides/, UX stage 1): every piece of guide content in one list, grouped by what
// the reader wants to do. Client-safe (no data imports). Guides are public and never need a login.
import type { AccountProfile } from "@rokadm/core";
import { GUIDE_PAGES, guidePage, guidesForYou, type GuidePage } from "./guides";
import type { PlayingAs } from "./store";

/** Topic tag used by the "For you" filter: a guide set, or "always" for content everyone gets. */
export type HubTag = GuidePage["set"] | "always";

export interface HubItem {
  href: string;
  title: string;
  /** One line: what it is. */
  summary: string;
  /** Guide set whose step list the hub summarises (step count, patch), when it is a guide page. */
  set?: GuidePage["set"];
  tag: HubTag;
  /** Extra links shown under the item (e.g. the four farm resource guides). */
  links?: { href: string; label: string }[];
}

export interface HubGroup {
  id: string;
  title: string;
  items: HubItem[];
}

const RES_PT = { food: "comida", wood: "madeira", stone: "pedra", gold: "ouro" } as const;

const fromPage = (set: GuidePage["set"], tag: HubTag = set): HubItem => {
  const g = guidePage(set);
  return { href: g.href, title: g.title, summary: g.summary, set, tag };
};

// Todos os rótulos dos grupos do hub ficam aqui.
export const HUB_GROUPS: readonly HubGroup[] = [
  {
    id: "plan",
    title: "Planejar minha conta",
    items: [fromPage("f2p", "always"), fromPage("first30"), fromPage("low"), fromPage("latestage")],
  },
  {
    id: "commanders",
    title: "Comandantes",
    items: [{
      href: "/commanders/", title: "Guia de comandantes",
      summary: "Quais comandantes valem suas esculturas: validade e Vale a pena / Espere / Evite, com os motivos.", tag: "always",
    }],
  },
  { id: "new-kingdom", title: "Começando num reino novo", items: [fromPage("newkingdom")] },
  {
    id: "back",
    title: "Voltando depois de uma pausa",
    items: [
      fromPage("returning"),
      { href: "/changes/", title: "O que mudou desde…", summary: "Escolha quando parou de jogar e veja as atualizações desde então.", tag: "returning" },
    ],
  },
  {
    id: "trouble",
    title: "Quando dá errado",
    items: [
      fromPage("recovery"),
      { href: "/tools/zeroed/", title: "Foi zerado? Plano de recuperação", summary: "Uma lista de 30 segundos para sair do jogo e o que reconstruir primeiro.", tag: "recovery" },
      { href: "/tools/safety/", title: "Jogue com segurança", summary: "O que leva contas a serem banidas, e um montador de pedido ao suporte.", tag: "always" },
    ],
  },
  {
    id: "farms",
    title: "Contas farm",
    items: [{
      ...fromPage("farms"),
      links: (["food", "wood", "stone", "gold"] as const).map((r) => ({ href: `/guides/farms/${r}/`, label: `Farm de ${RES_PT[r]}` })),
    }],
  },
  { id: "lead", title: "Liderando um reino", items: [fromPage("kingdomadmin")] },
];

/** Every guide page appears exactly once in the hub (tested). */
export const HUB_PAGES_COVERED: readonly string[] = GUIDE_PAGES.map((g) => g.href);

/**
 * Tags that apply to this reader: the base guide and safety always, the guides core suggests for
 * the profile (guidesForYou), and kingdom administration for leaders.
 */
export function tagsFor(profile: AccountProfile, playingAs: PlayingAs): Set<HubTag> {
  const tags = new Set<HubTag>(["always"]);
  for (const g of guidesForYou(profile)) tags.add(g.set);
  if (playingAs === "leader" || profile.role === "lider") tags.add("kingdomadmin");
  return tags;
}
