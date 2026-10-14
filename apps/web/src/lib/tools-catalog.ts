// The /tools/ hub list (client-safe, no data), grouped by task (UX stage 1). Guide-like pages
// (safety FAQ, zeroed plan, glossary, what changed) live on the Guides tab; trust is in the footer.
export type ToolGroup = "spend" | "time" | "combat" | "kingdom" | "farms" | "experimental";

export interface ToolEntry {
  href: string;
  title: string;
  blurb: string;
  /** Feature ids in produto/arvore-funcionalidades.md. */
  features: string[];
  group: ToolGroup;
}

export const TOOLS: readonly ToolEntry[] = [
  { href: "/tools/pack-value/", title: "Valor de pacotes", blurb: "Gemas e pontos VIP por dólar, no preço que você vê. Os itens não entram na conta.", features: ["F-14"], group: "spend" },
  { href: "/tools/gems/", title: "Tabela de valor das gemas", blurb: "O que cada uso de gemas compra: VIP, Pontos de Ação, itens da Loja VIP.", features: ["F-21"], group: "spend" },
  { href: "/tools/vip/", title: "Gemas para VIP", blurb: "Pontos, gemas e dias até o seu próximo nível de VIP.", features: ["F-21"], group: "spend" },
  { href: "/tools/hoard/", title: "Guia de acúmulo", blurb: "O que guardar para cada evento, sem chutar datas.", features: ["F-25"], group: "spend" },
  { href: "/tools/speedups/", title: "Acelerações e tempo", blurb: "Some suas acelerações e compare com o tempo de uma tarefa.", features: ["F-81"], group: "time" },
  { href: "/tools/buildings/", title: "Custo de construções", blurb: "Recursos e tempo bruto de um nível a outro, em qualquer construção.", features: ["F-81"], group: "time" },
  { href: "/tools/healing/", title: "Planejador de cura", blurb: "Capacidade do hospital e quanto custa curar um hospital cheio.", features: ["F-22"], group: "combat" },
  { href: "/tools/action-points/", title: "Pontos de Ação", blurb: "Ataques a bárbaros por PA e o preço em gemas para comprar mais.", features: ["F-81"], group: "combat" },
  { href: "/tools/kvk/", title: "Preparo para a KvK", blurb: "Uma lista para o seu primeiro KvK, com uma explicação simples da temporada.", features: ["F-26"], group: "kingdom" },
  { href: "/tools/migration/", title: "Verificador de migração", blurb: "Você pode migrar? O que falta, pelas regras atuais.", features: ["F-31"], group: "kingdom" },
  { href: "/farms/", title: "Central de farms", blurb: "Suas contas farm, uma lista diária e o registro de envios, além de qual farm criar, o caminho de construção e a calculadora do Entreposto Comercial.", features: ["F-04", "F-65", "F-66", "F-68"], group: "farms" },
  { href: "/tools/screenshot/", title: "Ler meus prints", blurb: "Poder, pontos de abate, Prefeitura e VIP sugeridos a partir de prints da sua própria conta, lidos no seu aparelho. Você confere cada valor.", features: ["F-54"], group: "experimental" },
];

export const GROUPS: readonly { id: ToolGroup; title: string }[] = [
  { id: "spend", title: "Gastos e valor" },
  { id: "time", title: "Acelerações e tempo" },
  { id: "combat", title: "Combate e cura" },
  { id: "kingdom", title: "Mudanças de reino" },
  { id: "farms", title: "Contas farm" },
  { id: "experimental", title: "Experimental" },
];
