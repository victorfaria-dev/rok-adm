import { describe, expect, it } from "vitest";
import { defaultProfile, PHASE_LAST_DAY, type AccountProfile } from "@rokadm/core";
import { getFact } from "@rokadm/data";
import { buildCalendar, canDate, MILESTONES } from "./guide-calendar";
import { buildGuidePayload, gistOf } from "./guide-payload";
import { buildTimeline, dayText, FLOOR_LANES, hereFor, LANES, laneOf, stripPos, tipsFor, towerFloors, viewBlocks } from "./guide-timeline";
import { fullGuide, selectGuide } from "./guide-view";

const make = (p: Partial<AccountProfile>): AccountProfile => ({ ...defaultProfile(), ...p });

describe("timeline lanes (wave VG)", () => {
  it("dated lanes follow core's phase ends, in order", () => {
    const dated = LANES.filter((l) => l.days !== null);
    expect(dated.map((l) => l.id)).toEqual([...FLOOR_LANES]);
    for (const l of dated) {
      const last = PHASE_LAST_DAY[l.id as keyof typeof PHASE_LAST_DAY];
      if (last !== undefined) expect(l.days![1], l.id).toBe(last);
    }
    expect(LANES.find((l) => l.id === "day4-14")).toMatchObject({ title: "Days 4–14", sub: "about CH8 → CH12" });
  });

  it("puts undated phases in the start and any-day lanes", () => {
    expect(laneOf("overview")).toBe("start");
    for (const p of ["daily", "event", "anytime"] as const) expect(laneOf(p)).toBe("any");
    expect(laneOf("day15-40")).toBe("day15-40");
  });

  it("places every step of the default guide exactly once, done steps flagged", () => {
    const payload = buildGuidePayload("f2p");
    const p = make({ spending: "f2p", kingdomDay: 20, cityHall: 12 });
    const view = selectGuide(payload, p);
    const t = buildTimeline(view, payload.badges);
    const ids = t.lanes.flatMap((l) => l.nodes.map((n) => n.id));
    expect(ids.sort()).toEqual(viewBlocks(view).map((b) => b.id).sort());
    expect(t.show).toBe(true);
    const done = t.lanes.flatMap((l) => l.nodes).filter((n) => n.done).map((n) => n.id).sort();
    expect(done).toEqual(view.alreadyDone.map((b) => b.block.id).sort());
    for (const n of t.lanes.flatMap((l) => l.nodes)) {
      expect(n.gist.length, n.id).toBeGreaterThan(0);
      expect(n.gist.length, n.id).toBeLessThanOrEqual(171);
    }
  });

  it("shows the timeline only where steps span two dated phases", () => {
    const show = (set: string) => {
      const p = buildGuidePayload(set);
      return buildTimeline(fullGuide(p), p.badges).show;
    };
    expect(show("first30")).toBe(true);
    expect(show("newkingdom")).toBe(true);
    expect(show("low")).toBe(true);
    expect(show("kingdomadmin")).toBe(false);
    expect(show("recovery")).toBe(false);
    expect(show("latestage")).toBe(false);
  });
});

describe("you are here", () => {
  it("uses the kingdom day first", () => {
    expect(hereFor(make({ kingdomDay: 2, cityHall: 20 })).lane).toBe("day0-3");
    expect(hereFor(make({ kingdomDay: 14 })).lane).toBe("day4-14");
    expect(hereFor(make({ kingdomDay: 20 }))).toMatchObject({ lane: "day15-40", basis: "day", text: "Dia 20 do reino", day: 20 });
    expect(hereFor(make({ kingdomDay: 90 })).lane).toBe("day41-90");
    expect(hereFor(make({ kingdomDay: 120, kingdomStage: "kvk1" })).lane).toBe("pre-kvk1");
  });

  it("falls back to the City Hall ranges of the phase titles", () => {
    const at = (cityHall: number) => hereFor(make({ kingdomDay: null, cityHall })).lane;
    expect([at(5), at(8), at(11), at(12), at(16), at(17), at(21), at(22), at(25)]).toEqual([
      "day0-3", "day4-14", "day4-14", "day15-40", "day15-40", "day41-90", "day41-90", "pre-kvk1", "pre-kvk1",
    ]);
    expect(hereFor(make({ kingdomDay: null, cityHall: 12 })).basis).toBe("cityHall");
  });

  it("says a KvK2+ kingdom is past the road", () => {
    expect(hereFor(make({ kingdomStage: "soc", kingdomDay: 400 }))).toMatchObject({ lane: "past", basis: "stage" });
  });

  it("marks one tower floor, bottom first", () => {
    const floors = towerFloors(null, hereFor(make({ kingdomDay: 20 })));
    expect(floors.map((f) => f.lane)).toEqual([...FLOOR_LANES]);
    expect(floors.filter((f) => f.here).map((f) => f.lane)).toEqual(["day15-40"]);
    expect(towerFloors(null, null).some((f) => f.here)).toBe(false);
  });
});

