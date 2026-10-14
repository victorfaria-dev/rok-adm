// @vitest-environment happy-dom
// Wave VG: the guide timeline renders every step as a keyboard-reachable node with confidence, gist,
// sources and a "Read more" link; the enhancer adds arrow keys and never hides steps under reduced motion.
import { cleanup, render } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultProfile } from "@rokadm/core";
import type { CardBadge, PayloadBlock } from "../../lib/guide-types";
import { buildTimeline, hereFor } from "../../lib/guide-timeline";
import { enhanceGuideTimeline, goToBlock, NEED_BLOCK } from "../../lib/guide-timeline-dom";
import type { GuideView, ViewBlock } from "../../lib/guide-view";
import { Timeline } from "./Timeline";

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

const block = (id: string, phase: PayloadBlock["phase"], extra: Partial<PayloadBlock> = {}): PayloadBlock =>
  ({
    id, title: `Step ${id}`, phase, section: "plan", order: 1, stage: ["todos"], perfil: ["todos"], funcao: ["todas"],
    hours_min_per_day: null, time_cost_min: null, priority: 3, recommended_for: [], ch_range: null, civ: [], consensus: "",
    split_views: null, body_md: "", why_md: "", cards: ["A01-0001"], patch_cards: [], confidence: "medium", uncertain_notes: null,
    gaps: [], low_spender_note: null, as_of: "2026-10-13", patch_ref: "1.1.09", bodyHtml: "<p>x</p>", whyHtml: "", gist: `Gist of ${id}.`,
    patch: { version: "1.1.09", note: null, asOf: "2026-10-13" }, ...extra,
  }) as PayloadBlock;
const item = (b: PayloadBlock): ViewBlock => ({ block: b, flags: { recommended: false, upcoming: false } as ViewBlock["flags"], lowSpenderNote: null, folded: [] });
const badges: Record<string, CardBadge> = { "A01-0001": { title: "CH", label: "Verified", confidence: "medium", usable: true, sources: ["fandom", "rkg"] } };

function view(done: PayloadBlock[] = []): GuideView {
  const blocks = [block("a", "day0-3"), block("b", "day4-14", { confidence: "low", ch_range: [8, 12] }), block("c", "day15-40"), block("d", "daily")];
  return { sections: [{ id: "plan", title: "Plan", blocks: blocks.map(item) }], alreadyDone: done.map(item), meta: {} } as unknown as GuideView;
}

function mount(v = view(), profile = defaultProfile()) {
  const t = buildTimeline(v, badges);
  return render(h(Timeline, { timeline: t, here: hereFor({ ...profile, kingdomDay: 20 }) }), { container: document.body.appendChild(document.createElement("div")) });
}

describe("Timeline", () => {
  it("renders one node per step, in lanes, with confidence, gist, sources and a Read more link", () => {
    const { container } = mount();
    expect([...container.querySelectorAll(".tl-lane")].map((l) => l.getAttribute("data-lane"))).toEqual(["day0-3", "day4-14", "day15-40", "any"]);
    const b = container.querySelector('[data-node="b"]')!;
    expect(b.querySelector("summary [data-confidence]")!.getAttribute("data-confidence")).toBe("low");
    expect(b.querySelector("summary")!.textContent).toContain("Pref. 8–12");
    expect(b.querySelector(".tl-gist")!.textContent).toBe("Gist of b.");
    expect(b.querySelector(".tl-meta")!.textContent).toContain("Fontes: fandom, rkg");
    expect(b.querySelector(".tl-meta")!.textContent).toContain("1 ficha de fato");
    expect(b.querySelector("a.tl-more")!.getAttribute("href")).toBe("#b-b");
    expect(container.querySelector('[data-lane="day15-40"] [data-you-are-here]')!.textContent).toContain("Dia 20 do reino");
  });

  it("folds a phase whose steps are all probably done", () => {
    const v = view();
    v.sections[0]!.blocks = v.sections[0]!.blocks.filter((b) => b.block.id !== "a");
    v.alreadyDone = [item(block("a", "day0-3"))];
    const { container } = mount(v);
    const lane = container.querySelector('[data-lane="day0-3"]')!;
    expect(lane.querySelector("details.tl-fold > summary")!.textContent).toBe("Mostrar 1 passo (provavelmente já feitos)");
    expect(lane.querySelector('[data-node="a"]')!.hasAttribute("data-done")).toBe(true);
  });

  it("arrow keys, Home and End move between steps; Escape closes an open step", () => {
    const { container } = mount();
    const undo = enhanceGuideTimeline(container);
    const sums = [...container.querySelectorAll<HTMLElement>(".tl-node > details > summary")];
    // happy-dom has no layout: treat every summary as visible.
    for (const s of sums) s.getClientRects = () => [{}] as unknown as DOMRectList;
    sums[0]!.focus();
    sums[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true }));
    expect(document.activeElement).toBe(sums[1]);
    sums[1]!.dispatchEvent(new KeyboardEvent("keydown", { key: "End", bubbles: true }));
    expect(document.activeElement).toBe(sums.at(-1));
    sums.at(-1)!.dispatchEvent(new KeyboardEvent("keydown", { key: "Home", bubbles: true }));
    expect(document.activeElement).toBe(sums[0]);
    sums[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true }));
    expect(document.activeElement).toBe(sums[0]);
    const d = sums[0]!.parentElement as HTMLDetailsElement;
    d.open = true;
    sums[0]!.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(d.open).toBe(false);
    undo();
  });

  it("never hides steps under reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), addEventListener() {}, removeEventListener() {} }));
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    const { container } = mount();
    const undo = enhanceGuideTimeline(container);
    expect(container.querySelector("[data-timeline]")!.hasAttribute("data-reveal")).toBe(false);
    undo();
  });

  it("reveals steps as they scroll in when motion is welcome", () => {
    vi.stubGlobal("matchMedia", () => ({ matches: false, addEventListener() {}, removeEventListener() {} }));
    vi.stubGlobal("IntersectionObserver", class { observe() {} unobserve() {} disconnect() {} });
    const { container } = mount();
    const undo = enhanceGuideTimeline(container);
    const root = container.querySelector("[data-timeline]")!;
    expect(root.hasAttribute("data-reveal")).toBe(true);
    // Focus shows a step at once.
    const s = container.querySelector<HTMLElement>(".tl-node summary")!;
    s.dispatchEvent(new FocusEvent("focusin", { bubbles: true }));
    expect(s.closest(".tl-node")!.hasAttribute("data-shown")).toBe(true);
    undo();
    expect(root.hasAttribute("data-reveal")).toBe(false);
  });

  it("Read more opens a closed 'Already done?' around the step, or asks the page to render it", () => {
    const { container } = mount();
    const done = document.createElement("details");
    done.innerHTML = '<article id="b-a"><h3>A</h3></article>';
    document.body.append(done);
    expect(goToBlock("a")).toBe(true);
    expect(done.open).toBe(true);
    expect(document.activeElement?.id).toBe("b-a");

    const undo = enhanceGuideTimeline(container);
    const asked: string[] = [];
    container.addEventListener(NEED_BLOCK, (e) => asked.push((e as CustomEvent<{ id: string }>).detail.id));
    container.querySelector<HTMLAnchorElement>('[data-node="c"] a.tl-more')!.click();
    expect(asked).toEqual(["c"]);
    undo();
    done.remove();
  });
});
