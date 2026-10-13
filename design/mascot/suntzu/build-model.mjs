// Sun Tzu — mascote-guia do KingdomOps.
// Gerador procedural (three.js) do modelo 3D estilizado + renderizações de referência.
//
// Uso (Node 20+):
//   THREE_DIR=/caminho/para/node_modules/three node design/mascot/suntzu/build-model.mjs
//   (opcional) PLAYWRIGHT_MODULE=/caminho/para/@playwright/test  CHROMIUM_PATH=/opt/pw-browsers/chromium
//   flags: --no-render  (gera só o suntzu.glb)
//
// O arquivo tem duas metades:
//  1. Funções "de navegador" exportadas (buildSunTzu, renderSheets). Recebem THREE e addons
//     por parâmetro, então este módulo não importa nada no topo e roda igual no Chromium.
//  2. main() para Node: abre um Chromium headless (Playwright), serve three.js + este
//     diretório por interceptação de rotas, constrói o modelo no navegador (canvas para as
//     texturas, GLTFExporter para o .glb) e grava os arquivos aqui.
//
// Convenções: origem nos pés, +Y para cima, olhando para +Z, altura ≈ 1.0.
// "Direita dele" = -X (lado esquerdo da tela na vista frontal).

/* ------------------------------------------------------------------ */
/* Paleta (amostrada da folha de referência e ajustada para albedo)    */
/* ------------------------------------------------------------------ */
export const PALETTE = {
  skin: 0xe8a374,
  skinShade: 0xd98a66,
  lip: 0xb06a55,
  robe: 0x7a4a2c,
  robeDark: 0x5e3a22,
  gold: 0xc08a3e,
  belt: 0x4a2e1c,
  apron: 0xc9965c,
  skirt: 0x3f4b3a,
  skirtDark: 0x2c372b,
  trousers: 0x2f3b30,
  boots: 0x2a332b,
  beard: 0xd6d3ce,
  brow: 0xcfcac3,
  hair: 0x77716b,
  band: 0x2f4a36,
  scabbard: 0x2b332c,
  grip: 0x2a2724,
  scroll: 0xd9bf95,
  scrollEnd: 0x6a4428,
  sclera: 0xf3ece4,
  iris: 0x6a3a1c,
  pupil: 0x1c1410,
};

/* ------------------------------------------------------------------ */
/* Utilidades numéricas                                                */
/* ------------------------------------------------------------------ */
const smoothstep = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};
const gauss = (u, v, cu, cv, su, sv) =>
  Math.exp(-(((u - cu) ** 2) / (2 * su * su) + ((v - cv) ** 2) / (2 * sv * sv)));
function segDist(px, py, ax, ay, bx, by) {
  const dx = bx - ax, dy = by - ay;
  const t = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - ax - t * dx, py - ay - t * dy);
}
// pseudo-aleatório determinístico
function rng(seed) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

/* ------------------------------------------------------------------ */
/* Texturas procedurais (canvas; só no navegador)                      */
/* ------------------------------------------------------------------ */
function makeTextures(THREE) {
  const mk = (w, h, draw) => {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.anisotropy = 4;
    return t;
  };
  const hex = (n) => '#' + n.toString(16).padStart(6, '0');

  // Saia: xadrez verde escuro (quadrados alternados + fios)
  const check = mk(64, 64, (g, w, h) => {
    g.fillStyle = hex(PALETTE.skirt); g.fillRect(0, 0, w, h);
    g.fillStyle = hex(PALETTE.skirtDark);
    g.fillRect(0, 0, 32, 32); g.fillRect(32, 32, 32, 32);
    g.strokeStyle = 'rgba(20,28,20,0.55)'; g.lineWidth = 2;
    for (const p of [1, 31, 33, 63]) {
      g.beginPath(); g.moveTo(p, 0); g.lineTo(p, h); g.stroke();
      g.beginPath(); g.moveTo(0, p); g.lineTo(w, p); g.stroke();
    }
    g.fillStyle = 'rgba(90,110,85,0.35)';
    g.fillRect(12, 12, 8, 8); g.fillRect(44, 44, 8, 8);
  });

  // Glifos originais (não são caracteres reais): blocos tipo selo gravado
  const glyphs = (g, x, y, w, h, r, ink) => {
    g.strokeStyle = ink; g.lineWidth = Math.max(1.5, w * 0.06); g.lineCap = 'square';
    const cols = 3, rows = 3;
    for (let k = 0; k < 5; k++) {
      const a = Math.floor(r() * cols), b = Math.floor(r() * rows);
      const x0 = x + (a / cols) * w, y0 = y + (b / rows) * h;
      g.beginPath();
      if (r() < 0.5) { g.moveTo(x0, y0 + h / rows / 2); g.lineTo(x0 + w / cols, y0 + h / rows / 2); }
      else { g.moveTo(x0 + w / cols / 2, y0); g.lineTo(x0 + w / cols / 2, y0 + h / rows); }
      g.stroke();
    }
    g.strokeRect(x, y, w, h);
  };
  const apron = mk(128, 256, (g, w, h) => {
    g.fillStyle = hex(PALETTE.apron); g.fillRect(0, 0, w, h);
    const r = rng(7);
    for (let p = 0; p < 2; p++) {
      const px = 6 + p * 61, pw = 55;
      g.strokeStyle = '#7a4f28'; g.lineWidth = 3; g.strokeRect(px, 6, pw, h - 12);
      g.fillStyle = 'rgba(120,70,30,0.12)'; g.fillRect(px + 3, 9, pw - 6, h - 18);
      for (let k = 0; k < 4; k++) glyphs(g, px + 11, 18 + k * 58, pw - 22, 44, r, '#6b4220');
    }
    g.fillStyle = 'rgba(255,230,180,0.25)'; g.fillRect(0, 0, w, 4);
  });
  const scroll = mk(128, 64, (g, w, h) => {
    g.fillStyle = hex(PALETTE.scroll); g.fillRect(0, 0, w, h);
    const r = rng(19);
    for (let k = 0; k < 6; k++) glyphs(g, 6 + k * 20, 14, 14, 36, r, '#7a5532');
    g.fillStyle = hex(PALETTE.scrollEnd); g.fillRect(0, 0, w, 5); g.fillRect(0, h - 5, w, 5);
  });
  return { check, apron, scroll };
}

