// 3D progress tower of the guide (F-62 v0, wave VG): one floor per phase, a marker on the profile's floor and
// a flag on top (KvK1). Loaded only after "View in 3D" (dynamic import), like the crest (decision I1): same
// pinned Three.js, same step-by-step mount that yields to the main thread, same WebGL failure path.
import {
  AmbientLight, BoxGeometry, Color, CylinderGeometry, DirectionalLight, Group, Mesh, MeshStandardMaterial,
  OctahedronGeometry, PerspectiveCamera, Scene, SRGBColorSpace, WebGLRenderer,
} from "three";
import { gpuIdle, yieldToMain } from "./three-steps";

export interface TowerFloor {
  /** Floor name, e.g. "Days 4–14". */
  t: string;
  /** Steps of the guide on this floor. */
  s: number;
}

export interface Tower3D {
  canvas: HTMLCanvasElement;
  setAutoRotate(on: boolean): void;
  rotateBy(dy: number, dx: number): void;
  dispose(): void;
}

export interface TowerOptions {
  floors: readonly TowerFloor[];
  /** Index of the profile's floor (bottom = 0); floors.length = past the top; -1 = unknown. */
  here: number;
  autoRotate: boolean;
  label: string;
  onLost: () => void;
  cancelled?: () => boolean;
}

const FLOOR_H = 0.42;
const GAP = 0.08;
const BASE = 2.2;
const SHRINK = 0.3;
const TILT_MAX = 0.6;

/** A design token as a Three colour (tokens are the only colour source, as in the CSS). */
function token(el: Element, name: string, fallback: string): Color {
  const v = getComputedStyle(el).getPropertyValue(name).trim();
  try {
    return new Color(v || fallback);
  } catch {
    return new Color(fallback);
  }
}

