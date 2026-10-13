// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MASCOT_CLIPS } from "./mascot-clips";
import { SunTzuMascot } from "./SunTzuMascot";

const CLIPS = { poster: "/m/poster.webp", idle: "/m/idle.mp4", talking: "/m/talk.mp4", grumble: "/m/grumble.mp4" };

function mockReducedMotion(reduce: boolean) {
  vi.stubGlobal("matchMedia", (q: string) => ({ matches: reduce && q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
}

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Sun Tzu mascot slot", () => {
  it("ships with no clips, so the decorative 2D SVG is shown", () => {
    expect(MASCOT_CLIPS.poster).toBeUndefined();
    const { container } = render(h(SunTzuMascot, { state: "idle" }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("video")).toBeNull();
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  it("with clips: a muted inline looping MP4 per state, poster and light preload, decorative", async () => {
    mockReducedMotion(false);
    const { container, rerender } = render(h(SunTzuMascot, { state: "talking", clips: CLIPS }));
    await new Promise((r) => setTimeout(r, 0));
    const v = container.querySelector("video")!;
    expect(v.getAttribute("src")).toBe("/m/talk.mp4");
    expect(v.getAttribute("poster")).toBe("/m/poster.webp");
    expect(v.muted).toBe(true);
    expect(v.hasAttribute("playsinline")).toBe(true);
    expect(v.hasAttribute("loop")).toBe(true);
    expect(["none", "metadata"]).toContain(v.getAttribute("preload"));
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
    rerender(h(SunTzuMascot, { state: "grumble", clips: CLIPS }));
    expect(container.querySelector("video")!.getAttribute("src")).toBe("/m/grumble.mp4");
  });

  it("with clips under reduced motion: poster only, no video", async () => {
    mockReducedMotion(true);
    const { container } = render(h(SunTzuMascot, { state: "idle", clips: CLIPS }));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")!.getAttribute("src")).toBe("/m/poster.webp");
  });
});
