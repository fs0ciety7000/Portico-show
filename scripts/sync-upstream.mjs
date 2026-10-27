#!/usr/bin/env node
// Reads the state of the Portico repository and writes src/data/upstream.json,
// the only source the site uses for: latest release (version, date, files),
// distribution channels (Homebrew tap, AUR), phase statuses, MVP matrix,
// test counts and the "after that" roadmap.
//
// - No dependency; Node 22+ (global fetch).
// - Writes the file only when something other than `syncedAt` changed, and
//   prints `changed` or `unchanged` so CI can decide whether to commit.
// - A failed request never erases data: the previous value is kept.
//
// Usage: node scripts/sync-upstream.mjs        (GITHUB_TOKEN optional, raises the rate limit)

import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const REPO = 'fs0ciety7000/Portico';
const TAP = 'fs0ciety7000/homebrew-portico';
const AUR = ['portico-bin', 'portico-gui-bin'];
const SCOOP = 'fs0ciety7000/scoop-portico';
const OUT = fileURLToPath(new URL('../src/data/upstream.json', import.meta.url));

const headers = { 'User-Agent': 'portico-show-sync', Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;

async function get(url, json = true) {
  const res = await fetch(url, { headers });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
  return json ? res.json() : res.text();
}

// ---------- Release ----------

async function release() {
  const r = await get(`https://api.github.com/repos/${REPO}/releases/latest`);
  if (!r) return null;
  return {
    version: r.tag_name.replace(/^v/, ''),
    tag: r.tag_name,
    name: r.name,
    date: r.published_at,
    url: r.html_url,
    assets: r.assets.filter((a) => !a.name.endsWith('.sha256')).map((a) => ({ name: a.name, size: a.size })),
  };
}

// ---------- Distribution ----------

async function homebrew() {
  const pick = async (path) => {
    const f = await get(`https://raw.githubusercontent.com/${TAP}/HEAD/${path}`, false).catch(() => null);
    const v = f && /releases\/download\/v([0-9][^/]*)\//.exec(f);
    const cv = f && /version\s+"([^"]+)"/.exec(f);
    return v?.[1] ?? cv?.[1] ?? null;
  };
  return { tap: TAP.replace('/homebrew-', '/'), formula: await pick('Formula/portico.rb'), cask: await pick('Casks/portico.rb') };
}

// Scoop bucket (TUI) and winget (GUI and TUI): published when they carry a version.
async function scoop() {
  const f = await get(`https://raw.githubusercontent.com/${SCOOP}/HEAD/bucket/portico.json`).catch(() => null);
  return { bucket: SCOOP, version: f?.version ?? null };
}

async function winget() {
  const versions = async (id) => {
    const list = await get(`https://api.github.com/repos/microsoft/winget-pkgs/contents/manifests/${id[0].toLowerCase()}/${id.replace('.', '/')}`);
    return Array.isArray(list) ? list.map((e) => e.name).filter((n) => /^\d+\.\d+\.\d+$/.test(n)) : [];
  };
  const latest = (vs) => vs.sort((a, b) => a.localeCompare(b, undefined, { numeric: true })).pop() ?? null;
  return { gui: latest(await versions('fs0ciety7000.Portico')), tui: latest(await versions('fs0ciety7000.PorticoTUI')) };
}

async function aur() {
  const q = AUR.map((n) => `arg[]=${n}`).join('&');
  const d = await get(`https://aur.archlinux.org/rpc/v5/info?${q}`);
  const out = {};
  for (const n of AUR) out[n] = d?.results?.find((x) => x.Name === n)?.Version ?? null;
  return out;
}

// ---------- PLAN.md ----------

const STATUS = [
  ['✅', 'done'],
  ['🔄', 'wip'],
  ['🚧', 'wip'],
  ['🔜', 'wip'],
  ['⏳', 'next'],
  ['❌', 'drop'],
];
const statusOf = (s) => STATUS.find(([e]) => s.includes(e))?.[1] ?? 'next';

