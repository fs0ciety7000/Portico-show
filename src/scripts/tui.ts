/**
 * Drives the TUI imitation: keyboard input, connection phases, spinner and
 * cursor ticks, and a short "attract" demo that stops at the first user input.
 */
import { type Run, type State, HOSTS, initialState, promptFor, render, runCommand, visibleHosts, welcome } from '../lib/tui/sim.ts';
import { cycleTheme, currentTheme } from './theme.ts';

const THEME_NAMES: Record<string, string> = { obsidian: 'Obsidian', basalt: 'Basalt', travertine: 'Travertine Night' };

export function runsToHtml(lines: Run[][]): string {
  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return lines.map((runs) => runs.map((r) => (r.cls ? `<span class="${r.cls}">${esc(r.text)}</span>` : esc(r.text))).join('')).join('\n');
}

export function mountTui(root: HTMLElement): void {
  const screen = root.querySelector<HTMLElement>('[data-tui-screen]');
  if (!screen) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const s: State = initialState(THEME_NAMES[currentTheme()]);
  let cols = 92;
  let rows = 26;
  let attract = !reduced;
  let timers: number[] = [];
  const phaseTimers: number[] = [];
  let html = '';

  const draw = () => {
    s.theme = THEME_NAMES[currentTheme()] ?? 'Obsidian';
    const next = runsToHtml(render(s, cols, rows));
    if (next !== html) {
      html = next;
      screen.innerHTML = next;
    }
  };

  const fit = () => {
    const w = root.clientWidth;
    // Wide windows get more columns, like a real terminal; narrow ones lose the details pane.
    cols = w < 640 ? 50 : Math.max(80, Math.min(150, Math.floor((w - 40) / (13 * 0.6))));
    rows = w < 640 ? 24 : 26;
    const size = root.closest('[data-panel]')?.querySelector('[data-tui-size]');
    if (size) size.textContent = `${cols}×${rows}`;
    root.style.setProperty('--cols', String(cols));
    draw();
  };

  const later = (ms: number, fn: () => void) => {
    timers.push(window.setTimeout(fn, ms));
  };
  // Connection phases are never cancelled by stopping the attract script.
  const phase = (ms: number, fn: () => void) => {
    phaseTimers.push(window.setTimeout(fn, ms));
  };

  const selected = () => {
    const list = visibleHosts(s);
    return list[Math.min(s.sel, Math.max(0, list.length - 1))];
  };

  const connect = (alias: string) => {
    const host = HOSTS.find((h) => h.alias === alias);
    if (!host) return;
    const existing = s.sessions[alias];
    if (existing && existing.phase === 'connected') {
      s.mode = 'term';
      s.active = alias;
      draw();
      return;
    }
    if (existing && (existing.phase === 'connecting' || existing.phase === 'authenticating')) return;
    s.sessions[alias] = { phase: 'connecting', since: performance.now(), lines: welcome(), input: '' };
    draw();
    if (host.fails) {
      phase(1100, () => {
        const sess = s.sessions[alias];
        if (sess) sess.phase = 'error';
        draw();
      });
      return;
    }
    phase(host.jump ? 1000 : 650, () => {
      const sess = s.sessions[alias];
      if (!sess || sess.phase !== 'connecting') return;
      sess.phase = 'authenticating';
      draw();
      phase(700, () => {
        if (sess.phase !== 'authenticating') return;
        sess.phase = 'connected';
        s.mode = 'term';
        s.active = alias;
        draw();
      });
    });
  };

  const disconnect = (alias: string) => {
    delete s.sessions[alias];
    if (s.active === alias) {
      s.active = null;
      if (s.mode === 'term') s.mode = 'hosts';
    }
    draw();
  };

  const move = (d: number) => {
    const n = visibleHosts(s).length;
    if (n === 0) return;
    s.sel = Math.max(0, Math.min(n - 1, s.sel + d));
  };

  const handle = (e: KeyboardEvent): boolean => {
    const k = e.key;
    if (s.mode === 'term' && s.active) {
      const sess = s.sessions[s.active];
      if (!sess) return false;
      if (s.prefix) {
        s.prefix = false;
        if (k === 'h' || k === '0' || k === 'Escape') s.mode = 'hosts';
        else if (k === 'd' || k === 'w') disconnect(s.active);
        return true;
      }
      if (e.ctrlKey && (k === ' ' || e.code === 'Space')) {
        s.prefix = true;
        return true;
      }
      if (k === 'Enter') {
        const cmd = sess.input;
        sess.lines.push(`${promptFor(s.active)}${cmd}`, ...runCommand(s.active, cmd));
        sess.input = '';
        if (cmd.trim() === 'exit') disconnect(s.active);
        return true;
      }
      if (k === 'Backspace') {
        sess.input = sess.input.slice(0, -1);
        return true;
      }
      if (e.ctrlKey && k === 'c') {
        sess.lines.push(`${promptFor(s.active)}${sess.input}^C`);
        sess.input = '';
        return true;
      }
      if (k.length === 1 && !e.ctrlKey && !e.metaKey && sess.input.length < 60) {
        sess.input += k;
        return true;
      }
      return false;
    }
    if (s.mode === 'help') {
      if (k === 'Tab') return false;
      if (k === 'Escape' || k === '?' || k === 'q') s.mode = 'hosts';
      return true;
    }
    if (s.mode === 'search') {
      if (k === 'Escape') s.mode = 'hosts';
      else if (k === 'Enter') {
        const h = selected();
        s.mode = 'hosts';
        if (h) connect(h.alias);
      } else if (k === 'ArrowDown' || (e.ctrlKey && k === 'n')) move(1);
      else if (k === 'ArrowUp' || (e.ctrlKey && k === 'p')) move(-1);
      else if (e.ctrlKey && k === 'u') s.query = '';
      else if (k === 'Backspace') s.query = s.query.slice(0, -1);
      else if (k.length === 1 && !e.ctrlKey && !e.metaKey && s.query.length < 24) {
        s.query += k;
        s.sel = 0;
      } else return false;
      return true;
    }
    switch (k) {
      case 'j':
      case 'ArrowDown':
        move(1);
        return true;
      case 'k':
      case 'ArrowUp':
        move(-1);
        return true;
      case 'g':
        s.sel = 0;
        return true;
      case 'G':
        s.sel = visibleHosts(s).length - 1;
        return true;
      case '/':
        s.mode = 'search';
        return true;
      case 'Escape':
        if (!s.query) return false;
        s.query = '';
        return true;
      case 'Enter': {
        const h = selected();
        if (h) connect(h.alias);
        return true;
      }
      case 'd': {
        const h = selected();
        if (h) disconnect(h.alias);
        return true;
      }
      case 't':
        cycleTheme();
        return true;
      case '?':
        s.mode = 'help';
        return true;
      case ']': {
        const open = Object.keys(s.sessions).find((a) => s.sessions[a]?.phase === 'connected');
        if (!open) return false;
        s.mode = 'term';
        s.active = open;
        return true;
      }
      default:
        if (e.ctrlKey && k === 'k') {
          s.mode = 'search';
          return true;
        }
        return false;
    }
  };

  const stopAttract = () => {
    if (!attract) return;
    attract = false;
    timers.forEach((t) => clearTimeout(t));
    timers = [];
  };

  root.addEventListener('keydown', (e) => {
    if (e.metaKey || e.altKey) return;
    stopAttract();
    if (handle(e)) {
      e.preventDefault();
      e.stopPropagation();
      draw();
    }
  });
  root.addEventListener('pointerdown', () => {
    stopAttract();
    root.focus({ preventScroll: true });
  });
  // Click a host row: the row index is derived from the line under the pointer.
  screen.addEventListener('click', (e) => {
    if (s.mode !== 'hosts') return;
    const rect = screen.getBoundingClientRect();
    const lineH = rect.height / rows;
    const row = Math.floor((e.clientY - rect.top) / lineH);
    const idx = row - 5;
    const n = visibleHosts(s).length;
    if (idx >= 0 && idx < n) {
      if (idx === s.sel) {
        const h = selected();
        if (h) connect(h.alias);
      } else s.sel = idx;
      draw();
    }
  });

  // Spinner and cursor.
  let visible = false;
  let last = 0;
  const tick = (now: number) => {
    if (!visible) return;
    if (now - last > 90) {
      last = now;
      if (!reduced) s.frame++;
      draw();
    }
    requestAnimationFrame(tick);
  };
  const playAttract = () => {
    if (!attract) return;
    const steps: [number, () => void][] = [
      [900, () => move(1)],
      [500, () => move(1)],
      [500, () => move(-1)],
      [700, () => {
        const h = selected();
        if (h) connect(h.alias);
      }],
    ];
    let at = 0;
    for (const [ms, fn] of steps) {
      at += ms;
      later(at, () => {
        fn();
        draw();
      });
    }
    // Type a command once the shell is there.
    const cmd = 'uptime';
    at += 2600;
    [...cmd].forEach((ch, i) =>
      later(at + i * 110, () => {
        const sess = s.active ? s.sessions[s.active] : undefined;
        if (sess && s.mode === 'term') sess.input += ch;
        draw();
      }),
    );
    later(at + cmd.length * 110 + 300, () => {
      if (s.active && s.mode === 'term') handle(new KeyboardEvent('keydown', { key: 'Enter' }));
      attract = false;
      draw();
    });
  };
  const io = new IntersectionObserver(([en]) => {
    const was = visible;
    visible = en?.isIntersecting ?? false;
    if (visible && !was) {
      requestAnimationFrame(tick);
      if (attract && timers.length === 0) playAttract();
    }
  }, { threshold: 0.4 });
  io.observe(root);
  new ResizeObserver(fit).observe(root);
  window.addEventListener('portico:theme', draw);
  fit();
}
