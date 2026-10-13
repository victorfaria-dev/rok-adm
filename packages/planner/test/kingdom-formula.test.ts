import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  DKP_FACT_ID, FORMULA_MAX_CHARS, FORMULA_MAX_DEPTH, FORMULA_PRESETS, WEIGHTS_NOT_COMPARABLE, evaluate, evaluateFormula, explainFormula,
  explainLinear, formatFormula, linearWeights, parseFormula, presetById, usedVariables, type FormulaNode,
} from "../src/kingdom-formula";

const ast = (text: string): FormulaNode => {
  const p = parseFormula(text);
  if (!p.ok) throw new Error(`${text}: ${p.error.message}`);
  return p.ast;
};
const val = (text: string, vars = {}) => {
  const r = evaluateFormula(text, vars);
  if (!r.ok) throw new Error(r.error.message);
  return r.value;
};
const errOf = (text: string, vars = {}) => {
  const r = evaluateFormula(text, vars);
  if (r.ok) throw new Error(`${text} did not fail`);
  return r.error;
};

describe("parse and evaluate", () => {
  it("numbers, decimals and precedence", () => {
    expect(val("1 + 2 * 3")).toBe(7);
    expect(val("(1 + 2) * 3")).toBe(9);
    expect(val("10 - 4 - 3")).toBe(3);
    expect(val("100 / 10 / 5")).toBe(2);
    expect(val("0.5 * 4")).toBe(2);
    expect(val(".5 * 4")).toBe(2);
    expect(val("2 * 3 + 4 * 5")).toBe(26);
  });

  it("unary minus and plus", () => {
    expect(val("-3 + 5")).toBe(2);
    expect(val("2 * -3")).toBe(-6);
    expect(val("--3")).toBe(3);
    expect(val("-(2 + 3) * 2")).toBe(-10);
    expect(val("+4")).toBe(4);
    expect(Object.is(val("-0"), 0)).toBe(true);
  });

  it("functions with fixed arity", () => {
    expect(val("min(3, 5)")).toBe(3);
    expect(val("max(3, 5)")).toBe(5);
    expect(val("round(2.5)")).toBe(3);
    expect(val("floor(2.9)")).toBe(2);
    expect(val("ceil(2.1)")).toBe(3);
    expect(val("abs(-7)")).toBe(7);
    expect(val("MAX(t4, deads)", { t4: 2, deads: 9 })).toBe(9);
    expect(errOf("min(1)").code).toBe("arity");
    expect(errOf("min(1, 2, 3)").code).toBe("arity");
    expect(errOf("abs(1, 2)").code).toBe("arity");
    expect(errOf("round()").code).toBe("arity");
    expect(errOf("round + 1").code).toBe("arity");
    expect(errOf("sqrt(4)")).toMatchObject({ code: "unknown_function", pos: 1 });
  });

  it("variables, aliases (case-insensitive) and missing values as 0", () => {
    const v = { t1: 1, t2: 2, t3: 3, t4: 4, t5: 5, deads: 6, kp: 7, power: 8 };
    expect(val("t1 + t2 + t3 + t4 + t5 + deads + kp + power", v)).toBe(36);
    expect(val("T4_KILLS * 10 + t5kills + Dead + deaths + death + kill_points", v)).toBe(40 + 5 + 18 + 7);
    expect(val("t4 * 10")).toBe(0);
    expect(val("t4", { t4: Number.NaN })).toBe(0);
    expect(usedVariables(ast("deaths * 2 + T4 + t4_kills + power"))).toEqual(["t4", "deads", "power"]);
  });

  it("accepts × and ÷ signs", () => {
    expect(val("t4 × 10 ÷ 2", { t4: 3 })).toBe(15);
  });
});

