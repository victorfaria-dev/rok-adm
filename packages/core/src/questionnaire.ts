// F-01 Account Setup Questionnaire: declarative questions, validation into an
// AccountProfile, and a compact URL-safe encoding (no backend needed to share
// or bookmark a guide setup). Pure functions, no I/O.

import { SPENDING_PROFILES } from "./types";
import type { AccountProfile, KingdomStage, Role, SpendingProfile } from "./types";

// ---------------------------------------------------------------------------
// Constants

export const ROLES: readonly Role[] = ["lutador", "farm", "rally", "guarnicao", "lider"];
export const KINGDOM_STAGES: readonly KingdomStage[] = ["pre_kvk", "kvk1", "kvk2", "kvk3", "soc"];

/**
 * Civilization codes (lower-case English names) seen in research/facts.
 * The game adds civilizations over time; confirm the list in game (T0).
 */
export const CIVILIZATIONS: readonly string[] = [
  "arabia", "britain", "byzantium", "china", "egypt", "france", "germany", "greece",
  "japan", "korea", "maya", "ottoman", "rome", "spain", "vikings",
];

export const MINUTES_PRESETS = [15, 30, 60, 120] as const;
export const CITY_HALL_MIN = 1;
export const CITY_HALL_MAX = 25;

// ---------------------------------------------------------------------------
// Question model

export type QuestionId =
  | "spending" | "lifetimeSpendUsd" | "minutesPerDay" | "sessionsPerDay" | "role"
  | "kingdomStage" | "kingdomDay" | "cityHall" | "civilization" | "returningPlayer";

export interface QuestionOption<V> {
  value: V;
  label: string;
  help?: string;
}

interface QuestionBase<V> {
  id: QuestionId;
  label: string;
  help: string;
  /** Value used when the answer is missing or blank. */
  default: V;
  /** null is an accepted answer ("I don't know" / "skip"). */
  nullable: boolean;
}

export interface ChoiceQuestion<V extends string | null = string | null> extends QuestionBase<V> {
  type: "choice";
  options: ReadonlyArray<QuestionOption<V>>;
}

export interface NumberQuestion extends QuestionBase<number | null> {
  type: "number";
  min: number;
  max: number;
  integer: boolean;
  unit?: string;
  /** Suggested values shown as quick picks; any value in [min, max] is valid. */
  presets?: ReadonlyArray<QuestionOption<number>>;
}

export interface BooleanQuestion extends QuestionBase<boolean> {
  type: "boolean";
  /** Yes/No labels with their one-line "why this matters". */
  options: readonly [QuestionOption<boolean>, QuestionOption<boolean>];
}

export type Question = ChoiceQuestion | NumberQuestion | BooleanQuestion;

const SPENDING_OPTIONS: ReadonlyArray<QuestionOption<SpendingProfile>> = [
  { value: "f2p", label: "F2P — $0 por mês", help: "Nenhum dinheiro gasto. O guia fica no caminho gratuito." },
  { value: "low", label: "Low (gasta pouco) — $5–$100 por mês", help: "p. ex., um passe mensal. Acrescenta ao caminho gratuito as notas para quem gasta pouco." },
  { value: "medium", label: "Medium (gasta médio) — $100–$500 por mês", help: "Acrescenta as notas de quem gasta; os passos escritos para esse perfil ganham uma marca para você." },
  { value: "high", label: "High (gasta muito) — $500–$1.000 por mês", help: "Acrescenta as notas de quem gasta; os passos escritos para esse perfil ganham uma marca para você." },
  { value: "whale", label: "Whale (baleia) — $1.000–$5.000 por mês", help: "Acrescenta as notas de quem gasta; os passos escritos para baleias ganham uma marca para você." },
  { value: "kraken", label: "Kraken — $5.000+ por mês", help: "Acrescenta as notas de quem gasta; os passos escritos para krakens ganham uma marca para você." },
];

