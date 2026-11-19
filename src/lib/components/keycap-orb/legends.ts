import { CELL, type Keycap, type KeycapFinish, type KeycapIcon } from './geometry';

export const FINISH_ID: Record<KeycapFinish, number> = { ink: 0, ash: 1, glass: 2, cobalt: 3, lime: 4 };

export const DEFAULT_PALETTE: Record<KeycapFinish, { cap: string; legend: string }> = {
  ink: { cap: '#17181d', legend: '#c9cdd9' },
  ash: { cap: '#b3b7c1', legend: '#1c2352' },
  glass: { cap: '#a9bcff', legend: '#3a50ff' },
  cobalt: { cap: '#2633d4', legend: '#141c8f' },
  lime: { cap: '#9aa53a', legend: '#1b1e0e' },
};

/** Centre first; the ring order puts HTML · CSS · JS across the middle row. */
export const DEFAULT_KEYS: Keycap[] = [
  { label: 'CSS', finish: 'cobalt', hotkey: 'c' },
  { label: 'HTML', finish: 'ink', hotkey: 'h' },
  { icon: 'slash', finish: 'ash' },
  { label: 'JS', finish: 'ink', hotkey: 'j' },
  { icon: 'bolt', finish: 'ash' },
  { icon: 'quote', finish: 'ink' },
  { icon: 'at', finish: 'glass' },
  { icon: 'gear', finish: 'ink' },
  { icon: 'search', finish: 'ink' },
  { icon: 'pen', finish: 'ash' },
  { icon: 'braces', finish: 'ink' },
  { icon: 'check', finish: 'lime' },
  { icon: 'folder', finish: 'ash' },
  { icon: 'frame', finish: 'ash' },
  { icon: 'chevrons', finish: 'ash' },
  { icon: 'shield', finish: 'ash' },
  { icon: 'cube', finish: 'glass' },
  { icon: 'code', finish: 'ink' },
  { icon: 'none', finish: 'ink' },
  { icon: 'hash', finish: 'cobalt' },
  { icon: 'terminal', finish: 'ink' },
  { icon: 'layers', finish: 'glass' },
  { icon: 'cursor', finish: 'ash' },
  { icon: 'none', finish: 'cobalt' },
  { icon: 'star', finish: 'ink' },
  { icon: 'none', finish: 'ash' },
  { icon: 'heart', finish: 'glass' },
  { icon: 'arrow', finish: 'ink' },
  { label: '⌘', finish: 'ash' },
  { icon: 'plus', finish: 'cobalt' },
  { icon: 'none', finish: 'glass' },
  { label: 'Esc', finish: 'lime' },
];

const gear = () => {
  let d = '';
  const teeth = 8;
  for (let i = 0; i < teeth; i++) {
    const c = (i / teeth) * Math.PI * 2;
    for (const [r, a] of [[7, c - 0.3], [9.4, c - 0.17], [9.4, c + 0.17], [7, c + 0.3]]) {
      d += (d ? 'L' : 'M') + (12 + Math.cos(a) * r).toFixed(2) + ' ' + (12 + Math.sin(a) * r).toFixed(2);
    }
  }
  return d + 'Z M15.2 12 A3.2 3.2 0 1 0 8.8 12 A3.2 3.2 0 1 0 15.2 12 Z';
};

