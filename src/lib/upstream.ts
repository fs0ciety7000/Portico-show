/**
 * The state of the Portico repository, as last synced by scripts/sync-upstream.mjs
 * (GitHub Action every 30 min, see .github/workflows/sync-upstream.yml).
 * Everything that follows Portico's releases and plan is derived here, at build
 * time: no request leaves the visitor's browser.
 */
import data from '../data/upstream.json';
import arch from '../data/arch.json';
import type { Dict, InstallMethod, Platform, Status } from '../i18n/content.ts';

export type PhaseStatus = 'done' | 'wip' | 'next' | 'drop';

export interface Upstream {
  syncedAt: string;
  repo: string;
  release: { version: string; tag: string; name: string; date: string; url: string; assets: { name: string; size: number }[] } | null;
  distribution: {
    homebrew: { tap: string; formula: string | null; cask: string | null } | null;
    aur: Record<string, string | null> | null;
  };
  phases: { id: string; title: string; status: PhaseStatus; summary: string }[];
  mvp: { n: number; name: string; status: Status }[];
  tests: { total: number; interop: number | null; e2e: string | null } | null;
  later: { theme: string; items: string[] }[];
  evaluate: string[];
}

export const upstream = data as Upstream;
const REPO_URL = `https://github.com/${upstream.repo}`;

export const release = upstream.release;
export const version = release?.version ?? '';
export const releaseUrl = release?.url ?? `${REPO_URL}/releases`;
export const downloadBase = release ? `${REPO_URL}/releases/download/${release.tag}` : '';

/** `{v}`, `{date}`… placeholders. */
export function fill(text: string, vars: Record<string, string | number>): string {
  return text.replace(/\{(\w+)\}/g, (m, k: string) => (k in vars ? String(vars[k]) : m));
}

export function releaseDate(lang: 'fr' | 'en'): string {
  if (!release) return '';
  return new Intl.DateTimeFormat(lang === 'fr' ? 'fr-BE' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
    new Date(release.date),
  );
}

function size(bytes: number, lang: 'fr' | 'en'): string {
  const mb = bytes / 1024 / 1024;
  const n = mb >= 10 ? Math.round(mb).toString() : mb.toFixed(1);
  return lang === 'fr' ? `${n.replace('.', ',')} Mo` : `${n} MB`;
}

const asset = (re: RegExp) => release?.assets.find((a) => re.test(a.name));

/** Distribution channels: available only when the published package carries the current release. */
export const channels = {
  homebrew: !!release && upstream.distribution.homebrew?.formula === version,
  homebrewCask: !!release && upstream.distribution.homebrew?.cask === version,
  aur: !!release && Object.values(upstream.distribution.aur ?? {}).some((v) => v?.startsWith(`${version}-`) ?? false),
  /** PKGBUILDs rendered by scripts/render-arch.sh and served under /arch/ (while the AUR is out of reach). */
  arch: !!release && arch.version === version,
};

const SITE = (import.meta.env.SITE as string | undefined)?.replace(/\/$/, '') ?? 'https://portico.dessenius.be';

