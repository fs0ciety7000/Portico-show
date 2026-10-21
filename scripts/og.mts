/**
 * Generates Open Graph cards and PNG icons from the ASCII hero scene.
 * Run: node scripts/og.mts (needs Playwright with a Chromium; dev-only, not part of the build).
 */
import { readFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { createGrid, gridToHtml } from '../src/lib/ascii/grid.ts';
import { renderHero } from '../src/lib/ascii/hero.ts';

const font = (f: string) => `data:font/woff2;base64,${readFileSync(new URL(`../public/fonts/${f}`, import.meta.url)).toString('base64')}`;
const grid = createGrid(78, 52);
renderHero(grid, { t: 1.3, scale: 0.55 });
const art = gridToHtml(grid);
const css = `
@font-face{font-family:G;src:url(${font('geist.woff2')})}
@font-face{font-family:J;src:url(${font('jetbrains-mono.woff2')})}
body{margin:0;width:1200px;height:630px;background:#0b0c0e;color:#ece9e2;font-family:G;display:flex;overflow:hidden}
.l{flex:1;padding:72px 0 64px 72px;display:flex;flex-direction:column}
.k{font:500 15px J;letter-spacing:.08em;text-transform:uppercase;color:#6c6a65}
h1{font:500 76px/0.98 G;letter-spacing:-.045em;margin:28px 0 0}h1 span{color:#a8a59d;display:block}
.w{margin-top:auto;display:flex;align-items:center;gap:14px;font:500 20px G;letter-spacing:.28em;color:#ece9e2}
.tags{font:400 17px J;color:#c8a96b;margin-top:26px}
pre{margin:0;font:400 11.6px/1 J;color:#6c6a65;align-self:center;margin-right:40px}
b{font-weight:400}.t1{color:#34363a}.t2{color:#6c6a65}.t3{color:#a8a59d}.t4{color:#c8a96b;font-weight:600}`;
const mark = `<svg width="30" height="30" viewBox="96 120 320 312" fill="none" stroke="#c8a96b" stroke-width="26" stroke-linecap="square"><path d="M116 150H396M136 186H376M160 186V392M352 186V392M208 392V290A48 48 0 0 1 304 290V392M116 412H396"/></svg>`;
const card = (k: string, a: string, b: string) => `<style>${css}</style><div class="l"><div class="k">${k}</div><h1>${a}<span>${b}</span></h1><div class="tags">{rust} {local-first} {tui+gui}</div><div class="w">${mark}PORTICO</div></div><pre>${art}</pre>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
for (const [lang, k, a, b] of [
  ['fr', 'Client SSH · Rust · macOS & Linux', 'Le portique', 'de vos serveurs.'],
  ['en', 'SSH client · Rust · macOS & Linux', 'The gateway', 'to your servers.'],
]) {
  await page.setContent(card(k!, a!, b!));
  await page.waitForTimeout(200);
  await page.screenshot({ path: `public/og-${lang}.png` });
}
const icon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8');
for (const size of [32, 180, 192, 512]) {
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<style>body{margin:0;background:transparent}svg{width:${size}px;height:${size}px;display:block}</style>${icon}`);
  const name = size === 32 ? 'favicon-32.png' : size === 180 ? 'apple-touch-icon.png' : `icon-${size}.png`;
  await page.screenshot({ path: `public/${name}`, omitBackground: true });
}
await browser.close();
