/**
 * Hero scene: the Portico mark (entablature, two fluted columns, an arch)
 * drawn in glyphs, with an engraved vortex turning around the doorway.
 * The doorway itself streams key-exchange-like hex: the threshold where a
 * session opens.
 *
 * `renderHero` is pure: the build calls it at t = 0 for the static fallback,
 * the browser calls it every frame on a canvas.
 */
import { CELL_ASPECT, type Grid, hash2, noise2, segDist, smoothstep, strokeGlyph } from './grid.ts';

// Mark geometry, in the 512-unit space of design/portico-mark.svg.
const STROKE = 22;
const H_BARS: [number, number, number][] = [
  [116, 396, 150],
  [136, 376, 186],
  [116, 396, 412],
];
const COLUMNS: [number, number, number][] = [
  [160, 186, 392],
  [352, 186, 392],
];
const ARCH = { cx: 256, cy: 290, r: 48, left: 208, right: 304, bottom: 392 };
const MARK_TOP = 139;
const MARK_BOTTOM = 423;

const HEX = '0123456789abcdef';

export interface HeroOptions {
  /** Seconds. */
  t: number;
  /** Mark height as a share of the grid height. */
  scale?: number;
  /** Pointer offset in [-1, 1], bends the vortex slightly. */
  px?: number;
  py?: number;
}

export function renderHero(grid: Grid, opts: HeroOptions): void {
  const { cols, rows, glyphs, tones } = grid;
  const t = opts.t;
  const widthEm = cols * CELL_ASPECT;
  const heightEm = rows;
  const markScale = ((opts.scale ?? 0.5) * heightEm) / (MARK_BOTTOM - MARK_TOP);
  // Mark → em transform (centred).
  const ox = widthEm / 2 - 256 * markScale;
  const oy = heightEm / 2 - ((MARK_TOP + MARK_BOTTOM) / 2) * markScale;
  const toMarkX = (u: number) => (u - ox) / markScale;
  const toMarkY = (v: number) => (v - oy) / markScale;
  // Vortex centre: inside the doorway.
  const vcx = 256 * markScale + ox + (opts.px ?? 0) * 1.2;
  const vcy = 340 * markScale + oy + (opts.py ?? 0) * 0.8;
  const reach = Math.max(widthEm, heightEm) * 0.62;
  const half = STROKE / 2;
  const pad = half + 7;
  const arms = 12;
  const twist = 15;
  const spin = t * 0.35;
  const hexTick = Math.floor(t * 9);

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const i = row * cols + col;
      const u = (col + 0.5) * CELL_ASPECT;
      const v = row + 0.5;
      const mx = toMarkX(u);
      const my = toMarkY(v);

      // 1. The mark.
      let glyph = '';
      let near = Infinity;
      for (const [x0, x1, y] of H_BARS) {
        const d = segDist(mx, my, x0, y, x1, y);
        near = Math.min(near, d);
        if (d <= half) glyph = my < y - half / 3 ? '"' : my > y + half / 3 ? '"' : '=';
      }
      for (const [x, y0, y1] of COLUMNS) {
        const d = segDist(mx, my, x, y0, x, y1);
        near = Math.min(near, d);
        if (d <= half) glyph = Math.abs(mx - x) > half * 0.55 ? ':' : '|';
      }
      // Arch legs and crown.
      const legL = segDist(mx, my, ARCH.left, ARCH.cy, ARCH.left, ARCH.bottom);
      const legR = segDist(mx, my, ARCH.right, ARCH.cy, ARCH.right, ARCH.bottom);
      const dxA = mx - ARCH.cx;
      const dyA = my - ARCH.cy;
      const rA = Math.sqrt(dxA * dxA + dyA * dyA);
      const crown = my <= ARCH.cy ? Math.abs(rA - ARCH.r) : Infinity;
      near = Math.min(near, legL, legR, crown);
      if (legL <= half || legR <= half) glyph = '|';
      else if (crown <= half) glyph = strokeGlyph(Math.atan2(dyA, dxA) + Math.PI / 2);

      if (glyph) {
        glyphs[i] = glyph;
        tones[i] = 4;
        continue;
      }

      // 2. The doorway: streaming hex, brighter towards the threshold.
      const inDoor =
        mx > ARCH.left + half + 3 &&
        mx < ARCH.right - half - 3 &&
        my < ARCH.bottom &&
        (my > ARCH.cy || rA < ARCH.r - half - 3);
      if (inDoor) {
        const flow = hash2(col, row - hexTick);
        const depth = smoothstep(ARCH.cy - ARCH.r, ARCH.bottom, my);
        if (flow < 0.35 + depth * 0.45) {
          glyphs[i] = HEX[Math.floor(hash2(col * 7 + hexTick, row) * 16)] ?? '0';
          tones[i] = depth > 0.55 ? 3 : 2;
        } else {
          glyphs[i] = ' ';
          tones[i] = 0;
        }
        continue;
      }

      // Keep a quiet margin around the strokes.
      if (near < pad) {
        glyphs[i] = ' ';
        tones[i] = 0;
        continue;
      }

      // 3. Engraved vortex.
      const dx = u - vcx;
      const dy = v - vcy;
      const r = Math.sqrt(dx * dx + dy * dy) + 1e-3;
      const theta = Math.atan2(dy, dx);
      const phase = theta * arms + Math.log(r + 1) * twist - spin * arms;
      const streak = Math.cos(phase);
      const dash = noise2(r * 0.9 - t * 0.6, theta * 3.1);
      const env = smoothstep(reach, reach * 0.18, r) * smoothstep(1.2, 6, r);
      const ink = smoothstep(0.5, 0.98, streak) * (0.25 + dash * 1.1) * env;

      if (ink > 0.16) {
        // Streak direction ⟂ phase gradient.
        const gx = (arms * -dy) / (r * r) + (twist * dx) / (r * (r + 1));
        const gy = (arms * dx) / (r * r) + (twist * dy) / (r * (r + 1));
        glyphs[i] = strokeGlyph(Math.atan2(gy, gx) + Math.PI / 2);
        tones[i] = ink > 0.62 ? 3 : ink > 0.34 ? 2 : 1;
      } else if (hash2(col, row) < 0.012 * (1 - env * 0.5)) {
        glyphs[i] = '.';
        tones[i] = 1;
      } else {
        glyphs[i] = ' ';
        tones[i] = 0;
      }
    }
  }
}
