import { describe, expect, it } from "vitest";
import { STEPS } from "./questionnaire-flow";
import { GREETING, LEADS, SUMMARY_LEAD } from "./sun-tzu";

describe("Sun Tzu lines", () => {
  const all = [GREETING, SUMMARY_LEAD, ...Object.values(LEADS)];

  it("have a lead for every onboarding step, and nothing else", () => {
    expect(Object.keys(LEADS).sort()).toEqual(STEPS.map((q) => q.id).sort());
  });

  it("stay short, plain and deterministic", () => {
    for (const line of all) {
      expect(line.length, line).toBeLessThanOrEqual(120);
      // Plain English: no fantasy clichés, no badges, no em dash in new interface text.
      expect(line, line).not.toMatch(/\b(my liege|thou|thee|ye|brave|warrior|quest|realm|adventurer|hero|destiny|recommended)\b|—/i);
    }
  });

  it("the greeting counts the real number of questions (at most 5)", () => {
    expect(GREETING).toContain(`${STEPS.length} perguntas rápidas`);
    expect(STEPS.length).toBeLessThanOrEqual(5);
  });
});
