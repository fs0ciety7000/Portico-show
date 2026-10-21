/** Theme switching: the three Portico themes, same `t` key as the app. */
export const THEMES = ['obsidian', 'basalt', 'travertine'] as const;
export type Theme = (typeof THEMES)[number];

export function currentTheme(): Theme {
  const th = document.documentElement.dataset['theme'];
  return (THEMES as readonly string[]).includes(th ?? '') ? (th as Theme) : 'obsidian';
}

export function setTheme(theme: Theme): void {
  document.documentElement.dataset['theme'] = theme;
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