/** Install guide, rebuilt from the files of the latest release. */
export function platforms(t: Dict): Platform[] {
  const i = t.install;
  const lang = t.lang as 'fr' | 'en';
  const url = (name: string) => `${downloadBase}/${name}`;
  const tarball = (target: string) => {
    const a = asset(new RegExp(`^portico-[^-]+-${target.replace(/[.]/g, '\\.')}\\.tar\\.gz$`));
    if (!a) return null;
    const dir = a.name.replace(/\.tar\.gz$/, '');
    return `curl -L ${url(a.name)} | tar xz && sudo install ${dir}/portico /usr/local/bin/`;
  };
  const steps = (pairs: [string, string | null][]) => pairs.filter((p): p is [string, string] => !!p[1]).map(([k, cmd]) => ({ k, cmd }));

  const mac: InstallMethod[] = [];
  const brewTap = upstream.distribution.homebrew?.tap ?? 'fs0ciety7000/portico';
  mac.push({
    k: 'Homebrew',
    s: channels.homebrew ? 'ok' : 'soon',
    note: channels.homebrew ? i.notes.brew : i.notes.brewSoon,
    steps: steps([
      ['TUI', `brew install ${brewTap}/portico`],
      ['GUI', `brew install --cask ${brewTap}/portico`],
    ]),
  });
  const dmg = asset(/_universal(-unsigned|-not-notarized)?\.dmg$/);
  if (dmg) {
    const unsigned = /-unsigned|-not-notarized/.test(dmg.name);
    mac.push({
      k: i.names.dmg,
      s: 'ok',
      note: unsigned ? i.notes.dmgUnsigned : i.notes.dmg,
      files: [{ name: dmg.name, size: size(dmg.size, lang), href: url(dmg.name) }],
      steps: unsigned ? [{ k: i.labels.allow, cmd: 'xattr -dr com.apple.quarantine /Applications/Portico.app' }] : [],
    });
  }
  const macTui = steps([
    ['Apple Silicon', tarball('aarch64-apple-darwin')],
    ['Intel', tarball('x86_64-apple-darwin')],
  ]);
  if (macTui.length) mac.push({ k: i.names.tui, s: 'ok', note: i.notes.tuiMac, steps: macTui });

  const linux: InstallMethod[] = [];
  const deb = (arch: string) => {
    const a = asset(new RegExp(`_${arch}\\.deb$`));
    return a ? `curl -LO ${url(a.name)} && sudo apt install ./${a.name}` : null;
  };
  const debSteps = steps([
    ['x86_64', deb('amd64')],
    ['arm64', deb('arm64')],
  ]);
  if (debSteps.length) linux.push({ k: i.names.deb, s: 'ok', note: i.notes.deb, steps: debSteps });
  if (channels.aur) {
    linux.push({
      k: 'Arch Linux (AUR)',
      s: 'ok',
      note: i.notes.aur,
      steps: steps([
        ['TUI', 'yay -S portico-bin'],
        ['GUI', 'yay -S portico-gui-bin'],
      ]),
    });
  }
  if (channels.arch) {
    const pkgbuild = (pkg: string) => `mkdir -p ${pkg} && cd ${pkg} && curl -LO ${SITE}/arch/${pkg}/PKGBUILD && makepkg -si`;
    linux.push({
      k: i.names.arch,
      s: 'ok',
      note: channels.aur ? i.notes.archAlt : i.notes.arch,
      files: arch.packages.map((pkg) => ({ name: `${pkg}/PKGBUILD`, size: `v${arch.version}`, href: `/arch/${pkg}/PKGBUILD` })),
      steps: steps([
        ['TUI', pkgbuild('portico-bin')],
        ['GUI', pkgbuild('portico-gui-bin')],
      ]),
    });
  }
  const appimage = (arch: string) => {
    const a = asset(new RegExp(`_${arch}\\.AppImage$`));
    return a ? `curl -LO ${url(a.name)} && chmod +x ${a.name} && ./${a.name}` : null;
  };
  const appSteps = steps([
    ['x86_64', appimage('amd64')],
    ['aarch64', appimage('aarch64')],
  ]);
  if (appSteps.length) linux.push({ k: 'AppImage', s: 'ok', note: i.notes.appimage, steps: appSteps });
  const linTui = steps([
    ['glibc', tarball('x86_64-unknown-linux-gnu')],
    ['musl', tarball('x86_64-unknown-linux-musl')],
  ]);
  if (linTui.length) linux.push({ k: i.names.tui, s: 'ok', note: i.notes.tuiLinux, steps: linTui });

  const source: InstallMethod[] = [
    {
      k: i.names.source,
      s: 'ok',
      note: i.notes.source,
      steps: [
        { k: i.labels.clone, cmd: `git clone --branch ${release?.tag ?? 'main'} ${REPO_URL} && cd Portico` },
        { k: 'TUI', cmd: 'cargo install --locked --path apps/portico-tui' },
        { k: 'GUI', cmd: 'cd apps/portico-gui && pnpm install --frozen-lockfile && pnpm tauri build' },
      ],
    },
  ];

  return [
    { id: 'macos', name: 'macOS', methods: mac },
    { id: 'linux', name: 'Linux', methods: linux },
    { id: 'source', name: i.names.sourceTab, methods: source },
  ];
}

export const sumsUrl = release?.assets.some((a) => a.name === 'SHA256SUMS') ? `${downloadBase}/SHA256SUMS` : releaseUrl;

/** Phase list for the roadmap: statuses from PLAN.md, copy from the dictionary (PLAN title as a fallback). */
export function roadmap(t: Dict) {
  return upstream.phases.map((p) => {
    const copy = t.roadmap.copy[p.id];
    const title = p.title.charAt(0).toUpperCase() + p.title.slice(1);
    return { n: p.id, s: p.status, t: copy?.t ?? title, d: copy?.d ?? p.summary };
  });
}

export function phaseStatus(id: string): PhaseStatus | undefined {
  return upstream.phases.find((p) => p.id === id)?.status;
}

/** "Ensuite": the "Roadmap au-delà" table of PLAN.md, themes translated when the dictionary knows them. */
export function later(t: Dict) {
  return upstream.later.map((l) => ({ theme: t.roadmap.themes[l.theme] ?? l.theme, items: t.lang === 'fr' ? l.items : [] }));
}
