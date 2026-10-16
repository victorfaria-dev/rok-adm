// F-34 DKP formula sandbox: a small, safe arithmetic language for kingdom DKP formulas.
// No eval / Function: a tokenizer and a recursive-descent parser build an AST, and evaluate()
// walks it. Every failure is a typed value with a 1-based character position and a plain-English
// message, so the UI never has to catch an exception and never shows NaN or Infinity.
// DKP has no official definition: each kingdom sets its own weights (B08-0001).

export const FORMULA_MAX_CHARS = 300;
export const FORMULA_MAX_DEPTH = 32;
export const FORMULA_MAX_NODES = 100;

/** Variables a formula may use, in display order. Kills are by troop tier. */
export const FORMULA_VARS = ["t1", "t2", "t3", "t4", "t5", "deads", "kp", "power"] as const;
export type FormulaVar = (typeof FORMULA_VARS)[number];
export type FormulaVars = Partial<Record<FormulaVar, number>>;

/** Accepted spellings (lower case) for each variable. */
const ALIASES: Readonly<Record<string, FormulaVar>> = (() => {
  // Null prototype: names like "constructor" or "__proto__" must not resolve through Object.prototype.
  const m: Record<string, FormulaVar> = Object.create(null) as Record<string, FormulaVar>;
  for (const t of [1, 2, 3, 4, 5] as const) {
    const v = `t${t}` as FormulaVar;
    for (const a of [v, `${v}_kills`, `${v}kills`, `${v}_kill`, `${v}kill`]) m[a] = v;
  }
  for (const a of ["deads", "dead", "deaths", "death", "dead_troops"]) m[a] = "deads";
  for (const a of ["kp", "kill_points", "killpoints"]) m[a] = "kp";
  m.power = "power";
  return m;
})();

/** Singular / plural nouns for plain-language text. */
export const VAR_NOUN: Readonly<Record<FormulaVar, { one: string; many: string }>> = {
  t1: { one: "abate de T1", many: "abates de T1" },
  t2: { one: "abate de T2", many: "abates de T2" },
  t3: { one: "abate de T3", many: "abates de T3" },
  t4: { one: "abate de T4", many: "abates de T4" },
  t5: { one: "abate de T5", many: "abates de T5" },
  deads: { one: "morte", many: "mortes" },
  kp: { one: "ponto de abate", many: "pontos de abate" },
  power: { one: "ponto de poder", many: "pontos de poder" },
};

const FUNCS = { min: 2, max: 2, round: 1, floor: 1, ceil: 1, abs: 1 } as const;
export type FormulaFn = keyof typeof FUNCS;
const isFn = (s: string): s is FormulaFn => Object.prototype.hasOwnProperty.call(FUNCS, s);

export type FormulaNode =
  | { type: "num"; value: number; pos: number }
  | { type: "var"; name: FormulaVar; pos: number }
  | { type: "neg"; arg: FormulaNode; pos: number }
  | { type: "bin"; op: "+" | "-" | "*" | "/"; left: FormulaNode; right: FormulaNode; pos: number }
  | { type: "call"; fn: FormulaFn; args: FormulaNode[]; pos: number };

export type FormulaErrorCode =
  | "empty" | "too_long" | "bad_char" | "bad_number" | "number_too_large" | "thousands" | "unknown_name" | "unknown_function"
  | "expected_value" | "expected_operator" | "missing_paren" | "extra_paren" | "arity" | "too_deep" | "too_many_nodes"
  | "div_zero" | "not_finite";

export interface FormulaError {
  code: FormulaErrorCode;
  /** 1-based character position in the formula text (0 when the whole formula is at fault). */
  pos: number;
  message: string;
}

export type ParseResult = { ok: true; ast: FormulaNode } | { ok: false; error: FormulaError };
export type EvalResult = { ok: true; value: number } | { ok: false; error: FormulaError };

const VAR_HINT = "Use t1–t5, deads, kp ou power.";
const at = (pos: number) => `no caractere ${pos}`;
const err = (code: FormulaErrorCode, pos: number, message: string): { ok: false; error: FormulaError } => ({ ok: false, error: { code, pos, message } });

