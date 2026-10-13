import { QUESTIONS } from "@rokadm/core";
import { describe, expect, it } from "vitest";
import { GREETING, LEADS, SUMMARY_LEAD } from "./sun-tzu";

describe("Sun Tzu lines", () => {
  const all = [GREETING, SUMMARY_LEAD, ...Object.values(LEADS)];

  it("have a lead for every question, and nothing else", () => {
    expect(Object.keys(LEADS).sort()).toEqual(QUESTIONS.map((q) => q.id).sort());
  });

  it("stay short, plain and deterministic", () => {
    for (const line of all) {
      expect(line.length, line).toBeLessThanOrEqual(120);
      // Plain English: no fantasy clichés, no badges, no em dash in new interface text.
      expect(line, line).not.toMatch(/\b(my liege|thou|thee|ye|brave|warrior|quest|realm|adventurer|hero|destiny|recommended)\b|—/i);
    }
  });

  it("the greeting counts the real number of questions", () => {
    expect(GREETING).toContain(`${QUESTIONS.length} quick questions`);
  });
});
