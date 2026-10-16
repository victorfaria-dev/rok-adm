// Support ticket text (F-82). Builds plain text the player pastes into the game's own support
// channel. Pure: nothing here stores or sends anything, and no field ever asks for a password.

export type TicketKind = "recovery" | "appeal" | "report";

export type TicketFieldId =
  | "governorId" | "governorName" | "kingdom" | "when" | "binding"
  | "notice" | "otherGovernor" | "what" | "screenshots";

export interface TicketField {
  id: TicketFieldId;
  label: string;
  /** English label used in the e-mail body (Lilith support reads English). */
  en: string;
  help?: string;
  required: boolean;
  multiline?: boolean;
}

export interface TicketTemplate {
  kind: TicketKind;
  title: string;
  /** One line on when to use it. */
  blurb: string;
  subject: string;
  fields: TicketField[];
}

const governorId: TicketField = { id: "governorId", label: "Seu ID de governador", en: "Your governor ID", help: "O número no perfil do seu governador.", required: true };
const governorName: TicketField = { id: "governorName", label: "Seu nome de governador", en: "Your governor name", required: false };
const kingdom: TicketField = { id: "kingdom", label: "Número do reino", en: "Kingdom number", help: "Por exemplo 2708.", required: true };
const screenshots: TicketField = {
  id: "screenshots", label: "Capturas de tela que você vai anexar", en: "Screenshots you will attach", multiline: true, required: false,
  help: "Uma por linha, por exemplo: aviso de banimento, página do perfil. Anexe as imagens no chat do suporte você mesmo.",
};

export const TICKET_TEMPLATES: readonly TicketTemplate[] = [
  {
    kind: "recovery",
    title: "Recuperar minha conta",
    blurb: "Você não consegue entrar, ou está na conta errada.",
    subject: "Account recovery request",
    fields: [
      governorId, governorName, kingdom,
      { id: "when", label: "Última vez que você conseguiu entrar", en: "Last time you could log in", help: "Data e hora, com o seu fuso horário ou UTC.", required: true },
      { id: "binding", label: "Como a conta foi vinculada", en: "How the account was bound", help: "Por exemplo: e-mail da conta Lilith, Google, Apple, Facebook. Nunca a sua senha.", required: false },
      { id: "what", label: "O que aconteceu", en: "What happened", multiline: true, required: true, help: "Curto e objetivo: o que você vê agora e o que mudou." },
      screenshots,
    ],
  },
  {
    kind: "appeal",
    title: "Recorrer de um banimento ou silenciamento",
    blurb: "Você acha que um banimento, silenciamento ou punição foi um engano.",
    subject: "Appeal of a ban or mute",
    fields: [
      governorId, governorName, kingdom,
      { id: "when", label: "Quando o banimento ou silenciamento começou", en: "When the ban or mute started", help: "Data e hora, com o seu fuso horário ou UTC.", required: true },
      { id: "notice", label: "A mensagem que o jogo mostrou", en: "The message the game showed", help: "Copie o texto do aviso, se houve um.", required: false, multiline: true },
      { id: "what", label: "Por que você acha que foi um engano", en: "Why you think it is a mistake", multiline: true, required: true, help: "Diga o que você estava fazendo. Seja educado e objetivo." },
      screenshots,
    ],
  },
  {
    kind: "report",
    title: "Denunciar um bot ou trapaceiro",
    blurb: "Outro governador parece usar bots, scripts ou trapaças.",
    subject: "Report of a suspected bot or cheat",
    fields: [
      governorId, kingdom,
      { id: "otherGovernor", label: "ID ou nome do governador dele", en: "Their governor ID or name", help: "O ID do perfil dele é o mais útil.", required: true },
      { id: "when", label: "Quando você viu", en: "When you saw it", help: "Data e hora, com o seu fuso horário ou UTC.", required: true },
      { id: "what", label: "O que você viu", en: "What you saw", multiline: true, required: true, help: "Só o que você mesmo viu. Sem palpites sobre quem está por trás." },
      screenshots,
    ],
  },
];

export type TicketValues = Partial<Record<TicketFieldId, string>>;

export interface TicketText {
  subject: string;
  body: string;
  /** Labels of required fields still empty. */
  missing: string[];
}

export function ticketTemplate(kind: TicketKind): TicketTemplate {
  const t = TICKET_TEMPLATES.find((x) => x.kind === kind);
  if (!t) throw new RangeError(`Unknown ticket kind: ${String(kind)}`);
  return t;
}

const clean = (s: string | undefined): string => (s ?? "").replace(/\r\n?/g, "\n").trim();

/** Ticket subject and body for one template. Empty optional fields are left out; empty required ones show "[missing]". */
export function buildTicket(kind: TicketKind, values: TicketValues): TicketText {
  const t = ticketTemplate(kind);
  const missing: string[] = [];
  const lines: string[] = ["Hello Support team,", ""];
  const intro: Record<TicketKind, string> = {
    recovery: "I need help getting back into my Rise of Kingdoms account.",
    appeal: "I would like to appeal a ban or mute on my Rise of Kingdoms account. I believe it was a mistake.",
    report: "I would like to report a governor who I believe is using bots, scripts or cheats.",
  };
  lines.push(intro[kind], "");
  for (const f of t.fields) {
    if (f.id === "what" || f.id === "screenshots" || f.id === "notice") continue;
    const v = clean(values[f.id]);
    if (!v) {
      if (f.required) { missing.push(f.label); lines.push(`${f.en}: [missing]`); }
      continue;
    }
    lines.push(`${f.en}: ${v.replace(/\n+/g, " ")}`);
  }
  const notice = clean(values.notice);
  if (t.fields.some((f) => f.id === "notice") && notice) lines.push("", "Message shown in the game:", notice);
  const what = clean(values.what);
  const whatField = t.fields.find((f) => f.id === "what")!;
  const whatLabel = whatField.label;
  lines.push("", `${whatField.en}:`, what || "[missing]");
  if (!what) missing.push(whatLabel);
  const shots = clean(values.screenshots).split("\n").map((s) => s.trim()).filter(Boolean);
  if (shots.length) lines.push("", "Screenshots attached:", ...shots.map((s) => `- ${s}`));
  lines.push("", "Thank you for your help.");
  return { subject: t.subject, body: lines.join("\n"), missing };
}

/** Subject and body as one block to copy. */
export function ticketToText(t: TicketText): string {
  return `Subject: ${t.subject}\n\n${t.body}`;
}
