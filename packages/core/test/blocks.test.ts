import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  defaultProfile,
  explainSelection,
  flattenGuide,
  mergeBlockSets,
  renderBlockMarkdown,
  renderGuideMarkdown,
  selectBlocks,
  type AccountProfile,
  type GuideBlock,
} from "../src/index";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const BLOCKS: GuideBlock[] = JSON.parse(readFileSync(resolve(ROOT, "guides/data/blocks.f2p.json"), "utf8"));
const GUIDE_MD = readFileSync(resolve(ROOT, "guides/f2p-early-kingdom-guide.md"), "utf8");

const profile = (over: Partial<AccountProfile> = {}): AccountProfile => ({
  ...defaultProfile(),
  minutesPerDay: 120,
  ...over,
});

const ids = (g: ReturnType<typeof selectBlocks>) => flattenGuide(g).map((s) => s.block.id);
const forProfile = (sp: string) => BLOCKS.filter((b) => b.perfil.includes("todos") || b.perfil.includes(sp as never));

describe("selectBlocks — spending profile", () => {
  it("dataset sanity", () => {
    expect(BLOCKS.length).toBeGreaterThanOrEqual(40);
  });

  it("an F2P fighter at CH1 with 2h/day gets every F2P block, in file order", () => {
    const g = selectBlocks(BLOCKS, profile({ role: "lutador" }));
    const expected = forProfile("f2p").filter((b) => b.funcao.includes("todas") || b.funcao.includes("lutador"));
    // pk-kvk1-behaviour is kvk1-only; farm-brief is farm-only.
    expect(ids(g)).toEqual(expected.filter((b) => b.stage.includes("pre_kvk") || b.stage.includes("todos")).map((b) => b.id));
    expect(g.alreadyDone).toEqual([]);
  });

  it("the union over roles and stages covers all F2P blocks", () => {
    const seen = new Set<string>();
    for (const role of ["lutador", "farm", "rally", "guarnicao", "lider"] as const)
      for (const kingdomStage of ["pre_kvk", "kvk1"] as const)
        for (const id of ids(selectBlocks(BLOCKS, profile({ role, kingdomStage })))) seen.add(id);
    expect([...seen].sort()).toEqual(forProfile("f2p").map((b) => b.id).sort());
    expect(forProfile("f2p")).toHaveLength(BLOCKS.length);
  });

  it("low inherits F2P blocks by default (Low = delta over F2P); strict match with profileFallback {}", () => {
    const low = ids(selectBlocks(BLOCKS, profile({ spending: "low" })));
    expect(low).toEqual(ids(selectBlocks(BLOCKS, profile())));
    const strict = flattenGuide(selectBlocks(BLOCKS, profile({ spending: "low" }), { profileFallback: {} }));
    for (const s of strict) expect(s.block.perfil.some((p) => p === "todos" || p === "low")).toBe(true);
    expect(strict.length).toBeLessThan(low.length);
  });

  it("a whale only gets blocks tagged todos/whale", () => {
    const g = selectBlocks(BLOCKS, profile({ spending: "whale", role: "farm" }));
    const got = flattenGuide(g);
    expect(got.length).toBeGreaterThan(0);
    for (const s of got) expect(s.block.perfil.some((p) => p === "todos" || p === "whale")).toBe(true);
    expect(ids(g)).not.toContain("ov-budget-reality-check");
    expect(g.excluded.find((e) => e.id === "ov-budget-reality-check")?.reasons[0]).toMatch(/Só para F2P; você é Whale/);
  });

  it("orders by section, then order", () => {
    const flat = flattenGuide(selectBlocks(BLOCKS, profile()));
    const sections = ["overview", "day0", "plan", "daily", "events", "farms", "mistakes", "recovery", "open"];
    for (let i = 1; i < flat.length; i++) {
      const a = flat[i - 1]!.block, b = flat[i]!.block;
      const d = sections.indexOf(a.section) - sections.indexOf(b.section);
      expect(d < 0 || (d === 0 && a.order <= b.order)).toBe(true);
    }
  });
});

