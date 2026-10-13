// "View in 3D" for the guide's progress tower (wave VG). The SVG tower is static and always works; this shows
// the button (JS only), loads Three.js on demand (lib/guide-tower-3d.ts, its own lazy chunk) and goes back to
// the SVG with a message when the chunk fails, WebGL is missing or the context is lost. No autorotation under
// prefers-reduced-motion.
import type { Tower3D, TowerFloor } from "./guide-tower-3d";

export const TOWER_FALLBACK = "The 3D view is not available on this device or browser, so you are seeing the flat tower. Everything else still works.";

function enhanceTower(fig: HTMLElement): () => void {
  fig.dataset.enhanced = "";
  const q = <T extends Element>(s: string) => fig.querySelector<T>(s)!;
  const svg = q<SVGSVGElement>("[data-tower-svg]");
  const host = q<HTMLElement>("[data-tower-host]");
  const actions = q<HTMLElement>("[data-tower-actions]");
  const btn = q<HTMLButtonElement>("[data-tower-toggle]");
  const status = q<HTMLElement>("[data-tower-status]");
  const note = q<HTMLElement>("[data-tower-fallback]");
  actions.hidden = false;

  let view: Tower3D | null = null;
  let token = 0;
  let mode: "2d" | "loading" | "3d" = "2d";

  const set2d = (message: string | null) => {
    token++;
    view?.dispose();
    view = null;
    mode = "2d";
    host.hidden = true;
    svg.removeAttribute("hidden");
    svg.style.display = "";
    btn.textContent = "View in 3D";
    btn.disabled = false;
    status.textContent = "";
    note.hidden = message === null;
    note.textContent = message ?? "";
  };

  const open3d = async () => {
    const mine = ++token;
    mode = "loading";
    btn.disabled = true;
    btn.textContent = "Loading 3D…";
    note.hidden = true;
    status.textContent = "Loading the 3D view…";
    try {
      const mod = await import("./guide-tower-3d");
      if (mine !== token) return;
      let floors: TowerFloor[] = [];
      try {
        floors = JSON.parse(fig.dataset.floors ?? "[]") as TowerFloor[];
      } catch {
        floors = [];
      }
      const here = Number(fig.dataset.here ?? "-1");
      const where = here >= floors.length ? "You are past the top floor." : here >= 0 ? `You are on the ${floors[here]?.t} floor.` : "";
      host.hidden = false;
      const v = await mod.mountTower3D(host, {
        floors,
        here,
        autoRotate: !matchMedia("(prefers-reduced-motion: reduce)").matches,
        label: `3D progress tower, ${floors.length} floors from ${floors[0]?.t ?? ""} to ${floors.at(-1)?.t ?? ""}. ${where} Drag or use the arrow keys to turn it.`,
        onLost: () => set2d(TOWER_FALLBACK),
        cancelled: () => mine !== token,
      });
      if (mine !== token) return v.dispose();
      view = v;
      mode = "3d";
      svg.style.display = "none";
      btn.textContent = "Back to 2D";
      btn.disabled = false;
      status.textContent = "3D view ready. Drag the tower or focus it and use the arrow keys.";
    } catch {
      if (mine === token) set2d(TOWER_FALLBACK);
    }
  };

  const onClick = () => {
    if (mode === "3d") {
      set2d(null);
      btn.focus();
    } else if (mode === "2d") void open3d();
  };
  btn.addEventListener("click", onClick);
  return () => {
    btn.removeEventListener("click", onClick);
    set2d(null);
    actions.hidden = true;
    delete fig.dataset.enhanced;
  };
}

/** Enhance every progress tower under `scope` (once each). Returns a cleanup. */
export function enhanceGuideTower(scope: ParentNode = document): () => void {
  const cleanups = [...scope.querySelectorAll<HTMLElement>("[data-tower]:not([data-enhanced])")].map(enhanceTower);
  return () => {
    for (const c of cleanups) c();
  };
}
