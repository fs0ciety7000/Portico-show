/** Theme palettes read from the generated tokens.css (single source: portico-theme). */
import css from '../styles/tokens.css?raw';

export type ThemeId = 'obsidian' | 'basalt' | 'travertine';

export function themeSwatches(id: ThemeId): string[] {
  const block = css.split(`[data-theme="${id}"]`)[1]?.split('}')[0] ?? '';
  const pick = (name: string) => new RegExp(`--${name}:\\s*([^;]+);`).exec(block)?.[1]?.trim() ?? 'transparent';
  return ['bg-base', 'bg-elevated', 'text-primary', 'accent'].map(pick);
}