/* ------------------------------------------------------------------ */
/* Construção do modelo                                                */
/* ------------------------------------------------------------------ */
export function buildSunTzu(THREE, { mergeGeometries }) {
  const V3 = THREE.Vector3;
  const tex = typeof document !== 'undefined' ? makeTextures(THREE) : {};

  /* ---------- materiais ---------- */
  const M = {};
  const mat = (name, color, o = {}) =>
    (M[name] = new THREE.MeshStandardMaterial({
      name, color, roughness: o.r ?? 0.85, metalness: o.m ?? 0,
      side: o.side ?? THREE.FrontSide, map: o.map ?? null,
    }));
  mat('skin', PALETTE.skin, { r: 0.72 });
  mat('lip', PALETTE.lip, { r: 0.7 });
  mat('robe', PALETTE.robe, { r: 0.88, side: THREE.DoubleSide });
  mat('gold', PALETTE.gold, { r: 0.6, m: 0.25 });
  mat('belt', PALETTE.belt, { r: 0.8 });
  mat('apron', 0xffffff, { r: 0.85, map: tex.apron ?? null });
  mat('skirt', 0xffffff, { r: 0.9, map: tex.check ?? null, side: THREE.DoubleSide });
  mat('trousers', PALETTE.trousers, { r: 0.9 });
  mat('boots', PALETTE.boots, { r: 0.75 });
  mat('beard', PALETTE.beard, { r: 0.9 });
  mat('brow', PALETTE.brow, { r: 0.9 });
  mat('hair', PALETTE.hair, { r: 0.85 });
  mat('band', PALETTE.band, { r: 0.8 });
  mat('scabbard', PALETTE.scabbard, { r: 0.65 });
  mat('grip', PALETTE.grip, { r: 0.8 });
  mat('scroll', 0xffffff, { r: 0.85, map: tex.scroll ?? null });
  mat('scrollEnd', PALETTE.scrollEnd, { r: 0.8 });
  mat('sclera', PALETTE.sclera, { r: 0.6 });
  mat('iris', PALETTE.iris, { r: 0.6 });
  mat('pupil', PALETTE.pupil, { r: 0.6 });

  /* ---------- helpers de geometria ---------- */
  // Grade paramétrica genérica: fn(s, t, i, j) -> Vector3. keep(i,j) filtra quads.
  function grid(nu, nv, fn, { keep, uvScale = [1, 1] } = {}) {
    const pos = [], uv = [], idx = [];
    for (let j = 0; j <= nv; j++)
      for (let i = 0; i <= nu; i++) {
        const p = fn(i / nu, j / nv, i, j);
        pos.push(p.x, p.y, p.z);
        uv.push((i / nu) * uvScale[0], (1 - j / nv) * uvScale[1]);
      }
    const w = nu + 1;
    for (let j = 0; j < nv; j++)
      for (let i = 0; i < nu; i++) {
        if (keep && !keep(i, j)) continue;
        const a = j * w + i, b = a + 1, c = a + w, d = c + 1;
        idx.push(a, c, b, b, c, d);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    g.setIndex(idx);
    return compact(g);
  }
  // remove vértices não referenciados (após filtrar quads)
  function compact(g) {
    const idx = g.index.array, n = g.attributes.position.count;
    const used = new Int32Array(n).fill(-1);
    let k = 0;
    for (const v of idx) if (used[v] < 0) used[v] = k++;
    if (k === n) return g;
    const out = new THREE.BufferGeometry();
    for (const name of Object.keys(g.attributes)) {
      const a = g.attributes[name], arr = new Float32Array(k * a.itemSize);
      for (let v = 0; v < n; v++) if (used[v] >= 0)
        for (let c = 0; c < a.itemSize; c++) arr[used[v] * a.itemSize + c] = a.array[v * a.itemSize + c];
      out.setAttribute(name, new THREE.BufferAttribute(arr, a.itemSize));
    }
    out.setIndex(Array.from(idx, (v) => used[v]));
    return out;
  }
  // normais suaves soldando vértices coincidentes (costuras/polos)
  function smoothNormals(g) {
    g.computeVertexNormals();
    const p = g.attributes.position, nrm = g.attributes.normal, map = new Map();
    for (let v = 0; v < p.count; v++) {
      const key = `${Math.round(p.getX(v) * 1e5)}_${Math.round(p.getY(v) * 1e5)}_${Math.round(p.getZ(v) * 1e5)}`;
      let e = map.get(key);
      if (!e) map.set(key, (e = { n: new V3(), vs: [] }));
      e.n.x += nrm.getX(v); e.n.y += nrm.getY(v); e.n.z += nrm.getZ(v); e.vs.push(v);
    }
    for (const e of map.values()) {
      if (e.vs.length < 2) continue;
      e.n.normalize();
      for (const v of e.vs) nrm.setXYZ(v, e.n.x, e.n.y, e.n.z);
    }
    return g;
  }
  // Torno com abertura frontal variável: profile [[r,y],...]; gap(y) = meio-ângulo da abertura
  function lathe(profile, segs, { zScale = 1, gap = () => 0, xShift = 0, uvScale } = {}) {
    return smoothNormals(grid(segs, profile.length - 1, (s, t, i, j) => {
      const [r, y] = profile[j];
      const g = gap(y);
      const phi = g + s * (Math.PI * 2 - 2 * g);
      return new V3(Math.sin(phi) * r + xShift, y, Math.cos(phi) * r * zScale);
    }, { uvScale }));
  }
  // Varredura (tubo de seção elíptica variável) ao longo de uma curva
  function sweep(curve, n, m, radius, { hint = new V3(0, 0, 1), deform, closeEnds = false } = {}) {
    const P = new V3(), T = new V3(), S = new V3(), U = new V3();
    const g = grid(m, n, (s, t) => {
      curve.getPointAt(t, P); curve.getTangentAt(t, T);
      S.crossVectors(T, hint).normalize(); U.crossVectors(S, T).normalize();
      const [ra, rb] = radius(t);
      const a = s * Math.PI * 2;
      const q = P.clone().addScaledVector(S, Math.cos(a) * ra).addScaledVector(U, Math.sin(a) * rb);
      return deform ? deform(q, t, a, P) : q;
    });
    return smoothNormals(g);
  }
  const ellipsoid = (rx, ry, rz, w = 16, h = 12) => {
    const g = new THREE.SphereGeometry(1, w, h);
    g.scale(rx, ry, rz);
    return g;
  };
  const xf = (g, { p = [0, 0, 0], r = [0, 0, 0], s = [1, 1, 1] } = {}) => {
    const m = new THREE.Matrix4().compose(
      new V3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new V3(...s));
    g.applyMatrix4(m);
    return g;
  };
  // normaliza atributos e funde
  function merge(geoms, keepUV = false) {
    const list = geoms.map((g) => {
      let h = g.index ? g : (() => { const t = g; t.setIndex([...Array(t.attributes.position.count).keys()]); return t; })();
      for (const k of Object.keys(h.attributes)) if (k !== 'position' && k !== 'normal' && !(keepUV && k === 'uv')) h.deleteAttribute(k);
      if (!h.attributes.normal) h.computeVertexNormals();
      return h;
    });
    return list.length === 1 ? list[0] : mergeGeometries(list, false);
  }
  const mesh = (name, geoms, material, keepUV = false) => {
    const m = new THREE.Mesh(merge([].concat(geoms), keepUV), material);
    m.name = name;
    return m;
  };
  const group = (name, parent, p = [0, 0, 0]) => {
    const g = new THREE.Group();
    g.name = name; g.position.set(...p);
    if (parent) parent.add(g);
    return g;
  };
  // caixa orientada entre dois pontos 2D (para o meandro)
  function meander(size, thick, depth) {
    const pts = [[0, 0], [0, 1], [1, 1], [1, 0], [0.32, 0], [0.32, 0.66], [0.68, 0.66], [0.68, 0.36]];
    const out = [];
    for (let k = 0; k < pts.length - 1; k++) {
      const [x0, y0] = pts[k], [x1, y1] = pts[k + 1];
      const len = Math.hypot(x1 - x0, y1 - y0) * size + thick;
      const horiz = Math.abs(y1 - y0) < 1e-6;
      const b = new THREE.BoxGeometry(horiz ? len : thick, horiz ? thick : len, depth);
      b.translate(((x0 + x1) / 2) * size, ((y0 + y1) / 2) * size, 0);
      out.push(b);
    }
    return out;
  }

  /* ================================================================ */
  /* Hierarquia                                                        */
  /* ================================================================ */
  const root = group('root');
  const body = group('body', root);
  const legs = group('legs', root);

  /* ---------- CABEÇA ---------- */
  const NECK_Y = 0.5;
  const head = group('head', body, [0, NECK_Y, 0.022]);
  const HC = new V3(0, 0.198, 0.0); // centro do crânio relativo ao pivô do pescoço
  const RX = 0.128, RY = 0.168, RZ = 0.13;

  const skull = (d) => {
    let x = d.x * RX, y = d.y * RY, z = d.z * RZ;
    if (d.y < 0) x *= 1 - 0.1 * d.y * d.y;      // mandíbula um pouco mais estreita
    if (d.y > 0.5) y *= 1 - 0.08 * (d.y - 0.5);   // topo um pouco achatado
    if (d.z < 0) z *= 0.96;
    return new V3(x, y, z);
  };
  const skullNormal = (d) => new V3(d.x / RX, d.y / RY, d.z / RZ).normalize();

  // Escultura do rosto: deslocamento ao longo da normal, em coordenadas (u,v) = (d.x, d.y)
  function faceDisp(u, v, dz) {
    const f = smoothstep(0.05, 0.45, dz);
    if (f <= 0) return 0;
    const au = Math.abs(u);
    let D = 0;
    // arco superciliar pesado, em "V" (ponta interna baixa = carranca)
    const vb = 0.16 + 0.22 * Math.min(au, 0.65);
    D += 0.016 * Math.exp(-((v - vb) ** 2) / (2 * 0.06 ** 2)) * smoothstep(0.88, 0.55, au);
    D += 0.008 * gauss(u, v, 0, 0.17, 0.07, 0.06);              // glabela franzida
    D -= 0.007 * gauss(au, v, 0.085, 0.27, 0.025, 0.08);       // sulcos verticais de raiva
    D -= 0.024 * gauss(au, v, 0.40, 0.10, 0.15, 0.10);          // órbitas fundas
    D += 0.006 * gauss(au, v, 0.40, -0.06, 0.13, 0.035);       // bolsas sob os olhos
    D += 0.012 * gauss(au, v, 0.57, -0.10, 0.16, 0.12);         // maçãs do rosto largas
    D += 0.016 * gauss(u, v, 0, 0.0, 0.065, 0.14);              // dorso do nariz
    const dist = segDist(au, v, 0.17, -0.16, 0.37, -0.64);      // sulco nasolabial
    D -= 0.012 * Math.exp(-(dist * dist) / (2 * 0.03 ** 2));
    D += 0.009 * gauss(au, v, 0.39, -0.30, 0.09, 0.12);         // bochecha sobre o sulco
    const vm = -0.56 - 0.7 * u * u;                              // boca virada para baixo
    D -= 0.007 * Math.exp(-((v - vm) ** 2) / (2 * 0.022 ** 2)) * smoothstep(0.34, 0.2, au);
    D += 0.005 * gauss(u, v, 0, -0.66, 0.14, 0.05);             // lábio inferior emburrado
    D += 0.008 * gauss(u, v, 0, -0.88, 0.2, 0.1);               // queixo
    D -= 0.006 * gauss(au, v, 0.82, 0.32, 0.1, 0.12);           // têmporas
    const vw = v - 0.05 * u * u;                                 // rugas da testa
    if (vw > 0.44 && vw < 0.86)
      D += 0.005 * Math.sin(((vw - 0.44) / 0.14) * Math.PI * 2) * Math.sin(((vw - 0.44) / 0.42) * Math.PI) * smoothstep(0.75, 0.3, au);
    return D * f;
  }
  const headPoint = (d) => skull(d).addScaledVector(skullNormal(d), faceDisp(d.x, d.y, d.z)).add(HC);
  const dirUV = (u, v) => new V3(u, v, Math.sqrt(Math.max(0, 1 - u * u - v * v)));

  // grade da cabeça: mais densa na frente (φ≈0) e na faixa do rosto (θ≈90°)
  const headDir = (s, t) => {
    const a = 2 * s - 1;
    const phi = Math.PI * a * (0.45 + 0.55 * a * a);
    const th = Math.PI * (t + (0.42 * Math.sin(2 * Math.PI * t)) / (2 * Math.PI));
    return new V3(Math.sin(th) * Math.sin(phi), Math.cos(th), Math.sin(th) * Math.cos(phi));
  };
  const hairLimit = (d) => 0.3 - 0.42 * Math.max(0, d.y); // linha do cabelo (entradas)
  const lower = (d) => -0.2 - 0.8 * Math.max(0, -d.z - 0.15);
  const hairCover = (d) => Math.min(hairLimit(d) - d.z, d.y - lower(d));
  // couro cabeludo totalmente coberto pelo cabelo não precisa de triângulos
  const faceGeo = smoothNormals(grid(58, 54, (s, t) => headPoint(headDir(s, t)), {
    keep: (i, j) => hairCover(headDir((i + 0.5) / 58, (j + 0.5) / 54)) < 0.16,
  }));
  const face = mesh('face', faceGeo, M.skin);
  head.add(face);

  // nariz forte e carnudo
  {
    const top = headPoint(dirUV(0, 0.1)), tipBase = headPoint(dirUV(0, -0.19));
    const nTip = skullNormal(dirUV(0, -0.19));
    const tip = tipBase.clone().addScaledVector(nTip, 0.017);
    const curve = new THREE.CatmullRomCurve3([
      top.clone().addScaledVector(new V3(0, 0, -1), 0.004),
      top.clone().lerp(tip, 0.5).add(new V3(0, 0, 0.004)),
      tip,
    ]);
    const bridge = sweep(curve, 10, 14, (t) => [0.0095 + 0.01 * t * t, 0.007 + 0.008 * t]);
    const tipS = xf(ellipsoid(0.019, 0.017, 0.017, 12, 9), { p: tip.toArray() });
    const parts = [bridge, tipS];
    for (const s of [-1, 1]) {
      const al = headPoint(dirUV(s * 0.15, -0.22)).addScaledVector(nTip, 0.007);
      parts.push(xf(ellipsoid(0.011, 0.0095, 0.011, 10, 7), { p: al.toArray() }));
    }
    head.add(mesh('nose', parts, M.skin));
  }

  // orelhas grandes
  for (const s of [-1, 1]) {
    const g = new THREE.SphereGeometry(1, 14, 12);
    const p = g.attributes.position;
    for (let v = 0; v < p.count; v++) {
      const x = p.getX(v), y = p.getY(v), z = p.getZ(v);
      if (x > 0) p.setX(v, x - 0.55 * Math.exp(-(y * y * 1.6 + z * z * 2.2) / 0.5) * x); // concha
    }
    g.scale(0.026, 0.068, 0.044);
    g.computeVertexNormals();
    const pos = headPoint(new V3(s, -0.05, -0.06).normalize()).add(new V3(s * 0.012, 0, -0.004));
    xf(g, { r: [0, s > 0 ? 0.35 : Math.PI - 0.35, s * 0.12] });
    g.translate(pos.x, pos.y, pos.z);
    head.add(mesh(s > 0 ? 'ear_L' : 'ear_R', g, M.skin));
  }

  // olhos fundos, olhando de lado (para a esquerda dele, +X), pálpebras pesadas
  const EYE_R = 0.0172;
  for (const s of [-1, 1]) {
    const d = dirUV(s * 0.4, 0.105);
    const n = skullNormal(d);
    const c = headPoint(d).addScaledVector(n, -0.0075);
    const eye = group(s > 0 ? 'eyes_L' : 'eyes_R', head, c.toArray());
    const ball = mesh('eyeball', new THREE.SphereGeometry(EYE_R, 12, 8), M.sclera);
    eye.add(ball);
    const look = new V3(0.32, -0.06, 1).normalize();
    const irisG = new THREE.SphereGeometry(1, 14, 5); irisG.scale(0.0098, 0.0098, 0.0035);
    irisG.lookAt(look); irisG.translate(...look.clone().multiplyScalar(EYE_R - 0.001).toArray());
    eye.add(mesh('iris', irisG, M.iris));
    const pupG = new THREE.SphereGeometry(1, 10, 4); pupG.scale(0.0048, 0.0048, 0.0028);
    pupG.lookAt(look); pupG.translate(...look.clone().multiplyScalar(EYE_R + 0.0012).toArray());
    eye.add(mesh('pupil', pupG, M.pupil));
    // pálpebra superior: calota que cobre o terço de cima, inclinada (canto interno mais baixo)
    const lid = new THREE.SphereGeometry(EYE_R * 1.14, 14, 6, 0, Math.PI * 2, 0, 1.0);
    xf(lid, { r: [0.5, 0, s * 0.36] });
    const low = new THREE.SphereGeometry(EYE_R * 1.1, 14, 4, 0, Math.PI * 2, Math.PI - 1.0, 1.0);
    xf(low, { r: [-0.35, 0, -s * 0.1] });
    eye.add(mesh('lids', [lid, low], M.skin));
  }

  // sobrancelhas grossas e cerradas (alvo de morph "scowl")
  for (const s of [-1, 1]) {
    const pts = [
      [0.06, 0.17, 0.007], [0.2, 0.23, 0.008], [0.38, 0.31, 0.008], [0.56, 0.35, 0.006], [0.73, 0.32, 0.003],
    ].map(([u, v, out]) => { const d = dirUV(s * u, v); return headPoint(d).addScaledVector(skullNormal(d), out); });
    const curve = new THREE.CatmullRomCurve3(pts);
    const r = rng(s > 0 ? 3 : 5);
    const noise = Array.from({ length: 300 }, () => r());
    let k = 0;
    const g = sweep(curve, 14, 10, (t) => {
      const prof = Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.95)) ** 0.6;
      return [0.004 + 0.0115 * prof, 0.0035 + 0.0065 * prof];
    }, {
      hint: new V3(0, 0, 1),
      deform: (q, t, a, P) => q.addScaledVector(q.clone().sub(P), (noise[k++ % noise.length] - 0.5) * 0.35),
    });
    // morph "scowl": ponta interna desce e avança, ponta externa sobe um pouco
    const p = g.attributes.position, target = new Float32Array(p.count * 3);
    const inner = pts[0];
    for (let v = 0; v < p.count; v++) {
      const dx = Math.abs(p.getX(v) - inner.x);
      const w = Math.exp(-dx / 0.03);
      target[v * 3 + 0] = -s * 0.004 * w;
      target[v * 3 + 1] = -0.009 * w + 0.003 * (1 - w);
      target[v * 3 + 2] = 0.004 * w;
    }
    g.morphAttributes.position = [new THREE.Float32BufferAttribute(target, 3)];
    g.morphTargetsRelative = true;
    const br = new THREE.Mesh(g, M.brow);
    for (const kk of ['uv']) g.deleteAttribute(kk);
    br.name = s > 0 ? 'brows_L' : 'brows_R';
    br.morphTargetDictionary = { scowl: 0 };
    br.morphTargetInfluences = [0];
    head.add(br);
  }

  // cabelo: casca com polo apontado para o coque -> linhas penteadas para trás
  {
    const B = new V3(0, 0.62, -0.78).normalize();
    const e1 = new V3(1, 0, 0), e2 = new V3().crossVectors(B, e1).normalize();
    const dirAt = (s, t) => {
      const th = t * Math.PI * 0.98, ph = s * Math.PI * 2;
      return B.clone().multiplyScalar(Math.cos(th))
        .addScaledVector(e1, Math.sin(th) * Math.cos(ph)).addScaledVector(e2, Math.sin(th) * Math.sin(ph));
    };
    const NU = 64, NV = 20;
    const g = smoothNormals(grid(NU, NV, (s, t) => {
      const d = dirAt(s, t);
      const m = Math.min(hairLimit(d) - d.z, d.y - lower(d));
      const ridge = 0.008 * Math.abs(Math.sin(s * Math.PI * 16)) * smoothstep(0.02, 0.4, t);
      const off = m < 0 ? 0.004 + Math.max(m, -0.08) * 0.3 : (0.004 + 0.012 * smoothstep(0, 0.12, m)) + ridge * smoothstep(0, 0.1, m);
      return skull(d).addScaledVector(skullNormal(d), off).add(HC);
    }, {
      keep: (i, j) => {
        const d = dirAt((i + 0.5) / NU, (j + 0.5) / NV);
        return Math.min(hairLimit(d) - d.z, d.y - lower(d)) > -0.12;
      },
    }));
    const hair = mesh('hair', g, M.hair);
    head.add(hair);

    // coque alto + faixa verde + grampo dourado com meandro
    const top = skull(new V3(0, 0.93, -0.36).normalize()).add(HC);
    const bun = group('hair_bun', head, top.toArray());
    const bunG = new THREE.SphereGeometry(1, 20, 10);
    const bp = bunG.attributes.position;
    for (let v = 0; v < bp.count; v++) {
      const x = bp.getX(v), y = bp.getY(v), z = bp.getZ(v);
      const k = 1 + 0.07 * Math.abs(Math.sin(Math.atan2(z, x) * 6)) * (1 - Math.abs(y));
      bp.setXYZ(v, x * k, y, z * k);
    }
    bunG.scale(0.055, 0.05, 0.055); bunG.translate(0, 0.075, 0);
    const knot = ellipsoid(0.028, 0.022, 0.028, 12, 6); knot.translate(0, 0.122, 0);
    const neck = new THREE.CylinderGeometry(0.036, 0.05, 0.045, 18, 1, true); neck.translate(0, 0.015, 0);
    bun.add(mesh('bun', [bunG, knot, neck], M.hair));
    const band = new THREE.TorusGeometry(0.039, 0.011, 6, 20); band.rotateX(Math.PI / 2); band.translate(0, 0.036, 0);
    bun.add(mesh('hair_band', band, M.band));
    const pin = group('hairpin', bun, [0, 0.075, 0]);
    const rod = new THREE.BoxGeometry(0.22, 0.014, 0.014); rod.translate(-0.03, 0, 0);
    const cap = new THREE.BoxGeometry(0.016, 0.02, 0.016); cap.translate(-0.14, 0, 0);
    const key = meander(0.08, 0.015, 0.013).map((b) => b.translate(0.075, -0.007, 0));
    const pinMesh = mesh('hairpin_gold', [rod, cap, ...key], M.gold);
    pin.add(pinMesh);
    pin.rotation.y = -0.55;
  }

  // barba longa e pontuda; o topo elíptico abraça a mandíbula
  const beard = group('beard', head, [0, HC.y - 0.12, 0.04]); // pivô no queixo
  {
    const o = new V3(0, HC.y - 0.12, 0.04);
    const curve = new THREE.CatmullRomCurve3([
      new V3(0, HC.y - 0.132, 0.008), new V3(0, HC.y - 0.215, 0.064), new V3(0, HC.y - 0.285, 0.1), new V3(0, HC.y - 0.355, 0.112),
    ].map((p) => p.sub(o)));
    const g = sweep(curve, 18, 30, (t) => [0.096 * (1 - t * t) * (1 + 0.05 * Math.sin(t * Math.PI)) + 0.0005, 0.098 * Math.pow(1 - t, 1.7) + 0.0005], {
      hint: new V3(1, 0, 0),
      deform: (q, t, a, P) => {
        // seção: a=0 lateral; laterais sobem até perto das orelhas (costeletas)
        const side = Math.abs(Math.cos(a));
        const front = Math.max(0, Math.sin(a));
        q.y -= (q.y - P.y) * 0.95 * Math.pow(1 - t, 3); // topo plano: a boca fica à mostra
        q.y += 0.065 * Math.pow(side, 1.5) * Math.pow(1 - t, 3);
        // mechas
        const d = q.clone().sub(P);
        d.multiplyScalar(1 + 0.07 * Math.abs(Math.sin(a * 11 + t * 2)) * (0.3 + front));
        return P.clone().add(d);
      },
    });
    beard.add(mesh('beard_mesh', g, M.beard));

    // lábio inferior emburrado (aparece entre bigode e barba)
    {
      const d = dirUV(0, -0.62);
      const lp = headPoint(d).addScaledVector(skullNormal(d), 0.004);
      const lg = ellipsoid(0.021, 0.0075, 0.011, 12, 6);
      const lpa = lg.attributes.position;
      for (let v = 0; v < lpa.count; v++) { const x = lpa.getX(v); lpa.setY(v, lpa.getY(v) - 11 * x * x); }
      lg.computeVertexNormals();
      lg.translate(lp.x, lp.y, lp.z);
      head.add(mesh('mouth', lg, M.lip));
    }
    // bigode farto caindo para os lados
    const must = group('moustache', head, [0, HC.y - 0.07, 0.124]);
    const parts = [];
    for (const s of [-1, 1]) {
      const c = new THREE.CatmullRomCurve3([
        new V3(s * 0.002, 0.004, 0.006), new V3(s * 0.03, -0.004, 0.0), new V3(s * 0.058, -0.03, -0.022), new V3(s * 0.07, -0.07, -0.04),
      ]);
      parts.push(sweep(c, 12, 12, (t) => {
        const w = Math.sin(Math.PI * Math.min(1, 0.22 + 0.8 * t)) ** 0.7;
        return [0.003 + 0.016 * w, 0.003 + 0.011 * w];
      }, {
        hint: new V3(0, 0, 1),
        deform: (q, t, a, P) => P.clone().add(q.clone().sub(P).multiplyScalar(1 + 0.08 * Math.abs(Math.sin(a * 5 + t * 6)))),
      }));
    }
    must.add(mesh('moustache_mesh', parts, M.beard));
  }

  /* ---------- CORPO ---------- */
  const Z = 0.8; // achatamento frente-trás do tronco
  const torsoR = (y) => {
    // raio externo do manto superior em função de y (para encaixar alças)
    const prof = [[0.05, 0.505], [0.085, 0.49], [0.118, 0.465], [0.132, 0.43], [0.133, 0.38], [0.126, 0.34], [0.124, 0.31]];
    for (let k = 0; k < prof.length - 1; k++) {
      const [r0, y0] = prof[k], [r1, y1] = prof[k + 1];
      if (y <= y0 && y >= y1) return r0 + ((y0 - y) / (y0 - y1)) * (r1 - r0);
    }
    return 0.124;
  };
  const robe = group('robe', body);
  {
    const upper = lathe([[0.0, 0.512], [0.05, 0.505], [0.085, 0.49], [0.118, 0.465], [0.132, 0.43], [0.133, 0.38], [0.126, 0.34], [0.124, 0.31]], 32, { zScale: Z });
    // parte de baixo aberta na frente (mostra saia e avental)
    const lowerProf = [[0.126, 0.315], [0.134, 0.27], [0.145, 0.21], [0.158, 0.15], [0.168, 0.1], [0.17, 0.088]];
    const gap = (y) => 0.28 + 0.4 * smoothstep(0.31, 0.1, y);
    const lower = lathe(lowerProf, 32, { zScale: Z, gap });
    robe.add(mesh('robe_cloth', [upper, lower], M.robe));
    // acabamento dourado: barra e bordas frontais
    const hemProf = [[0.172, 0.104], [0.174, 0.094], [0.173, 0.086], [0.168, 0.084]];
    const hem = lathe(hemProf, 32, { zScale: Z, gap: () => gap(0.09) });
    const trims = [hem];
    for (const s of [-1, 1]) {
      const pts = lowerProf.map(([r, y]) => {
        const ph = gap(y) * s;
        return new V3(Math.sin(ph) * (r + 0.003), y, Math.cos(ph) * (r + 0.003) * Z);
      });
      trims.push(sweep(new THREE.CatmullRomCurve3(pts), 10, 6, () => [0.006, 0.004], { hint: new V3(0, 0, 1) }));
    }
    // gola cruzada (esquerda sobre direita) com borda dourada
    const collarPts = (s) => [
      new V3(-s * 0.06, 0.505, -0.01), new V3(-s * 0.062, 0.49, 0.06), new V3(-s * 0.03, 0.43, 0.105), new V3(s * 0.03, 0.37, 0.108), new V3(s * 0.07, 0.33, 0.1),
    ];
    for (const s of [1, -1]) trims.push(sweep(new THREE.CatmullRomCurve3(collarPts(s)), 14, 6, () => [0.0075, 0.005], { hint: new V3(0, 0, 1) }));
    robe.add(mesh('robe_trim', trims, M.gold));
    const backCollar = sweep(new THREE.CatmullRomCurve3([new V3(-0.06, 0.505, -0.01), new V3(0, 0.508, -0.06), new V3(0.06, 0.505, -0.01)]), 10, 8, () => [0.008, 0.006], { hint: new V3(0, 1, 0) });
    robe.add(mesh('collar_back', backCollar, M.gold));

    // saia verde xadrez
    const skirt = lathe([[0.118, 0.33], [0.13, 0.25], [0.142, 0.15], [0.15, 0.085]], 32, { zScale: Z * 0.98, uvScale: [6, 2] });
    robe.add(mesh('skirt', skirt, M.skirt, true));
    // avental bege com dois painéis de glifos
    const apron = grid(10, 6, (s, t) => {
      const y = 0.315 - t * 0.19;
      const r = 0.13 + (0.315 - y) * 0.09 + 0.006;
      const ph = -0.36 + s * 0.72;
      return new V3(Math.sin(ph) * r + 0.012, y, Math.cos(ph) * r * Z * 0.98 + 0.004);
    });
    apron.computeVertexNormals();
    robe.add(mesh('apron', apron, M.apron, true));

    // cinto marrom escuro + faixa verde + fivela redonda dourada
    const belt = lathe([[0.127, 0.338], [0.13, 0.333], [0.13, 0.303], [0.127, 0.298]], 32, { zScale: Z });
    const sash = lathe([[0.127, 0.352], [0.129, 0.348], [0.129, 0.336], [0.127, 0.333]], 32, { zScale: Z });
    robe.add(mesh('belt', belt, M.belt));
    robe.add(mesh('sash', sash, M.band));
    const buckle = new THREE.CylinderGeometry(0.019, 0.02, 0.008, 24); buckle.rotateX(Math.PI / 2); buckle.translate(0.006, 0.318, 0.105);
    const boss = ellipsoid(0.011, 0.011, 0.006, 14, 8); boss.translate(0.006, 0.318, 0.11);
    robe.add(mesh('buckle', [buckle, boss], M.gold));
  }

  // mangas largas e curtas + mãos
  for (const s of [-1, 1]) {
    const sh = new V3(s * 0.098, 0.452, 0.0);
    const sl = group(s > 0 ? 'sleeves_L' : 'sleeves_R', body, sh.toArray());
    sl.rotation.z = s * 0.6;   // braço caído ~49° da vertical
    sl.rotation.x = -0.12;
    const prof = [[0.044, 0.02], [0.05, -0.01], [0.062, -0.06], [0.074, -0.11], [0.082, -0.148], [0.083, -0.152]];
    const cloth = lathe(prof, 22);
    const inner = lathe([[0.079, -0.152], [0.07, -0.12]], 22);
    sl.add(mesh('sleeve_cloth', [cloth, inner], M.robe));
    const cuff = lathe([[0.08, -0.13], [0.086, -0.132], [0.087, -0.155], [0.08, -0.158]], 22);
    sl.add(mesh('cuff', cuff, M.gold));
    // braço e mão (luva gordinha estilizada)
    const hand = group(s > 0 ? 'hands_L' : 'hands_R', sl, [0, -0.175, 0.0]);
    const forearm = new THREE.CylinderGeometry(0.026, 0.03, 0.07, 10, 1, true); forearm.translate(0, 0.035, 0);
    // palma achatada em X (voltada para o corpo), dedos gordinhos apontando para baixo
    const palm = ellipsoid(0.024, 0.036, 0.034, 12, 8);
    const parts = [forearm, palm];
    for (let f = 0; f < 4; f++) {
      const fg = new THREE.CapsuleGeometry(0.0095, 0.02, 2, 6);
      fg.translate(s * 0.002, -0.04 + Math.abs(f - 1.2) * 0.003, (f - 1.5) * 0.0145 - 0.004);
      parts.push(fg);
    }
    const thumb = new THREE.CapsuleGeometry(0.01, 0.016, 2, 6);
    thumb.rotateX(-0.7); thumb.translate(-s * 0.006, -0.008, 0.034);
    parts.push(thumb);
    const hm = mesh('hand_mesh', parts, M.skin);
    hm.rotation.set(0, 0, -s * 0.55); // pulso dobrado: mão quase vertical
    hand.add(hm);
  }

  // pergaminho enrolado no quadril direito dele (-X)
  {
    const sc = group('scroll', body, [-0.15, 0.25, 0.08]);
    sc.scale.setScalar(1.25);
    sc.rotation.set(0.12, 0, -0.18);
    const paper = new THREE.CylinderGeometry(0.026, 0.026, 0.12, 22, 1, true);
    sc.add(mesh('scroll_paper', paper, M.scroll, true));
    const ends = [];
    for (const y of [-0.064, 0.064]) {
      const e = new THREE.CylinderGeometry(0.029, 0.029, 0.012, 22); e.translate(0, y, 0); ends.push(e);
      const k = new THREE.CylinderGeometry(0.011, 0.011, 0.016, 12); k.translate(0, y + Math.sign(y) * 0.012, 0); ends.push(k);
    }
    sc.add(mesh('scroll_ends', ends, M.scrollEnd));
    const tie = new THREE.TorusGeometry(0.0275, 0.0035, 4, 16); tie.rotateX(Math.PI / 2); tie.translate(0, 0.02, 0);
    sc.add(mesh('scroll_tie', tie, M.belt));
    const hook = new THREE.BoxGeometry(0.012, 0.05, 0.006); hook.translate(0.022, 0.07, -0.01);
    sc.add(mesh('scroll_strap', hook, M.belt));
  }

  // espada embainhada nas costas, punho acima do ombro esquerdo dele (+X)
  {
    const tipP = new V3(-0.2, 0.1, -0.115), pomP = new V3(0.205, 0.69, -0.13);
    const sw = group('sword', body, tipP.toArray());
    const dir = pomP.clone().sub(tipP); const L = dir.length(); dir.normalize();
    sw.quaternion.setFromUnitVectors(new V3(0, 1, 0), dir);
    sw.rotateY(0.25);
    const sheath = new THREE.BoxGeometry(0.044, L * 0.73, 0.028); sheath.translate(0, L * 0.365, 0);
    const sheathEdge = new THREE.CylinderGeometry(0.022, 0.022, L * 0.73, 10, 1); sheathEdge.scale(1, 1, 0.68); sheathEdge.translate(0, L * 0.365, 0);
    sw.add(mesh('scabbard', [sheath, sheathEdge], M.scabbard));
    const fits = [];
    for (const [y, h] of [[0.012, 0.03], [L * 0.33, 0.026], [L * 0.69, 0.034]]) {
      const b = new THREE.BoxGeometry(0.054, h * 1.2, 0.038); b.translate(0, y, 0); fits.push(b);
    }
    const guard = new THREE.BoxGeometry(0.066, 0.018, 0.048); guard.translate(0, L * 0.745, 0); fits.push(guard);
    const pommelCap = new THREE.BoxGeometry(0.036, 0.014, 0.03); pommelCap.translate(0, L * 0.905, 0); fits.push(pommelCap);
    const key = meander(0.064, 0.015, 0.014).map((b) => { b.translate(-0.032, L * 0.915, 0); return b; });
    fits.push(...key);
    sw.add(mesh('sword_gold', fits, M.gold));
    const grip = new THREE.CylinderGeometry(0.016, 0.017, L * 0.15, 10); grip.translate(0, L * 0.825, 0);
    const wraps = [];
    for (let k = 0; k < 4; k++) { const t = new THREE.TorusGeometry(0.017, 0.003, 4, 10); t.rotateX(Math.PI / 2); t.translate(0, L * (0.765 + k * 0.035), 0); wraps.push(t); }
    sw.add(mesh('sword_grip', [grip, ...wraps], M.grip));
  }

  // alça marrom: do ombro direito dele, cruzando as costas até o quadril esquerdo
  {
    const pts = [];
    for (let k = 0; k < 24; k++) {
      const a = (k / 24) * Math.PI * 2;
      const y = 0.392 - 0.08 * Math.sin(a);
      const r = torsoR(y) + 0.006;
      pts.push(new V3(Math.sin(a) * r, y, Math.cos(a) * r * Z));
    }
    const curve = new THREE.CatmullRomCurve3(pts, true);
    const g = sweep(curve, 48, 6, () => [0.0035, 0.012], { hint: new V3(0, 1, 0) });
    const strap = mesh('strap', g, M.belt);
    body.add(strap);
  }

  /* ---------- PERNAS E BOTAS ---------- */
  for (const s of [-1, 1]) {
    const lg = group(s > 0 ? 'legs_L' : 'legs_R', legs, [s * 0.072, 0, 0]);
    const tr = new THREE.CylinderGeometry(0.036, 0.04, 0.06, 16); tr.translate(0, 0.1, 0);
    lg.add(mesh('trousers', tr, M.trousers));
    const bt = group(s > 0 ? 'boots_L' : 'boots_R', lg, [0, 0, 0]);
    bt.rotation.y = s * 0.12;
    bt.scale.set(1.25, 1.2, 1.15);
    const shaft = new THREE.CylinderGeometry(0.037, 0.04, 0.06, 14, 1, true); shaft.translate(0, 0.055, 0);
    const toe = ellipsoid(0.042, 0.034, 0.066, 12, 8); toe.translate(0, 0.024, 0.018);
    const cut = toe.attributes.position;
    for (let v = 0; v < cut.count; v++) if (cut.getY(v) < 0.012) cut.setY(v, 0.012);
    toe.computeVertexNormals();
    bt.add(mesh('boot', [shaft, toe], M.boots));
    const sole = new THREE.CylinderGeometry(1, 1, 0.012, 24); sole.scale(0.045, 1, 0.07); sole.translate(0, 0.006, 0.018);
    bt.add(mesh('boot_sole', sole, M.gold));
  }

  /* ================================================================ */
  /* Animações                                                         */
  /* ================================================================ */
  const q = (x, y, z) => new THREE.Quaternion().setFromEuler(new THREE.Euler(x, y, z)).toArray();
  const qTrack = (name, times, eulers) => new THREE.QuaternionKeyframeTrack(`${name}.quaternion`, times, eulers.flatMap((e) => q(...e)));
  const vTrack = (name, prop, times, vals) => new THREE.VectorKeyframeTrack(`${name}.${prop}`, times, vals.flat());
  const base = (n) => root.getObjectByName(n);
  const pos = (n, dx = 0, dy = 0, dz = 0) => { const p = base(n).position; return [p.x + dx, p.y + dy, p.z + dz]; };
  const browsMorph = (times, vals) => ['brows_L', 'brows_R'].map((n) => new THREE.NumberKeyframeTrack(`${n}.morphTargetInfluences`, times, vals));

  const idle = new THREE.AnimationClip('idle', 2, [
    vTrack('body', 'scale', [0, 1, 2], [[1, 1, 1], [1.006, 1.014, 1.006], [1, 1, 1]]),
    qTrack('head', [0, 1, 2], [[0, 0, 0], [0.035, 0, 0.012], [0, 0, 0]]),
    qTrack('beard', [0, 1, 2], [[0, 0, 0], [-0.03, 0, 0.02], [0, 0, 0]]),
    qTrack('sleeves_L', [0, 1, 2], [[-0.12, 0, 0.6], [-0.12, 0, 0.57], [-0.12, 0, 0.6]]),
    qTrack('sleeves_R', [0, 1, 2], [[-0.12, 0, -0.6], [-0.12, 0, -0.57], [-0.12, 0, -0.6]]),
    ...browsMorph([0, 1, 2], [0, 0.15, 0]),
  ]);
  const tt = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 1.0];
  const talk = new THREE.AnimationClip('talk', 1, [
    qTrack('head', tt, [[0, 0, 0], [0.09, 0.03, 0], [0.01, 0.0, 0], [0.07, -0.03, 0], [0.0, 0, 0], [0.05, 0.02, 0], [0, 0, 0]]),
    vTrack('beard', 'position', tt, [pos('beard'), pos('beard', 0, -0.012, 0.003), pos('beard'), pos('beard', 0, -0.01, 0.002), pos('beard'), pos('beard', 0, -0.008, 0.002), pos('beard')]),
    qTrack('beard', tt, [[0, 0, 0], [0.08, 0, 0], [0, 0, 0], [0.07, 0, 0], [0, 0, 0], [0.05, 0, 0], [0, 0, 0]]),
    vTrack('moustache', 'scale', tt, [[1, 1, 1], [1.06, 0.9, 1], [1, 1, 1], [1.05, 0.92, 1], [1, 1, 1], [1.04, 0.94, 1], [1, 1, 1]]),
    vTrack('moustache', 'position', tt, [pos('moustache'), pos('moustache', 0, 0.003, 0), pos('moustache'), pos('moustache', 0, 0.003, 0), pos('moustache'), pos('moustache', 0, 0.002, 0), pos('moustache')]),
    ...browsMorph([0, 0.3, 0.6, 1], [0, 0.35, 0.1, 0]),
  ]);
  const gt = [0, 0.15, 0.3, 0.45, 0.6, 0.75, 0.9, 1.2];
  const grumble = new THREE.AnimationClip('grumble', 1.2, [
    qTrack('head', gt, [[0, 0, 0], [0.1, 0.0, 0], [0.12, 0.13, 0.02], [0.12, -0.13, -0.02], [0.12, 0.11, 0.02], [0.12, -0.09, -0.01], [0.1, 0, 0], [0, 0, 0]]),
    vTrack('head', 'position', [0, 0.2, 0.9, 1.2], [pos('head'), pos('head', 0, -0.012, 0), pos('head', 0, -0.012, 0), pos('head')]),
    ...browsMorph([0, 0.18, 0.95, 1.2], [0, 1, 1, 0]),
    vTrack('brows_L', 'position', [0, 0.18, 0.95, 1.2], [pos('brows_L'), pos('brows_L', 0, -0.004, 0.002), pos('brows_L', 0, -0.004, 0.002), pos('brows_L')]),
    vTrack('brows_R', 'position', [0, 0.18, 0.95, 1.2], [pos('brows_R'), pos('brows_R', 0, -0.004, 0.002), pos('brows_R', 0, -0.004, 0.002), pos('brows_R')]),
    vTrack('moustache', 'scale', [0, 0.3, 0.6, 0.9, 1.2], [[1, 1, 1], [1.08, 0.94, 1.05], [1.02, 1, 1], [1.08, 0.94, 1.05], [1, 1, 1]]),
    qTrack('beard', gt, [[0, 0, 0], [0, 0, 0], [0, -0.06, 0.04], [0, 0.06, -0.04], [0, -0.05, 0.03], [0, 0.04, -0.02], [0, 0, 0], [0, 0, 0]]),
    qTrack('sleeves_L', [0, 0.25, 0.95, 1.2], [[-0.12, 0, 0.6], [-0.3, 0, 0.5], [-0.3, 0, 0.5], [-0.12, 0, 0.6]]),
    qTrack('sleeves_R', [0, 0.25, 0.95, 1.2], [[-0.12, 0, -0.6], [-0.3, 0, -0.5], [-0.3, 0, -0.5], [-0.12, 0, -0.6]]),
  ]);
  return { root, clips: [idle, talk, grumble] };
}