const ROLE_OPTIONS: ReadonlyArray<QuestionOption<Role>> = [
  { value: "lutador", label: "Lutador", help: "Sua conta principal luta em campo. A rotina mantém as tarefas do lutador." },
  { value: "farm", label: "Conta farm", help: "Uma segunda conta que coleta para uma principal. A rotina tira as tarefas que só uma conta principal precisa." },
  { value: "rally", label: "Líder de rally", help: "Você lidera rallies (ataques em massa) em fortes, bandeiras e cidades. A rotina mantém as tarefas de rally." },
  { value: "guarnicao", label: "Guarnição", help: "Você defende estruturas e cidades. A rotina mantém as tarefas de guarnição." },
  { value: "lider", label: "Líder de aliança / reino", help: "R4/R5 ou conselho do reino. Acrescenta o guia de administração do reino." },
];

const STAGE_OPTIONS: ReadonlyArray<QuestionOption<KingdomStage>> = [
  { value: "pre_kvk", label: "Antes da primeira KvK", help: "Um reino novo. O guia cobre as fases iniciais e o começo do reino." },
  { value: "kvk1", label: "KvK 1 (Temporada 1)", help: "O guia acrescenta as seções da KvK 1." },
  { value: "kvk2", label: "KvK 2", help: "Usa o plano de fase tardia; seções sem passos para esta etapa mostram passos da KvK 1, com aviso." },
  { value: "kvk3", label: "KvK 3", help: "Usa o plano de fase tardia; seções sem passos para esta etapa mostram passos da KvK 1, com aviso." },
  { value: "soc", label: "Temporada de Conquista (SoC)", help: "Usa o plano de fase tardia; seções sem passos para esta etapa mostram passos da KvK 1, com aviso." },
];

/** Civilization names as the pt-BR game client shows them (see packages/data/i18n/glossary.json). */
const CIVILIZATION_LABELS: Readonly<Record<string, string>> = {
  arabia: "Arábia", britain: "Grã-Bretanha", byzantium: "Bizâncio", china: "China", egypt: "Egito",
  france: "França", germany: "Alemanha", greece: "Grécia", japan: "Japão", korea: "Coreia",
  maya: "Maias", ottoman: "Otomanos", rome: "Roma", spain: "Espanha", vikings: "Vikings",
};
const titleCase = (s: string): string => CIVILIZATION_LABELS[s] ?? s.charAt(0).toUpperCase() + s.slice(1);

