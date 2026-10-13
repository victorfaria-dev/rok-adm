// @vitest-environment happy-dom
import { cleanup, render } from "@testing-library/preact";
import { h } from "preact";
import { afterEach, describe, expect, it, vi } from "vitest";
import { HD_MEDIA, MASCOT_CLIPS } from "./mascot-clips";
import { SunTzuMascot, clipSrc } from "./SunTzuMascot";

const CLIPS = {
  poster: "/m/poster.webp",
  idle: { sd: "/m/idle-480.mp4", hd: "/m/idle-720.mp4" },
  grumble: { sd: "/m/grumble-480.mp4" },
};

function mockMedia(opts: { reduce?: boolean; hd?: boolean }) {
  vi.stubGlobal("matchMedia", (q: string) => ({
    matches: (q.includes("reduce") && !!opts.reduce) || (q === HD_MEDIA && !!opts.hd),
    media: q,
    addEventListener() {},
    removeEventListener() {},
  }));
}

const tick = () => new Promise((r) => setTimeout(r, 0));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("Sun Tzu mascot slot", () => {
  it("with no clips configured, the decorative 2D SVG is shown", () => {
    const { container } = render(h(SunTzuMascot, { state: "idle", clips: {} }));
    expect(container.querySelector("svg")).toBeTruthy();
    expect(container.querySelector("video")).toBeNull();
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
  });

  it("the shipped config uses the idle clip: 480 px by default, 720 px only on dense wide screens", () => {
    expect(clipSrc(MASCOT_CLIPS, "idle", false)).toBe("/mascot/idle-480.mp4");
    expect(clipSrc(MASCOT_CLIPS, "idle", true)).toBe("/mascot/idle-720.mp4");
    // States without their own clip play idle (the card shakes for grumble in CSS).
    expect(clipSrc(MASCOT_CLIPS, "talking", false)).toBe("/mascot/idle-480.mp4");
    expect(clipSrc(MASCOT_CLIPS, "grumble", false)).toBe("/mascot/idle-480.mp4");
    // A still (history) mascot never plays.
    expect(clipSrc(MASCOT_CLIPS, undefined, false)).toBeNull();
  });

  it("server render and first paint show only the poster", () => {
    const html = render(h(SunTzuMascot, { state: "idle", clips: CLIPS })).container.innerHTML;
    // Effects have not run in the synchronous render: no <video> yet.
    expect(html).toContain("/m/poster.webp");
  });

  it("after mount: a muted, inline, looping MP4 for the state, poster and light preload, decorative", async () => {
    mockMedia({});
    const { container, rerender } = render(h(SunTzuMascot, { state: "idle", clips: CLIPS }));
    await tick();
    const v = container.querySelector("video")!;
    expect(v.getAttribute("src")).toBe("/m/idle-480.mp4");
    expect(v.getAttribute("poster")).toBe("/m/poster.webp");
    expect(v.muted).toBe(true);
    expect(v.hasAttribute("playsinline")).toBe(true);
    expect(v.hasAttribute("loop")).toBe(true);
    expect(v.hasAttribute("autoplay")).toBe(false); // played by the on-screen observer
    expect(["none", "metadata"]).toContain(v.getAttribute("preload"));
    expect(container.firstElementChild!.getAttribute("aria-hidden")).toBe("true");
    rerender(h(SunTzuMascot, { state: "grumble", clips: CLIPS, pulse: 1 }));
    expect(container.querySelector("video")!.getAttribute("src")).toBe("/m/grumble-480.mp4");
    expect(container.firstElementChild!.getAttribute("data-pulse")).toBe("odd");
  });

  it("dense wide screens get the 720 px clip", async () => {
    mockMedia({ hd: true });
    const { container } = render(h(SunTzuMascot, { state: "idle", clips: CLIPS }));
    await tick();
    expect(container.querySelector("video")!.getAttribute("src")).toBe("/m/idle-720.mp4");
  });

  it("under reduced motion: poster only, no video", async () => {
    mockMedia({ reduce: true });
    const { container } = render(h(SunTzuMascot, { state: "idle", clips: CLIPS }));
    await tick();
    expect(container.querySelector("video")).toBeNull();
    expect(container.querySelector("img")!.getAttribute("src")).toBe("/m/poster.webp");
  });
});
