// @vitest-environment happy-dom
import { cleanup, fireEvent, render } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { MASCOT_CLIPS, wantsHd } from "./mascot-clips";
import { SunTzuMascot, clipSrc } from "./SunTzuMascot";

const CLIPS = {
  poster: "/m/poster.webp",
  idle: { sd: "/m/idle-480.mp4", hd: "/m/idle-720.mp4" },
  grumble: { sd: "/m/grumble-480.mp4" },
  greet: { sd: "/m/greet-480.mp4", once: true },
};

function mockMedia(opts: { reduce?: boolean }) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: q.includes("reduce") && !!opts.reduce,
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("Sun Tzu mascot", () => {
  it("with no clips configured, the decorative 2D SVG is shown", () => {
    const { container } = render(h(SunTzuMascot, { state: "idle", stage: true, clips: {} }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("video")).toBeNull();
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  it("the shipped config: idle and talk clips; every other state plays idle", () => {
    expect(clipSrc(MASCOT_CLIPS, "idle", false)).toBe("/mascot/idle-480.mp4");
    expect(clipSrc(MASCOT_CLIPS, "idle", true)).toBe("/mascot/idle-720.mp4");
    expect(clipSrc(MASCOT_CLIPS, "talking", false)).toBe("/mascot/talk-480.mp4");
    expect(clipSrc(MASCOT_CLIPS, "talking", true)).toBe("/mascot/talk-720.mp4");
    // No clip yet: idle plays (the stage shakes for grumble in CSS).
    for (const s of ["grumble", "greet", "approve", "victory"] as const) expect(clipSrc(MASCOT_CLIPS, s, false)).toBe("/mascot/idle-480.mp4");
    expect(clipSrc(MASCOT_CLIPS, undefined, false)).toBeNull();
  });

  it("720 px only when the stage covers more than 480 device px", () => {
    expect(wantsHd(240, 2)).toBe(false);
    expect(wantsHd(241, 2)).toBe(true);
    expect(wantsHd(160, 3)).toBe(false); // phone stage
    expect(wantsHd(240, 1)).toBe(false);
  });

  it("server render and first paint of the stage show only the poster", () => {
    const html = render(h(SunTzuMascot, { state: "idle", stage: true, clips: CLIPS })).container.innerHTML;
    // Effects have not run in the synchronous render: no <video> yet.
    expect(html).toContain("/m/poster.webp");
  });

  it("a small (history) mascot is a still poster and never loads video", async () => {
    mockMedia({});
    const { container } = render(h(SunTzuMascot, { size: 32, clips: CLIPS }));
    await tick();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")!.getAttribute("src")).toBe("/m/poster.webp");
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  it("stage after mount: a muted, inline, looping MP4 for the state, poster and light preload, decorative", async () => {
    mockMedia({});
    const { container, rerender } = render(h(SunTzuMascot, { state: "idle", stage: true, clips: CLIPS }));
    await tick();
    const v = container.querySelector("video")!;
    expect(v.getAttribute("src")).toBe("/m/idle-480.mp4");
    expect(v.getAttribute("poster")).toBe("/m/poster.webp");
    expect(v.muted).toBe(true);
    expect(v.hasAttribute("playsinline")).toBe(true);
    expect(v.hasAttribute("loop")).toBe(true);
    expect(v.hasAttribute("autoplay")).toBe(false); // played by the on-screen observer
    expect(v.getAttribute("preload")).toBe("metadata");
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
    expect(container.firstElementChild!.classList.contains("st-stage")).toBe(true);
    rerender(h(SunTzuMascot, { state: "grumble", stage: true, clips: CLIPS, pulse: 1 }));
    expect(container.querySelector("video")!.getAttribute("src")).toBe("/m/grumble-480.mp4");
    expect(container.firstElementChild!.getAttribute("data-pulse")).toBe("odd");
    expect(container.querySelectorAll("video")).toHaveLength(1);
  });

  it("each clip shows its own first frame as poster", async () => {
    mockMedia({});
    const { container } = render(h(SunTzuMascot, { state: "talking", stage: true, clips: MASCOT_CLIPS }));
    await tick();
    const v = container.querySelector("video")!;
    expect(v.getAttribute("src")).toBe("/mascot/talk-480.mp4");
    expect(v.getAttribute("poster")).toBe("/mascot/talk-poster.webp");
  });

  it("a large stage on a dense screen gets the 720 px clip", async () => {
    mockMedia({});
    vi.stubGlobal("devicePixelRatio", 2);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 600, height: 300, top: 0, left: 0, right: 600, bottom: 300, x: 0, y: 0, toJSON() {} } as DOMRect);
    const { container } = render(h(SunTzuMascot, { state: "idle", stage: true, clips: CLIPS }));
    await tick();
    expect(container.querySelector("video")!.getAttribute("src")).toBe("/m/idle-720.mp4");
  });

  it("a one-shot clip plays once, then idle loops", async () => {
    mockMedia({});
    const { container } = render(h(SunTzuMascot, { state: "greet", stage: true, clips: CLIPS }));
    await tick();
    const v = container.querySelector("video")!;
    expect(v.getAttribute("src")).toBe("/m/greet-480.mp4");
    expect(v.hasAttribute("loop")).toBe(false);
    fireEvent(v, new Event("ended"));
    await tick();
    expect(container.querySelector("video")!.getAttribute("src")).toBe("/m/idle-480.mp4");
    expect(container.querySelector("video")!.hasAttribute("loop")).toBe(true);
  });

  it("under reduced motion: poster only, no video", async () => {
    mockMedia({ reduce: true });
    const { container } = render(h(SunTzuMascot, { state: "idle", stage: true, clips: CLIPS }));
    await tick();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")!.getAttribute("src")).toBe("/m/poster.webp");
  });
});