describe("selectBlocks — flags", () => {
  it("marks recommended when the profile is in recommended_for", () => {
    const f2p = flattenGuide(selectBlocks(BLOCKS, profile()));
    const low = flattenGuide(selectBlocks(BLOCKS, profile({ spending: "low" })));
    const rec = (list: typeof f2p, id: string) => list.find((s) => s.block.id === id)?.flags.recommended;
    expect(rec(f2p, "ov-patch-state")).toBe(true);
    expect(rec(low, "ov-patch-state")).toBe(true);
    expect(rec(f2p, "open-pending-measurements")).toBe(false);
    expect(rec(low, "d0-join-alliance")).toBe(true);
    const med = flattenGuide(selectBlocks(BLOCKS, profile({ spending: "medium" })));
    expect(rec(med, "d0-join-alliance")).toBe(true);
    expect(rec(med, "d0-day1-survival")).toBe(false);
  });

  it("attaches lowSpenderNote only for low", () => {
    const withNote = BLOCKS.find((b) => b.low_spender_note && b.perfil.includes("todos"));
    const f2p = flattenGuide(selectBlocks(BLOCKS, profile()));
    expect(f2p.every((s) => s.lowSpenderNote === null)).toBe(true);
    const low = flattenGuide(selectBlocks(BLOCKS, profile({ spending: "low" })));
    // Every todos block with a low note keeps it for low.
    for (const s of low) expect(s.lowSpenderNote).toBe(s.block.low_spender_note);
    if (withNote) expect(low.find((s) => s.block.id === withNote.id)?.lowSpenderNote).toBeTruthy();
  });

  it("flags pending and uncertainty", () => {
    const flat = flattenGuide(selectBlocks(BLOCKS, profile()));
    const open = flat.find((s) => s.block.id === "open-pending-measurements")!;
    expect(open.flags).toMatchObject({ isPending: true, confidence: "pending", hasUncertainty: true, hasGaps: true });
    const alliance = flat.find((s) => s.block.id === "d0-join-alliance")!;
    expect(alliance.flags.hasUncertainty).toBe(false);
    const budget = flat.find((s) => s.block.id === "ov-budget-reality-check")!;
    expect(budget.flags).toMatchObject({ hasUncertainty: true, isPending: false, recommended: true });
  });
});

describe("selectBlocks — City Hall, time, civilization, kingdom day", () => {
  it("moves blocks whose CH range is behind the player to alreadyDone", () => {
    const g = selectBlocks(BLOCKS, profile({ cityHall: 18 }));
    const done = g.alreadyDone.map((s) => s.block.id);
    expect(done).toEqual(expect.arrayContaining(["d0-civilization", "d0-new-kingdom-start", "d4-ch8-ch12-checkpoints", "d4-research-economy", "d15-ch10-ch17"]));
    expect(ids(g)).not.toContain("d0-civilization");
    expect(ids(g)).toContain("d41-ch21-t4"); // 17–22
    expect(ids(g)).toContain("d0-build-order"); // 1–25
  });

  it("drops already-done blocks when includeAlreadyDone is false", () => {
    const g = selectBlocks(BLOCKS, profile({ cityHall: 25 }), { includeAlreadyDone: false });
    expect(g.alreadyDone).toEqual([]);
    expect(g.excluded.map((e) => e.id)).toContain("d41-ch21-t4");
  });

  it("flags upcoming blocks when CH is below the range", () => {
    const g = flattenGuide(selectBlocks(BLOCKS, profile({ cityHall: 5 })));
    expect(g.find((s) => s.block.id === "d41-ch21-t4")?.flags.upcoming).toBe(true);
    expect(g.find((s) => s.block.id === "d0-civilization")?.flags.upcoming).toBe(false);
  });

  it("filters daily tiers by minutes per day", () => {
    const at = (m: number) => ids(selectBlocks(BLOCKS, profile({ minutesPerDay: m })));
    expect(at(15)).toEqual(expect.arrayContaining(["daily-15min", "daily-weekly", "daily-break-mode"]));
    expect(at(15)).not.toContain("daily-30min");
    expect(at(30)).toContain("daily-30min");
    expect(at(30)).not.toContain("daily-60min");
    expect(at(60)).toContain("daily-60min");
    expect(at(5)).toContain("daily-break-mode");
    expect(at(5)).not.toContain("daily-15min");
  });

  it("folds lower daily tiers into the highest one", () => {
    const g = selectBlocks(BLOCKS, profile({ minutesPerDay: 60 }), { dailyTiers: "fold" });
    const daily = g.sections.find((s) => s.id === "daily")!;
    expect(daily.blocks.map((b) => b.block.id)).not.toContain("daily-15min");
    const top = daily.blocks.find((b) => b.block.id === "daily-60min")!;
    expect(top.folded.map((f) => f.block.id)).toEqual(["daily-15min", "daily-30min"]);
    expect([...ids(g)].sort()).toEqual([...ids(selectBlocks(BLOCKS, profile({ minutesPerDay: 60 })))].sort());
  });

  it("filters by civilization (synthetic block)", () => {
    const base = BLOCKS.find((b) => b.id === "d0-join-alliance")!;
    const civBlock: GuideBlock = { ...base, id: "civ-china-only", civ: ["china"] };
    const set = mergeBlockSets(BLOCKS, [civBlock]);
    expect(ids(selectBlocks(set, profile({ civilization: "china" })))).toContain("civ-china-only");
    expect(ids(selectBlocks(set, profile({ civilization: "spain" })))).not.toContain("civ-china-only");
    expect(ids(selectBlocks(set, profile({ civilization: null })))).not.toContain("civ-china-only");
  });

  it("moves past phases to alreadyDone by kingdom day", () => {
    const g = selectBlocks(BLOCKS, profile({ kingdomDay: 50 }));
    const done = g.alreadyDone.map((s) => s.block.id);
    expect(done).toContain("d0-first-gems-vip"); // day0-3
    expect(done).toContain("d15-vip6-milestone"); // day15-40
    expect(ids(g)).toContain("d41-hospital"); // day41-90
    expect(ids(g)).toContain("pk-eve-of-crusade");
  });

  it("minimum plan and hide-low-confidence toggles", () => {
    const min = flattenGuide(selectBlocks(BLOCKS, profile(), { minPriority: 4 }));
    expect(min.every((s) => s.block.priority >= 4)).toBe(true);
    const sure = flattenGuide(selectBlocks(BLOCKS, profile(), { hideLowConfidence: true }));
    expect(sure.some((s) => s.block.confidence === "low" || s.block.confidence === "pending")).toBe(false);
  });

  it("stage filter: kvk1-only block appears only at kvk1", () => {
    expect(ids(selectBlocks(BLOCKS, profile({ kingdomStage: "pre_kvk" })))).not.toContain("pk-kvk1-behaviour");
    expect(ids(selectBlocks(BLOCKS, profile({ kingdomStage: "kvk1" })))).toContain("pk-kvk1-behaviour");
    // Only stage-independent blocks (the daily routine) reach later stages.
    const soc = ids(selectBlocks(BLOCKS, profile({ kingdomStage: "soc" })));
    expect(soc.length).toBeGreaterThan(0);
    for (const id of soc) expect(BLOCKS.find((b) => b.id === id)!.stage).toContain("todos");
  });
});

