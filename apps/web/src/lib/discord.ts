// "Post to Discord" (wave G): a webhook URL the council pastes itself, strict validation, pure
// message builders and one POST on an explicit click. No bot, no login, no server of ours.
// The URL is a secret (anyone with it can post): it is never logged, shown in full or put in errors.
import { MGE_POLICY_TEXT, escapeMarkdown, type LedgerSummary, type MgePublic, type Resource } from "@rokadm/planner";

/** Discord's limit for a message's content. */
export const DISCORD_MAX = 2000;

const HOSTS = ["discord.com", "discordapp.com"];
const PATH_RE = /^\/api\/webhooks\/(\d{17,20})\/([A-Za-z0-9_-]{50,100})\/?$/;

export type WebhookCheck = { ok: true; url: string; id: string } | { ok: false; error: string };

const NOT_WEBHOOK = "Isto não é uma URL de webhook do Discord. Ela se parece com https://discord.com/api/webhooks/123…/abc…";

/**
 * Accept only https://discord.com/api/webhooks/<id>/<token> (or discordapp.com): no other host,
 * port, login, query or fragment. Returns the canonical URL (no trailing slash).
 */
export function checkWebhookUrl(raw: string): WebhookCheck {
  const s = raw.trim();
  if (!s) return { ok: false, error: "Cole primeiro a URL do webhook do Discord." };
  if (!/^https:\/\//i.test(s)) return { ok: false, error: "A URL do webhook precisa começar com https://" };
  let u: URL;
  try {
    u = new URL(s);
  } catch {
    return { ok: false, error: NOT_WEBHOOK };
  }
  if (u.protocol !== "https:" || !HOSTS.includes(u.hostname) || u.port !== "" || u.username !== "" || u.password !== "") {
    return { ok: false, error: "Só webhooks em discord.com (ou discordapp.com) são aceitos." };
  }
  if (u.search !== "" || u.hash !== "" || /[?#]/.test(s)) return { ok: false, error: "Remova tudo depois do token (a parte com ? ou #)." };
  const m = PATH_RE.exec(u.pathname);
  if (!m) return { ok: false, error: NOT_WEBHOOK };
  return { ok: true, url: `https://${u.hostname}/api/webhooks/${m[1]}/${m[2]}`, id: m[1]! };
}

/** "discord.com/…/1234…5678 (token oculto)": enough to recognise which webhook is saved. */
export function maskWebhook(url: string): string {
  const c = checkWebhookUrl(url);
  if (!c.ok) return "um webhook salvo";
  return `${new URL(c.url).hostname}/api/webhooks/${c.id.slice(0, 4)}…${c.id.slice(-4)} (token oculto)`;
}

export interface DiscordPayload {
  content: string;
  /** Never ping anyone, whatever the text says (@everyone, roles, users). */
  allowed_mentions: { parse: [] };
}

export function discordPayload(content: string): DiscordPayload {
  return { content, allowed_mentions: { parse: [] } };
}

export type MessageResult = { ok: true; content: string } | { ok: false; reason: string };

const esc = (s: string): string => escapeMarkdown(s, "discord");
const fmt = (n: number): string => n.toLocaleString("pt-BR");
const day = (d: string): string =>
  new Date(`${d}T00:00:00Z`).toLocaleDateString("pt-BR", { weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Put as many blocks as fit in one message; the footer (if any) always stays at the end. */
function fit(head: string, blocks: readonly string[], footer: (left: number) => string): string {
  const out: string[] = [head];
  let used = head.length;
  for (let i = 0; i < blocks.length; i++) {
    const rest = blocks.length - i - 1;
    const b = blocks[i]!;
    if (used + 2 + b.length + 2 + footer(rest).length > DISCORD_MAX) {
      if (out.length === 1) {
        // Not even the first block fits: keep as many of its lines as possible.
        const room = DISCORD_MAX - used - 4 - footer(rest).length - 2;
        const lines = b.split("\n");
        const kept: string[] = [];
        for (const l of lines) {
          if ([...kept, l, "…"].join("\n").length > room) break;
          kept.push(l);
        }
        if (kept.length > 0) {
          out.push([...kept, "…"].join("\n"));
          used += 2 + out[1]!.length;
          continue;
        }
      }
      const f = footer(blocks.length - i);
      return [...out, f].filter(Boolean).join("\n\n");
    }
    out.push(b);
    used += 2 + b.length;
  }
  return [...out, footer(0)].filter(Boolean).join("\n\n");
}

/** MGE results: rule, then each event's slots (name and why). Scores only when the ledger carries them. */
export function mgeResultsMessage(p: MgePublic, link: string | null): MessageResult {
  if (p.events.length === 0) return { ok: false, reason: "Adicione pelo menos um evento primeiro." };
  const head = `**Resultados do MGE: ${esc(p.title || "plano do MGE")}**\nRegra: ${MGE_POLICY_TEXT[p.policy].label}, ${p.slotsPerEvent} ${p.slotsPerEvent === 1 ? "vaga" : "vagas"} por evento.`;
  const blocks = p.events.map((e) => {
    const rows = [
      ...e.slots.map((s) => ({ slot: s.slot, text: `${esc(s.name)}${p.includeScores && s.score !== undefined ? ` (${fmt(s.score)})` : ""} — ${esc(s.reason)}` })),
      ...e.unfilled.map((slot) => ({ slot, text: "não preenchida" })),
    ].sort((a, b) => a.slot - b.slot);
    const title = `**${day(e.date)}${e.commander ? `, ${esc(e.commander)}` : ""}**${e.locked ? " (final)" : " (plano)"}`;
    return [title, ...rows.map((r) => `${r.slot}. ${r.text}`)].join("\n");
  });
  const linkLine = link && link.length <= 900 ? `Registro completo: ${link}` : link ? "Registro completo: o link é longo demais para esta mensagem; compartilhe-o separadamente." : "";
  const content = fit(head, blocks, (left) => [left > 0 ? `…e mais ${left} ${left === 1 ? "evento" : "eventos"}.` : "", linkLine].filter(Boolean).join("\n"));
  return { ok: true, content };
}

/** Rules page: title and the view-only link. */
export function rulesLinkMessage(title: string, link: string | null): MessageResult {
  if (!link) return { ok: false, reason: "Crie primeiro o link somente para visualização (o botão de compartilhar acima)." };
  const content = `**${esc(title || "Regras do reino")}**\nLeia as regras do nosso reino (somente leitura): ${link}`;
  if (content.length > DISCORD_MAX) return { ok: false, reason: "O link é maior que uma mensagem do Discord (2.000 caracteres). Encurte as regras ou compartilhe o arquivo de texto." };
  return { ok: true, content };
}

/** Recruitment post: the Discord-format body as built on the page (already escaped). */
export function recruitMessage(body: string): MessageResult {
  if (!body.trim()) return { ok: false, reason: "Preencha o formulário primeiro; a publicação está vazia." };
  if (body.length > DISCORD_MAX) return { ok: false, reason: `A publicação tem ${fmt(body.length)} caracteres; o Discord aceita ${fmt(DISCORD_MAX)}. Encurte primeiro.` };
  return { ok: true, content: body };
}

const RES: Record<Resource, string> = { food: "Comida", wood: "Madeira", stone: "Pedra", gold: "Ouro" };

/** Farm shipments for one week: total received, per resource, per farm. */
export function farmsWeekMessage(s: LedgerSummary, range: { from: string; to: string }, farmNames: Readonly<Record<string, string>>, onlyFarm: string | null = null): MessageResult {
  if (s.count === 0) return { ok: false, reason: "Nenhum envio nesta semana para publicar." };
  const head = [
    `**Envios das contas farm, ${day(range.from)} – ${day(range.to)}**${onlyFarm ? ` (${esc(onlyFarm)})` : ""}`,
    `Recebido pela principal: **${fmt(s.total.net)}** (${s.count} ${s.count === 1 ? "envio" : "envios"}, imposto pago ${fmt(s.total.tax)})`,
  ].join("\n");
  const res = (Object.keys(RES) as Resource[]).filter((r) => s.byResource[r].gross > 0)
    .map((r) => `${RES[r]}: enviado ${fmt(s.byResource[r].gross)}, recebido ${fmt(s.byResource[r].net)}`);
  const farms = Object.entries(s.byFarm).map(([id, f]) => `${esc(Object.hasOwn(farmNames, id) ? farmNames[id]! : "Conta farm excluída")}: recebido ${fmt(f.total.net)}`);
  const blocks = [res.join("\n"), ...(farms.length > 1 || !onlyFarm ? [`Por conta farm:\n${farms.join("\n")}`] : [])].filter(Boolean);
  return { ok: true, content: fit(head, blocks, () => "") };
}

export type SendResult =
  | { ok: true }
  | { ok: false; kind: "rate"; retryAfter: number; message: string }
  | { ok: false; kind: "gone" | "refused" | "network" | "server"; message: string };

function retrySeconds(res: Response, body: unknown): number {
  const fromBody = typeof body === "object" && body !== null && typeof (body as { retry_after?: unknown }).retry_after === "number"
    ? (body as { retry_after: number }).retry_after : NaN;
  const fromHeader = Number(res.headers.get("retry-after"));
  const s = Number.isFinite(fromBody) && fromBody > 0 ? fromBody : Number.isFinite(fromHeader) && fromHeader > 0 ? fromHeader : 5;
  return Math.min(3600, Math.ceil(s));
}

/**
 * POST one message to the webhook. Never throws and never puts the URL in a message.
 * 429 → wait time from Discord; 401/403/404 → webhook deleted or wrong; 400 → Discord refused the text.
 */
export async function sendToDiscord(url: string, content: string, fetchImpl: typeof fetch = fetch): Promise<SendResult> {
  const c = checkWebhookUrl(url);
  if (!c.ok) return { ok: false, kind: "refused", message: c.error };
  if (!content.trim() || content.length > DISCORD_MAX) return { ok: false, kind: "refused", message: "A mensagem deve ter de 1 a 2.000 caracteres." };
  let res: Response;
  try {
    res = await fetchImpl(c.url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(discordPayload(content)),
      credentials: "omit",
      referrerPolicy: "no-referrer",
    });
  } catch {
    return { ok: false, kind: "network", message: "Não foi possível acessar o Discord. Verifique sua conexão (ou um bloqueador) e tente de novo." };
  }
  if (res.ok) return { ok: true };
  if (res.status === 429) {
    let body: unknown = null;
    try { body = await res.json(); } catch { /* no body */ }
    const s = retrySeconds(res, body);
    return { ok: false, kind: "rate", retryAfter: s, message: `O Discord pediu para ir mais devagar. Tente de novo em ${s} ${s === 1 ? "segundo" : "segundos"}.` };
  }
  if (res.status === 401 || res.status === 403 || res.status === 404) {
    return { ok: false, kind: "gone", message: "O Discord não aceitou este webhook: ele foi excluído ou a URL está errada. Copie uma URL nova nas configurações de Integrações do canal." };
  }
  if (res.status >= 400 && res.status < 500) return { ok: false, kind: "refused", message: `O Discord recusou a mensagem (erro ${res.status}). Nada foi publicado.` };
  return { ok: false, kind: "server", message: `O Discord teve um problema (erro ${res.status}). Tente de novo mais tarde.` };
}
