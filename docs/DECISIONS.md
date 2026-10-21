# Décisions · site Portico

## D-001 · Astro plutôt que Next.js
- **Choix** : Astro 7 en sortie statique.
- **Alternatives** : Next.js (App Router, export statique), SvelteKit.
- **Raison** : un site vitrine sans données dynamiques. Astro livre zéro JS par défaut et n'hydrate que les îlots
  (canvas ASCII, démo TUI) ; HTML complet au build, donc lisible sans JS et rapide. Next imposerait React au runtime
  pour un gain nul. SvelteKit aurait été cohérent avec la GUI, mais son intérêt est le rendu serveur dont on n'a pas besoin.

## D-002 · Pas de Tailwind, tokens Portico
- **Choix** : CSS natif scopé par composant, variables issues de `portico-theme`.
- **Raison** : une seule source de vérité visuelle avec l'app. Les trois thèmes de l'app pilotent le site (touche `t`).

## D-003 · ASCII art procédural, partagé build/navigateur
- **Choix** : scènes décrites par des fonctions pures (`src/lib/ascii`). Le build les rend en `<pre>` (fallback sans JS,
  `prefers-reduced-motion`), le navigateur anime le hero sur un `<canvas>` (20 fps, en pause hors écran).
- **Alternatives** : image pré-rendue, WebGL, bibliothèque ASCII.
- **Raison** : aucune dépendance, texte net à toute taille, déterministe, et coût CPU borné.

## D-004 · Démo TUI simulée, mise en page relevée sur la vraie TUI
- **Choix** : `src/lib/tui/sim.ts` reproduit la TUI (captures tmux de `portico` en release) et se pilote au clavier.
- **Alternative** : enregistrement asciinema, vidéo.
- **Raison** : interactif, accessible au clavier, suit le thème actif, quelques Ko.

## D-005 · nginx statique derrière Coolify
- **Choix** : image multi-étapes `node:24-alpine` → `nginx:alpine`, healthcheck `/healthz`.
- **Raison** : plus léger qu'un serveur Node ; en-têtes de sécurité et cache immuable des assets fingerprintés.
  La CSP est générée par Astro (`security.csp`) avec les empreintes des scripts inline : pas de `unsafe-inline` pour les scripts ni les styles.
