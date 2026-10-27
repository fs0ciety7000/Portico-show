/**
 * Theme switching, as in the app: the `t` key cycles Obsidian → Basalt →
 * Travertine Night → Marble → Auto. Auto follows the system appearance
 * (Marble when light, Obsidian when dark). `data-theme` always holds the theme
 * actually shown; `data-theme-choice` holds what the visitor picked.
 */
export const THEMES = ['obsidian', 'basalt', 'travertine', 'marble', 'auto'] as const;
export type Theme = (typeof THEMES)[number];
export type ShownTheme = Exclude<Theme, 'auto'>;

const light = () => window.matchMedia('(prefers-color-scheme: light)').matches;

function resolve(choice: Theme): ShownTheme {
  return choice === 'auto' ? (light() ? 'marble' : 'obsidian') : choice;
}

/** What the visitor picked (Auto included). */
export function currentTheme(): Theme {
  const root = document.documentElement;
  const choice = root.dataset['themeChoice'] ?? root.dataset['theme'] ?? '';
  return (THEMES as readonly string[]).includes(choice) ? (choice as Theme) : 'obsidian';
}

/** The theme on screen. */
export function shownTheme(): ShownTheme {
  return resolve(currentTheme());
}

function apply(choice: Theme): void {
  const root = document.documentElement;
  root.dataset['themeChoice'] = choice;
  root.dataset['theme'] = resolve(choice);
}

export function setTheme(theme: Theme): void {
  apply(theme);
  try {
    localStorage.setItem('portico-theme', theme);
  } catch {
    /* private mode: the choice simply isn't remembered */
  }
  window.dispatchEvent(new CustomEvent('portico:theme', { detail: theme }));
}

export function cycleTheme(): Theme {
  const i = THEMES.indexOf(currentTheme());
  const next = THEMES[(i + 1) % THEMES.length] ?? 'obsidian';
  setTheme(next);
  return next;
}

// Auto follows the system live.
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', () => {
    if (currentTheme() !== 'auto') return;
    apply('auto');
    window.dispatchEvent(new CustomEvent('portico:theme', { detail: 'auto' }));
  });
}

/** True when a key press belongs to a text field or an interactive widget that owns the keyboard. */
export function isTyping(e: KeyboardEvent): boolean {
  const el = e.target as HTMLElement | null;
  if (!el) return false;
  if (el.closest('[data-owns-keys]')) return true;
  const tag = el.tagName;
  return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || el.isContentEditable;
}

/** Read a CSS custom property from the root. */
export function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}