// ---------------------------------------------------------------------------
// Tokenizer

type Tok =
  | { t: "num"; v: number; pos: number; text: string }
  | { t: "id"; v: string; pos: number }
  | { t: "op"; v: "+" | "-" | "*" | "/"; pos: number }
  | { t: "("; pos: number }
  | { t: ")"; pos: number }
  | { t: ","; pos: number }
  | { t: "end"; pos: number };

class FormulaFail extends Error {
  constructor(readonly error: FormulaError) {
    super(error.message);
  }
}
const fail = (code: FormulaErrorCode, pos: number, message: string): never => {
  throw new FormulaFail({ code, pos, message });
};

function tokenize(src: string): Tok[] {
  const out: Tok[] = [];
  let i = 0;
  while (i < src.length) {
    const c = src[i]!;
    const pos = i + 1;
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9.]/.test(c)) {
      const m = /^(?:\d+(?:\.\d+)?|\.\d+)/.exec(src.slice(i));
      if (!m) fail("bad_number", pos, `Este número não está completo ${at(pos)}. Escreva números como 10 ou 0.5.`);
      const text = m![0];
      const next = src[i + text.length];
      if (next === "." || (next !== undefined && /[0-9]/.test(next))) fail("bad_number", pos, `Este número não está completo ${at(pos)}. Escreva números como 10 ou 0.5.`);
      const v = Number(text);
      if (v > Number.MAX_SAFE_INTEGER) {
        fail("number_too_large", pos, `O número ${at(pos)} é grande demais. Use números de até ${Number.MAX_SAFE_INTEGER.toLocaleString("pt-BR")}.`);
      }
      out.push({ t: "num", v, pos, text });
      i += text.length;
      continue;
    }
    if (/[A-Za-z_]/.test(c)) {
      const m = /^[A-Za-z_][A-Za-z0-9_]*/.exec(src.slice(i))!;
      out.push({ t: "id", v: m[0], pos });
      i += m[0].length;
      continue;
    }
    if (c === "+" || c === "-" || c === "*" || c === "/") { out.push({ t: "op", v: c, pos }); i++; continue; }
    if (c === "×" || c === "·") { out.push({ t: "op", v: "*", pos }); i++; continue; }
    if (c === "÷") { out.push({ t: "op", v: "/", pos }); i++; continue; }
    if (c === "−") { out.push({ t: "op", v: "-", pos }); i++; continue; }
    if (c === "(" || c === ")" || c === ",") { out.push({ t: c, pos }); i++; continue; }
    fail("bad_char", pos, `O caractere '${c}' ${at(pos)} não pode ser usado. Use números, nomes, + - * / e parênteses.`);
  }
  out.push({ t: "end", pos: src.length + 1 });
  return out;
}

// ---------------------------------------------------------------------------
// Parser (recursive descent)
//   expr  := term (("+" | "-") term)*
//   term  := unary (("*" | "/") unary)*
//   unary := ("-" | "+") unary | primary
//   primary := number | name | name "(" expr ("," expr)* ")" | "(" expr ")"

class Parser {
  private i = 0;
  private nodes = 0;
  private depth = 0;
  constructor(private readonly toks: Tok[]) {}

  private peek(): Tok { return this.toks[this.i]!; }
  private next(): Tok { return this.toks[this.i++]!; }

  private node<T extends FormulaNode>(n: T): T {
    if (++this.nodes > FORMULA_MAX_NODES) fail("too_many_nodes", n.pos, `Esta fórmula é longa demais (mais de ${FORMULA_MAX_NODES} partes). Simplifique-a.`);
    return n;
  }
  private enter(pos: number): void {
    if (++this.depth > FORMULA_MAX_DEPTH) fail("too_deep", pos, `Esta fórmula tem parênteses aninhados demais ${at(pos)} (no máximo ${FORMULA_MAX_DEPTH} níveis). Simplifique-a.`);
  }
  private leave(): void { this.depth--; }

  parse(): FormulaNode {
    const e = this.expr();
    const t = this.peek();
    if (t.t !== "end") this.unexpected(t, "operator");
    return e;
  }