/** The F-01 question list, in display order. Labels are Brazilian Portuguese. */
export const QUESTIONS: readonly Question[] = [
  {
    id: "spending", type: "choice", nullable: false, default: "f2p",
    label: "Quanto você gasta por mês em Rise of Kingdoms?",
    help: "Define quais conselhos você vê e quais passos do guia ganham uma marca para você. Não há resposta certa. As faixas são uma convenção da comunidade, em dólares (USD).",
    options: SPENDING_OPTIONS,
  },
  {
    id: "lifetimeSpendUsd", type: "number", nullable: true, default: null, min: 0, max: 10_000_000, integer: true, unit: "USD",
    label: "Mais ou menos quanto você já gastou, no total, nesta conta?",
    help: "Opcional. O gasto passado muda o conselho mesmo que você seja F2P hoje.",
    presets: [
      { value: 0, label: "Nada", help: "Só a sua resposta mensal define o perfil." },
      { value: 100, label: "Cerca de $100", help: "Conta como Low quando a sua resposta mensal é menor." },
      { value: 1_000, label: "Cerca de $1.000", help: "Conta como Low; o resumo avisa se você joga como F2P agora." },
      { value: 10_000, label: "$10.000 ou mais", help: "Conta como High ou acima quando a sua resposta mensal é menor." },
    ],
  },
  {
    id: "minutesPerDay", type: "number", nullable: false, default: 60, min: 0, max: 1440, integer: true, unit: "min",
    label: "Quanto tempo você consegue jogar em um dia comum?",
    help: "Define o nível da rotina diária. Escolha o tempo que você realmente tem, não o que gostaria de ter.",
    presets: [
      { value: 15, label: "15 minutos", help: "A rotina mantém só as tarefas que rendem mais por minuto." },
      { value: 30, label: "30 minutos", help: "A rotina cabe nos itens essenciais do dia e em alguns extras." },
      { value: 60, label: "1 hora", help: "Espaço para a maioria das tarefas diárias e um pouco de evento." },
      { value: 120, label: "2 horas ou mais", help: "A rotina inclui tarefas mais longas que um dia curto deixa de fora." },
    ],
  },
  {
    id: "sessionsPerDay", type: "number", nullable: true, default: null, min: 1, max: 24, integer: true,
    label: "Quantas vezes por dia você entra no jogo?",
    help: "Opcional. Define como cronômetros e marchas se encaixam entre as suas visitas.",
    presets: [
      { value: 1, label: "Uma vez", help: "Uma sessão só: deixe cronômetros e marchas longos antes de sair." },
      { value: 2, label: "2–3 vezes", help: "Você consegue reabastecer filas e marchas entre as sessões." },
      { value: 4, label: "4 ou mais", help: "Cronômetros curtos e tarefas rápidas de evento cabem entre as entradas." },
    ],
  },
  {
    id: "role", type: "choice", nullable: false, default: "lutador",
    label: "Qual é a função principal desta conta?",
    help: "Contas farm também recebem os conselhos de rotina e de segurança que valem para toda conta.",
    options: ROLE_OPTIONS,
  },
  {
    id: "kingdomStage", type: "choice", nullable: false, default: "pre_kvk",
    label: "Em que etapa está o seu reino agora?",
    help: "Aparece na tela de temporada/KvK do reino.",
    options: STAGE_OPTIONS,
  },
  {
    id: "kingdomDay", type: "number", nullable: true, default: null, min: 0, max: 5000, integer: true, unit: "dias",
    label: "Quantos dias tem o seu reino?",
    help: "Opcional. As fases que você já passou vão para uma lista \"Já feito?\".",
  },
  {
    id: "cityHall", type: "number", nullable: false, default: 1, min: CITY_HALL_MIN, max: CITY_HALL_MAX, integer: true,
    label: "Qual é o nível da sua Prefeitura?",
    help: "Os passos de níveis menores vão para \"Já feito?\" para você conferir o que deixou passar.",
  },
  {
    id: "civilization", type: "choice", nullable: true, default: null,
    label: "Qual civilização você joga?",
    help: "Deixe \"Ainda não escolhi\" se estiver decidindo: o guia inclui a escolha da civilização.",
    options: [
      { value: null, label: "Ainda não escolhi / não sei", help: "O guia mantém a escolha da civilização no seu plano." },
      ...CIVILIZATIONS.map((c) => ({
        value: c,
        label: titleCase(c),
        help: "Salva com o seu perfil. O guia ainda não muda conforme a civilização.",
      })),
    ],
  },
  {
    id: "returningPlayer", type: "boolean", nullable: false, default: false,
    label: "Você está voltando depois de uma longa pausa?",
    help: "Contas que voltam recebem conselhos de reciclagem onde existirem.",
    options: [
      { value: true, label: "Sim", help: "O guia abre com o guia de quem volta e com passos de reciclagem." },
      { value: false, label: "Não", help: "Contas novas com Prefeitura baixa também recebem o caminho dos primeiros 30 dias." },
    ],
  },
];

export function getQuestion(id: QuestionId): Question {
  const q = QUESTIONS.find((x) => x.id === id);
  if (!q) throw new Error(`Unknown question ${id}`);
  return q;
}

// ---------------------------------------------------------------------------
// Validation

export interface ValidationError {
  field: QuestionId | "_";
  message: string;
}

export type ValidationResult =
  | { profile: AccountProfile; warnings: string[] }
  | { errors: ValidationError[] };

export function defaultProfile(): AccountProfile {
  const p: Record<string, unknown> = {};
  for (const q of QUESTIONS) p[q.id] = q.default;
  return p as unknown as AccountProfile;
}

const isBlank = (v: unknown): boolean => v === undefined || v === null || (typeof v === "string" && v.trim() === "");

