// CSV import/export of the council kit (wave G): MGE governors and ledger, requirements sandbox roster.
// The ledger CSV export is tested in packages/planner/test/kingdom-mge.test.ts (mgeLedgerCsv).
import { emptyMgeDoc, parseCsv } from "@rokadm/planner";
import { describe, expect, it } from "vitest";
import { addCandidatesFromCsv } from "./kingdom-mge";
import { cardToForm, formToCard, newCard, rosterFromCsv, rosterToCsv } from "./kingdom-requirements";

let n = 0;
const ids = () => `c${++n}`;

describe("MGE governors from CSV", () => {
  it("reads name and score columns in any order and merges like pasting", () => {
    const doc = { ...emptyMgeDoc("p"), candidates: [{ id: "a", name: "Alpha", score: 1, tags: [] }] };
    const r = addCandidatesFromCsv(doc, "﻿DKP;Governor\n4.2m;alpha\n\"1,200\";\"Bo, Jr\"\nabc;Cy\n;\n300k;Dee\n", ids);
    expect(r.added).toBe(2);
    expect(r.updated).toEqual(["Alpha"]);
    expect(r.doc.candidates.map((c) => [c.name, c.score])).toEqual([["Alpha", 4_200_000], ["Bo, Jr", 1200], ["Dee", 300_000]]);
    expect(r.errors).toEqual([{ line: 4, text: "Cy, abc", message: expect.stringContaining("not a number") }]);
  });

  it("a guarded formula comes back as plain text, never evaluated", () => {
    const r = addCandidatesFromCsv(emptyMgeDoc("p"), "name\n'=HYPERLINK(1)\n", ids);
    expect(r.doc.candidates[0]!.name).toBe("=HYPERLINK(1)");
  });

  it("throws a readable message without a name column", () => {
    expect(() => addCandidatesFromCsv(emptyMgeDoc("p"), "who,score\nA,1")).toThrow(/Missing: "name"/);
  });
});

describe("requirements roster CSV", () => {
  it("exports name, stats and the card's verdict; re-imports into an empty sandbox", () => {
    const card = newCard(new Date("2026-10-13T00:00:00Z"));
    const csv = rosterToCsv(card);
    const p = parseCsv(csv);
    expect(p.ok && p.rows[0]).toEqual(["name", "power", "t1", "t2", "t3", "t4", "t5", "deads", "kp", "dkp", "target", "percent_of_target", "result"]);
    expect(p.ok && p.rows.length).toBe(4);
    expect(p.ok && p.rows[1]![0]).toBe("Sample A");
    expect(p.ok && ["pass", "below", "no band"]).toContain(p.ok && p.rows[1]![12]);

    const back = rosterFromCsv([], csv, ids);
    expect(back.added).toBe(3);
    expect(back.samples[0]!.values.power).toBe("10500000");
    const again = formToCard({ ...cardToForm(card), samples: back.samples });
    expect(again.errors).toEqual({});
    expect(again.card.sampleAccounts.map((s) => s.stats.power)).toEqual(card.sampleAccounts.map((s) => s.stats.power));
  });

  it("same name updates, bad numbers are reported per row, the limit holds", () => {
    const start = cardToForm(newCard()).samples;
    const r = rosterFromCsv(start, "Name,Power,T4 kills\nsample a,1m,\nNew,xx,1\nNew2,2m,5k\n", ids);
    expect(r.updated).toBe(1);
    expect(r.samples[0]!.values.power).toBe("1m");
    expect(r.errors).toEqual([{ line: 3, message: "Not a number: power." }]);
    expect(r.samples.at(-1)).toMatchObject({ name: "New2", values: { power: "2m", t4: "5k" } });
    const many = "name\n" + Array.from({ length: 30 }, (_, i) => `G${i}`).join("\n");
    const full = rosterFromCsv([], many, ids);
    expect(full.added).toBe(20);
    expect(full.overLimit).toBe(10);
  });
});
