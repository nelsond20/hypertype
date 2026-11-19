import {
  angleBetween, buildCore, buildKeycap, buildStem, clamp, cross, dot, frontOrder, fitDistance,
  hexToLinear, KEY_H, layoutSlots, lookAt, mul4, mulberry32, norm, perspective, project, qAxis,
  qMul, qNormalize, qRotate, rayBox, raySphere, ripplePulse, sub, CELL,
  type Keycap, type KeycapFinish, type KeycapPalette, type Mesh, type Quat, type Vec3,
} from './geometry';
import { DEFAULT_KEYS, DEFAULT_PALETTE, drawAtlas, FINISH_ID, ICON_KEYS, legendKey } from './legends';
import { BG_FRAG, BG_VERT, MESH_FRAG, MESH_VERT } from './shaders';

export type Tuning = {
  palette?: KeycapPalette;
  background: string;
  glow: string;
  scale: number;
  autoRotate: boolean;
  speed: number;
  reflection: boolean;
  ripple: boolean;
  reduced: boolean;
  onKeyPress?: (key: Keycap, index: number) => void;
};

export type OrbHooks = {
  /** Read every frame, so changing it never rebuilds the GL state. */
  tuning: () => Tuning;
  fail: () => void;
  contextRestored: () => void;
  announce: (message: string) => void;
};

const STRIDE = 20; // floats per instance: a 4×4 model matrix, then info
const RADIUS = 2;
const FOV = (28 * Math.PI) / 180;

const compile = (gl: WebGL2RenderingContext, type: number, src: string) => {
  const sh = gl.createShader(type);
  if (!sh) throw new Error('no shader');
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    const log = gl.getShaderInfoLog(sh);
    gl.deleteShader(sh);
    throw new Error('shader: ' + log);
  }
  return sh;
};

const link = (gl: WebGL2RenderingContext, vsSrc: string, fsSrc: string) => {
  const vs = compile(gl, gl.VERTEX_SHADER, vsSrc);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fsSrc);
  const program = gl.createProgram();
  if (!program) throw new Error('no program');
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const log = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error('link: ' + log);
  }
  return program;
};

/**
 * Builds the orb on `canvas`, wires the pointer and keyboard on `root`, and
 * returns a function that tears all of it down again.
 */