  private unexpected(t: Tok, wanted: "value" | "operator"): never {
    if (t.t === ")" && wanted === "value") return fail("expected_value", t.pos, `Esperava um número ou um nome antes do ')' ${at(t.pos)}.`);
    if (t.t === ")") return fail("extra_paren", t.pos, `Há um ')' ${at(t.pos)} sem o '(' correspondente.`);
    if (t.t === ",") {
      return fail("thousands", t.pos, `Vírgula ',' inesperada ${at(t.pos)}. Escreva números sem separador de milhar (1000, não 1,000); vírgulas só separam os valores dentro de min( ) e max( ).`);
    }
    if (t.t === "end") return fail("expected_value", t.pos, `A fórmula termina cedo demais ${at(t.pos)}: falta um número ou nome.`);
    if (wanted === "operator") return fail("expected_operator", t.pos, `Esperava + - * ou / ${at(t.pos)}. Escreva t4 * 10, não t4 10 nem 10t4.`);
    return fail("expected_value", t.pos, `Esperava um número, um nome ou '(' ${at(t.pos)}.`);
  }

  private expr(): FormulaNode {
    let left = this.term();
    for (;;) {
      const t = this.peek();
      if (t.t === "op" && (t.v === "+" || t.v === "-")) {
        this.next();
        const right = this.term();
        left = this.node({ type: "bin", op: t.v, left, right, pos: t.pos });
      } else return left;
    }
  }

  private term(): FormulaNode {
    let left = this.unary();
    for (;;) {
      const t = this.peek();
      if (t.t === "op" && (t.v === "*" || t.v === "/")) {
        this.next();
        const right = this.unary();
        left = this.node({ type: "bin", op: t.v, left, right, pos: t.pos });
      } else return left;
    }
  }

  private unary(): FormulaNode {
    const t = this.peek();
    if (t.t === "op" && (t.v === "-" || t.v === "+")) {
      this.next();
      this.enter(t.pos);
      const arg = this.unary();
      this.leave();
      return t.v === "-" ? this.node({ type: "neg", arg, pos: t.pos }) : arg;
    }
    return this.primary();
  }

  private primary(): FormulaNode {
    const t = this.next();
    if (t.t === "num") return this.node({ type: "num", value: t.v, pos: t.pos });
    if (t.t === "(") {
      this.enter(t.pos);
      const e = this.expr();
      const close = this.next();
      if (close.t !== ")") {
        if (close.t === "end") fail("missing_paren", t.pos, `O '(' ${at(t.pos)} nunca é fechado. Acrescente um ')'.`);
        this.i--;
        this.unexpected(close, "operator");
      }
      this.leave();
      return e;
    }
    if (t.t === "id") {
      const name = t.v.toLowerCase();
      if (this.peek().t === "(") {
        if (!isFn(name)) return fail("unknown_function", t.pos, `Função desconhecida '${t.v}' ${at(t.pos)}. Use min, max, round, floor, ceil ou abs.`);
        const open = this.next();
        this.enter(open.pos);
        const args: FormulaNode[] = [];
        if (this.peek().t !== ")") {
          args.push(this.expr());
          while (this.peek().t === ",") {
            this.next();
            args.push(this.expr());
          }
        }
        const close = this.next();
        if (close.t !== ")") {
          if (close.t === "end") fail("missing_paren", open.pos, `O '(' ${at(open.pos)} nunca é fechado. Acrescente um ')'.`);
          this.i--;
          this.unexpected(close, "operator");
        }
        this.leave();
        const want = FUNCS[name];
        if (args.length !== want) {
          fail("arity", t.pos, `${name}( ) ${at(t.pos)} recebe ${want === 1 ? "1 valor" : `${want} valores separados por vírgula`}, não ${args.length}.`);
        }
        return this.node({ type: "call", fn: name, args, pos: t.pos });
      }
      const v = Object.prototype.hasOwnProperty.call(ALIASES, name) ? ALIASES[name] : undefined;
      if (!v) {
        if (isFn(name)) return fail("arity", t.pos, `${name} ${at(t.pos)} precisa de parênteses, como ${name}(t4 * 10${FUNCS[name] === 2 ? ", 0" : ""}).`);
        return fail("unknown_name", t.pos, `Nome desconhecido '${t.v}' ${at(t.pos)}. ${VAR_HINT}`);
      }
      return this.node({ type: "var", name: v, pos: t.pos });
    }
    this.i--;
    return this.unexpected(t, "value");
  }
}