function parseNumber(q: NumberQuestion, raw: unknown): { value: number | null } | { error: string } {
  if (isBlank(raw)) {
    if (raw === null && q.nullable) return { value: null };
    return { value: q.default };
  }
  const n = typeof raw === "number" ? raw : typeof raw === "string" ? Number(raw.trim()) : NaN;
  if (!Number.isFinite(n)) return { error: `${q.label} Esperava um número.` };
  if (q.integer && !Number.isInteger(n)) return { error: `${q.label} Esperava um número inteiro.` };
  if (n < q.min || n > q.max) return { error: `${q.label} Deve estar entre ${q.min} e ${q.max}.` };
  return { value: n };
}

function parseChoice(q: ChoiceQuestion, raw: unknown): { value: string | null } | { error: string } {
  if (isBlank(raw)) {
    if (raw === null && q.nullable) return { value: null };
    return { value: q.default };
  }
  if (typeof raw !== "string") return { error: `${q.label} Esperava uma das opções listadas.` };
  const v = raw.trim().toLowerCase();
  const opt = q.options.find((o) => o.value === v);
  if (!opt) {
    const allowed = q.options.map((o) => o.value ?? "(none)").join(", ");
    return { error: `${q.label} "${raw}" não é uma opção (${allowed}).` };
  }
  return { value: opt.value };
}

function parseBoolean(q: BooleanQuestion, raw: unknown): { value: boolean } | { error: string } {
  if (isBlank(raw)) return { value: q.default };
  if (typeof raw === "boolean") return { value: raw };
  if (raw === 1 || raw === 0) return { value: raw === 1 };
  if (typeof raw === "string") {
    const v = raw.trim().toLowerCase();
    if (["true", "1", "yes", "y", "on"].includes(v)) return { value: true };
    if (["false", "0", "no", "n", "off"].includes(v)) return { value: false };
  }
  return { error: `${q.label} Esperava sim ou não.` };
}

/**
 * Validate raw answers (form values: strings or typed values, keyed by question id).
 * Missing answers take the question default; an explicit `null` is accepted only for
 * nullable questions. Unknown keys are errors (catches typos in shared links).
 */
export function validateAnswers(raw: unknown): ValidationResult {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return { errors: [{ field: "_", message: "As respostas devem ser um objeto indexado pelo id da pergunta." }] };
  }
  const input = raw as Record<string, unknown>;
  const errors: ValidationError[] = [];
  const out: Record<string, unknown> = {};

  for (const key of Object.keys(input)) {
    if (!QUESTIONS.some((q) => q.id === key)) errors.push({ field: "_", message: `Pergunta desconhecida "${key}".` });
  }

  for (const q of QUESTIONS) {
    const v = input[q.id];
    if (v === null && !q.nullable) {
      errors.push({ field: q.id, message: `${q.label} Uma resposta é obrigatória.` });
      continue;
    }
    const r = q.type === "number" ? parseNumber(q, v) : q.type === "choice" ? parseChoice(q, v) : parseBoolean(q, v);
    if ("error" in r) errors.push({ field: q.id, message: r.error });
    else out[q.id] = r.value;
  }

  // Cross-field rules
  if (errors.length === 0) {
    const day = out.kingdomDay as number | null;
    const stage = out.kingdomStage as KingdomStage;
    if (day !== null && stage !== "pre_kvk" && day < 60) {
      errors.push({
        field: "kingdomDay",
        message: `Um reino no dia ${day} ainda não pode ter passado da pré-KvK (a primeira KvK começa por volta do dia 100).`,
      });
    }
  }
  if (errors.length > 0) return { errors };

  const profile = out as unknown as AccountProfile;
  return { profile, warnings: profileWarnings(profile) };
}

/** Soft checks: answers that are valid but change how the advice should be read. */
export function profileWarnings(p: AccountProfile): string[] {
  const w: string[] = [];
  if ((p.spending === "f2p" || p.spending === "low") && p.lifetimeSpendUsd !== null && p.lifetimeSpendUsd >= 1000) {
    w.push(
      `Você gastou cerca de $${p.lifetimeSpendUsd} no passado: sua conta pode estar à frente de uma conta ${p.spending.toUpperCase()} típica, então algumas metas serão conservadoras.`,
    );
  }
  if (p.kingdomStage === "pre_kvk" && p.kingdomDay !== null && p.kingdomDay > 150) {
    w.push(`O dia ${p.kingdomDay} do reino é tarde para a pré-KvK; confira a etapa do seu reino.`);
  }
  if (p.minutesPerDay < 15) {
    w.push("Menos de 15 minutos por dia: o guia mostra o piso dos Dias leves / Modo Pausa.");
  }
  return w;
}

