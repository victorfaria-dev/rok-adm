// 3D crest view (F-61): the shield extruded with a metal rim, the emblem in relief and the flat crest as the face.
// Loaded only after "View in 3D" (dynamic import), so Three.js never reaches a route's first-visit JS.
import {
  AmbientLight, CanvasTexture, Color, DirectionalLight, ExtrudeGeometry, Group, Mesh, MeshStandardMaterial,
  PerspectiveCamera, Scene, Shape, ShapeGeometry, SRGBColorSpace, WebGLRenderer, type Material,
} from "three";
import { CREST_H, CREST_W, emblemPoints, pngLayout, SHIELDS, type CrestV1, type Point } from "./crest";
import { crestPalette, drawCrest } from "./crest-export";

const UNIT = CREST_W / 2;
const DEPTH = 0.16;
const BEVEL = 0.03;
const RELIEF = 0.05;
const TEX = 1024;
const TILT_MAX = 0.7;

/** Crest coordinates (100 × 120, y down) to scene units (centred, y up, ~2 wide). */
export const toScene = ([x, y]: Point): [number, number] => [(x - CREST_W / 2) / UNIT, -(y - CREST_H / 2) / UNIT];

function shapeOf(points: readonly Point[]): Shape {
  const s = new Shape();
  points.forEach((p, i) => {
    const [x, y] = toScene(p);
    if (i === 0) s.moveTo(x, y);
    else s.lineTo(x, y);
  });
  s.closePath();
  return s;
}

/** True when the browser can create a WebGL context (probe on a throwaway canvas). */
export function hasWebGL(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") ?? c.getContext("webgl"));
  } catch {
    return false;
  }
}

export interface Crest3D {
  canvas: HTMLCanvasElement;
  setAutoRotate(on: boolean): void;
  rotateBy(dy: number, dx: number): void;
  snapshot(): Promise<Blob>;
  dispose(): void;
}

export function mountCrest3D(host: HTMLElement, crest: CrestV1, opts: { autoRotate: boolean; label: string; onLost: () => void }): Crest3D {
  if (!hasWebGL()) throw new Error("WebGL is not available.");
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", opts.label);
  canvas.dataset.crest3d = "";
  host.appendChild(canvas);

  const scene = new Scene();
  const camera = new PerspectiveCamera(35, 1, 0.1, 50);
  camera.position.set(0, 0, 5.4);
  scene.add(new AmbientLight(undefined, 1.1));
  const key = new DirectionalLight(undefined, 2.4);
  key.position.set(2.5, 3, 4);
  scene.add(key);
  const rim = new DirectionalLight(undefined, 1);
  rim.position.set(-3, -1, 2);
  scene.add(rim);

  const pal = crestPalette(crest);
  const owned: Array<{ dispose(): void }> = [];
  const own = <T extends { dispose(): void }>(x: T): T => (owned.push(x), x);

  const group = new Group();
  scene.add(group);

  // Body: extruded shield, alliance colour on the caps, bronze on the sides.
  const shield = shapeOf(SHIELDS[crest.shape]);
  const body = own(new ExtrudeGeometry(shield, { depth: DEPTH, bevelEnabled: true, bevelThickness: BEVEL, bevelSize: BEVEL, bevelSegments: 3, curveSegments: 4 }));
  body.translate(0, 0, -DEPTH / 2);
  const caps = own(new MeshStandardMaterial({ color: new Color(pal.field), metalness: 0.2, roughness: 0.55 }));
  const sides = own(new MeshStandardMaterial({ color: new Color(pal.rim), metalness: 0.75, roughness: 0.3 }));
  group.add(new Mesh(body, [caps, sides] as Material[]));

  // Face: the flat crest drawn on a canvas and mapped onto the shield outline.
  const tex = document.createElement("canvas");
  tex.width = TEX; tex.height = TEX;
  const ctx = tex.getContext("2d");
  if (ctx) drawCrest(ctx, crest, TEX);
  const map = own(new CanvasTexture(tex));
  map.colorSpace = SRGBColorSpace;
  const { scale, x, y } = pngLayout(TEX);
  const k = (UNIT * scale) / TEX;
  map.repeat.set(k, k);
  map.offset.set((x + (CREST_W / 2) * scale) / TEX, 1 - (y + (CREST_H / 2) * scale) / TEX);
  const face = own(new ShapeGeometry(shield, 4));
  const faceMat = own(new MeshStandardMaterial({ map, metalness: 0.15, roughness: 0.6 }));
  const faceMesh = new Mesh(face, faceMat);
  faceMesh.position.z = DEPTH / 2 + BEVEL + 0.002;
  group.add(faceMesh);

  // Emblem in relief.
  const relief = own(new ExtrudeGeometry(shapeOf(emblemPoints(crest.emblem)), { depth: RELIEF, bevelEnabled: true, bevelThickness: 0.012, bevelSize: 0.012, bevelSegments: 2 }));
  const reliefMat = own(new MeshStandardMaterial({ color: new Color(pal.emblem), metalness: 0.6, roughness: 0.3 }));
  const reliefMesh = new Mesh(relief, reliefMat);
  reliefMesh.position.z = faceMesh.position.z;
  group.add(reliefMesh);

  let auto = opts.autoRotate;
  let drag: { x: number; y: number } | null = null;
  let raf = 0;
  let disposed = false;
  const render = () => renderer.render(scene, camera);
  const tick = () => {
    raf = 0;
    if (auto && !drag) group.rotation.y += 0.008;
    render();
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

  // Drag to rotate (mouse or touch); arrow keys when the canvas has focus.
  canvas.style.touchAction = "none";
  const down = (e: PointerEvent) => {
    drag = { x: e.clientX, y: e.clientY };
    try { canvas.setPointerCapture(e.pointerId); } catch { /* unsupported */ }
  };
  const move = (e: PointerEvent) => {
    if (!drag) return;
    rotateBy((e.clientX - drag.x) * 0.012, (e.clientY - drag.y) * 0.012);
    drag = { x: e.clientX, y: e.clientY };
  };
  const up = () => {
    drag = null;
    schedule();
  };
  const keys = (e: KeyboardEvent) => {
    const step = 0.2;
    const d: Record<string, [number, number]> = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    const m = d[e.key];
    if (!m) return;
    e.preventDefault();
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

  // A small resting angle so the relief reads even when nothing moves.
  group.rotation.set(-0.12, 0.45, 0);
  schedule();

  return {
    canvas,
    setAutoRotate(on) {
      auto = on;
      schedule();
    },
    rotateBy,
    snapshot() {
      render();
      return new Promise((resolve, reject) => canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Could not save the 3D view."))), "image/png"));
    },
    dispose() {
      disposed = true;
      if (raf) cancelAnimationFrame(raf);
      ro?.disconnect();
      canvas.removeEventListener("webglcontextlost", lost);
      for (const o of owned) o.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