describe("kingdom calendar", () => {
  it("every dated milestone's day is written in its card", () => {
    const norm = (s: string) => s.replace(/[–—]/g, "-").toLowerCase();
    for (const m of MILESTONES.filter((x) => x.day !== null)) {
      const f = getFact(m.facts[0]!);
      expect(f, m.id).toBeDefined();
      const text = norm([f!.statement, f!.title, ...f!.values.map((v) => `${v.key} ${v.value} ${v.unit ?? ""}`)].join(" "));
      expect(text, m.id).toContain(norm(m.evidence!));
    }
  });

  it("dated milestones come from cards with a source; the rest are pending with a gap id", () => {
    const cal = buildCalendar();
    expect(cal.length).toBe(MILESTONES.length);
    for (const m of cal) {
      if (m.day) {
        expect(m.facts.every(canDate), m.id).toBe(true);
        expect(m.sources.length, m.id).toBeGreaterThan(0);
        expect(m.confidence, m.id).not.toBe("pending");
      } else {
        expect(m.confidence, m.id).toBe("pending");
        expect(m.gaps.length, m.id).toBeGreaterThan(0);
      }
    }
    expect(cal.find((m) => m.id === "kvk1")?.day).toEqual([100, 100]);
    expect(cal.find((m) => m.id === "kvk1-length")?.label).toBe("Disputed");
  });

  it("a card without a source, or outdated, never dates a milestone", () => {
    const cal = buildCalendar([{ id: "x", title: "X", day: [3, 3], approx: false, kind: "event", facts: ["Z99-0000"], evidence: null }]);
    expect(cal[0]).toMatchObject({ day: null, confidence: "pending" });
  });

  it("labels days and positions", () => {
    expect(dayText({ day: [5, 5], approx: false })).toBe("Dia 5");
    expect(dayText({ day: [20, 23], approx: true })).toBe("Dias ~20–23");
    expect(dayText({ day: [100, 160], approx: true })).toBe("Dia ~100+");
    expect(dayText({ day: null, approx: false })).toBe("Pendente");
    expect(stripPos(80)).toBe(50);
    expect(stripPos(400)).toBe(100);
  });

  it("links a milestone to the most specific steps that cite its card", () => {
    const blocks = buildGuidePayload("f2p").blocks;
    const tips = tipsFor({ facts: ["C04-0005"] }, blocks);
    expect(tips.length).toBeGreaterThan(0);
    expect(tips.length).toBeLessThanOrEqual(2);
    expect(tips.map((t) => t.id)).toContain("d4-pelagius-day5");
    expect(tipsFor({ facts: ["Z99-0000"] }, blocks)).toEqual([]);
  });
});

describe("gist", () => {
  it("keeps the first sentence, drops fact ids and the consensus tag", () => {
    expect(gistOf("<ul><li><strong>Recommended:</strong> join early [A06-0516]. Consensus: <strong>unanimous</strong>.</li></ul>")).toBe("Recommended: join early.");
  });
  it("joins a short lead-in with what follows and skips tables", () => {
    const html = '<p><strong>Goals</strong></p><div class="ko-table" tabindex="0" role="region" aria-label="x"><table><tr><td>t</td></tr></table></div><ul><li>Keep a second builder running.</li></ul>';
    expect(gistOf(html)).toBe("Goals: Keep a second builder running.");
  });
  it("cuts long text at a sentence or a word", () => {
    const long = `<p>${"word ".repeat(60)}</p>`;
    const g = gistOf(long);
    expect(g.endsWith("…")).toBe(true);
    expect(g.length).toBeLessThanOrEqual(171);
  });
});
