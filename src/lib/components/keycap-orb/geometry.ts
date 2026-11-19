/**
 * Keycap Orb — pure maths and mesh data.
 *
 * Ported from the React `keycap-orb` component (21st.dev, @kedhareswer). The
 * numbers, layout rules and meshes are unchanged; only the React shell around
 * them was replaced by Svelte (see ../KeycapOrb.svelte and ./engine.ts).
 */

export type KeycapFinish = 'ink' | 'ash' | 'glass' | 'cobalt' | 'lime';

export type KeycapIcon =
  | 'code' | 'braces' | 'chevrons' | 'frame' | 'quote' | 'slash' | 'at' | 'pen'
  | 'check' | 'search' | 'bolt' | 'gear' | 'shield' | 'folder' | 'cube'
  | 'cursor' | 'hash' | 'terminal' | 'layers' | 'star' | 'heart' | 'arrow'
  | 'plus' | 'none';

export type Keycap = {
  icon?: KeycapIcon;
  label?: string;
  finish?: KeycapFinish;
  hotkey?: string;
};

export type KeycapPalette = Partial<Record<KeycapFinish, { cap?: string; legend?: string }>>;

export type Vec3 = [number, number, number];
export type Quat = [number, number, number, number];
export type Slot = { lat: number; lon: number; size: number; dir: Vec3; east: Vec3 };
export type Mesh = { pos: Float32Array; nor: Float32Array; idx: Uint16Array };

export const clamp = (v: number, lo: number, hi: number): number =>
  v > hi ? hi : v >= lo ? v : lo;

export const mulberry32 = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

/** Latitude rings from pole to pole; the middle of the ball is a near-square grid. */
export const layoutSlots = (rings: number): Slot[] => {
  const n = Math.round(clamp(rings, 5, 15));
  const step = Math.PI / (n - 1);
  const slots: Slot[] = [];
  for (let r = 0; r < n; r++) {
    const lat = -Math.PI / 2 + r * step;
    const ring = 2 * Math.PI * Math.cos(lat);
    const count = Math.max(1, Math.round(ring / step));
    const spacing = count === 1 ? step : ring / count;
    const size = Math.min(1, spacing / step);
    for (let k = 0; k < count; k++) {
      const lon = (k / count) * 2 * Math.PI;
      const c = Math.cos(lat);
      const dir: Vec3 = [c * Math.sin(lon), Math.sin(lat), c * Math.cos(lon)];
      const east: Vec3 = [Math.cos(lon), 0, -Math.sin(lon)];
      slots.push({ lat, lon, size, dir, east });
    }
  }
  return slots;
};

export const angleBetween = (a: Vec3, b: Vec3): number =>
  Math.acos(clamp(a[0] * b[0] + a[1] * b[1] + a[2] * b[2], -1, 1));