export function startOrb(
  canvas: HTMLCanvasElement,
  root: HTMLElement,
  rings: number,
  keys: Keycap[] | undefined,
  hooks: OrbHooks,
): () => void {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: true, premultipliedAlpha: false });
  if (!gl) {
    hooks.fail();
    return () => {};
  }

  // ---- layout -------------------------------------------------------------
  const ringCount = Math.round(clamp(rings, 5, 15));
  const slots = layoutSlots(ringCount);
  const order = frontOrder(slots);
  const list = keys && keys.length ? keys : DEFAULT_KEYS;
  const count = slots.length;
  const step = Math.PI / (ringCount - 1);
  const capWorld = RADIUS * step * 0.92;

  const assigned: Keycap[] = new Array(count);
  order.forEach((slot, rank) => {
    assigned[slot] = rank < list.length ? list[rank] : list[(rank * 7) % list.length];
  });

  const legends: string[] = [];
  const cellOf = new Map<string, number>();
  for (const k of assigned) {
    const id = legendKey(k);
    if (id && !cellOf.has(id) && legends.length < 64) {
      cellOf.set(id, legends.length);
      legends.push(id);
    }
  }

  const rand = mulberry32(0x6b657963);
  const frames = slots.map((s, i) => {
    const n = s.dir;
    const e = s.east;
    const nth: Vec3 = norm(cross(n, e));
    const tilt = (rand() - 0.5) * 0.09;
    const tiltDir = rand() * Math.PI * 2;
    const roll = (rand() - 0.5) * 0.08;
    const axis = norm([
      e[0] * Math.cos(tiltDir) + nth[0] * Math.sin(tiltDir),
      e[1] * Math.cos(tiltDir) + nth[1] * Math.sin(tiltDir),
      e[2] * Math.cos(tiltDir) + nth[2] * Math.sin(tiltDir),
    ]);
    const q = qMul(qAxis(axis, tilt), qAxis(n, roll));
    const y = qRotate(q, n);
    const x = qRotate(q, e);
    const z = cross(x, y);
    const pop = rand() < 0.12 ? 0.18 + rand() * 0.12 : (rand() - 0.3) * 0.06;
    const finish = assigned[i]?.finish ?? 'ink';
    return {
      x, y, z, dir: n,
      size: capWorld * s.size,
      pop: finish === 'glass' ? Math.max(pop, 0.1) : pop,
      finish: FINISH_ID[finish] ?? 0,
      cell: cellOf.get(legendKey(assigned[i] ?? {})) ?? -1,
      shade: 0.92 + rand() * 0.16,
    };
  });
  const glassIdx = frames.map((f, i) => (f.finish === 2 ? i : -1)).filter((i) => i >= 0);
  const solidIdx = frames.map((f, i) => (f.finish !== 2 ? i : -1)).filter((i) => i >= 0);

  // ---- GL resources ---------------------------------------------------------
  let bgProgram: WebGLProgram | null = null;
  let meshProgram: WebGLProgram | null = null;
  const buffers: WebGLBuffer[] = [];
  const vaos: WebGLVertexArrayObject[] = [];
  let atlas: WebGLTexture | null = null;
  let instBuf: WebGLBuffer | null = null;
  let coreBuf: WebGLBuffer | null = null;
  let raf = 0;
  let disposed = false;
  let visible = true;

  const onLost = (e: Event) => {
    e.preventDefault();
    cancelAnimationFrame(raf);
    raf = 0;
  };
  const onRestored = () => hooks.contextRestored();
  canvas.addEventListener('webglcontextlost', onLost);
  canvas.addEventListener('webglcontextrestored', onRestored);

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = Math.round(canvas.clientWidth * dpr);
    const h = Math.round(canvas.clientHeight * dpr);
    if (w === 0 || h === 0) return;
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
    }
  };
  const observer = new ResizeObserver(resize);
  observer.observe(canvas);

  // WebGL2 has no base-instance draw: a sub-range of the instance buffer is
  // drawn by moving the attribute pointers to it.
  const pointInstances = (buf: WebGLBuffer | null, first: number) => {
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    for (let a = 0; a < 5; a++) {
      gl.vertexAttribPointer(2 + a, 4, gl.FLOAT, false, STRIDE * 4, first * STRIDE * 4 + a * 16);
    }
  };

  const meshVao = (mesh: Mesh, inst: WebGLBuffer | null) => {
    const vao = gl.createVertexArray();
    if (!vao) throw new Error('no vao');
    vaos.push(vao);
    gl.bindVertexArray(vao);
    const pb = gl.createBuffer();
    const nb = gl.createBuffer();
    const ib = gl.createBuffer();
    if (!pb || !nb || !ib) throw new Error('no buffer');
    buffers.push(pb, nb, ib);
    gl.bindBuffer(gl.ARRAY_BUFFER, pb);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.pos, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ARRAY_BUFFER, nb);
    gl.bufferData(gl.ARRAY_BUFFER, mesh.nor, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 3, gl.FLOAT, false, 0, 0);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, ib);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.idx, gl.STATIC_DRAW);
    for (let a = 0; a < 5; a++) {
      gl.enableVertexAttribArray(2 + a);
      gl.vertexAttribDivisor(2 + a, 1);
    }
    pointInstances(inst, 0);
    gl.bindVertexArray(null);
    return { vao, count: mesh.idx.length };
  };

  const u: Record<string, WebGLUniformLocation | null> = {};
  const ub: Record<string, WebGLUniformLocation | null> = {};
  let capVao = { vao: null as WebGLVertexArrayObject | null, count: 0 };
  let stemVao = { vao: null as WebGLVertexArrayObject | null, count: 0 };
  let coreVao = { vao: null as WebGLVertexArrayObject | null, count: 0 };
  let atlasCells = 1;
  const inst = new Float32Array(count * STRIDE);

  // ---- motion state ---------------------------------------------------------
  let q: Quat = qAxis([1, 0, 0], -0.14);
  let vel: [number, number] = [0, 0];
  let tilt: [number, number] = [0, 0];
  const hoverAmt = new Float32Array(count);
  const pressAmt = new Float32Array(count);
  const pressHeld = new Uint8Array(count);
  const lift = new Float32Array(count);
  const ripples: { origin: Vec3; t0: number }[] = [];
  const started = performance.now();
  let last = started;
  let hover = -1;
  let pointer = { x: 0, y: 0, inside: false };
  let drag = { active: false, moved: false, id: -1, sx: 0, sy: 0, lx: 0, ly: 0, lt: 0, key: -1 };
  let keyboardKey = new Map<string, number>();
  let center: Vec3 = [0, 0, 0];
  let cam = { eye: [0, 0, 10] as Vec3, right: [1, 0, 0] as Vec3, up: [0, 1, 0] as Vec3, forward: [0, 0, -1] as Vec3, aspect: 1 };
  const world = frames.map(() => ({ x: [0, 0, 0] as Vec3, y: [0, 0, 0] as Vec3, z: [0, 0, 0] as Vec3, p: [0, 0, 0] as Vec3, s: 1 }));

  // ---- picking --------------------------------------------------------------
  const ray = (clientX: number, clientY: number) => {
    const r = canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / Math.max(r.width, 1)) * 2 - 1;
    const ny = 1 - ((clientY - r.top) / Math.max(r.height, 1)) * 2;
    const t = Math.tan(FOV / 2);
    const d = norm([
      cam.forward[0] + cam.right[0] * nx * t * cam.aspect + cam.up[0] * ny * t,
      cam.forward[1] + cam.right[1] * nx * t * cam.aspect + cam.up[1] * ny * t,
      cam.forward[2] + cam.right[2] * nx * t * cam.aspect + cam.up[2] * ny * t,
    ]);
    return { o: cam.eye, d };
  };

  const pick = (clientX: number, clientY: number) => {
    const { o, d } = ray(clientX, clientY);
    let best = -1;
    let bestT = raySphere(o, d, center, RADIUS * 0.98);
    if (bestT < 0) bestT = Infinity;
    for (let i = 0; i < count; i++) {
      const w = world[i];
      const rel = sub(o, w.p);
      const s2 = w.s * w.s;
      const lo: Vec3 = [dot(rel, w.x) / s2, dot(rel, w.y) / s2, dot(rel, w.z) / s2];
      const ld: Vec3 = [dot(d, w.x) / s2, dot(d, w.y) / s2, dot(d, w.z) / s2];
      const t = rayBox(lo, ld, [-0.5, 0, -0.5], [0.5, KEY_H, 0.5]);
      if (t >= 0 && t < bestT) {
        bestT = t;
        best = i;
      }
    }
    return best;
  };

  // ---- pressing -------------------------------------------------------------
  const fire = (i: number) => {
    const now = (performance.now() - started) / 1000;
    const t = hooks.tuning();
    if (t.ripple && !t.reduced) {
      ripples.push({ origin: frames[i].dir, t0: now });
      if (ripples.length > 6) ripples.shift();
    }
    const k = assigned[i];
    const name = k?.label || (k?.icon && k.icon !== 'none' ? k.icon : 'blank');
    hooks.announce(name + ' pressed');
    t.onKeyPress?.(k ?? {}, i);
  };

  const facingIndex = () => {
    let best = 0;
    let bestDot = -Infinity;
    for (let i = 0; i < count; i++) {
      const w = world[i];
      const facing = dot(norm(w.y), norm(sub(cam.eye, w.p)));
      if (facing > bestDot) {
        bestDot = facing;
        best = i;
      }
    }
    return best;
  };

  const keyFor = (key: string) => {
    const lower = key.toLowerCase();
    const candidates: number[] = [];
    assigned.forEach((k, i) => {
      if (k.hotkey && k.hotkey.toLowerCase() === lower) candidates.push(i);
    });
    if (!candidates.length && key.length === 1) {
      const icons = ICON_KEYS[key] ?? [];
      assigned.forEach((k, i) => {
        if (k.icon && icons.includes(k.icon)) candidates.push(i);
        else if (k.label && k.label.toLowerCase().startsWith(lower)) candidates.push(i);
      });
    }
    let best = -1;
    let bestDot = -Infinity;
    for (const i of candidates) {
      const facing = dot(norm(world[i].y), norm(sub(cam.eye, world[i].p)));
      if (facing > bestDot) {
        bestDot = facing;
        best = i;
      }
    }
    if (best >= 0 || key.length !== 1) return best;
    const front: number[] = [];
    for (let i = 0; i < count; i++) {
      if (dot(norm(world[i].y), norm(sub(cam.eye, world[i].p))) > 0.55) front.push(i);
    }
    return front.length ? front[key.codePointAt(0)! % front.length] : facingIndex();
  };

  const onPointerDown = (e: PointerEvent) => {
    if (e.button !== 0 && e.pointerType === 'mouse') return;
    root.setPointerCapture?.(e.pointerId);
    const k = pick(e.clientX, e.clientY);
    drag = { active: true, moved: false, id: e.pointerId, sx: e.clientX, sy: e.clientY, lx: e.clientX, ly: e.clientY, lt: performance.now(), key: k };
    vel = [0, 0];
    if (k >= 0) pressHeld[k] = 1;
    root.style.cursor = 'grabbing';
  };

  const onPointerMove = (e: PointerEvent) => {
    const r = root.getBoundingClientRect();
    pointer = {
      x: ((e.clientX - r.left) / Math.max(r.width, 1)) * 2 - 1,
      y: ((e.clientY - r.top) / Math.max(r.height, 1)) * 2 - 1,
      inside: true,
    };
    if (drag.active && e.pointerId === drag.id) {
      const dx = e.clientX - drag.lx;
      const dy = e.clientY - drag.ly;
      if (!drag.moved && Math.hypot(e.clientX - drag.sx, e.clientY - drag.sy) > 6) {
        drag.moved = true;
        if (drag.key >= 0) pressHeld[drag.key] = 0;
      }
      if (drag.moved) {
        const k = (Math.PI * 1.2) / Math.max(Math.min(r.width, r.height), 1);
        q = qNormalize(qMul(qMul(qAxis([0, 1, 0], dx * k), qAxis(cam.right, dy * k)), q));
        const now = performance.now();
        const dt = Math.max(now - drag.lt, 1) / 1000;
        vel = [vel[0] * 0.6 + ((dx * k) / dt) * 0.4, vel[1] * 0.6 + ((dy * k) / dt) * 0.4];
        drag.lt = now;
      }
      drag.lx = e.clientX;
      drag.ly = e.clientY;
    } else {
      hover = pick(e.clientX, e.clientY);
      root.style.cursor = hover >= 0 ? 'pointer' : 'grab';
    }
  };

  const onPointerUp = (e: PointerEvent) => {
    if (!drag.active || e.pointerId !== drag.id) return;
    if (performance.now() - drag.lt > 80) vel = [0, 0];
    if (!drag.moved && drag.key >= 0) {
      pressHeld[drag.key] = 0;
      fire(drag.key);
    }
    drag.active = false;
    root.releasePointerCapture?.(e.pointerId);
    root.style.cursor = hover >= 0 ? 'pointer' : 'grab';
  };

  const onPointerCancel = (e: PointerEvent) => {
    if (drag.key >= 0) pressHeld[drag.key] = 0;
    if (e.pointerId === drag.id) drag.active = false;
  };

  const onPointerLeave = () => {
    pointer.inside = false;
    if (!drag.active) hover = -1;
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    const spin = 1.6;
    if (e.key === 'ArrowLeft') vel = [-spin, vel[1]];
    else if (e.key === 'ArrowRight') vel = [spin, vel[1]];
    else if (e.key === 'ArrowUp') vel = [vel[0], -spin];
    else if (e.key === 'ArrowDown') vel = [vel[0], spin];
    else if (e.key === 'Tab' || e.key === 'Escape' || e.key === 'Shift') return;
    else {
      if (e.repeat) {
        e.preventDefault();
        return;
      }
      const i = e.key === 'Enter' || e.key === ' ' ? facingIndex() : keyFor(e.key);
      if (i < 0) return;
      pressHeld[i] = 1;
      keyboardKey.set(e.key.toLowerCase(), i);
    }
    e.preventDefault();
  };

  const onKeyUp = (e: KeyboardEvent) => {
    const i = keyboardKey.get(e.key.toLowerCase());
    if (i === undefined) return;
    keyboardKey.delete(e.key.toLowerCase());
    pressHeld[i] = 0;
    fire(i);
  };

  const onBlur = () => {
    keyboardKey.forEach((i) => (pressHeld[i] = 0));
    keyboardKey = new Map();
  };

  root.addEventListener('pointerdown', onPointerDown);
  root.addEventListener('pointermove', onPointerMove);
  root.addEventListener('pointerup', onPointerUp);
  root.addEventListener('pointercancel', onPointerCancel);
  root.addEventListener('pointerleave', onPointerLeave);
  root.addEventListener('keydown', onKeyDown);
  root.addEventListener('keyup', onKeyUp);
  root.addEventListener('blur', onBlur);

  // Nothing draws while the orb is scrolled out of view.
  const io = new IntersectionObserver((entries) => {
    visible = entries.some((e) => e.isIntersecting);
    if (visible && !raf && !disposed) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  });
  io.observe(root);

  // ---- frame ----------------------------------------------------------------
  function frame() {
    raf = 0;
    if (disposed || !visible || !gl) return;
    const t = hooks.tuning();
    const nowMs = performance.now();
    const dt = Math.min((nowMs - last) / 1000, 0.05);
    last = nowMs;
    const now = (nowMs - started) / 1000;
    const calm = t.reduced;

    resize();
    const W = canvas.width;
    const H = canvas.height;
    if (W === 0 || H === 0) {
      raf = requestAnimationFrame(frame);
      return;
    }

    if (!drag.active) {
      if (Math.abs(vel[0]) + Math.abs(vel[1]) > 1e-4) {
        q = qNormalize(qMul(qMul(qAxis([0, 1, 0], vel[0] * dt), qAxis(cam.right, vel[1] * dt)), q));
        const damp = Math.exp(-dt * 2.2);
        vel = [vel[0] * damp, vel[1] * damp];
      }
      if (t.autoRotate && !calm) {
        q = qNormalize(qMul(qAxis([0, 1, 0], 0.16 * clamp(t.speed, -6, 6) * dt), q));
      }
    }

    const goal: [number, number] = pointer.inside && !drag.active ? [pointer.x * 0.12, pointer.y * 0.1] : [0, 0];
    const ease = 1 - Math.exp(-dt * 4);
    tilt = [tilt[0] + (goal[0] - tilt[0]) * ease, tilt[1] + (goal[1] - tilt[1]) * ease];
    const view = qNormalize(qMul(qMul(qAxis([0, 1, 0], tilt[0]), qAxis([1, 0, 0], tilt[1])), q));

    const aspect = W / H;
    const reach = RADIUS + capWorld * KEY_H;
    const dist = fitDistance(reach, FOV, aspect, t.scale);
    const bob = calm ? 0 : Math.sin(now * 0.9) * 0.05;
    center = [0, bob, 0];
    const floorY = -reach * 1.16;
    const eye: Vec3 = [0, dist * 0.12, dist];
    const target: Vec3 = [0, -reach * 0.12, 0];
    const la = lookAt(eye, target);
    cam = { eye, right: la.right, up: la.up, forward: la.forward, aspect };
    const proj = perspective(FOV, aspect, 0.1, 100);
    const viewProj = mul4(proj, la.m);

    const k = 1 - Math.exp(-dt * 14);
    for (let i = 0; i < count; i++) {
      const fr = frames[i];
      hoverAmt[i] += ((i === hover ? 1 : 0) - hoverAmt[i]) * k;
      pressAmt[i] += (pressHeld[i] - pressAmt[i]) * (pressHeld[i] ? 1 - Math.exp(-dt * 30) : k);
      let wave = 0;
      for (const r of ripples) wave += ripplePulse(now - r.t0, angleBetween(fr.dir, r.origin));
      lift[i] = fr.pop + hoverAmt[i] * 0.16 - pressAmt[i] * 0.3 + wave;
    }
    while (ripples.length && now - ripples[0].t0 > 4) ripples.shift();

    for (let i = 0; i < count; i++) {
      const fr = frames[i];
      const w = world[i];
      const x = qRotate(view, fr.x);
      const y = qRotate(view, fr.y);
      const z = qRotate(view, fr.z);
      const n = qRotate(view, fr.dir);
      const out = RADIUS + lift[i] * fr.size * KEY_H;
      w.s = fr.size;
      w.x = [x[0] * fr.size, x[1] * fr.size, x[2] * fr.size];
      w.y = [y[0] * fr.size, y[1] * fr.size, y[2] * fr.size];
      w.z = [z[0] * fr.size, z[1] * fr.size, z[2] * fr.size];
      w.p = [center[0] + n[0] * out, center[1] + n[1] * out, center[2] + n[2] * out];
    }

    const glassSorted = glassIdx
      .map((i) => ({ i, d: dot(sub(world[i].p, eye), la.forward) }))
      .sort((a, b) => b.d - a.d)
      .map((g) => g.i);
    const drawOrder = solidIdx.concat(glassSorted);
    drawOrder.forEach((i, slot) => {
      const w = world[i];
      const fr = frames[i];
      const o = slot * STRIDE;
      inst.set([w.x[0], w.x[1], w.x[2], 0, w.y[0], w.y[1], w.y[2], 0, w.z[0], w.z[1], w.z[2], 0, w.p[0], w.p[1], w.p[2], 1], o);
      inst[o + 16] = fr.finish;
      inst[o + 17] = fr.cell;
      inst[o + 18] = hoverAmt[i];
      inst[o + 19] = fr.shade;
    });
    gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
    gl.bufferSubData(gl.ARRAY_BUFFER, 0, inst);

    const coreScale = RADIUS * 0.985;
    gl.bindBuffer(gl.ARRAY_BUFFER, coreBuf);
    gl.bufferSubData(
      gl.ARRAY_BUFFER,
      0,
      new Float32Array([coreScale, 0, 0, 0, 0, coreScale, 0, 0, 0, 0, coreScale, 0, center[0], center[1], center[2], 1, 0, -1, 0, 1]),
    );

    const pal = t.palette ?? {};
    const caps: number[] = [];
    const inks: number[] = [];
    for (const name of ['ink', 'ash', 'glass', 'cobalt', 'lime'] as KeycapFinish[]) {
      caps.push(...hexToLinear(pal[name]?.cap, hexToLinear(DEFAULT_PALETTE[name].cap, [0, 0, 0])));
      inks.push(...hexToLinear(pal[name]?.legend, hexToLinear(DEFAULT_PALETTE[name].legend, [1, 1, 1])));
    }
    caps.push(...hexToLinear('#c9cfe0', [0.6, 0.6, 0.7]), ...hexToLinear('#050508', [0, 0, 0]));
    inks.push(0, 0, 0, 0, 0, 0);
    const glowLin = hexToLinear(t.glow, [0.014, 0.03, 1]);
    const bgLin = hexToLinear(t.background, [0.001, 0.001, 0.002]);

    gl.viewport(0, 0, W, H);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    const orbScreen = project(viewProj, center);
    const floorScreen = project(viewProj, [0, floorY, 0]);
    gl.disable(gl.DEPTH_TEST);
    gl.disable(gl.BLEND);
    gl.useProgram(bgProgram);
    gl.bindVertexArray(vaos[0]);
    gl.uniform2f(ub.uRes, W, H);
    gl.uniform3f(ub.uBg, bgLin[0], bgLin[1], bgLin[2]);
    gl.uniform3f(ub.uGlow, glowLin[0], glowLin[1], glowLin[2]);
    gl.uniform2f(ub.uOrb, (orbScreen[0] * aspect) / 2, orbScreen[1] / 2);
    gl.uniform1f(ub.uHorizon, floorScreen[1] / 2);
    gl.uniform1f(ub.uSeed, calm ? 0 : (now * 7.3) % 100);
    gl.drawArrays(gl.TRIANGLES, 0, 3);

    gl.useProgram(meshProgram);
    gl.uniformMatrix4fv(u.uViewProj, false, viewProj);
    gl.uniform3f(u.uCam, eye[0], eye[1], eye[2]);
    gl.uniform3fv(u.uCap, caps);
    gl.uniform3fv(u.uInk, inks);
    gl.uniform3f(u.uGlow, glowLin[0], glowLin[1], glowLin[2]);
    gl.uniform1f(u.uCells, atlasCells);
    gl.uniform1f(u.uFloor, floorY);
    gl.uniform1i(u.tLegend, 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.enable(gl.DEPTH_TEST);
    gl.enable(gl.CULL_FACE);

    const drawSet = (glass: boolean) => {
      gl.uniform1f(u.uStem, 0);
      gl.uniform1f(u.uCore, 0);
      if (!glass) {
        gl.uniform1f(u.uGlass, 0);
        gl.uniform1f(u.uCore, 1);
        gl.bindVertexArray(coreVao.vao);
        pointInstances(coreBuf, 0);
        gl.drawElementsInstanced(gl.TRIANGLES, coreVao.count, gl.UNSIGNED_SHORT, 0, 1);
        gl.uniform1f(u.uCore, 0);
        gl.bindVertexArray(capVao.vao);
        pointInstances(instBuf, 0);
        gl.drawElementsInstanced(gl.TRIANGLES, capVao.count, gl.UNSIGNED_SHORT, 0, solidIdx.length);
        if (glassIdx.length) {
          gl.uniform1f(u.uStem, 1);
          gl.bindVertexArray(stemVao.vao);
          pointInstances(instBuf, solidIdx.length);
          gl.drawElementsInstanced(gl.TRIANGLES, stemVao.count, gl.UNSIGNED_SHORT, 0, glassIdx.length);
          gl.uniform1f(u.uStem, 0);
        }
        return;
      }
      if (!glassIdx.length) return;
      gl.uniform1f(u.uGlass, 1);
      gl.depthMask(false);
      gl.bindVertexArray(capVao.vao);
      pointInstances(instBuf, solidIdx.length);
      gl.cullFace(gl.FRONT);
      gl.drawElementsInstanced(gl.TRIANGLES, capVao.count, gl.UNSIGNED_SHORT, 0, glassIdx.length);
      gl.cullFace(gl.BACK);
      gl.drawElementsInstanced(gl.TRIANGLES, capVao.count, gl.UNSIGNED_SHORT, 0, glassIdx.length);
      gl.depthMask(true);
      gl.uniform1f(u.uGlass, 0);
    };

    if (t.reflection) {
      gl.uniform1f(u.uReflect, 1);
      gl.frontFace(gl.CW);
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      drawSet(false);
      drawSet(true);
      gl.frontFace(gl.CCW);
      gl.clear(gl.DEPTH_BUFFER_BIT);
    }

    gl.uniform1f(u.uReflect, 0);
    gl.disable(gl.BLEND);
    drawSet(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
    drawSet(true);
    gl.disable(gl.BLEND);
    gl.bindVertexArray(null);

    raf = requestAnimationFrame(frame);
  }

  try {
    bgProgram = link(gl, BG_VERT, BG_FRAG);
    meshProgram = link(gl, MESH_VERT, MESH_FRAG);
    for (const key of ['uRes', 'uBg', 'uGlow', 'uOrb', 'uHorizon', 'uSeed']) {
      ub[key] = gl.getUniformLocation(bgProgram, key);
    }
    for (const key of [
      'uViewProj', 'uReflect', 'uFloor', 'uCam', 'uCap', 'uInk', 'uGlow',
      'tLegend', 'uCells', 'uGlass', 'uStem', 'uCore',
    ]) {
      u[key] = gl.getUniformLocation(meshProgram, key);
    }

    const bgVao = gl.createVertexArray();
    if (!bgVao) throw new Error('no vao');
    vaos.push(bgVao);

    instBuf = gl.createBuffer();
    coreBuf = gl.createBuffer();
    if (!instBuf || !coreBuf) throw new Error('no buffer');
    buffers.push(instBuf, coreBuf);
    gl.bindBuffer(gl.ARRAY_BUFFER, instBuf);
    gl.bufferData(gl.ARRAY_BUFFER, inst.byteLength, gl.DYNAMIC_DRAW);
    gl.bindBuffer(gl.ARRAY_BUFFER, coreBuf);
    gl.bufferData(gl.ARRAY_BUFFER, STRIDE * 4, gl.DYNAMIC_DRAW);

    capVao = meshVao(buildKeycap(), instBuf);
    stemVao = meshVao(buildStem(), instBuf);
    coreVao = meshVao(buildCore(), coreBuf);

    const drawn = drawAtlas(legends);
    atlasCells = drawn.cells;
    atlas = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, atlas);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, drawn.canvas);
    gl.generateMipmap(gl.TEXTURE_2D);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const aniso = gl.getExtension('EXT_texture_filter_anisotropic');
    if (aniso) gl.texParameterf(gl.TEXTURE_2D, aniso.TEXTURE_MAX_ANISOTROPY_EXT, 4);

    resize();
    raf = requestAnimationFrame(frame);
  } catch {
    if (!disposed) hooks.fail();
  }

  return () => {
    disposed = true;
    cancelAnimationFrame(raf);
    observer.disconnect();
    io.disconnect();
    canvas.removeEventListener('webglcontextlost', onLost);
    canvas.removeEventListener('webglcontextrestored', onRestored);
    root.removeEventListener('pointerdown', onPointerDown);
    root.removeEventListener('pointermove', onPointerMove);
    root.removeEventListener('pointerup', onPointerUp);
    root.removeEventListener('pointercancel', onPointerCancel);
    root.removeEventListener('pointerleave', onPointerLeave);
    root.removeEventListener('keydown', onKeyDown);
    root.removeEventListener('keyup', onKeyUp);
    root.removeEventListener('blur', onBlur);
    for (const b of buffers) gl.deleteBuffer(b);
    for (const v of vaos) gl.deleteVertexArray(v);
    if (atlas) gl.deleteTexture(atlas);
    if (bgProgram) gl.deleteProgram(bgProgram);
    if (meshProgram) gl.deleteProgram(meshProgram);
  };
}

export { CELL };