describe("explainSelection", () => {
  it("explains inclusion and exclusion", () => {
    const b = BLOCKS.find((x) => x.id === "farm-brief")!;
    const no = explainSelection(b, profile({ role: "lutador" }));
    expect(no.placement).toBe("excluded");
    expect(no.reasons.join(" ")).toMatch(/Só para as funções farm; a sua função é lutador/);
    const yes = explainSelection(b, profile({ role: "farm" }));
    expect(yes.included).toBe(true);
    expect(yes.checks.every((c) => c.passed)).toBe(true);
    expect(yes.reasons).toContain("Recomendado para F2P.");
  });

  it("explains already-done and time failures", () => {
    const civ = BLOCKS.find((x) => x.id === "d0-civilization")!;
    const e = explainSelection(civ, profile({ cityHall: 15 }));
    expect(e.placement).toBe("alreadyDone");
    expect(e.reasons[0]).toMatch(/Prefeitura 1–10; você está na Prefeitura 15/);
    const d60 = BLOCKS.find((x) => x.id === "daily-60min")!;
    const t = explainSelection(d60, profile({ minutesPerDay: 30 }));
    expect(t.placement).toBe("excluded");
    expect(t.checks.find((c) => c.criterion === "time")?.passed).toBe(false);
  });
});

describe("mergeBlockSets", () => {
  it("delta block with same id replaces the base one", () => {
    const base = BLOCKS.slice(0, 3);
    const delta = [{ ...base[1]!, title: "Low version" }];
    const merged = mergeBlockSets(base, delta);
    expect(merged).toHaveLength(3);
    expect(merged[1]!.title).toBe("Low version");
  });
});

describe("renderGuideMarkdown", () => {
  it("renders blocks exactly like assemble_guide.py (blocks without low notes)", () => {
    const g = selectBlocks(BLOCKS, profile());
    let compared = 0;
    for (const s of flattenGuide(g)) {
      if (s.block.low_spender_note) continue;
      const level = s.block.section === "plan" ? 4 : 3;
      const md = renderBlockMarkdown(s, {}, level).trimEnd();
      expect(GUIDE_MD).toContain(md);
      compared++;
    }
    expect(compared).toBeGreaterThan(25);
  });

  it("low profile renders low-spender notes like the F2P guide does", () => {
    const g = selectBlocks(BLOCKS, profile({ spending: "low" }));
    const s = flattenGuide(g).find((x) => x.block.low_spender_note)!;
    expect(s).toBeTruthy();
    const level = s.block.section === "plan" ? 4 : 3;
    expect(GUIDE_MD).toContain(renderBlockMarkdown(s, {}, level).trimEnd());
  });

  it("produces the same block headings, in order, as the generated F2P guide", () => {
    // The Python guide shows every F2P block regardless of role/stage.
    const all = BLOCKS.map((b) => ({ ...b, funcao: ["todas" as const], stage: ["todos" as const] }));
    const md = renderGuideMarkdown(selectBlocks(all, profile()));
    const heads = (s: string) =>
      s.split("\n").filter((l) => /^#{2,4} /.test(l) && !/^## (Sumário|Como ler este guia|Apêndice|Já feito)/.test(l))
        .filter((l) => !/^### (Lacunas referenciadas|Confiança dos blocos|Contradições conhecidas)/.test(l));
    const pyHeads = heads(GUIDE_MD.split("## Apêndice")[0]!).filter((l) => !l.startsWith("# "));
    expect(heads(md).filter((l) => !l.startsWith("# "))).toEqual(pyHeads);
    expect(md).toContain("**Recomendado** para F2P");
  });

  it("renders an Already done? list", () => {
    const md = renderGuideMarkdown(selectBlocks(BLOCKS, profile({ cityHall: 20 })));
    expect(md).toContain("## Já feito?");
    expect(md).toMatch(/- \*\*Escolha sua civilização[^\n]*\(Prefeitura 1–10\)/);
  });
});