describe("errors (typed, positioned, never thrown)", () => {
  it("unknown name with 1-based position and hint", () => {
    expect(errOf("t4 + tx")).toEqual({ code: "unknown_name", pos: 6, message: "Unknown name 'tx' at character 6. Use t1–t5, deads, kp or power." });
  });

  it("empty, bad characters and broken numbers", () => {
    expect(errOf("   ").code).toBe("empty");
    expect(errOf("t4 * 10 %")).toMatchObject({ code: "bad_char", pos: 9 });
    expect(errOf("1.2.3").code).toBe("bad_number");
    expect(errOf("5.").code).toBe("bad_number");
    expect(errOf("t4 * 1,000")).toMatchObject({ code: "thousands", pos: 7 });
  });

  it("missing operators, values and parentheses", () => {
    expect(errOf("t4 10")).toMatchObject({ code: "expected_operator", pos: 4 });
    expect(errOf("10t4").code).toBe("expected_operator");
    expect(errOf("t4 *")).toMatchObject({ code: "expected_value", pos: 5 });
    expect(errOf("* t4").code).toBe("expected_value");
    expect(errOf("(t4 + 1")).toMatchObject({ code: "missing_paren", pos: 1 });
    expect(errOf("min(t4, 1")).toMatchObject({ code: "missing_paren", pos: 4 });
    expect(errOf("t4 + 1)")).toMatchObject({ code: "extra_paren", pos: 7 });
    expect(errOf("()").code).toBe("expected_value");
    expect(errOf("(t4 t5)").code).toBe("expected_operator");
  });

  it("limits: length, depth, nodes", () => {
    expect(errOf("1+".repeat(150) + "1").code).toBe("too_long");
    expect(parseFormula("1".repeat(FORMULA_MAX_CHARS)).ok).toBe(true);
    const deep = (n: number) => "(".repeat(n) + "1" + ")".repeat(n);
    expect(parseFormula(deep(FORMULA_MAX_DEPTH)).ok).toBe(true);
    expect(errOf(deep(FORMULA_MAX_DEPTH + 1)).code).toBe("too_deep");
    expect(errOf("-".repeat(40) + "1").code).toBe("too_deep");
    expect(errOf(Array.from({ length: 60 }, () => "t4").join("+")).code).toBe("too_many_nodes");
  });

  it("division by zero and non-finite results are errors, never NaN/Infinity", () => {
    expect(errOf("t4 / deads", { t4: 5 })).toMatchObject({ code: "div_zero", pos: 4 });
    expect(errOf("1 / (2 - 2)").code).toBe("div_zero");
    expect(errOf("t4 * t4 * t4", { t4: 1e200 }).code).toBe("not_finite");
    expect(val("t4 / deads", { t4: 10, deads: 4 })).toBe(2.5);
  });

  it("non-string input does not throw", () => {
    expect(parseFormula(undefined as unknown as string).ok).toBe(false);
  });
});