/* ------------------------------------------------------------------ */
/* Renderizações (no navegador): folha 8 vistas, comparação, close,    */
/* pôster transparente                                                 */
/* ------------------------------------------------------------------ */
export async function renderSheets(THREE, { GLTFLoader }, { glbUrl, refUrl }) {
  const gltf = await new GLTFLoader().loadAsync(glbUrl);
  const model = gltf.scene;
  let tris = 0, meshes = 0;
  model.traverse((o) => {
    if (o.isMesh) { meshes++; tris += (o.geometry.index ? o.geometry.index.count : o.geometry.attributes.position.count) / 3; }
  });
  const box = new THREE.Box3().setFromObject(model);

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const scene = new THREE.Scene();
  scene.add(model);
  const cam = new THREE.PerspectiveCamera(30, 1, 0.05, 20);
  scene.add(cam);
  scene.add(new THREE.HemisphereLight(0xfff6ec, 0x7a746a, 1.25));
  const key = new THREE.DirectionalLight(0xfff1e0, 2.9); key.position.set(-1.8, 2.4, 1.3); cam.add(key); cam.add(key.target); key.target.position.set(0, 0, -3);
  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.8); fill.position.set(1.8, 0.4, 1.2); cam.add(fill); cam.add(fill.target); fill.target.position.set(0, 0, -3);
  const rim = new THREE.DirectionalLight(0xffffff, 1.0); rim.position.set(0.5, 1.5, -2.5); cam.add(rim); cam.add(rim.target); rim.target.position.set(0, 0, -3);

  const shot = (w, h, deg, { dist = 2.15, ty = 0.5, cy = 0.62, fov = 30, bg = 0xdcdddf, alpha = false } = {}) => {
    renderer.setSize(w, h, false);
    renderer.setPixelRatio(1);
    if (alpha) { scene.background = null; renderer.setClearColor(0x000000, 0); } else { scene.background = new THREE.Color(bg); }
    cam.fov = fov; cam.aspect = w / h; cam.updateProjectionMatrix();
    const a = (deg * Math.PI) / 180;
    cam.position.set(Math.sin(a) * dist, cy, Math.cos(a) * dist);
    cam.lookAt(0, ty, 0);
    renderer.render(scene, cam);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    c.getContext('2d').drawImage(renderer.domElement, 0, 0);
    return c;
  };
  const sheet = (w, h, bg = '#dcdddf') => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    return [c, g];
  };
  const label = (g, text, x, y) => {
    g.fillStyle = '#6b6d72'; g.font = '600 26px "DejaVu Sans", Arial, sans-serif'; g.textAlign = 'center';
    g.fillText(text, x, y);
  };

  const views = [[0, '0°  FRONT'], [45, '45°'], [90, '90°  RIGHT'], [135, '135°'], [180, '180°  BACK'], [225, '225°'], [270, '270°  LEFT'], [315, '315°']];
  const [turn, tg] = sheet(1536, 1024);
  views.forEach(([deg, txt], k) => {
    const x = (k % 4) * 384, y = Math.floor(k / 4) * 512;
    tg.drawImage(shot(384, 462, deg), x, y);
    label(tg, txt, x + 192, y + 488);
  });

  const ref = await new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = refUrl; });
  const [cmp, cg] = sheet(1536, 512);
  cg.drawImage(ref, 0, 0, 384, 512, 0, 0, 384, 512);
  cg.drawImage(shot(384, 462, 0), 384, 0);
  cg.drawImage(ref, 768, 0, 384, 512, 768, 0, 384, 512);
  cg.drawImage(shot(384, 462, 90), 1152, 0);
  cg.fillStyle = '#dcdddf'; cg.fillRect(0, 462, 1536, 50); cg.fillRect(768, 462, 384, 50);
  label(cg, 'REFERÊNCIA 0°', 192, 498); label(cg, 'MODELO 0°', 576, 498);
  label(cg, 'REFERÊNCIA 90°', 960, 498); label(cg, 'MODELO 90°', 1344, 498);
  cg.fillStyle = '#9a9ca0'; cg.fillRect(767, 20, 2, 440);

  const [fc, fg] = sheet(1024, 512);
  fg.drawImage(shot(512, 512, 0, { dist: 0.75, ty: 0.66, cy: 0.7, fov: 30 }), 0, 0);
  fg.drawImage(shot(512, 512, 35, { dist: 0.75, ty: 0.66, cy: 0.7, fov: 30 }), 512, 0);

  const poster = shot(512, 512, 35, { dist: 2.3, ty: 0.5, cy: 0.66, fov: 28, alpha: true });

  return {
    stats: { tris, meshes, height: box.max.y - box.min.y, min: box.min.toArray(), max: box.max.toArray(), clips: gltf.animations.map((a) => `${a.name}:${a.duration.toFixed(2)}s`) },
    turnaround: turn.toDataURL('image/png'),
    comparison: cmp.toDataURL('image/png'),
    face: fc.toDataURL('image/png'),
    poster: poster.toDataURL('image/png'),
  };
}

