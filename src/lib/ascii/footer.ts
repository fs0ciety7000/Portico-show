/**
 * Footer scene: an engraved landscape at dusk. Mesas on the horizon, a low sun
 * ringed like a radar sweep, and a ruined portico on a stylobate, its central
 * arch still lit. A lone traveller walks the path with a lantern.
 *
 * Rendered once at build time into a static <pre>. Deterministic.
 */
import { type Grid, fbm, hash2, noise2, smoothstep } from './grid.ts';

type Put = (col: number, row: number, glyph: string, tone: number) => void;

export function renderFooter(grid: Grid): void {
  const { cols: C, rows: R, glyphs, tones } = grid;
  const put: Put = (col, row, glyph, tone) => {
    if (col < 0 || col >= C || row < 0 || row >= R) return;
    const i = row * C + col;
    glyphs[i] = glyph;
    tones[i] = tone;
  };
  const stamp = (col: number, row: number, art: string[], tone: number | ((ch: string, x: number) => number)) => {
    art.forEach((line, dy) => {
      [...line].forEach((ch, dx) => {
        if (ch === '`') return; // transparent
        put(col + dx, row + dy, ch, typeof tone === 'number' ? tone : tone(ch, dx));
      });
    });
  };

  const horizon = Math.round(R * 0.58);

  // 1. Sun, low behind the ruin, with dashed rings.
  const sunC = C * 0.26;
  const sunR = horizon - 4;
  const sunRad = R * 0.24;
  for (let row = 0; row < horizon; row++) {
    for (let col = 0; col < C; col++) {
      const dx = (col - sunC) * 0.6;
      const dy = (row - sunR) * 1.15;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d < sunRad) {
        if (row % 2 === 0) put(col, row, d < sunRad - 1 ? '-' : '.', 2);
        continue;
      }
      const ring = (d - sunRad) / 2.2;
      const k = Math.round(ring);
      if (k >= 1 && k <= 9 && Math.abs(ring - k) < 0.18) {
        const a = Math.atan2(dy, dx);
        if (hash2(Math.floor((a + 4) * (18 + k * 6)), k) < 0.85 - k * 0.06) put(col, row, k < 4 ? '-' : '.', k < 3 ? 2 : 1);
      } else if (hash2(col, row) < 0.004) {
        put(col, row, hash2(row, col) < 0.3 ? '+' : '.', 1);
      }
    }
  }

  // 2. Mesas on the horizon (flat tops, hatched faces).
  const ridge = (col: number, far: boolean) => {
    const x = col / C;
    const base = far ? 0.11 : 0.05;
    const n = fbm(x * (far ? 3.2 : 5.5) + (far ? 0 : 9), far ? 1.7 : 4.2, 4);
    const mesa = smoothstep(0.42, 0.55, n) * (far ? 0.16 : 0.08);
    return horizon - Math.round(R * (base * fbm(x * 9, 2) + mesa));
  };
  for (const far of [true, false]) {
    for (let col = 0; col < C; col++) {
      const top = ridge(col, far);
      const prev = ridge(col - 1, far);
      const next = ridge(col + 1, far);
      for (let row = top; row < horizon; row++) {
        let g = ' ';
        let tone = far ? 1 : 2;
        if (row === top) {
          g = next < top ? '/' : prev < top ? '\\' : '_';
          tone = far ? 2 : 3;
        } else if (prev < row && row <= top + (top - prev) && prev < top) {
          g = '\\';
        } else {
          const stripe = far ? (col + row * 2) % 5 === 0 : (col - row * 2) % 4 === 0;
          const cliff = noise2(col * 0.3, row * 0.5) > 0.55;
          g = stripe ? (far ? '/' : '\\') : cliff && row - top < 3 ? '|' : ' ';
          if (g === '|') tone = far ? 2 : 3;
        }
        put(col, row, g, tone);
      }
    }
  }

  // 3. Ground: shrubs and grass, denser and bigger towards the viewer.
  const pathX = (row: number) => {
    const depth = (row - horizon) / (R - horizon);
    return C * (0.6 - depth * 0.18) + Math.sin(depth * 5) * 4;
  };
  const pathW = (row: number) => 1 + ((row - horizon) / (R - horizon)) * 13;
  for (let row = horizon; row < R; row++) {
    const depth = (row - horizon) / (R - horizon);
    for (let col = 0; col < C; col++) {
      const onPath = Math.abs(col - pathX(row)) < pathW(row);
      if (onPath) {
        if (hash2(col, row) < 0.12) put(col, row, hash2(row, col) < 0.5 ? '.' : '_', 1);
        else put(col, row, ' ', 0);
        continue;
      }
      const clump = fbm(col * (0.11 - depth * 0.07), row * 0.23, 4);
      const h = hash2(col, row);
      if (clump > 0.66 - depth * 0.06) {
        const lit = noise2(col * 0.4, row * 0.6) > 0.5;
        const set = depth > 0.6 ? '=+*' : depth > 0.3 ? '+=-' : ':-';
        put(col, row, set[Math.floor(h * set.length)] ?? '#', lit ? 3 : 2);
      } else if (h < 0.04 + depth * 0.32) {
        const set = depth < 0.25 ? ".," : depth < 0.6 ? ".,'" : ".,':";
        put(col, row, set[Math.floor(hash2(row, col) * set.length)] ?? ',', depth > 0.7 && h < 0.2 ? 2 : 1);
      } else {
        put(col, row, ' ', 0);
      }
    }
  }

  // 4. The ruined portico on its stylobate.
  const colW = 5;
  const bay = 12;
  const archBay = 22;
  const nCols = 6;
  const templeW = colW * nCols + bay * (nCols - 2) + archBay;
  const left = Math.round(C * 0.6 - templeW / 2);
  const stylobate = horizon + 3;
  const colH = Math.round(R * 0.3);
  const capRow = stylobate - colH;
  const xs: number[] = [];
  let x = left;
  for (let k = 0; k < nCols; k++) {
    xs.push(x);
    x += colW + (k === 2 ? archBay : bay);
  }
  const tEnd = (xs[nCols - 1] ?? left) + colW;

  // Clear the temple silhouette so the hatching never shows through:
  // full height under the entablature, only the low ruins at both ends.
  const coreL = (xs[1] ?? left) - 3;
  const coreR = (xs[4] ?? left) + colW + 3;
  for (let row = capRow - 4; row <= stylobate + 2; row++) {
    for (let col = left - 4; col <= tEnd + 4; col++) {
      const core = col >= coreL && col <= coreR;
      const low = row >= stylobate - Math.round(colH * 0.45);
      if (core || low) put(col, row, ' ', 0);
    }
  }

  // Steps.
  for (let s = 0; s < 3; s++) {
    for (let col = left - 2 - s * 2; col <= tEnd + 1 + s * 2; col++) put(col, stylobate + s, s === 0 ? '=' : '_', s === 0 ? 3 : 2);
    put(left - 3 - s * 2, stylobate + s, '[', 2);
    put(tEnd + 2 + s * 2, stylobate + s, ']', 2);
  }

  // Columns: lit on the left, shaded on the right; two are broken.
  // Symmetric ruin: the outer columns are broken, the arch stays centred under the entablature.
  const broken: Record<number, number> = { 0: Math.round(colH * 0.38), 5: Math.round(colH * 0.2) };
  xs.forEach((cx, k) => {
    const h = broken[k] ?? colH;
    const top = stylobate - h;
    for (let row = top; row < stylobate; row++) {
      ['|', ':', '|', ':', '|'].forEach((g, dx) => put(cx + dx, row, g, dx < 2 ? 3 : dx === 2 ? 2 : 1));
    }
    put(cx - 1, stylobate - 1, '[', 2);
    put(cx + colW, stylobate - 1, ']', 2);
    if (h === colH) {
      stamp(cx - 1, top - 1, ['_[===]_'], 3);
    } else {
      // Jagged break.
      const jag = k === 0 ? ['`/\\_`'] : ['_/`\\'];
      stamp(cx, top - 1, jag, 2);
      // Fallen drums nearby.
      if (k === 5) stamp(cx + colW + 3, stylobate + 3, ['(=|:|=)'], (_, i) => (i < 3 ? 3 : 2));
    }
  });

  // Entablature over the standing columns (ends broken after column 4).
  const entEnd = (xs[4] ?? left) + colW + 2;
  const entStart = (xs[1] ?? left) - 2;
  for (let col = entStart; col <= entEnd; col++) {
    const ragged = col > entEnd - 4 || col < entStart + 3 ? hash2(col, 1) < 0.5 : false;
    put(col, capRow - 2, '=', 3);
    if (!ragged) put(col, capRow - 3, (col - entStart) % 6 < 3 ? '|' : ' ', 2);
    if (!ragged || col < entEnd - 2) put(col, capRow - 4, '"', 2);
  }

  // The arch in the wide bay, its doorway glowing.
  const aL = (xs[2] ?? left) + colW + 3;
  const aR = (xs[3] ?? left) - 4;
  const aMid = (aL + aR) / 2;
  const aRadius = (aR - aL) / 2;
  const springRow = capRow + Math.round(colH * 0.25);
  for (let row = capRow - 1; row < stylobate; row++) {
    for (let col = aL; col <= aR; col++) {
      const dx = (col - aMid) * 0.6;
      const dy = row - springRow;
      const inside = dy >= 0 || Math.sqrt(dx * dx + dy * dy) < aRadius * 0.6;
      const edge = col === aL || col === aR;
      if (dy < 0) {
        const d = Math.sqrt(dx * dx + dy * dy);
        if (Math.abs(d - aRadius * 0.6) < 0.6) put(col, row, col < aMid ? '/' : '\\', 4);
        else if (inside) put(col, row, hash2(col, row) < 0.35 ? '.' : ' ', 4);
      } else if (edge) {
        put(col, row, '|', 4);
      } else if (inside) {
        const glow = smoothstep(stylobate, springRow, row);
        put(col, row, hash2(col, row) < 0.2 + (1 - glow) * 0.4 ? (row > stylobate - 3 ? ':' : '.') : ' ', 4);
      }
    }
  }

  // 5. A traveller with a lantern on the path.
  const fr = Math.round(horizon + (R - horizon) * 0.55);
  const fc = Math.round(pathX(fr)) - 2;
  stamp(fc, fr, ['`o`*', '/|\\|', '`|``', '/`\\`'], (ch) => (ch === '*' ? 4 : 3));
}