export async function mountTower3D(host: HTMLElement, opts: TowerOptions): Promise<Tower3D> {
  const stop = () => opts.cancelled?.() === true;
  const owned: Array<{ dispose(): void }> = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);
  const abort = (): never => {
    for (const o of owned) o.dispose();
    throw new Error("cancelled");
  };
  await yieldToMain();
  if (stop()) abort();
  // Throws when the browser cannot create a WebGL context (the caller keeps the SVG and says so).
  const renderer = own(new WebGLRenderer({ antialias: true, alpha: true }));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", opts.label);
  canvas.dataset.tower3d = "";

  const n = opts.floors.length;
  const total = n * (FLOOR_H + GAP);
  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, total * 0.55, 7.2);
  camera.lookAt(0, total * 0.42, 0);
  scene.add(new AmbientLight(undefined, 1.2));
  const key = new DirectionalLight(undefined, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new DirectionalLight(undefined, 0.8);
  rim.position.set(-4, 1, -2);
  scene.add(rim);

  const done = token(host, "--ko-bronze", "peru");
  const ahead = token(host, "--ko-text-muted", "gray");
  const accent = token(host, "--ko-accent", "goldenrod");
  const group = new Group();
  scene.add(group);

  // Floors: a stepped tower, the profile's floor in the accent colour, floors below it in bronze (behind you).
  const mats = {
    done: own(new MeshStandardMaterial({ color: done, metalness: 0.55, roughness: 0.4 })),
    ahead: own(new MeshStandardMaterial({ color: ahead, metalness: 0.2, roughness: 0.7 })),
    here: own(new MeshStandardMaterial({ color: accent, emissive: accent, emissiveIntensity: 0.25, metalness: 0.4, roughness: 0.35 })),
  };
  for (let i = 0; i < n; i++) {
    const w = BASE - i * SHRINK;
    const geo = own(new BoxGeometry(w, FLOOR_H, w));
    const mat = i === opts.here ? mats.here : opts.here >= 0 && i < opts.here ? mats.done : opts.here < 0 ? mats.done : mats.ahead;
    const floor = new Mesh(geo, mat);
    floor.position.y = i * (FLOOR_H + GAP) + FLOOR_H / 2;
    group.add(floor);
  }
  await yieldToMain();
  if (stop()) abort();

  // Flag on the top floor: KvK1 is the goal.
  const pole = new Mesh(own(new CylinderGeometry(0.03, 0.03, 0.9, 8)), mats.done);
  pole.position.y = total + 0.45;
  group.add(pole);
  const flag = new Mesh(own(new BoxGeometry(0.5, 0.28, 0.03)), opts.here >= n ? mats.here : mats.done);
  flag.position.set(0.26, total + 0.76, 0);
  group.add(flag);

  // "You are here": a marker beside the floor (or above the flag when the kingdom is past KvK1).
  let marker: Mesh | null = null;
  if (opts.here >= 0) {
    marker = new Mesh(own(new OctahedronGeometry(0.18)), mats.here);
    const y = opts.here < n ? opts.here * (FLOOR_H + GAP) + FLOOR_H / 2 : total + 1.2;
    const x = opts.here < n ? (BASE - opts.here * SHRINK) / 2 + 0.35 : 0;
    marker.position.set(x, y, opts.here < n ? (BASE - opts.here * SHRINK) / 2 + 0.35 : 0);
    group.add(marker);
  }
  group.rotation.set(0, -0.6, 0);

  await yieldToMain();
  if (stop()) abort();
  try {
    await renderer.compileAsync(scene, camera);
  } catch {
    // older drivers: the first render compiles instead
  }
  await yieldToMain();
  if (stop()) abort();
  renderer.setSize(64, 64, false);
  renderer.render(scene, camera);
  await gpuIdle(renderer.getContext(), stop);
  if (stop()) abort();
  host.appendChild(canvas);

  let auto = opts.autoRotate;
  let drag: { x: number; y: number } | null = null;
  let raf = 0;
  let disposed = false;
  const baseY = marker?.position.y ?? 0;
  const tick = (t: number) => {
    raf = 0;
    if (auto && !drag) {
      group.rotation.y += 0.006;
      // The marker bobs only while the tower turns on its own (never under reduced motion).
      if (marker) marker.position.y = baseY + Math.sin(t / 400) * 0.05;
    }
    renderer.render(scene, camera);
    if (auto) schedule();
  };
  const schedule = () => {
    if (!raf && !disposed) raf = requestAnimationFrame(tick);
  };
  const resize = () => {
    const w = Math.max(host.clientWidth, 1);
    renderer.setSize(w, w, true);
    camera.aspect = 1;
    camera.updateProjectionMatrix();
    schedule();
  };
  const ro = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(resize);
  ro?.observe(host);
  resize();

  const rotateBy = (dy: number, dx: number) => {
    group.rotation.y += dy;
    group.rotation.x = Math.min(Math.max(group.rotation.x + dx, -TILT_MAX), TILT_MAX);
    schedule();
  };
  canvas.style.touchAction = "none";
  const down = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY };
    auto = false;
    try { canvas.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    rotateBy((e.clientX - drag.x) * 0.012, (e.clientY - drag.y) * 0.006);
    drag = { x: e.clientX, y: e.clientY };
  };
  const up = () => {
    drag = null;
    schedule();
  };
  const keys = (e: KeyboardEvent) => {
    const d: Record<string, [number, number]> = { ArrowLeft: [-0.2, 0], ArrowRight: [0.2, 0], ArrowUp: [0, -0.1], ArrowDown: [0, 0.1] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
    auto = false;
    rotateBy(m[0], m[1]);
  };
  const lost = (e: Event) => {
    e.preventDefault();
    opts.onLost();
  };
  canvas.addEventListener("pointerdown", down);
  canvas.addEventListener("pointermove", move);
  canvas.addEventListener("pointerup", up);
  canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("keydown", keys);
  canvas.addEventListener("webglcontextlost", lost);
  schedule();

  return {
    canvas,
    setAutoRotate(on) {
      auto = on;
      schedule();
    },
    rotateBy,
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      for (const o of owned) o.dispose();
      canvas.remove();
    },
  };
}
