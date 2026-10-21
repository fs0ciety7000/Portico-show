/**
 * A faithful, scripted imitation of the Portico TUI (layout taken from real
 * tmux captures, see captures/tui-*.ans). Pure state + a renderer to styled
 * runs, so the build can print the first frame and the browser can drive it.
 *
 * Nothing here talks to a network: hosts, latencies and shell output are fixed.
 */

export type Phase = 'idle' | 'connecting' | 'authenticating' | 'connected' | 'error';
export type Mode = 'hosts' | 'search' | 'term' | 'help';

export interface Host {
  alias: string;
  user: string;
  host: string;
  port: number;
  tags: string[];
  fav?: boolean;
  jump?: string;
  forward?: string;
  line: number;
  rtt: number;
  fails?: string;
}

export const HOSTS: Host[] = [
  { alias: 'db-prod', user: 'postgres', host: '10.0.4.12', port: 22, tags: ['prod', 'db'], fav: true, jump: 'bastion', forward: '5432 localhost:5432', line: 12, rtt: 26 },
  { alias: 'bastion', user: 'ops', host: 'bastion.example.com', port: 2222, tags: ['infra'], line: 1, rtt: 18 },
  { alias: 'web-01', user: 'deploy', host: 'web-01.internal', port: 22, tags: ['prod', 'web'], jump: 'bastion', forward: '8080 localhost:80', line: 5, rtt: 23 },
  { alias: 'staging', user: 'deploy', host: 'staging.example.com', port: 22, tags: ['staging'], line: 1, rtt: 31 },
  { alias: 'nas', user: 'admin', host: 'nas.home.arpa', port: 22, tags: ['home'], fav: true, line: 52, rtt: 0, fails: 'nas.home.arpa' },
  { alias: 'api-01', user: 'deploy', host: 'api-01.internal', port: 22, tags: ['prod', 'api'], jump: 'bastion', line: 22, rtt: 24 },
  { alias: 'gitlab-runner', user: 'gitlab-runner', host: 'runner.example.com', port: 22, tags: ['ci'], line: 43, rtt: 41 },
  { alias: 'raspberry', user: 'pi', host: '192.168.1.42', port: 22, tags: ['home', 'iot'], line: 58, rtt: 4 },
  { alias: 'homelab-k3s', user: 'ubuntu', host: '192.168.1.60', port: 22, tags: ['home', 'k8s'], line: 64, rtt: 3 },
];

export const SPINNER = ['⣾', '⣽', '⣻', '⢿', '⡿', '⣟', '⣯', '⣷'];

export interface Session {
  phase: Phase;
  since: number;
  lines: string[];
  input: string;
}

export interface State {
  mode: Mode;
  sel: number;
  query: string;
  prefix: boolean;
  active: string | null;
  sessions: Record<string, Session>;
  theme: string;
  frame: number;
}

export function initialState(theme = 'Obsidian'): State {
  return { mode: 'hosts', sel: 0, query: '', prefix: false, active: null, sessions: {}, theme, frame: 0 };
}

/** Fuzzy-ish filter: `#tag`, `*` favourites, otherwise an ordered subsequence. */
export function visibleHosts(s: State): Host[] {
  const q = s.query.trim().toLowerCase();
  if (!q) return HOSTS;
  return HOSTS.filter((h) => {
    return q.split(/\s+/).every((term) => {
      if (term === '*') return h.fav === true;
      if (term.startsWith('#')) return h.tags.some((t) => t.startsWith(term.slice(1)));
      const hay = `${h.alias} ${h.user}@${h.host}`.toLowerCase();
      let i = 0;
      for (const ch of hay) if (ch === term[i]) i++;
      return i === term.length;
    });
  });
}

// ---------- Rendering to a cell buffer ----------

export interface Run {
  text: string;
  cls: string;
}

