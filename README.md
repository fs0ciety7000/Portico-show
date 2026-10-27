# Portico · site vitrine

Site de [Portico](https://github.com/fs0ciety7000/Portico), gestionnaire de sessions SSH local-first écrit en Rust.
Production : **https://portico.dessenius.be** · **https://portico.cardormedia.com**

Conçu et développé par Nicolas Dessenius · Cardor Interactive.

## Stack

| Domaine | Choix |
|---|---|
| Framework | Astro 7, sortie 100 % statique, TypeScript `strictest` |
| Styles | CSS natif ; couleurs, rayons et durées = tokens générés par `portico-theme` (`src/styles/tokens.css`) |
| JS | Vanilla TS pour les îlots interactifs (démo TUI, thèmes) ; Three.js en différé pour le hero |
| Polices | Geist, Inter, JetBrains Mono, auto-hébergées (`public/fonts`) |
| Service | nginx alpine dans Docker, déployé par Coolify |

Les décisions et leurs alternatives sont dans [`docs/DECISIONS.md`](docs/DECISIONS.md).

## Développer

```bash
npm install
npm run dev            # http://localhost:4321
npm run build          # astro check + build → dist/
npm run sync-tokens    # recopie tokens.css depuis ../Portico après un changement de thème
```

Node ≥ 22.23.4 (exigence d'Astro 7).

## Structure

```
src/
├── components/        # une section = un composant (Hero, Interfaces, Features…)
├── i18n/content.ts    # tout le texte FR / EN, faits tirés du dépôt Portico
├── lib/tui/sim.ts     # imitation fidèle de la TUI (mise en page relevée sur des captures tmux)
├── scripts/           # îlots client : scène 3D du hero (hero3d.ts), démo TUI, thèmes
└── styles/            # tokens.css (généré) + site.css (échelle éditoriale)
public/shots/          # captures réelles de la GUI (mode démo), 3 thèmes
design/                # source de la gravure du footer
```

## Synchronisation avec le dépôt Portico

Version, date et fichiers de la dernière release, commandes d'installation, statut Homebrew et AUR, statuts des
phases, matrice du MVP, nombre de tests et « Ensuite » viennent de `src/data/upstream.json`, écrit par
`scripts/sync-upstream.mjs` à partir de l'API GitHub (release `latest`), de `docs/PLAN.md` sur `main`, du tap
`fs0ciety7000/homebrew-portico` et de l'AUR. Le build ne fait aucune requête réseau.

- L'action `.github/workflows/sync-upstream.yml` tourne **dès qu'une release est publiée** (le job `site` du
  workflow de release de Portico envoie un `repository_dispatch` `portico-release`, jeton `SITE_DISPATCH_TOKEN`),
  et aussi selon un planning (toutes les 30 min demandées ; GitHub espace en pratique les exécutions de plusieurs
  heures) et à la main (*Run workflow*). Si l'instantané change, elle le commite sur `main` et Coolify redéploie.
- En local : `NODE_USE_ENV_PROXY=1 node scripts/sync-upstream.mjs` (affiche `changed` ou `unchanged`).
- **Paquets servis par le site** (`scripts/render-packages.sh`, avec les scripts `render.sh` de Portico au tag de
  la release et les sommes de `SHA256SUMS`) :
  - Arch Linux, tant que l'AUR est inaccessible (inscriptions fermées) : PKGBUILD `portico-bin` et
    `portico-gui-bin` sous `/arch/`, installés avec `makepkg -si` (testés dans un conteneur Arch, 0.2.0 et 0.2.1) ;
  - Scoop, tant que le bucket n'est pas publié : `/scoop/portico.json`, installé avec
    `scoop install https://portico.dessenius.be/scoop/portico.json`.
  Dès que l'AUR, le bucket ou winget portent la version courante, le site affiche leurs commandes habituelles.
- Les textes des phases sont traduits dans `src/i18n/content.ts` (`roadmap.copy`) ; une phase nouvelle sans texte
  s'affiche avec son titre et sa première puce de `PLAN.md` (en français), le temps d'ajouter sa traduction.

## Déploiement

Coolify (`coolify.fs0ciety.org`), build pack Dockerfile, port 80, healthcheck `/healthz`.
Un push sur la branche suivie redéploie le site.
