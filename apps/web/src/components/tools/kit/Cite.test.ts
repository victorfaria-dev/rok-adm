// @vitest-environment happy-dom
// Q2 P3: "Re-verify" names the stale card ids (visible text and tooltip).
import { mergeCites } from "@rokadm/planner/tools";
import { cleanup, render } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it } from "vitest";
import { Cite } from "./Cite";

afterEach(cleanup);

describe("Cite", () => {
  it("lists the stale card ids next to Reverificar", () => {
    const c = mergeCites(
      { facts: ["A05-0001"], confidence: "high", stale: true },
      { facts: ["A05-0002"], confidence: "medium", stale: false },
      { facts: ["A10-0003"], confidence: "high", stale: true },
    );
    expect(c.staleFacts).toEqual(["A05-0001", "A10-0003"]);
    const { container } = render(h(Cite, { cite: c }));
    const tag = container.querySelector(".t-stale")!;
    expect(tag.textContent).toBe("Reverificar: A05-0001, A10-0003");
    expect(tag.getAttribute("title")).toBe("Confirmado antes do último patch oficial: A05-0001, A10-0003");
  });

  it("no stale card, no badge and no staleFacts key", () => {
    const c = mergeCites({ facts: ["A"], confidence: "low", stale: false });
    expect(c).toEqual({ facts: ["A"], confidence: "low", stale: false });
    const { container } = render(h(Cite, { cite: c }));
    expect(container.querySelector(".t-stale")).toBeNull();
  });
});