describe("linearWeights and explanations", () => {
  it("linear formulas give weights and constant", () => {
    expect(linearWeights(ast("t4*10 + t5*20 + deads*50"))).toEqual({ weights: { t4: 10, t5: 20, deads: 50 }, constant: 0 });
    expect(linearWeights(ast("(t4 + 2*t5) * 10 - deads / 2 + 100"))).toEqual({ weights: { t4: 10, t5: 20, deads: -0.5 }, constant: 100 });
    expect(linearWeights(ast("10 * t4 + t4"))).toEqual({ weights: { t4: 11 }, constant: 0 });
    expect(linearWeights(ast("t4 - t4 + 5"))).toEqual({ weights: {}, constant: 5 });
    expect(linearWeights(ast("-t5 * max(2, 3)"))).toEqual({ weights: { t5: -3 }, constant: 0 });
    expect(linearWeights(ast("t4 * 0.1 * 3"))).toEqual({ weights: { t4: 0.3 }, constant: 0 });
  });

  it("non-linear formulas give null", () => {
    for (const f of ["t4 * t5", "max(t4, deads)", "round(t4 * 10)", "100 / t4", "t4 / (2 - 2)", "abs(deads)"]) expect(linearWeights(ast(f)), f).toBeNull();
  });

  it("plain-language explanation", () => {
    expect(explainFormula(ast("t4*10 + t5*20 + deads*50"))).toBe("Each T4 kill = 10 points, each T5 kill = 20 points, each dead = 50 points.");
    expect(explainLinear({ weights: { t5: 1 }, constant: -5 })).toBe("Each T5 kill = 1 point, minus 5 points for everyone.");
    expect(explainLinear({ weights: {}, constant: 0 })).toMatch(/same score/);
    expect(explainFormula(ast("max(t4, deads)"))).toMatch(/^Your score is max\(t4, deads\)\. It uses T4 kills and deads/);
  });

  it("formatFormula is canonical and round-trips", () => {
    expect(formatFormula(ast("T4_KILLS*10+  t5 *20+DEAD*50"))).toBe("t4 * 10 + t5 * 20 + deads * 50");
    expect(formatFormula(ast("((t4 + t5)) * 2"))).toBe("(t4 + t5) * 2");
    expect(formatFormula(ast("t4 - (t5 - deads)"))).toBe("t4 - (t5 - deads)");
    expect(formatFormula(ast("t4 / (t5 * 2)"))).toBe("t4 / (t5 * 2)");
    expect(formatFormula(ast("-(t4 + 1)"))).toBe("-(t4 + 1)");
    expect(formatFormula(ast("Min( t4 ,2)"))).toBe("min(t4, 2)");
    for (const f of ["t4 - (t5 - deads) * -2", "max(t4, 1) / (2 + kp)", "-(-t4)", "10 / 4 / 2"]) {
      const a = ast(f);
      const vars = { t4: 3, t5: 7, deads: 11, kp: 2 };
      expect(evaluate(ast(formatFormula(a)), vars)).toEqual(evaluate(a, vars));
    }
  });
});

describe("presets (B08-0001)", () => {
  const card = readFileSync(join(__dirname, "../../../research/facts/B08/B08-0001.md"), "utf8");
  const valores = new Map<string, string>();
  for (const m of card.matchAll(/\{chave: "([^"]+)", valor: "([^"]+)"/g)) valores.set(m[1]!, m[2]!);

  it("confidence shown matches the card's confianca line", () => {
    const c = /^confianca:\s*(\w+)/m.exec(card)?.[1];
    const map: Record<string, string> = { alta: "high", media: "medium", baixa: "low" };
    for (const p of FORMULA_PRESETS) {
      expect(p.factId).toBe(DKP_FACT_ID);
      expect(p.confidence).toBe(map[c!]);
    }
  });

  it("each preset's weights equal the card's valores", () => {
    expect(FORMULA_PRESETS).toHaveLength(3);
    for (const p of FORMULA_PRESETS) {
      const text = valores.get(p.factKey);
      expect(text, p.factKey).toBeDefined();
      const weights: Record<string, number> = {};
      for (const term of text!.split("+")) {
        const m = /^\s*(T4|T5|dead)\s*x\s*(\d+)\s*$/.exec(term);
        expect(m, term).not.toBeNull();
        weights[m![1] === "dead" ? "deads" : m![1]!.toLowerCase()] = Number(m![2]);
      }
      expect(linearWeights(ast(p.formula))).toEqual({ weights, constant: 0 });
    }
  });

  it("K2779 keeps its zeroed-day rule as a note, not in the formula", () => {
    expect(presetById("k2779-kvk2")?.ruleNote).toMatch(/terrible trade/);
    expect(presetById("nope")).toBeUndefined();
    expect(WEIGHTS_NOT_COMPARABLE).toMatch(/2\.5 to 5/);
    // dead:T5 ratios in the presets: 2.5, 2.67, 5
    const ratios = FORMULA_PRESETS.map((p) => { const w = linearWeights(ast(p.formula))!.weights; return w.deads! / w.t5!; });
    expect(Math.min(...ratios)).toBe(2.5);
    expect(Math.max(...ratios)).toBe(5);
  });
});

describe("prototype names", () => {
  it.each(["constructor", "__proto__", "toString", "valueOf", "hasOwnProperty", "constructor * 2 + t4"])("rejects %j as an unknown name", (f) => {
    const r = parseFormula(f);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error.code).toBe("unknown_name");
  });
});
