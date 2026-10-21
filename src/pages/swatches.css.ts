/** Swatch colours of the three themes, generated from tokens.css at build time. */
import type { APIRoute } from 'astro';
import { themeSwatches } from '../lib/themes.ts';

export const GET: APIRoute = () => {
  const css = (['obsidian', 'basalt', 'travertine'] as const)
    .flatMap((id) => themeSwatches(id).map((c, n) => `.sw-${id}-${n}{background:${c}}`))
    .join('\n');
  return new Response(css, { headers: { 'Content-Type': 'text/css; charset=utf-8' } });
};