/* ------------------------------------------------------------------ */
/* Node: orquestra o Chromium headless                                 */
/* ------------------------------------------------------------------ */
async function main() {
  const fs = await import('node:fs');
  const path = await import('node:path');
  const { fileURLToPath } = await import('node:url');
  const { createRequire } = await import('node:module');
  const here = path.dirname(fileURLToPath(import.meta.url));
  const repo = path.resolve(here, '../../..');
  const THREE_DIR = process.env.THREE_DIR;
  if (!THREE_DIR || !fs.existsSync(path.join(THREE_DIR, 'build/three.module.js'))) {
    console.error('Defina THREE_DIR apontando para node_modules/three (versão 0.170.0). Ver README.md.');
    process.exit(1);
  }
  const pwModule = process.env.PLAYWRIGHT_MODULE || path.join(repo, 'apps/web/node_modules/@playwright/test');
  const { chromium } = createRequire(import.meta.url)(pwModule);
  const exe = process.env.CHROMIUM_PATH || (fs.existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
  const browser = await chromium.launch({ executablePath: exe, args: ['--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
  const page = await browser.newPage();
  page.on('console', (m) => console.log('[page]', m.text()));
  page.on('pageerror', (e) => console.error('[page error]', e));
  const ORIGIN = 'http://suntzu.local';
  const types = { '.js': 'text/javascript', '.mjs': 'text/javascript', '.png': 'image/png', '.glb': 'model/gltf-binary', '.html': 'text/html' };
  await page.route(`${ORIGIN}/**`, (route) => {
    const u = new URL(route.request().url());
    let file;
    if (u.pathname === '/') return route.fulfill({ contentType: 'text/html', body: `<!doctype html><meta charset="utf-8"><script type="importmap">{"imports":{"three":"/three/build/three.module.js","three/addons/":"/three/examples/jsm/"}}</script><body></body>` });
    if (u.pathname.startsWith('/three/')) file = path.join(THREE_DIR, u.pathname.slice(7));
    else if (u.pathname.startsWith('/mascot/')) file = path.join(here, u.pathname.slice(8));
    if (!file || !fs.existsSync(file)) return route.fulfill({ status: 404, body: 'not found' });
    route.fulfill({ contentType: types[path.extname(file)] || 'application/octet-stream', body: fs.readFileSync(file) });
  });
  await page.goto(`${ORIGIN}/`);

  const glbB64 = await page.evaluate(async () => {
    const THREE = await import('three');
    const { mergeGeometries } = await import('three/addons/utils/BufferGeometryUtils.js');
    const { GLTFExporter } = await import('three/addons/exporters/GLTFExporter.js');
    const { buildSunTzu } = await import('/mascot/build-model.mjs?' + Date.now());
    const { root, clips } = buildSunTzu(THREE, { mergeGeometries });
    const buf = await new GLTFExporter().parseAsync(root, { binary: true, animations: clips });
    let s = ''; const b = new Uint8Array(buf);
    for (let i = 0; i < b.length; i += 0x8000) s += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return btoa(s);
  });
  const glbPath = path.join(here, 'suntzu.glb');
  fs.writeFileSync(glbPath, Buffer.from(glbB64, 'base64'));
  console.log(`suntzu.glb: ${(fs.statSync(glbPath).size / 1024).toFixed(1)} KB`);

  if (!process.argv.includes('--no-render')) {
    const out = await page.evaluate(async () => {
      const THREE = await import('three');
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { renderSheets } = await import('/mascot/build-model.mjs?' + Date.now());
      return renderSheets(THREE, { GLTFLoader }, { glbUrl: '/mascot/suntzu.glb?' + Date.now(), refUrl: '/mascot/reference-turnaround.png' });
    });
    for (const k of ['turnaround', 'comparison', 'face', 'poster']) {
      const name = k === 'face' ? 'face-closeup.png' : `${k}.png`;
      fs.writeFileSync(path.join(here, name), Buffer.from(out[k].split(',')[1], 'base64'));
    }
    console.log('stats', JSON.stringify(out.stats));
  }
  await browser.close();
}

if (globalThis.process?.versions?.node) {
  const { pathToFileURL } = await import('node:url');
  if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) await main();
}
