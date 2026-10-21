/**
 * Live ASCII renderer on a <canvas>. The static <pre> rendered at build time
 * stays in place until the first frame is drawn, and remains the fallback
 * without JavaScript.
 *
 * - One rAF loop per scene, paused off-screen and when the tab is hidden.
 * - prefers-reduced-motion: a single still frame, redrawn on resize/theme only.
 * - Colours come from the theme tokens and follow `portico:theme`.
 */
import { type Grid, CELL_ASPECT, createGrid, rowRuns } from '../lib/ascii/grid.ts';
import { token } from './theme.ts';

export interface SceneOptions {
  canvas: HTMLCanvasElement;
  /** Element whose size drives the grid. */
  box: HTMLElement;
  /** Font size in CSS px for a given box width. */
  fontSize: (width: number) => number;
  render: (grid: Grid, t: number, pointer: { x: number; y: number }) => void;
  /** Frames per second cap (glyph art does not need 60). */
  fps?: number;
  onFirstFrame?: () => void;
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, '$&$&') : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix(a: string, b: string, wa: number): string {
  const [r1, g1, b1] = hexToRgb(a);
  const [r2, g2, b2] = hexToRgb(b);
  const m = (x: number, y: number) => Math.round(x * wa + y * (1 - wa));
  return `rgb(${m(r1, r2)} ${m(g1, g2)} ${m(b1, b2)})`;
}

function palette(): string[] {
  const muted = token('--text-muted') || '#6c6a65';
  const base = token('--bg-base') || '#0b0c0e';
  return ['transparent', mix(muted, base, 0.55), muted, token('--text-secondary') || '#a8a59d', token('--accent') || '#c8a96b'];
}

export function mountScene(opts: SceneOptions): () => void {
  const { canvas, box, render } = opts;
  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return () => {};
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const frameMs = 1000 / (opts.fps ?? 24);
  let grid: Grid = createGrid(1, 1);
  let colors = palette();
  let fs = 12;
  let visible = false;
  let raf = 0;
  let last = 0;
  let started = performance.now();
  let first = true;
  const pointer = { x: 0, y: 0, tx: 0, ty: 0 };

  const resize = () => {
    const w = box.clientWidth;
    const h = box.clientHeight;
    if (w === 0 || h === 0) return;
    fs = opts.fontSize(w);
    const cols = Math.max(8, Math.floor(w / (fs * CELL_ASPECT)));
    const rows = Math.max(8, Math.floor(h / fs));
    grid = createGrid(cols, rows);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(cols * fs * CELL_ASPECT * dpr);
    canvas.height = Math.round(rows * fs * dpr);
    canvas.style.width = `${cols * fs * CELL_ASPECT}px`;
    canvas.style.height = `${rows * fs}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(performance.now());
  };

  const draw = (now: number) => {
    const t = reduced.matches ? 1.3 : (now - started) / 1000 + 1.3;
    pointer.x += (pointer.tx - pointer.x) * 0.06;
    pointer.y += (pointer.ty - pointer.y) * 0.06;
    render(grid, t, pointer);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'top';
    const cw = fs * CELL_ASPECT;
    // One fillText per run of same-tone glyphs, grouped by tone so font and colour change at most 4 times.
    const byTone: [number, number, string][][] = [[], [], [], [], []];
    for (let r = 0; r < grid.rows; r++) {
      let col = 0;
      for (const run of rowRuns(grid, r)) {
        if (run.tone !== 0 && run.text.trim()) byTone[run.tone]?.push([col, r, run.text]);
        col += run.text.length;
      }
    }
    byTone.forEach((runs, tone) => {
      if (tone === 0 || runs.length === 0) return;
      ctx.font = `${tone === 4 ? 600 : 400} ${fs}px "JetBrains Mono", monospace`;
      ctx.fillStyle = colors[tone] ?? colors[2] ?? 'gray';
      for (const [c, r, text] of runs) {
        // maxWidth pins each run to the grid even if the font's advance drifts slightly.
        ctx.fillText(text, c * cw, r * fs + fs * 0.08, text.length * cw);
      }
    });
    if (first) {
      first = false;
      opts.onFirstFrame?.();
    }
  };

  const loop = (now: number) => {
    raf = 0;
    if (!visible || reduced.matches || document.hidden) return;
    if (now - last >= frameMs) {
      last = now;
      draw(now);
    }
    raf = requestAnimationFrame(loop);
  };
  const kick = () => {
    if (!raf && visible && !reduced.matches && !document.hidden) raf = requestAnimationFrame(loop);
  };

  const ro = new ResizeObserver(resize);
  ro.observe(box);
  const io = new IntersectionObserver(([e]) => {
    visible = e?.isIntersecting ?? false;
    kick();
  });
  io.observe(box);
  const onTheme = () => {
    colors = palette();
    draw(performance.now());
  };
  const onMove = (e: PointerEvent) => {
    const r = box.getBoundingClientRect();
    pointer.tx = ((e.clientX - r.left) / r.width) * 2 - 1;
    pointer.ty = ((e.clientY - r.top) / r.height) * 2 - 1;
  };
  const onMotion = () => {
    started = performance.now();
    draw(started);
    kick();
  };
  window.addEventListener('portico:theme', onTheme);
  window.addEventListener('pointermove', onMove, { passive: true });
  document.addEventListener('visibilitychange', kick);
  reduced.addEventListener('change', onMotion);
  // Wait for the mono face so glyph metrics match the static fallback.
  void document.fonts.load(`400 12px "JetBrains Mono"`).then(resize);

  return () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    io.disconnect();
    window.removeEventListener('portico:theme', onTheme);
    window.removeEventListener('pointermove', onMove);
    document.removeEventListener('visibilitychange', kick);
    reduced.removeEventListener('change', onMotion);
  };
}