class Buffer {
  readonly cells: { ch: string; cls: string }[][];
  constructor(
    readonly cols: number,
    readonly rows: number,
  ) {
    this.cells = Array.from({ length: rows }, () => Array.from({ length: cols }, () => ({ ch: ' ', cls: '' })));
  }
  put(x: number, y: number, text: string, cls = '', max = Infinity): number {
    const row = this.cells[y];
    if (!row) return x;
    let i = 0;
    for (const ch of text) {
      if (i >= max) break;
      const cell = row[x + i];
      if (cell) {
        cell.ch = ch;
        cell.cls = cls;
      }
      i++;
    }
    return x + i;
  }
  fill(x: number, y: number, w: number, cls: string): void {
    const row = this.cells[y];
    if (!row) return;
    for (let i = 0; i < w; i++) {
      const cell = row[x + i];
      if (cell) cell.cls = cell.cls ? `${cell.cls} ${cls}` : cls;
    }
  }
  box(x: number, y: number, w: number, h: number, cls: string, title?: string, titleCls = ''): void {
    this.put(x, y, `╭${'─'.repeat(w - 2)}╮`, cls);
    for (let r = 1; r < h - 1; r++) {
      this.put(x, y + r, '│', cls);
      this.put(x + w - 1, y + r, '│', cls);
    }
    this.put(x, y + h - 1, `╰${'─'.repeat(w - 2)}╯`, cls);
    if (title) this.put(x + 1, y, ` ${title} `, titleCls);
  }
  runs(): Run[][] {
    return this.cells.map((row) => {
      const out: Run[] = [];
      for (const c of row) {
        const last = out[out.length - 1];
        if (last && last.cls === c.cls) last.text += c.ch;
        else out.push({ text: c.ch, cls: c.cls });
      }
      return out;
    });
  }
}

function statusLabel(h: Host, sess: Session | undefined, frame: number): { dot: string; cls: string; text: string } {
  const spin = SPINNER[frame % SPINNER.length] ?? '⣾';
  switch (sess?.phase ?? 'idle') {
    case 'connecting':
      return { dot: spin, cls: 'st-connecting', text: h.jump ? `Connecting · ${h.jump} (1/2)` : 'Connecting' };
    case 'authenticating':
      return { dot: spin, cls: 'st-authenticating', text: 'Authenticating · agent' };
    case 'connected':
      return { dot: '●', cls: 'st-connected', text: `Connected · ${h.rtt} ms` };
    case 'error':
      return { dot: '●', cls: 'st-error', text: 'Failed' };
    default:
      return { dot: '●', cls: 'st-idle', text: 'Disconnected' };
  }
}

function hostByAlias(alias: string | null): Host | undefined {
  return HOSTS.find((h) => h.alias === alias);
}