/** Parse formula text into an AST, or a typed error. Never throws. */
export function parseFormula(text: string): ParseResult {
  const src = typeof text === "string" ? text : "";
  if (!src.trim()) return err("empty", 0, `Escreva uma fórmula, por exemplo t4 * 10 + t5 * 20 + deads * 50. ${VAR_HINT}`);
  if (src.length > FORMULA_MAX_CHARS) return err("too_long", FORMULA_MAX_CHARS + 1, `Esta fórmula tem ${src.length} caracteres. Mantenha em até ${FORMULA_MAX_CHARS}.`);
  try {
    return { ok: true, ast: new Parser(tokenize(src)).parse() };
  } catch (e) {
    if (e instanceof FormulaFail) return { ok: false, error: e.error };
    return err("bad_char", 0, "Não foi possível ler esta fórmula.");
  }
}

// ---------------------------------------------------------------------------
// Evaluation

function evalNode(n: FormulaNode, vars: FormulaVars): number {
  let v: number;
  switch (n.type) {
    case "num": v = n.value; break;
    case "var": {
      const x = vars[n.name];
      v = typeof x === "number" && Number.isFinite(x) ? x : 0;
      break;
    }
    case "neg": v = -evalNode(n.arg, vars); break;
    case "bin": {
      const a = evalNode(n.left, vars);
      const b = evalNode(n.right, vars);
      if (n.op === "/" && b === 0) fail("div_zero", n.pos, `Divisão por zero ${at(n.pos)}: o valor depois de '/' é 0 para esses números.`);
      v = n.op === "+" ? a + b : n.op === "-" ? a - b : n.op === "*" ? a * b : a / b;
      break;
    }
    case "call": {
      const a = n.args.map((x) => evalNode(x, vars));
      v = n.fn === "min" ? Math.min(a[0]!, a[1]!) : n.fn === "max" ? Math.max(a[0]!, a[1]!)
        : n.fn === "round" ? Math.round(a[0]!) : n.fn === "floor" ? Math.floor(a[0]!) : n.fn === "ceil" ? Math.ceil(a[0]!) : Math.abs(a[0]!);
      break;
    }
  }
  if (!Number.isFinite(v)) fail("not_finite", n.pos, `O resultado é grande demais para calcular ${at(n.pos)}. Confira os números que você digitou.`);
  return v === 0 ? 0 : v; // no -0
}

/** Evaluate an AST. Missing or non-finite variables count as 0. Never throws, never returns NaN/Infinity. */
export function evaluate(ast: FormulaNode, vars: FormulaVars = {}): EvalResult {
  try {
    return { ok: true, value: evalNode(ast, vars) };
  } catch (e) {
    if (e instanceof FormulaFail) return { ok: false, error: e.error };
    return err("not_finite", 0, "Não foi possível calcular esta fórmula.");
  }
}

/** Parse and evaluate in one step. */
export function evaluateFormula(text: string, vars: FormulaVars = {}): EvalResult {
  const p = parseFormula(text);
  return p.ok ? evaluate(p.ast, vars) : p;
}

/** Variables a formula uses, in FORMULA_VARS order. */
export function usedVariables(ast: FormulaNode): FormulaVar[] {
  const seen = new Set<FormulaVar>();
  const walk = (n: FormulaNode): void => {
    if (n.type === "var") seen.add(n.name);
    else if (n.type === "neg") walk(n.arg);
    else if (n.type === "bin") { walk(n.left); walk(n.right); }
    else if (n.type === "call") n.args.forEach(walk);
  };
  walk(ast);
  return FORMULA_VARS.filter((v) => seen.has(v));
}

// ---------------------------------------------------------------------------
// Linear form: DKP = constant + Σ weight × variable

export interface LinearForm {
  /** Non-zero coefficient per variable, in FORMULA_VARS order. */
  weights: Partial<Record<FormulaVar, number>>;
  constant: number;
}

