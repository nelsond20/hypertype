export const BG_VERT = `#version 300 es
void main() {
  vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2) * 2.0 - 1.0;
  gl_Position = vec4(p, 0.0, 1.0);
}
`;

export const BG_FRAG = `#version 300 es
precision highp float;
out vec4 fragColor;
uniform vec2 uRes;
uniform vec3 uBg;
uniform vec3 uGlow;
uniform vec2 uOrb;
uniform float uHorizon;
uniform float uSeed;

float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233)) + uSeed) * 43758.5453); }

vec3 tone(vec3 c) {
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}

void main() {
  vec2 p = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  vec3 col = uBg;
  vec2 g = (p - vec2(uOrb.x + 0.2, uHorizon - 0.5)) * vec2(0.55, 0.95);
  col += uGlow * exp(-dot(g, g) * 8.0) * 0.5;
  col += uGlow * exp(-dot(g, g) * 2.6) * 0.05;
  vec2 h = p - uOrb;
  col += uGlow * exp(-dot(h, h) * 9.0) * 0.012;
  col *= 1.0 - 0.4 * smoothstep(0.5, 1.15, length(p * vec2(0.8, 1.0)));
  vec3 outc = tone(col);
  outc += (hash(gl_FragCoord.xy) - 0.5) / 255.0 * 1.5;
  fragColor = vec4(outc, 1.0);
}
`;

export const MESH_VERT = `#version 300 es
layout(location = 0) in vec3 aPos;
layout(location = 1) in vec3 aNor;
layout(location = 2) in vec4 aM0;
layout(location = 3) in vec4 aM1;
layout(location = 4) in vec4 aM2;
layout(location = 5) in vec4 aM3;
layout(location = 6) in vec4 aInfo;
uniform mat4 uViewProj;
uniform float uReflect;
uniform float uFloor;
out vec3 vWorld;
out vec3 vNormal;
out vec3 vLocal;
out vec3 vTx;
out vec3 vTz;
flat out vec4 vInfo;
void main() {
  mat4 m = mat4(aM0, aM1, aM2, aM3);
  vec4 w = m * vec4(aPos, 1.0);
  vec3 n = mat3(m) * aNor;
  vec3 tx = aM0.xyz;
  vec3 tz = aM2.xyz;
  if (uReflect > 0.5) {
    w.y = 2.0 * uFloor - w.y;
    n.y = -n.y;
    tx.y = -tx.y;
    tz.y = -tz.y;
  }
  vWorld = w.xyz;
  vNormal = n;
  vLocal = aPos;
  vTx = tx;
  vTz = tz;
  vInfo = aInfo;
  gl_Position = uViewProj * w;
}
`;