const clean = (s) =>
  s
    .replace(/^\[[ x]\]\s*/, '')
    .replace(/\*\(.*?\)\*/g, '')
    .replace(/\*\*|`|\*/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Split a "Contenu" cell on top-level commas / semicolons (not inside parentheses). */
function splitItems(cell) {
  const items = [];
  let depth = 0;
  let cur = '';
  for (const ch of cell) {
    if (ch === '(') depth++;
    if (ch === ')') depth = Math.max(0, depth - 1);
    if ((ch === ',' || ch === ';') && depth === 0) {
      items.push(cur);
      cur = '';
    } else cur += ch;
  }
  items.push(cur);
  return items
    .map((x) => clean(x.replace(/\(.*?\)/g, '')))
    .filter(Boolean)
    .map((x) => x.charAt(0).toUpperCase() + x.slice(1));
}

function table(md, heading) {
  const i = md.indexOf(heading);
  if (i < 0) return [];
  const rows = [];
  for (const line of md.slice(i).split('\n').slice(1)) {
    if (!line.startsWith('|')) {
      if (rows.length) break;
      continue;
    }
    const cells = line.split('|').slice(1, -1).map((c) => c.trim());
    if (cells.every((c) => /^-+$/.test(c))) continue;
    rows.push(cells);
  }
  return rows.slice(1); // drop the header row
}

function plan(md) {
  const phases = [];
  const re = /^#{2,3} Phase ([0-9]+[a-z]?)\s*:\s*(.+)$/gm;
  let m;
  while ((m = re.exec(md))) {
    const [, id, rest] = m;
    const title = clean(rest.replace(/[✅🔄🚧🔜⏳❌]/gu, '').replace(/\*\(.*$/, ''));
    // First bullet of the section, as a fallback description for phases the site has no copy for.
    const body = md.slice(m.index + m[0].length).split(/\n#{2,3} /)[0];
    const bullet = /^- (.+)$/m.exec(body)?.[1] ?? '';
    phases.push({ id, title, status: statusOf(rest), summary: clean(bullet).slice(0, 180) });
  }
  const order = (id) => parseInt(id, 10) * 10 + (id.match(/[a-z]$/) ? id.charCodeAt(id.length - 1) - 96 : 0);
  phases.sort((a, b) => order(a.id) - order(b.id));

  const mvp = table(md, '### Matrice de sortie du MVP').map(([n, name, tui, gui]) => ({
    n: Number(n),
    name: clean(name),
    status: tui.includes('✅') && gui.includes('✅') ? 'done' : tui.includes('✅') || gui.includes('✅') ? 'wip' : 'next',
  }));

  // Tests: the finished rows of the dashboard ("780 + 95 GUI + interop (13 scénarios) + E2E bureau 22/22"),
  // the largest suite wins (phases are not always closed in numeric order).
  const board = table(md, '## Tableau de bord').filter((r) => (r[1] ?? '').trim().startsWith('✅') && /\d/.test(r[2] ?? ''));
  const cell = (r) => r[2] ?? '';
  const total = (c) => Number(/^\s*(\d+)/.exec(c)?.[1] ?? 0) + Number(/(\d+)\s*GUI/.exec(c)?.[1] ?? 0);
  const best = board.map(cell).sort((a, b) => total(b) - total(a))[0] ?? '';
  const lastOf = (re) => board.map(cell).map((c) => re.exec(c)?.[1]).filter(Boolean).pop() ?? null;
  const tests = {
    total: total(best),
    interop: Number(lastOf(/interop[^(]*\((\d+)\s*sc/)) || null,
    e2e: lastOf(/E2E[^0-9]*(\d+\/\d+)/),
  };

  // A phase still open in its heading but with a part shipped ("⏳ S1 livrée en 0.6.0") is in progress.
  for (const row of table(md, '## Tableau de bord')) {
    const id = /^(\d+[a-z]?)\b/.exec(row[0] ?? '')?.[1];
    const phase = phases.find((p) => p.id === id);
    if (phase && phase.status === 'next' && /livr|shipped/i.test(row[1] ?? '')) phase.status = 'wip';
  }

  const later = table(md, '## Roadmap au-delà').map(([theme, content]) => ({ theme: clean(theme), items: splitItems(content ?? '') }));
  const evaluate = table(md, '### À évaluer séparément').map(([subject]) => clean(subject));

  return { phases, mvp, tests, later, evaluate };
}

// ---------- Main ----------

const previous = existsSync(OUT) ? JSON.parse(readFileSync(OUT, 'utf8')) : {};
const settle = async (name, fn) => {
  try {
    return await fn();
  } catch (e) {
    console.error(`warning: ${name}: ${e.message}; keeping the previous value`);
    return undefined;
  }
};

const rel = await settle('release', release);
const brew = await settle('homebrew', homebrew);
const arch = await settle('aur', aur);
const scp = await settle('scoop', scoop);
const wg = await settle('winget', winget);
const md = await settle('plan', () => get(`https://raw.githubusercontent.com/${REPO}/HEAD/docs/PLAN.md`, false));
const parsed = md ? plan(md) : undefined;

const next = {
  repo: REPO,
  release: rel ?? previous.release ?? null,
  distribution: {
    homebrew: brew ?? previous.distribution?.homebrew ?? null,
    aur: arch ?? previous.distribution?.aur ?? null,
    scoop: scp ?? previous.distribution?.scoop ?? null,
    winget: wg ?? previous.distribution?.winget ?? null,
  },
  phases: parsed?.phases ?? previous.phases ?? [],
  mvp: parsed?.mvp ?? previous.mvp ?? [],
  tests: parsed?.tests ?? previous.tests ?? null,
  later: parsed?.later ?? previous.later ?? [],
  evaluate: parsed?.evaluate ?? previous.evaluate ?? [],
};

const strip = ({ syncedAt: _ignored, ...rest }) => JSON.stringify(rest);
if (strip(previous) === strip(next)) {
  console.log('unchanged');
} else {
  writeFileSync(OUT, `${JSON.stringify({ syncedAt: new Date().toISOString(), ...next }, null, 2)}\n`);
  console.log('changed');
}
