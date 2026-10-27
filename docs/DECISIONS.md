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

## D-003 · Hero en 3D (Three.js), footer en gravure
- **Choix** : le hero est une scène Three.js : le portique du logo en volume (entablement, colonnes cannelées,
  arche en laiton), la lumière dans l'arche, un tunnel d'anneaux et un flux de particules qui la traversent.
  Le footer est une gravure (eau-forte) d'un portique en ruine, utilisée comme masque de luminance : ses traits
  prennent les couleurs du thème actif, l'accent éclaire l'arche et la lanterne.
- **Historique** : une première version utilisait de l'ASCII art procédural (hero et footer) ; abandonnée à la demande
  du propriétaire au profit d'un rendu plus « produit ».
- **Raison** : Three.js chargé en différé (chunk séparé, `requestIdleCallback`), poster SVG en repli sans WebGL ni JS,
  rendu figé avec `prefers-reduced-motion`, boucle en pause hors écran. La gravure est servie en WebP niveaux de gris
  (100 à 260 Ko), chargée avec le footer.
- **Source de l'illustration** : générée par IA (gpt-image-2) d'après un brief « gravure du XIXe, portique, mesas,
  voyageur à la lanterne », original conservé dans `design/footer-engraving-source.png`.

## D-004 · Démo TUI simulée, mise en page relevée sur la vraie TUI
- **Choix** : `src/lib/tui/sim.ts` reproduit la TUI (captures tmux de `portico` en release) et se pilote au clavier.
- **Alternative** : enregistrement asciinema, vidéo.
- **Raison** : interactif, accessible au clavier, suit le thème actif, quelques Ko.

## D-005 · nginx statique derrière Coolify
- **Choix** : image multi-étapes `node:24-alpine` → `nginx:alpine`, healthcheck `/healthz`.
- **Raison** : plus léger qu'un serveur Node ; en-têtes de sécurité et cache immuable des assets fingerprintés.
  La CSP est générée par Astro (`security.csp`) avec les empreintes des scripts inline : pas de `unsafe-inline` pour les scripts ni les styles.

## D-006 · Le site suit le dépôt Portico tout seul
- **Choix** : un instantané versionné (`src/data/upstream.json`, `packages.json`) écrit par une GitHub Action à
  chaque release publiée (`repository_dispatch` envoyé par le workflow de release de Portico) et selon un planning ;
  le build ne fait aucune requête. Les paquets qui ne peuvent pas encore atteindre leur canal (AUR, bucket Scoop)
  sont rendus par les scripts de Portico et servis par le site (`/arch/`, `/scoop/`).
- **Alternatives** : rendu serveur (SSR) avec cache, requêtes depuis le navigateur vers l'API GitHub.
- **Raison** : le site reste statique (nginx, CSP stricte, aucun appel tiers chez le visiteur), chaque changement
  amont laisse une trace dans l'historique git, et une API GitHub indisponible ne casse jamais le build.

## D-007 · Quatre thèmes et Auto, comme l'app
- **Choix** : Obsidian (défaut), Basalt, Travertine Night, Marble (clair) et Auto (système), touche `t`.
  Le site reste sombre par défaut ; Marble passe la scène 3D en mélange normal (la lumière additive disparaît sur
  fond clair) et la gravure du footer devient un dessin à la mine sur papier.