/** Slot indices from the one facing the viewer outward, clockwise from the left. */
export const frontOrder = (slots: Slot[]): number[] => {
  const front: Vec3 = [0, 0, 1];
  const keyed = slots.map((s, i) => {
    const d = Math.round(angleBetween(s.dir, front) * 1000) / 1000;
    const a = Math.atan2(s.dir[1], s.dir[0]);
    const around = (((Math.PI - a) % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
    return { i, d, around: Math.round(around * 1000) / 1000 };
  });
  keyed.sort((p, q) => p.d - q.d || p.around - q.around || p.i - q.i);
  return keyed.map((k) => k.i);
};

export const qMul = (a: Quat, b: Quat): Quat => [
  a[3] * b[0] + a[0] * b[3] + a[1] * b[2] - a[2] * b[1],
  a[3] * b[1] - a[0] * b[2] + a[1] * b[3] + a[2] * b[0],
  a[3] * b[2] + a[0] * b[1] - a[1] * b[0] + a[2] * b[3],
  a[3] * b[3] - a[0] * b[0] - a[1] * b[1] - a[2] * b[2],
];

export const qAxis = (axis: Vec3, angle: number): Quat => {
  const s = Math.sin(angle / 2);
  return [axis[0] * s, axis[1] * s, axis[2] * s, Math.cos(angle / 2)];
};

export const qNormalize = (q: Quat): Quat => {
  const l = Math.hypot(q[0], q[1], q[2], q[3]);
  return l > 1e-9 && Number.isFinite(l) ? [q[0] / l, q[1] / l, q[2] / l, q[3] / l] : [0, 0, 0, 1];
};

export const qRotate = (q: Quat, v: Vec3): Vec3 => {
  const x = q[0], y = q[1], z = q[2], w = q[3];
  const tx = 2 * (y * v[2] - z * v[1]);
  const ty = 2 * (z * v[0] - x * v[2]);
  const tz = 2 * (x * v[1] - y * v[0]);
  return [
    v[0] + w * tx + y * tz - z * ty,
    v[1] + w * ty + z * tx - x * tz,
    v[2] + w * tz + x * ty - y * tx,
  ];
};

/** How far a cap moves (in cap heights) when a ripple started `elapsed` s ago `distance` rad away. */
export const ripplePulse = (elapsed: number, distance: number): number => {
  const tau = elapsed - distance / 3.2;
  if (tau <= 0 || tau > 2.4) return 0;
  return Math.sin(tau * 13) * Math.exp(-tau * 4.2) * Math.exp(-distance * 0.55) * 0.42;
};

export const fitDistance = (radius: number, fovY: number, aspect: number, fill: number): number => {
  const t = Math.tan(fovY / 2);
  const f = clamp(fill, 0.3, 0.95);
  return radius / (f * t * Math.min(1, aspect)) + radius * 0.35;
};

export const rayBox = (o: Vec3, d: Vec3, lo: Vec3, hi: Vec3): number => {
  let t0 = -Infinity;
  let t1 = Infinity;
  for (let a = 0; a < 3; a++) {
    if (Math.abs(d[a]) < 1e-12) {
      if (o[a] < lo[a] || o[a] > hi[a]) return -1;
      continue;
    }
    const ta = (lo[a] - o[a]) / d[a];
    const tb = (hi[a] - o[a]) / d[a];
    t0 = Math.max(t0, Math.min(ta, tb));
    t1 = Math.min(t1, Math.max(ta, tb));
  }
  if (t1 < Math.max(t0, 0)) return -1;
  return t0 >= 0 ? t0 : t1;
};

export const raySphere = (o: Vec3, d: Vec3, c: Vec3, r: number): number => {
  const ox = o[0] - c[0], oy = o[1] - c[1], oz = o[2] - c[2];
  const b = ox * d[0] + oy * d[1] + oz * d[2];
  const k = ox * ox + oy * oy + oz * oz - r * r;
  const disc = b * b - k;
  if (disc < 0) return -1;
  const s = Math.sqrt(disc);
  const t = -b - s;
  return t >= 0 ? t : -b + s >= 0 ? -b + s : -1;
};

export const hexToLinear = (hex: string | undefined, fallback: Vec3): Vec3 => {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec((hex ?? '').trim());
  if (!m) return fallback;
  const h = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
  const lin = (v: number) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return [lin(parseInt(h.slice(0, 2), 16)), lin(parseInt(h.slice(2, 4), 16)), lin(parseInt(h.slice(4, 6), 16))];
};

export const sub = (a: Vec3, b: Vec3): Vec3 => [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
export const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
export const cross = (a: Vec3, b: Vec3): Vec3 => [
  a[1] * b[2] - a[2] * b[1],
  a[2] * b[0] - a[0] * b[2],
  a[0] * b[1] - a[1] * b[0],
];
export const norm = (a: Vec3): Vec3 => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

export const perspective = (fovY: number, aspect: number, near: number, far: number) => {
  const f = 1 / Math.tan(fovY / 2);
  const nf = 1 / (near - far);
  return [f / aspect, 0, 0, 0, 0, f, 0, 0, 0, 0, (far + near) * nf, -1, 0, 0, 2 * far * near * nf, 0];
};

export const lookAt = (eye: Vec3, target: Vec3) => {
  const z = norm(sub(eye, target));
  const x = norm(cross([0, 1, 0], z));
  const y = cross(z, x);
  return {
    m: [x[0], y[0], z[0], 0, x[1], y[1], z[1], 0, x[2], y[2], z[2], 0, -dot(x, eye), -dot(y, eye), -dot(z, eye), 1],
    right: x,
    up: y,
    forward: [-z[0], -z[1], -z[2]] as Vec3,
  };
};

export const mul4 = (a: number[], b: number[]) => {
  const o = new Array<number>(16);
  for (let c = 0; c < 4; c++) {
    for (let r = 0; r < 4; r++) {
      o[c * 4 + r] = a[r] * b[c * 4] + a[4 + r] * b[c * 4 + 1] + a[8 + r] * b[c * 4 + 2] + a[12 + r] * b[c * 4 + 3];
    }
  }
  return o;
};

export const project = (m: number[], p: Vec3): [number, number] => {
  const x = m[0] * p[0] + m[4] * p[1] + m[8] * p[2] + m[12];
  const y = m[1] * p[0] + m[5] * p[1] + m[9] * p[2] + m[13];
  const w = m[3] * p[0] + m[7] * p[1] + m[11] * p[2] + m[15];
  return [x / w, y / w];
};

// ---- cap geometry, in cap widths -------------------------------------------
export const KEY_H = 0.6;
export const TOP_HALF = 0.37;
export const BEVEL = 0.055;
export const DISH = 0.028;
export const CELL = 128;

const smoothNormals = (pos: number[], idx: number[]) => {
  const nor = new Float32Array(pos.length);
  for (let i = 0; i < idx.length; i += 3) {
    const a = idx[i] * 3, b = idx[i + 1] * 3, c = idx[i + 2] * 3;
    const ux = pos[b] - pos[a], uy = pos[b + 1] - pos[a + 1], uz = pos[b + 2] - pos[a + 2];
    const vx = pos[c] - pos[a], vy = pos[c + 1] - pos[a + 1], vz = pos[c + 2] - pos[a + 2];
    const nx = uy * vz - uz * vy, ny = uz * vx - ux * vz, nz = ux * vy - uy * vx;
    for (const v of [a, b, c]) {
      nor[v] += nx;
      nor[v + 1] += ny;
      nor[v + 2] += nz;
    }
  }
  for (let i = 0; i < nor.length; i += 3) {
    const l = Math.hypot(nor[i], nor[i + 1], nor[i + 2]) || 1;
    nor[i] /= l;
    nor[i + 1] /= l;
    nor[i + 2] /= l;
  }
  return nor;
};

/** The cap: a stack of rounded-square rings, stitched into one smooth shell. */
export const buildKeycap = (): Mesh => {
  const SEG = 7;
  const rings: [number, number, number][] = [];
  const wallTop = KEY_H - BEVEL;
  for (let i = 0; i <= 4; i++) {
    const t = i / 4;
    rings.push([0.5 - (0.5 - TOP_HALF - BEVEL) * t, 0.11 + 0.03 * t, wallTop * t]);
  }
  for (let i = 1; i <= 5; i++) {
    const a = (i / 5) * (Math.PI / 2);
    rings.push([TOP_HALF + BEVEL * Math.cos(a), 0.14 + 0.02 * (1 - Math.cos(a)), wallTop + BEVEL * Math.sin(a)]);
  }
  for (let i = 1; i <= 6; i++) {
    const h = TOP_HALF * (1 - i / 6.2);
    const q = h / TOP_HALF;
    rings.push([h, 0.16 * q, KEY_H - DISH * (1 - q * q)]);
  }
  const pos: number[] = [];
  const loop = 4 * (SEG + 1);
  for (const [half, rad, y] of rings) {
    const r = Math.min(rad, half);
    const c = half - r;
    const corners: [number, number, number][] = [
      [c, c, 0],
      [-c, c, Math.PI / 2],
      [-c, -c, Math.PI],
      [c, -c, (3 * Math.PI) / 2],
    ];
    for (const [cx, cz, a0] of corners) {
      for (let s = 0; s <= SEG; s++) {
        const a = a0 + (s / SEG) * (Math.PI / 2);
        pos.push(cx + Math.cos(a) * r, y, cz + Math.sin(a) * r);
      }
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < rings.length - 1; i++) {
    for (let j = 0; j < loop; j++) {
      const a = i * loop + j;
      const b = i * loop + ((j + 1) % loop);
      const c = (i + 1) * loop + ((j + 1) % loop);
      const d = (i + 1) * loop + j;
      idx.push(a, d, c, a, c, b);
    }
  }
  const centre = pos.length / 3;
  pos.push(0, KEY_H - DISH, 0);
  const last = (rings.length - 1) * loop;
  for (let j = 0; j < loop; j++) idx.push(last + j, centre, last + ((j + 1) % loop));
  return { pos: new Float32Array(pos), nor: smoothNormals(pos, idx), idx: new Uint16Array(idx) };
};

/** Flat-shaded boxes: the stem and switch housing seen through glass caps. */
export const buildStem = (): Mesh => {
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  const box = (cx: number, cy: number, cz: number, hx: number, hy: number, hz: number) => {
    const faces: [Vec3, Vec3, Vec3][] = [
      [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
      [[-1, 0, 0], [0, 0, 1], [0, 1, 0]],
      [[0, 1, 0], [0, 0, 1], [1, 0, 0]],
      [[0, -1, 0], [1, 0, 0], [0, 0, 1]],
      [[0, 0, 1], [1, 0, 0], [0, 1, 0]],
      [[0, 0, -1], [0, 1, 0], [1, 0, 0]],
    ];
    const h: Vec3 = [hx, hy, hz];
    for (const [n, u, v] of faces) {
      const base = pos.length / 3;
      for (const [su, sv] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
        const p: Vec3 = [cx, cy, cz];
        for (let a = 0; a < 3; a++) p[a] += n[a] * h[a] + u[a] * su * h[a] + v[a] * sv * h[a];
        pos.push(p[0], p[1], p[2]);
        nor.push(n[0], n[1], n[2]);
      }
      idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
    }
  };
  box(0, 0.05, 0, 0.36, 0.05, 0.36);
  box(0, 0.25, 0, 0.17, 0.2, 0.045);
  box(0, 0.25, 0, 0.045, 0.2, 0.17);
  return { pos: new Float32Array(pos), nor: new Float32Array(nor), idx: new Uint16Array(idx) };
};

/** The dark core the caps sit on, so the gaps between them read as depth. */
export const buildCore = (): Mesh => {
  const LAT = 24;
  const LON = 40;
  const pos: number[] = [];
  for (let i = 0; i <= LAT; i++) {
    const th = (i / LAT) * Math.PI;
    for (let j = 0; j <= LON; j++) {
      const ph = (j / LON) * Math.PI * 2;
      pos.push(Math.sin(th) * Math.cos(ph), Math.cos(th), Math.sin(th) * Math.sin(ph));
    }
  }
  const idx: number[] = [];
  for (let i = 0; i < LAT; i++) {
    for (let j = 0; j < LON; j++) {
      const a = i * (LON + 1) + j;
      const b = a + 1;
      const d = a + LON + 1;
      const c = d + 1;
      idx.push(a, b, c, a, c, d);
    }
  }
  return { pos: new Float32Array(pos), nor: new Float32Array(pos), idx: new Uint16Array(idx) };
};