interface Lin { w: Map<FormulaVar, number>; c: number }

function linOf(n: FormulaNode): Lin | null {
  switch (n.type) {
    case "num": return { w: new Map(), c: n.value };
    case "var": return { w: new Map([[n.name, 1]]), c: 0 };
    case "neg": {
      const a = linOf(n.arg);
      return a && scale(a, -1);
    }
    case "bin": {
      const a = linOf(n.left), b = linOf(n.right);
      if (!a || !b) return null;
      if (n.op === "+" || n.op === "-") {
        const s = n.op === "+" ? 1 : -1;
        const w = new Map(a.w);
        for (const [k, v] of b.w) w.set(k, (w.get(k) ?? 0) + s * v);
        return { w, c: a.c + s * b.c };
      }
      if (n.op === "*") {
        if (a.w.size === 0) return scale(b, a.c);
        if (b.w.size === 0) return scale(a, b.c);
        return null;
      }
      if (b.w.size === 0 && b.c !== 0) return scale(a, 1 / b.c);
      return null;
    }
    case "call": {
      // A function of constants is a constant; of variables it is not linear in general.
      const args = n.args.map(linOf);
      if (args.some((x) => !x || x.w.size > 0)) return null;
      const r = evaluate(n);
      return r.ok ? { w: new Map(), c: r.value } : null;
    }
  }
}

function scale(a: Lin, k: number): Lin {
  const w = new Map<FormulaVar, number>();
  for (const [key, v] of a.w) w.set(key, v * k);
  return { w, c: a.c * k };
}

const tidy = (x: number): number => {
  const r = Number(x.toPrecision(12));
  return r === 0 ? 0 : r;
};

/** Per-variable coefficients and constant when the formula is linear, else null (min/max/round of variables, products of variables, division by a variable). */
export function linearWeights(ast: FormulaNode): LinearForm | null {
  const l = linOf(ast);
  if (!l || !Number.isFinite(l.c) || [...l.w.values()].some((v) => !Number.isFinite(v))) return null;
  const weights: Partial<Record<FormulaVar, number>> = {};
  for (const v of FORMULA_VARS) {
    const k = tidy(l.w.get(v) ?? 0);
    if (k !== 0) weights[v] = k;
  }
  return { weights, constant: tidy(l.c) };
}

/**
 * Plain number for explanations: 10, 0.5, 1,000, 0.0000001. Never exponent notation, and a tiny
 * non-zero weight is never shown as 0: below 1 it keeps up to 6 significant digits.
 */
export function formatWeight(n: number): string {
  const x = Number(n.toPrecision(12));
  if (x !== 0 && Math.abs(x) < 1) return x.toLocaleString("en-US", { maximumSignificantDigits: 6 });
  return x.toLocaleString("en-US", { maximumFractionDigits: 6 });
}

/** Decimal digits without exponent notation: 1e-7 → "0.0000001", 1e21 → "1000000000000000000000". */
export function plainNumber(n: number): string {
  const s = String(n);
  const m = /^(-?)(\d)(?:\.(\d+))?e([+-]\d+)$/.exec(s);
  if (!m) return s;
  const digits = m[2]! + (m[3] ?? "");
  const intLen = 1 + Number(m[4]);
  let body: string;
  if (intLen <= 0) body = `0.${"0".repeat(-intLen)}${digits}`;
  else if (intLen >= digits.length) body = digits + "0".repeat(intLen - digits.length);
  else body = `${digits.slice(0, intLen)}.${digits.slice(intLen)}`;
  return m[1] + body;
}

/** "Cada abate de T4 = 10 pontos, cada abate de T5 = 20 pontos, cada morte = 50 pontos." ou null quando não é linear. */
export function explainLinear(lin: LinearForm): string {
  const parts = FORMULA_VARS.filter((v) => lin.weights[v] !== undefined).map((v) => {
    const k = lin.weights[v]!;
    return `cada ${VAR_NOUN[v].one} = ${formatWeight(k)} ponto${Math.abs(k) === 1 ? "" : "s"}`;
  });
  if (lin.constant !== 0) parts.push(`${lin.constant > 0 ? "mais" : "menos"} ${formatWeight(Math.abs(lin.constant))} ponto${Math.abs(lin.constant) === 1 ? "" : "s"} para todos`);
  if (parts.length === 0) return "Esta fórmula dá a todos a mesma pontuação, não importa o que façam.";
  const s = parts.join(", ");
  return `${s[0]!.toUpperCase()}${s.slice(1)}.`;
}