export function render(s: State, cols: number, rows: number): Run[][] {
  const b = new Buffer(cols, rows);
  const compact = cols < 70;
  const hosts = visibleHosts(s);
  const sel = hosts[Math.min(s.sel, Math.max(0, hosts.length - 1))];
  const tabs = Object.keys(s.sessions).filter((a) => s.sessions[a]?.phase !== 'error' && s.sessions[a]?.phase !== 'idle');

  // Header: brand, tabs, theme.
  let x = b.put(0, 0, ' ╭┴┴╮ ', 'a');
  x = b.put(x, 0, 'PORTICO', 'p');
  x = b.put(x + 2, 0, '│', 'b');
  const onHosts = s.mode !== 'term';
  if (onHosts) {
    x = b.put(x, 0, '▍', 'a sel');
    x = b.put(x, 0, `Hosts ${HOSTS.length} `, 'p sel');
  } else {
    x = b.put(x, 0, ` Hosts ${HOSTS.length} `, 'm');
  }
  tabs.forEach((alias, i) => {
    const host = hostByAlias(alias);
    const st = host ? statusLabel(host, s.sessions[alias], s.frame) : null;
    x = b.put(x, 0, '│', 'b');
    const active = s.mode === 'term' && s.active === alias;
    if (active) x = b.put(x, 0, '▍', 'a sel');
    else x = b.put(x, 0, ' ', '');
    x = b.put(x, 0, `${i + 1} `, active ? 'p sel' : 'm');
    x = b.put(x, 0, `${st?.dot ?? '●'} `, `${st?.cls ?? ''}${active ? ' sel' : ''}`);
    x = b.put(x, 0, `${alias} `, active ? 'p sel' : 's');
  });
  if (!compact) b.put(cols - s.theme.length - 1, 0, s.theme, 'm');

  const bodyTop = 1;
  const bodyBottom = rows - 2;

  if (s.mode === 'term' && s.active) {
    const sess = s.sessions[s.active];
    const lines = sess?.lines ?? [];
    const height = bodyBottom - bodyTop + 1;
    const view = [...lines, `${promptFor(s.active)}${sess?.input ?? ''}`].slice(-height);
    view.forEach((line, i) => {
      const y = bodyTop + i;
      const p = promptFor(s.active ?? '');
      if (line.startsWith(p)) {
        const at = p.indexOf(':');
        b.put(1, y, p.slice(0, at), 'st-connected');
        b.put(1 + at, y, p.slice(at), 's');
        b.put(1 + p.length, y, line.slice(p.length), 'p', cols - 2 - p.length);
      } else {
        b.put(1, y, line, line.startsWith('Welcome') || line.startsWith('Last') ? 's' : '', cols - 2);
      }
    });
    // Cursor.
    const last = view.length - 1;
    const cx = 1 + [...(view[last] ?? '')].length;
    if (s.frame % 8 < 5) b.fill(cx, bodyTop + last, 1, 'cursor');
    // Status bar.
    const host = hostByAlias(s.active);
    if (s.prefix) {
      b.put(1, rows - 1, ' PREFIX ', 'inv');
      b.put(10, rows - 1, ' h  hosts   n  new tab   w  close   d  disconnect', 'm');
    } else {
      b.put(1, rows - 1, ' TERM ', 'm');
      b.put(8, rows - 1, ' Ctrl-Space  prefix · then h for hosts', 'm');
    }
    if (host && !compact) {
      const st = statusLabel(host, sess, s.frame);
      const right = `${st.dot} ${host.alias} · ${host.rtt} ms `;
      const rx = cols - right.length - 1;
      b.put(rx, rows - 1, `${st.dot} `, st.cls);
      b.put(rx + 2, rows - 1, `${host.alias} `, 'p');
      b.put(rx + 2 + host.alias.length + 1, rows - 1, `· ${host.rtt} ms`, 'm');
    }
    return b.runs();
  }

  // Left column: search + host list.
  const leftW = compact ? cols - 2 : Math.min(41, Math.floor(cols * 0.44));
  const lx = 1;
  const searching = s.mode === 'search';
  b.box(lx, bodyTop, leftW, 3, searching ? 'a' : 'b');
  if (s.query || searching) {
    let qx = b.put(lx + 2, bodyTop + 1, '⌕ ', 'm');
    qx = b.put(qx, bodyTop + 1, s.query, 'p');
    if (searching && s.frame % 8 < 5) b.put(qx, bodyTop + 1, ' ', 'cursor');
  } else {
    b.put(lx + 2, bodyTop + 1, '⌕ Search hosts   /', 'm');
  }
  const listTop = bodyTop + 3;
  const listH = bodyBottom - listTop + 1;
  b.box(lx, listTop, leftW, listH, searching ? 'b' : 'a', 'Hosts', 's');
  if (s.query) b.put(lx + leftW - 9, listTop, ` ${hosts.length}/${HOSTS.length} `, 'm');
  if (hosts.length === 0) {
    b.put(lx + 2, listTop + 2, 'No host matches.', 's');
    b.put(lx + 2, listTop + 3, 'Try #tag, * or Ctrl-U to clear.', 'm');
  }
  hosts.slice(0, listH - 2).forEach((h, i) => {
    const y = listTop + 1 + i;
    const isSel = h === sel;
    const st = statusLabel(h, s.sessions[h.alias], s.frame);
    const inner = leftW - 2;
    const selCls = isSel ? ' sel' : '';
    if (isSel) b.fill(lx + 1, y, inner, 'sel');
    let hx = b.put(lx + 2, y, isSel ? '▍' : ' ', `a${selCls}`);
    hx = b.put(hx, y, `${st.dot} `, `${st.cls}${selCls}`);
    const room = lx + leftW - 1 - hx;
    hx = b.put(hx, y, h.alias, `p${selCls}`, room);
    if (h.fav) hx = b.put(hx, y, ' ★', `a${selCls}`, lx + leftW - 1 - hx);
    hx = b.put(hx, y, `  ${h.user}@${h.host}`, `m${selCls}`, lx + leftW - 1 - hx);
    b.put(hx, y, ` #${h.tags.join(' #')}`, `s${selCls}`, lx + leftW - 1 - hx);
  });

  // Right column: details.
  if (!compact && sel) {
    const rx = lx + leftW + 1;
    const rw = cols - rx - 1;
    b.box(rx, bodyTop, rw, bodyBottom - bodyTop + 1, 'b');
    const dx = rx + 3;
    let y = bodyTop + 2;
    b.put(dx, y++, sel.alias, 'p');
    const ux = b.put(dx, y, `${sel.user}@${sel.host}`, 's');
    b.put(ux, y++, `:${sel.port}`, 'm');
    y++;
    const sess = s.sessions[sel.alias];
    const st = statusLabel(sel, sess, s.frame);
    const sx = b.put(dx, y, `${st.dot} `, st.cls);
    if (sess?.phase === 'connected') {
      const tx = b.put(sx, y, 'Connected', 'p');
      b.put(tx, y, ` · ${sel.rtt} ms`, 'm');
    } else {
      b.put(sx, y, st.text, sess?.phase === 'error' ? 'st-error' : 'p');
    }
    y++;
    if (sess?.phase === 'error' && sel.fails) {
      b.put(dx + 2, y++, `could not resolve ${sel.fails}`, 's');
      b.put(dx + 2, y++, 'hint: check HostName or your DNS', 'm');
    }
    y++;
    const busy = sess?.phase === 'connecting' || sess?.phase === 'authenticating';
    if (busy) {
      const cx = b.put(dx, y, ' d ', 'kbd');
      b.put(cx + 1, y, 'cancel', 's');
    } else {
      const kx = b.put(dx, y, ' ↵ ', 'kbd');
      const label = sess?.phase === 'connected' ? 'open terminal' : sess?.phase === 'error' ? 'retry' : 'connect';
      const ax = b.put(kx + 1, y, label, 's');
      if (sess?.phase === 'connected') {
        const dx2 = b.put(ax + 3, y, ' d ', 'kbd');
        b.put(dx2 + 1, y, 'disconnect', 's');
      }
    }
    y += 2;
    const row = (k: string, v: string, cls = 's') => {
      b.put(dx, y, k, 'm');
      b.put(dx + 14, y++, v, cls, rw - 18);
    };
    if (sel.jump) row('Jump', `${sel.jump} → ${sel.alias}`);
    if (sel.forward) row('Forward -L', sel.forward);
    row('Tags', `#${sel.tags.join(' #')}`, 'a');
    row('Defined in', `~/.ssh/config:${sel.line}`);
  }

  // Help overlay.
  if (s.mode === 'help') {
    const w = Math.min(46, cols - 4);
    const h = 13;
    const hx = Math.floor((cols - w) / 2);
    const hy = Math.floor((rows - h) / 2);
    for (let r = 0; r < h; r++) b.put(hx, hy + r, ' '.repeat(w), 'ov');
    b.box(hx, hy, w, h, 'a', 'Help', 'p');
    const items: [string, string][] = [
      ['j k ↑ ↓', 'move'],
      ['↵', 'connect / open terminal'],
      ['/', 'search · #tag · * favourites'],
      ['d', 'disconnect'],
      ['t', 'cycle theme'],
      ['Ctrl-Space', 'prefix (in a terminal)'],
      ['Esc', 'close'],
    ];
    items.forEach(([k, v], i) => {
      b.put(hx + 3, hy + 2 + i, k, 'a ov');
      b.put(hx + 17, hy + 2 + i, v, 's ov', w - 19);
    });
    b.put(hx + 3, hy + h - 2, 'Esc or ? to close', 'm ov');
  }

  // Status bar.
  const keys: [string, string][] =
    s.mode === 'search'
      ? [['↵', 'connect'], ['↑↓', 'move'], ['Ctrl-U', 'clear'], ['Esc', 'done']]
      : [['↵', 'connect'], ['/', 'search'], ['d', 'disconnect'], ['t', 'theme'], ['?', 'help']];
  let bx = b.put(1, rows - 1, s.mode === 'search' ? ' SEARCH ' : ' HOSTS ', 'inv');
  bx += 2;
  for (const [k, v] of keys) {
    if (bx + k.length + v.length + 4 > cols) break;
    bx = b.put(bx, rows - 1, k, 'a');
    bx = b.put(bx + 1, rows - 1, v, 'm');
    bx += 3;
  }
  return b.runs();
}

