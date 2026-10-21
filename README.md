# Portico · site vitrine

Site de [Portico](https://github.com/fs0ciety7000/Portico), gestionnaire de sessions SSH local-first écrit en Rust.
Production : **https://portico.dessenius.be** · **https://portico.cardormedia.com**

Conçu et développé par Nicolas Dessenius · Cardor Interactive.

## Stack

| Domaine | Choix |
|---|---|
| Framework | Astro 7, sortie 100 % statique, TypeScript `strictest` |
| Styles | CSS natif ; couleurs, rayons et durées = tokens générés par `portico-theme` (`src/styles/tokens.css`) |
| JS | Vanilla TS, uniquement pour les îlots interactifs (scène ASCII, démo TUI, thèmes) |
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
├── lib/ascii/         # moteur ASCII pur (build + navigateur) : hero, footer
├── lib/tui/sim.ts     # imitation fidèle de la TUI (mise en page relevée sur des captures tmux)
├── scripts/           # îlots client : canvas ASCII, démo TUI, thèmes
└── styles/            # tokens.css (généré) + site.css (échelle éditoriale)
public/shots/          # captures réelles de la GUI (mode démo), 3 thèmes
scripts/og.mts         # régénère les images Open Graph et les icônes (Playwright)
```

## Déploiement

Coolify (`coolify.fs0ciety.org`), build pack Dockerfile, port 80, healthcheck `/healthz`.
Un push sur la branche suivie redéploie le site.