export const MESH_FRAG = `#version 300 es
precision highp float;
in vec3 vWorld;
in vec3 vNormal;
in vec3 vLocal;
in vec3 vTx;
in vec3 vTz;
flat in vec4 vInfo;
out vec4 fragColor;

uniform vec3 uCam;
uniform vec3 uCap[7];
uniform vec3 uInk[7];
uniform vec3 uGlow;
uniform sampler2D tLegend;
uniform float uCells;
uniform float uReflect;
uniform float uFloor;
uniform float uGlass;
uniform float uStem;
uniform float uCore;

const float KEY_H = 0.600;
const float TOP_HALF = 0.370;
const float CELL = 128.0;

vec3 tone(vec3 c) {
  c = (c * (2.51 * c + 0.03)) / (c * (2.43 * c + 0.59) + 0.14);
  return pow(clamp(c, 0.0, 1.0), vec3(1.0 / 2.2));
}

vec3 env(vec3 d) {
  vec3 c = mix(vec3(0.006, 0.007, 0.014), vec3(0.03, 0.033, 0.055), smoothstep(-0.2, 0.9, d.y));
  c += vec3(1.0, 0.97, 0.93) * smoothstep(0.86, 0.96, dot(d, normalize(vec3(-0.55, 0.78, 0.45)))) * 2.6;
  c += vec3(0.75, 0.8, 1.0) * smoothstep(0.94, 0.99, dot(d, normalize(vec3(0.85, 0.3, 0.25)))) * 1.1;
  c += uGlow * smoothstep(0.05, -0.55, d.y) * 0.95;
  return c;
}

void main() {
  int f = int(vInfo.x + 0.5);
  float hover = vInfo.z;
  vec3 base = uCap[f] * vInfo.w;
  vec3 ink = uInk[f];
  float rough = f == 0 ? 0.36 : f == 1 ? 0.46 : f == 2 ? 0.06 : f == 3 ? 0.3 : 0.42;
  if (uStem > 0.5) { base = uCap[5]; rough = 0.5; }
  if (uCore > 0.5) { base = uCap[6]; rough = 0.55; }

  vec3 N = normalize(vNormal);
  if (!gl_FrontFacing) N = -N;
  vec3 V = normalize(uCam - vWorld);

  float hasLegend = step(0.0, vInfo.y) * (1.0 - uStem) * (1.0 - uCore);
  vec2 uv = vLocal.xz / (2.0 * TOP_HALF) + 0.5;
  float inside = step(0.0, uv.x) * step(0.0, uv.y) * step(uv.x, 1.0) * step(uv.y, 1.0);
  float top = smoothstep(KEY_H - 0.07, KEY_H - 0.035, vLocal.y) * inside * hasLegend;
  float id = floor(max(vInfo.y, 0.0) + 0.5);
  float row = floor((id + 0.5) / uCells);
  vec2 cell = vec2(id - row * uCells, row);
  vec2 auv = (cell + clamp(uv, 0.02, 0.98)) / uCells;
  float e = 1.5 / (uCells * CELL);
  float leg = texture(tLegend, auv).r * top;
  float gx = texture(tLegend, auv + vec2(e, 0.0)).r - texture(tLegend, auv - vec2(e, 0.0)).r;
  float gz = texture(tLegend, auv + vec2(0.0, e)).r - texture(tLegend, auv - vec2(0.0, e)).r;
  N = normalize(N + (normalize(vTx) * gx + normalize(vTz) * gz) * 0.45 * top);
  base = mix(base, ink, leg * (f == 2 ? 0.0 : 0.92));
  rough = mix(rough, 0.6, leg * 0.5);

  float ao = (uStem > 0.5 || uCore > 0.5) ? 0.55 : mix(0.28, 1.0, smoothstep(0.0, KEY_H * 0.85, vLocal.y));

  float ndv = max(dot(N, V), 0.0);
  float F = 0.04 + 0.96 * pow(1.0 - ndv, 5.0);
  float shin = mix(900.0, 22.0, rough);

  vec3 Ls[3];
  vec3 Cs[3];
  Ls[0] = normalize(vec3(-0.55, 0.85, 0.7));  Cs[0] = vec3(1.0, 0.96, 0.9) * 2.3;
  Ls[1] = normalize(vec3(0.2, -0.85, 0.5));   Cs[1] = uGlow * 1.5;
  Ls[2] = normalize(vec3(0.9, 0.35, -0.45));  Cs[2] = vec3(0.6, 0.68, 1.0) * 1.2;
  vec3 diff = vec3(0.0);
  vec3 spec = vec3(0.0);
  for (int i = 0; i < 3; i++) {
    float ndl = max(dot(N, Ls[i]), 0.0);
    vec3 H = normalize(Ls[i] + V);
    diff += Cs[i] * ndl;
    spec += Cs[i] * pow(max(dot(N, H), 0.0), shin) * (shin + 8.0) / 60.0 * ndl;
  }
  vec3 R = reflect(-V, N);
  vec3 envc = mix(env(R), env(N) * 0.5, rough);
  vec3 ambient = vec3(0.02, 0.022, 0.035) + uGlow * 0.06 * max(-N.y, 0.0);

  vec3 col;
  float alpha = 1.0;
  if (uGlass > 0.5) {
    alpha = clamp(0.1 + F * 0.95 + leg * 0.8, 0.0, 1.0);
    vec3 body = base * (diff * 0.1 + 0.05);
    col = body * alpha + envc * F * 1.4 + spec * 0.09;
    col += ink * leg * (0.35 + diff.r * 0.25);
    col += uGlow * hover * (0.25 + F) * 0.6;
  } else {
    col = base * (diff * 0.3 + ambient) * ao;
    col += (spec * 0.05 * (1.0 - rough * 0.7) + envc * F * (1.0 - rough * 0.55)) * mix(0.5, 1.0, ao);
    col += uGlow * hover * (0.06 + F * 1.1) * 0.7;
    col += ink * leg * hover * 0.35;
  }

  vec3 outc = tone(col);
  if (uReflect > 0.5) {
    float fade = exp(-max(uFloor - vWorld.y, 0.0) * 1.5) * 0.3;
    fragColor = vec4(outc * fade * alpha, fade * alpha);
  } else if (uGlass > 0.5) {
    fragColor = vec4(outc, alpha);
  } else {
    fragColor = vec4(outc, 1.0);
  }
}
`;