export function promptFor(alias: string): string {
  const h = hostByAlias(alias);
  return `${h?.user ?? 'user'}@${alias}:~$ `;
}

export function welcome(): string[] {
  return ['Welcome to Ubuntu 24.04.1 LTS (GNU/Linux 6.8.0-45-generic x86_64)', '', 'Last login: Tue Oct 20 17:41:55 2026 from 10.0.0.2'];
}

/** Canned shell: enough to feel alive, nothing more. */
export function runCommand(alias: string, cmd: string): string[] {
  const c = cmd.trim();
  const h = hostByAlias(alias);
  switch (c.split(/\s+/)[0]) {
    case '':
      return [];
    case 'uptime':
      return [' 17:42:08 up 41 days,  3:12,  1 user,  load average: 0.08, 0.11, 0.09'];
    case 'ls':
      return ['app  logs  deploy.sh  README.md  restart'];
    case 'whoami':
      return [h?.user ?? 'user'];
    case 'hostname':
      return [alias];
    case 'pwd':
      return [`/home/${h?.user ?? 'user'}`];
    case 'echo':
      return [c.slice(5)];
    case 'date':
      return ['Wed Oct 21 21:42:08 UTC 2026'];
    case 'uname':
      return ['Linux'];
    case 'portico':
      return ['You are already in it.'];
    case 'help':
      return ['demo shell: uptime, ls, whoami, hostname, pwd, date, exit'];
    case 'exit':
      return ['logout'];
    default:
      return [`${c.split(/\s+/)[0]}: command not found (this is a demo shell, try help)`];
  }
}
