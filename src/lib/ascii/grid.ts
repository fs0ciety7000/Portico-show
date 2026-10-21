/**
 * ASCII raster primitives shared by the build (static <pre> fallback) and the
 * browser (live canvas). Pure functions only: no DOM, no Node APIs.
 *
 * A grid is a list of cells. Each cell holds one glyph and a tone index:
 *   0 empty · 1 faint · 2 mid · 3 bright · 4 accent
 * Tones map to theme tokens in CSS (`.t1`…`.t4`) and on canvas.
 */

export type Tone = 0 | 1 | 2 | 3 | 4;

export interface Grid {
  cols: number;
  rows: number;
  glyphs: string[];
  tones: Uint8Array;
}

export function createGrid(cols: number, rows: number): Grid {
  return {
    cols,
    rows,
    glyphs: new Array<string>(cols * rows).fill(' '),
    tones: new Uint8Array(cols * rows),
  };
}

/** Width / height ratio of a monospace cell at `line-height: 1` (JetBrains Mono advance = 0.6em). */
export const CELL_ASPECT = 0.6;

export function clamp01(x: number): number {
  return x < 0 ? 0 : x > 1 ? 1 : x;
}

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** Deterministic hash → [0,1). Same output in Node and in the browser. */
export function hash2(x: number, y: number): number {
  let h = Math.imul(x | 0, 374761393) ^ Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

/** Smooth value noise in [0,1). */
export function noise2(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi);
  const b = hash2(xi + 1, yi);
  const c = hash2(xi, yi + 1);
  const d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}

export function fbm(x: number, y: number, octaves = 4): number {
  let sum = 0;
  let amp = 0.5;
  let f = 1;
  let norm = 0;
  for (let i = 0; i < octaves; i++) {
    sum += amp * noise2(x * f, y * f);
    norm += amp;
    amp *= 0.5;
    f *= 2;
  }
  return sum / norm;
}

/** Distance from point p to segment ab. */
export function segDist(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const len2 = dx * dx + dy * dy;
  const t = len2 === 0 ? 0 : clamp01(((px - ax) * dx + (py - ay) * dy) / len2);
  const cx = ax + t * dx - px;
  const cy = ay + t * dy - py;
  return Math.sqrt(cx * cx + cy * cy);
}

/** Map a line direction (radians) to the closest stroke glyph. */
export function strokeGlyph(angle: number): string {
  // Fold to [0, π).
  let a = angle % Math.PI;
  if (a < 0) a += Math.PI;
  const step = Math.PI / 8;
  if (a < step || a >= 7 * step) return '-';
  if (a < 3 * step) return '\\';
  if (a < 5 * step) return '|';
  return '/';
}

export interface Run {
  tone: Tone;
  text: string;
}

/** Group a row into runs of equal tone (compact HTML / fewer canvas calls). */
export function rowRuns(grid: Grid, row: number): Run[] {
  const runs: Run[] = [];
  const start = row * grid.cols;
  let tone = grid.tones[start] as Tone;
  let text = '';
  for (let c = 0; c < grid.cols; c++) {
    const i = start + c;
    const t = (grid.glyphs[i] === ' ' ? 0 : grid.tones[i]) as Tone;
    if (t !== tone && text.length > 0) {
      runs.push({ tone, text });
      text = '';
    }
    tone = t;
    text += grid.glyphs[i];
  }
  if (text.length > 0) runs.push({ tone, text });
  return runs;
}

const ESC: Record<string, string> = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

/** Serialize to HTML: one line per row, tones as `<b class="tN">` spans. */
export function gridToHtml(grid: Grid): string {
  const lines: string[] = [];
  for (let r = 0; r < grid.rows; r++) {
    let line = '';
    for (const run of rowRuns(grid, r)) {
      const text = run.text.replace(/[&<>"]/g, (ch) => ESC[ch] ?? ch);
      line += run.tone === 0 ? text : `<b class="t${run.tone}">${text}</b>`;
    }
    lines.push(line.replace(/\s+$/, ''));
  }
  return lines.join('\n');
}