/** Plain-language explanation of any formula (falls back to the canonical text when it is not linear). */
export function explainFormula(ast: FormulaNode): string {
  const lin = linearWeights(ast);
  if (lin) return explainLinear(lin);
  const vars = usedVariables(ast).map((v) => VAR_NOUN[v].many);
  return `Sua pontuação é ${formatFormula(ast)}. Ela usa ${vars.length ? listText(vars) : "nenhum número de jogador"}; por causa de min, max, arredondamento ou da multiplicação de números entre si, cada unidade extra nem sempre vale o mesmo.`;
}

export function listText(items: string[], joiner = "e"): string {
  if (items.length <= 1) return items.join("");
  return `${items.slice(0, -1).join(", ")} ${joiner} ${items[items.length - 1]}`;
}

// ---------------------------------------------------------------------------
// Canonical text

const PREC = { "+": 1, "-": 1, "*": 2, "/": 2 } as const;

function fmt(n: FormulaNode, parentPrec: number, rightSide: boolean): string {
  switch (n.type) {
    case "num": return plainNumber(n.value);
    case "var": return n.name;
    case "neg": {
      const inner = fmt(n.arg, 3, false);
      return `-${inner}`;
    }
    case "call": return `${n.fn}(${n.args.map((a) => fmt(a, 0, false)).join(", ")})`;
    case "bin": {
      const p = PREC[n.op];
      const s = `${fmt(n.left, p, false)} ${n.op} ${fmt(n.right, p, true)}`;
      const wrap = p < parentPrec || (rightSide && p === parentPrec);
      return wrap ? `(${s})` : s;
    }
  }
}

/** Canonical formula text: lower-case names, aliases resolved, single spaces, only the parentheses needed. */
export function formatFormula(ast: FormulaNode): string {
  return fmt(ast, 0, false);
}

// ---------------------------------------------------------------------------
// Presets (B08-0001, verified verbatim; confidence medium)

export interface FormulaPreset {
  id: string;
  label: string;
  /** Key of the matching row in the fact card's `valores`. */
  factKey: string;
  factId: string;
  confidence: "medium";
  stage: string;
  formula: string;
  /** Kingdom rule that the formula itself cannot express. */
  ruleNote?: string;
}

export const DKP_FACT_ID = "B08-0001";
export const REQUIREMENT_FACT_ID = "B08-0002";

export const FORMULA_PRESETS: readonly FormulaPreset[] = [
  { id: "k2708-kvk1", label: "K2708 (KvK1)", factKey: "K2708 KvK1", factId: DKP_FACT_ID, confidence: "medium", stage: "KvK1", formula: "t4 * 10 + t5 * 20 + deads * 50" },
  {
    id: "k2779-kvk2", label: "K2779 (KvK2)", factKey: "K2779 KvK2", factId: DKP_FACT_ID, confidence: "medium", stage: "KvK2", formula: "t4 * 10 + t5 * 30 + deads * 80",
    ruleNote: "O K2779 também conta as suas mortes como 0 em um dia em que você foi zerado em uma 'troca terrível'. Essa regra é decidida pelo conselho dia a dia; não faz parte da fórmula.",
  },
  { id: "rok-steward", label: "Exemplo do ROK Steward", factKey: "ROK Steward example", factId: DKP_FACT_ID, confidence: "medium", stage: "other", formula: "t4 * 1 + t5 * 2 + deads * 10" },
];

export function presetById(id: string | null | undefined): FormulaPreset | undefined {
  return FORMULA_PRESETS.find((p) => p.id === id);
}

export const WEIGHTS_NOT_COMPARABLE =
  "Os pesos não são comparáveis entre reinos: nesses exemplos uma morte vale de 2,5 a 5 abates de T5.";