// ---------------------------------------------------------------------------
// URL-safe encoding
//
// Format (version 1), fields joined by ".", empty field = null:
//   1.<spending>.<role>.<stage>.<cityHall>.<minutes>.<sessions>.<kingdomDay>.<lifetimeUsd>.<civ>.<returning>
// spending/role/stage are indexes into SPENDING_PROFILES/ROLES/KINGDOM_STAGES,
// civ is the lower-case code, returning is 0/1. Only [0-9a-z.] is produced, which
// fits URL hashes and query values ([A-Za-z0-9._~-]) without escaping.
// Example: "1.0.0.0.12.60..35..china.0"

export const PROFILE_CODE_VERSION = "1";
const CODE_RE = /^[A-Za-z0-9._~-]*$/;

export function encodeProfile(p: AccountProfile): string {
  const idx = <T>(list: readonly T[], v: T, name: string): string => {
    const i = list.indexOf(v);
    if (i < 0) throw new Error(`Cannot encode ${name} "${String(v)}"`);
    return String(i);
  };
  const num = (n: number | null): string => (n === null ? "" : String(n));
  const civ = p.civilization === null ? "" : p.civilization.toLowerCase();
  if (civ !== "" && !/^[a-z0-9]+$/.test(civ)) throw new Error(`Cannot encode civilization "${p.civilization}"`);
  return [
    PROFILE_CODE_VERSION,
    idx(SPENDING_PROFILES, p.spending, "spending"),
    idx(ROLES, p.role, "role"),
    idx(KINGDOM_STAGES, p.kingdomStage, "kingdomStage"),
    String(p.cityHall),
    String(p.minutesPerDay),
    num(p.sessionsPerDay),
    num(p.kingdomDay),
    num(p.lifetimeSpendUsd),
    civ,
    p.returningPlayer ? "1" : "0",
  ].join(".");
}

/** Decode and validate a profile code. Never throws. */
export function decodeProfile(code: string): ValidationResult {
  const fail = (message: string): ValidationResult => ({ errors: [{ field: "_", message }] });
  if (typeof code !== "string" || code.length === 0) return fail("Código de perfil vazio.");
  if (code.length > 200 || !CODE_RE.test(code)) return fail("O código de perfil tem caracteres inválidos.");
  const parts = code.split(".");
  if (parts[0] !== PROFILE_CODE_VERSION) return fail(`Versão do código de perfil não suportada "${parts[0]}".`);
  if (parts.length !== 11) return fail(`O código de perfil deve ter 11 campos, mas tem ${parts.length}.`);
  const [, sp, ro, st, ch, min, ses, kd, life, civ, ret] = parts as [string, ...string[]];

  const fromIdx = <T>(list: readonly T[], s: string | undefined): T | string => {
    if (s === undefined || !/^\d$/.test(s)) return `#${s ?? ""}`;
    const v = list[Number(s)];
    return v === undefined ? `#${s}` : v;
  };
  const opt = (s: string | undefined): string | null => (s === undefined || s === "" ? null : s);

  return validateAnswers({
    spending: fromIdx(SPENDING_PROFILES, sp),
    role: fromIdx(ROLES, ro),
    kingdomStage: fromIdx(KINGDOM_STAGES, st),
    cityHall: ch === "" ? null : ch,
    minutesPerDay: min === "" ? null : min,
    sessionsPerDay: opt(ses),
    kingdomDay: opt(kd),
    lifetimeSpendUsd: opt(life),
    civilization: opt(civ),
    returningPlayer: ret === "1" ? true : ret === "0" ? false : (ret ?? null),
  });
}