/** 24-unit grid. "f:" marks a filled path; the rest are stroked with round caps. */
const ICONS: Record<Exclude<KeycapIcon, 'none'>, string[]> = {
  code: ['M8 7 L3 12 L8 17', 'M16 7 L21 12 L16 17', 'M14 4 L10 20'],
  braces: [
    'M9 4 C7 4 6.5 5 6.5 7 V9.8 C6.5 11 5.8 12 4.5 12 C5.8 12 6.5 13 6.5 14.2 V17 C6.5 19 7 20 9 20',
    'M15 4 C17 4 17.5 5 17.5 7 V9.8 C17.5 11 18.2 12 19.5 12 C18.2 12 17.5 13 17.5 14.2 V17 C17.5 19 17 20 15 20',
  ],
  chevrons: ['M9.5 6.5 L4 12 L9.5 17.5', 'M14.5 6.5 L20 12 L14.5 17.5'],
  frame: [
    'M6.5 6.5 H17.5 V17.5 H6.5 Z',
    'f:M4 4 H8 V8 H4 Z M16 4 H20 V8 H16 Z M4 16 H8 V20 H4 Z M16 16 H20 V20 H16 Z',
  ],
  quote: [
    'f:M10.5 6 C6.5 6.5 4.5 9 4.5 12.5 V18 H10.5 V12 H7.5 C7.7 10 8.8 8.8 10.5 8.5 Z M19.5 6 C15.5 6.5 13.5 9 13.5 12.5 V18 H19.5 V12 H16.5 C16.7 10 17.8 8.8 19.5 8.5 Z',
  ],
  slash: ['M15.5 3.5 L8.5 20.5'],
  at: [
    'M16 12 A4 4 0 1 1 8 12 A4 4 0 1 1 16 12',
    'M16 8 V13.5 C16 15.3 17 16.3 18.5 16.3 C20 16.3 21 14.8 21 12 A9 9 0 1 0 17.4 19.2',
  ],
  pen: ['M12 3 L18.5 12.5 L15 20.5 H9 L5.5 12.5 Z', 'M12 3 V10.5', 'M13.6 12 A1.6 1.6 0 1 1 10.4 12 A1.6 1.6 0 1 1 13.6 12'],
  check: ['M4.5 12.5 L9.8 17.8 L19.5 6.5'],
  search: ['M16.5 10.5 A6 6 0 1 1 4.5 10.5 A6 6 0 1 1 16.5 10.5', 'M15 15 L20 20'],
  bolt: ['f:M13.5 2.5 L5 13.5 H11 L10 21.5 L19 10 H13 Z'],
  gear: ['f:' + gear()],
  shield: ['M12 3 L19.5 6 V11.5 C19.5 16 16.5 19.5 12 21.5 C7.5 19.5 4.5 16 4.5 11.5 V6 Z'],
  folder: ['M3.5 7 C3.5 6 4.2 5.2 5.2 5.2 H9.4 L11.4 7.3 H18.8 C19.8 7.3 20.5 8 20.5 9 V17 C20.5 18 19.8 18.8 18.8 18.8 H5.2 C4.2 18.8 3.5 18 3.5 17 Z'],
  cube: ['M12 3 L19.8 7.5 V16.5 L12 21 L4.2 16.5 V7.5 Z', 'M4.2 7.5 L12 12 L19.8 7.5', 'M12 12 V21'],
  cursor: ['f:M5 3.5 L19 12 L12.6 13.4 L9.4 19.6 Z'],
  hash: ['M10 4 L8 20', 'M16 4 L14 20', 'M4.5 9 H20', 'M4 15 H19.5'],
  terminal: ['M5 7 L10 12 L5 17', 'M12.5 17.5 H19'],
  layers: ['M12 3.5 L20.5 8 L12 12.5 L3.5 8 Z', 'M3.5 12 L12 16.5 L20.5 12', 'M3.5 16 L12 20.5 L20.5 16'],
  star: ['f:M12 3 L14.6 8.9 L21 9.5 L16.2 13.8 L17.6 20.2 L12 16.9 L6.4 20.2 L7.8 13.8 L3 9.5 L9.4 8.9 Z'],
  heart: ['f:M12 20 C5 15.5 3 12.5 3 9.2 C3 6.6 5 4.6 7.5 4.6 C9.3 4.6 10.9 5.6 12 7.2 C13.1 5.6 14.7 4.6 16.5 4.6 C19 4.6 21 6.6 21 9.2 C21 12.5 19 15.5 12 20 Z'],
  arrow: ['M4.5 12 H19.5', 'M13.5 6 L19.5 12 L13.5 18'],
  plus: ['M12 5 V19', 'M5 12 H19'],
};

/** Characters that obviously belong to a glyph, for typing at the orb. */
export const ICON_KEYS: Partial<Record<string, KeycapIcon[]>> = {
  '/': ['slash'], '\\': ['slash'], '@': ['at'], '#': ['hash'], '{': ['braces'], '}': ['braces'],
  '<': ['code', 'chevrons'], '>': ['chevrons', 'code', 'terminal'], '"': ['quote'], "'": ['quote'],
  '?': ['search'], '+': ['plus'], '*': ['star'], $: ['terminal'],
};

export const legendKey = (k: Keycap) =>
  k.icon && k.icon !== 'none' ? 'i:' + k.icon : k.label && k.icon !== 'none' ? 't:' + k.label : '';

/** Every distinct legend, drawn white on black into one atlas. */
export const drawAtlas = (legends: string[]) => {
  const cells = Math.max(1, Math.ceil(Math.sqrt(legends.length)));
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = cells * CELL;
  const ctx = canvas.getContext('2d');
  if (!ctx) return { canvas, cells };
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#fff';
  ctx.strokeStyle = '#fff';
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  legends.forEach((id, n) => {
    const ox = (n % cells) * CELL;
    const oy = Math.floor(n / cells) * CELL;
    ctx.save();
    ctx.translate(ox, oy);
    if (id.startsWith('i:')) {
      const paths = ICONS[id.slice(2) as Exclude<KeycapIcon, 'none'>] ?? [];
      const s = (CELL * 0.66) / 24;
      ctx.translate(CELL * 0.17, CELL * 0.17);
      ctx.scale(s, s);
      ctx.lineWidth = 2.6;
      for (const p of paths) {
        if (p.startsWith('f:')) ctx.fill(new Path2D(p.slice(2)), 'evenodd');
        else ctx.stroke(new Path2D(p));
      }
    } else {
      const text = id.slice(2);
      let size = text.length <= 2 ? 64 : 46;
      const family = '"JetBrains Mono Variable", ui-monospace, system-ui, sans-serif';
      ctx.font = '700 ' + size + 'px ' + family;
      while (ctx.measureText(text).width > CELL * 0.78 && size > 14) {
        size -= 2;
        ctx.font = '700 ' + size + 'px ' + family;
      }
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, CELL / 2, CELL / 2 + size * 0.04);
    }
    ctx.restore();
  });
  return { canvas, cells };
};
