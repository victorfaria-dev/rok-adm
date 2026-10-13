// Support ticket text (F-82). Builds plain text the player pastes into the game's own support
// channel. Pure: nothing here stores or sends anything, and no field ever asks for a password.

export type TicketKind = "recovery" | "appeal" | "report";

export type TicketFieldId =
  | "governorId" | "governorName" | "kingdom" | "when" | "binding"
  | "notice" | "otherGovernor" | "what" | "screenshots";

export interface TicketField {
  id: TicketFieldId;
  label: string;
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

const governorId: TicketField = { id: "governorId", label: "Your governor ID", help: "The number on your governor profile.", required: true };
const governorName: TicketField = { id: "governorName", label: "Your governor name", required: false };
const kingdom: TicketField = { id: "kingdom", label: "Kingdom number", help: "For example 2708.", required: true };
const screenshots: TicketField = {
  id: "screenshots", label: "Screenshots you will attach", multiline: true, required: false,
  help: "One per line, for example: ban notice, profile page. Attach the images in the support chat yourself.",
};

export const TICKET_TEMPLATES: readonly TicketTemplate[] = [
  {
    kind: "recovery",
    title: "Recover my account",
    blurb: "You can't log in, or you are on the wrong account.",
    subject: "Account recovery request",
    fields: [
      governorId, governorName, kingdom,
      { id: "when", label: "Last time you could log in", help: "Date and time, with your time zone or UTC.", required: true },
      { id: "binding", label: "How the account was bound", help: "For example: Lilith account email, Google, Apple, Facebook. Never your password.", required: false },
      { id: "what", label: "What happened", multiline: true, required: true, help: "Short and factual: what you see now and what changed." },
      screenshots,
    ],
  },
  {
    kind: "appeal",
    title: "Appeal a ban or mute",
    blurb: "You think a ban, mute or penalty was a mistake.",
    subject: "Appeal of a ban or mute",
    fields: [
      governorId, governorName, kingdom,
      { id: "when", label: "When the ban or mute started", help: "Date and time, with your time zone or UTC.", required: true },
      { id: "notice", label: "The message the game showed", help: "Copy the wording of the notice, if there was one.", required: false, multiline: true },
      { id: "what", label: "Why you think it is a mistake", multiline: true, required: true, help: "Say what you were doing. Stay polite and factual." },
      screenshots,
    ],
  },
  {
    kind: "report",
    title: "Report a bot or cheater",
    blurb: "Another governor seems to use bots, scripts or cheats.",
    subject: "Report of a suspected bot or cheat",
    fields: [
      governorId, kingdom,
      { id: "otherGovernor", label: "Their governor ID or name", help: "The ID from their profile is the most useful.", required: true },
      { id: "when", label: "When you saw it", help: "Date and time, with your time zone or UTC.", required: true },
      { id: "what", label: "What you saw", multiline: true, required: true, help: "Only what you saw yourself. No guesses about who is behind it." },
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
      if (f.required) { missing.push(f.label); lines.push(`${f.label}: [missing]`); }
      continue;
    }
    lines.push(`${f.label}: ${v.replace(/\n+/g, " ")}`);
  }
  const notice = clean(values.notice);
  if (t.fields.some((f) => f.id === "notice") && notice) lines.push("", "Message shown in the game:", notice);
  const what = clean(values.what);
  const whatLabel = t.fields.find((f) => f.id === "what")!.label;
  lines.push("", `${whatLabel}:`, what || "[missing]");
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
