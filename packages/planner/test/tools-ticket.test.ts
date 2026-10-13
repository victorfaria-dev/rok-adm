import { describe, expect, it } from "vitest";
import { buildTicket, TICKET_TEMPLATES, ticketTemplate, ticketToText, type TicketKind } from "../src/tools";

describe("ticket templates", () => {
  it("has the three kinds, each asking for governor ID, kingdom, time and what happened", () => {
    expect(TICKET_TEMPLATES.map((t) => t.kind)).toEqual(["recovery", "appeal", "report"]);
    for (const t of TICKET_TEMPLATES) {
      const ids = t.fields.map((f) => f.id);
      for (const need of ["governorId", "kingdom", "when", "what", "screenshots"]) expect(ids).toContain(need);
    }
  });
  it("never asks for a password", () => {
    for (const t of TICKET_TEMPLATES) for (const f of t.fields) expect(`${f.id} ${f.label}`.toLowerCase()).not.toContain("password");
  });
  it("throws for an unknown kind", () => {
    expect(() => ticketTemplate("refund" as TicketKind)).toThrow(RangeError);
  });
});

describe("buildTicket", () => {
  it("puts the typed values into the text and lists screenshots", () => {
    const t = buildTicket("appeal", {
      governorId: "12345678", kingdom: "2708", when: "2026-10-12 18:00 UTC",
      notice: "Your account is muted.", what: "I only posted alliance times.", screenshots: "mute notice\n\n profile page ",
    });
    expect(t.subject).toBe("Appeal of a ban or mute");
    expect(t.missing).toEqual([]);
    expect(t.body).toContain("Your governor ID: 12345678");
    expect(t.body).toContain("Kingdom number: 2708");
    expect(t.body).toContain("Message shown in the game:\nYour account is muted.");
    expect(t.body).toContain("Screenshots attached:\n- mute notice\n- profile page");
    expect(t.body).not.toContain("governor name");
  });
  it("marks missing required fields and leaves out empty optional ones", () => {
    const t = buildTicket("report", { governorId: " " });
    expect(t.missing).toEqual(["Your governor ID", "Kingdom number", "Their governor ID or name", "When you saw it", "What you saw"]);
    expect(t.body).toContain("Your governor ID: [missing]");
    expect(t.body).not.toContain("Screenshots attached");
  });
  it("flattens newlines in one-line fields and normalises CRLF", () => {
    const t = buildTicket("recovery", { governorId: "1\n2", kingdom: "1", when: "x", what: "a\r\nb" });
    expect(t.body).toContain("Your governor ID: 1 2");
    expect(t.body).toContain("What happened:\na\nb");
  });
  it("ticketToText prefixes the subject", () => {
    expect(ticketToText({ subject: "S", body: "B", missing: [] })).toBe("Subject: S\n\nB");
  });
});
