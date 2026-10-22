/**
 * All copy, in both languages. Facts come from the Portico repository
 * (README, CLAUDE.md, docs/PLAN.md, docs/KEYBINDINGS.md): keep them in sync.
 */
export type Lang = 'fr' | 'en';
export type Status = 'done' | 'wip' | 'next' | 'drop';

export interface InstallStep {
  k: string;
  cmd: string;
}
export interface InstallMethod {
  k: string;
  s: 'ok' | 'soon';
  note: string;
  steps: InstallStep[];
  files?: { name: string; size: string }[];
}
export interface Platform {
  id: string;
  name: string;
  methods: InstallMethod[];
}

export const RELEASE_URL = 'https://github.com/fs0ciety7000/Portico/releases/tag/v0.1.0';
export const DOWNLOAD_URL = 'https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0';

export const REPO = 'https://github.com/fs0ciety7000/Portico';
export const SITE_REPO = 'https://github.com/fs0ciety7000/Portico-show';

const fr = {
  lang: 'fr',
  locale: 'fr_BE',
  meta: {
    title: 'Portico · Gestionnaire de sessions SSH local-first, en Rust',
    description:
      'Client SSH local-first et keyboard-first pour macOS et Linux. Un moteur Rust, une TUI et une GUI. Votre ~/.ssh/config reste la source de vérité.',
  },
  skip: 'Aller au contenu',
  nav: {
    label: 'Navigation principale',
    links: [
      ['#interfaces', 'Interfaces'],
      ['#fonctionnalites', 'Fonctionnalités'],
      ['#securite', 'Sécurité'],
      ['#clavier', 'Clavier'],
      ['#feuille-de-route', 'Feuille de route'],
      ['#installer', 'Installer'],
    ],
    github: 'GitHub',
    theme: 'Thème',
    themeHint: 'Changer de thème (touche t)',
    menu: 'Menu',
    close: 'Fermer',
    langSwitch: { href: '/en/', label: 'EN', title: 'Read in English' },
  },
  hero: {
    eyebrow: 'Client SSH · Rust · macOS & Linux',
    title: ['Le portique', 'de vos serveurs.'],
    lead: 'Portico est un gestionnaire de sessions SSH local-first, rapide et pensé pour le clavier. Un moteur Rust, deux interfaces : une TUI et une GUI. Votre ~/.ssh/config reste la source de vérité.',
    primary: 'Installer',
    secondary: 'Voir le code',
    release: 'v0.1.0 disponible',
    releaseHint: 'Le MVP complet, pour macOS et Linux',
    tags: ['{rust:1.90}', '{unsafe:forbid}', '{cloud:0}', '{tui:25ms}'],
    figure: 'Fig. 01 · Le seuil',
    figureMeta: 'kex curve25519-sha256',
    scroll: 'Défiler pour entrer',
    sceneLabel: 'Scène 3D : le portique du logo Portico, un entablement sur deux colonnes, dont l’arche éclairée est traversée par un tunnel d’anneaux et un flux de particules.',
  },
  stats: {
    label: 'En chiffres',
    items: [
      { value: '0', unit: '', label: 'compte, cloud ou télémétrie. Tout fonctionne hors ligne.' },
      { value: '25', unit: 'ms', label: 'pour une TUI utilisable à froid avec 50 hôtes. L’objectif était 100 ms.' },
      { value: '7', unit: 'Mo', label: 'de mémoire au repos pour la TUI, terminal ouvert.' },
      { value: '400', unit: '+', label: 'tests, dont l’interop avec un vrai OpenSSH (13 scénarios) et un E2E de l’app de bureau.' },
    ],
  },
  manifesto: {
    label: 'Principes',
    title: 'Votre setup est la source de vérité.',
    body: 'Portico lit ~/.ssh/config, known_hosts, ssh-agent et vos clés. Il ne réécrit jamais votre configuration : ses métadonnées (tags, favoris, groupes) vivent à côté, dans un TOML lisible. Pas de compte, pas de synchronisation imposée, pas de lock-in.',
    items: [
      { k: 'Zéro lock-in', v: 'Données en TOML lisible et versionnable. Supprimez Portico, votre SSH n’a pas bougé.' },
      { k: 'Keyboard-first', v: 'Chaque action a un raccourci. La palette ⌘K expose tout, la souris n’est jamais requise.' },
      { k: 'Performance', v: 'TUI utilisable en moins de 100 ms à froid. Aucun redraw quand rien ne change.' },
      { k: 'Respect d’OpenSSH', v: 'Include, Match, ProxyJump, tokens, ordre d’authentification : la sémantique exacte d’OpenSSH.' },
    ],
  },
  interfaces: {
    label: 'Interfaces',
    title: ['Un moteur.', 'Deux interfaces.'],
    lead: 'portico-core porte tout le métier : sessions, authentification, SFTP, tunnels. La TUI vit dans votre terminal, la GUI dans une fenêtre native. Même moteur, mêmes raccourcis, mêmes thèmes.',
    tabs: { tui: 'TUI · terminal', gui: 'GUI · application', tuiShort: 'TUI', guiShort: 'GUI' },
    tuiHint: 'Essayez : j / k pour naviguer, ↵ pour se connecter, / pour chercher, t pour le thème.',
    tuiFocus: 'Cliquez ou tabulez dans le terminal pour le piloter au clavier.',
    tuiSpecs: [
      ['Rendu', 'ratatui 0.30 · crossterm'],
      ['Émulateur', 'alacritty_terminal · 10 000 lignes'],
      ['Onglets', 'et panneaux, préfixe Ctrl-Space'],
    ],
    guiSpecs: [
      ['Shell', 'Tauri 2 · Rust mince'],
      ['Interface', 'Svelte 5 · xterm.js 6 WebGL'],
      ['Palette', '⌘K, toutes les actions'],
    ],
    guiAlt: 'L’application Portico : liste des hôtes à gauche, détails de l’hôte sélectionné, statut de connexion.',
    themesTitle: 'Trois thèmes sombres',
    themes: [
      { id: 'obsidian', name: 'Obsidian', note: 'Minéral, accent laiton' },
      { id: 'basalt', name: 'Basalt', note: 'Gris-bleu, accent acier' },
      { id: 'travertine', name: 'Travertine Night', note: 'Pierre chaude, terracotta' },
    ],
    themesNote: 'Ce site utilise les tokens de portico-theme : changez de thème, la page entière suit.',
  },
  features: {
    label: 'Fonctionnalités',
    title: 'Le MVP est livré. La suite est en route.',
    lead: 'Les quatorze fonctionnalités du MVP sont livrées dans les deux interfaces. Chaque phase est close par trois revues : sécurité, protocoles SSH et design.',
    legend: { done: 'Livré', wip: 'En cours', next: 'Prévu', drop: 'Abandonné' },
    groups: { mvp: 'MVP · 14 sur 14', after: 'Après le MVP' },
    items: [
      { g: 'mvp', s: 'done', t: 'Parsing de ~/.ssh/config', d: 'Host, Match, Include, wildcards, héritage, tokens et ProxyJump, avec la sémantique first-wins d’OpenSSH. Parser maison, rapide même avec 2 000 hôtes.' },
      { g: 'mvp', s: 'done', t: 'Recherche floue, tags et groupes', d: 'Matcher nucleo (celui de Helix). #tag, @groupe et * pour les favoris ; tags, groupes et notes s’éditent dans hosts.toml.' },
      { g: 'mvp', s: 'done', t: 'Connexion SSH interactive', d: 'PTY xterm-256color, onglets, redimensionnement en direct, vim et htop utilisables. ProxyJump récursif jusqu’à 8 rebonds.' },
      { g: 'mvp', s: 'done', t: 'SFTP : explorateur et transferts', d: 'Deux panneaux en TUI, liste et glisser-déposer en GUI. 1 Gio dans chaque sens contre OpenSSH, annulation sans fichier résiduel.' },
      { g: 'mvp', s: 'done', t: 'Clés, ssh-agent et certificats', d: 'Clés locales, identités de l’agent (ajout avec durée de vie, retrait), certificats OpenSSH avec leur validité et une alerte 7 jours avant l’expiration.' },
      { g: 'mvp', s: 'done', t: 'Génération de clés', d: 'ed25519 par défaut, RSA 3072 à 8192, ECDSA P-256/384/521, passphrase au format OpenSSH. Une clé existante n’est jamais écrasée.' },
      { g: 'mvp', s: 'done', t: 'Copie de clé publique', d: 'L’équivalent de ssh-copy-id : ajout idempotent, sans réécrire l’existant, puis reconnexion avec cette clé seule pour vérifier.' },
      { g: 'mvp', s: 'done', t: 'Port forwarding local et distant', d: '-L et -R, sur localhost par défaut. Une écoute exposée au réseau demande une confirmation, et les forwards de ssh_config sont proposés, jamais démarrés d’office.' },
      { g: 'mvp', s: 'done', t: 'Récents, favoris et onglets', d: 'Les 50 dernières sessions, des favoris, des groupes et plusieurs sessions ouvertes en onglets.' },
      { g: 'mvp', s: 'done', t: 'Snippets', d: 'Globaux, par hôte ou par tag, avec des placeholders validés. Exécutés dans l’onglet actif ; un collage multi-ligne risqué est refusé.' },
      { g: 'mvp', s: 'done', t: 'Statut de connexion et latence', d: 'connecting → authenticating → connected, avec le RTT mesuré par keepalive@openssh.com. Chaque erreur vient avec un hint actionnable.' },
      { g: 'mvp', s: 'done', t: 'Trois thèmes, raccourcis configurables', d: 'Obsidian, Basalt, Travertine Night, au contraste testé. Raccourcis réglables dans settings.toml, documentation générée depuis la keymap.' },
      { g: 'mvp', s: 'done', t: 'Secrets dans le keyring', d: 'Keychain sur macOS, Secret Service sur Linux. En repli, un vault chiffré (Argon2id, XChaCha20-Poly1305) déverrouillé au démarrage.' },
      { g: 'mvp', s: 'done', t: 'Logs de session et config effective', d: 'Logs de connexion par session, filtrables, et la config effective façon ssh -G avec l’origine fichier:ligne de chaque option.' },
      { g: 'after', s: 'done', t: 'Proxy SOCKS5 (-D)', d: 'Tunnel dynamique, DynamicForward de ssh_config proposé, écoute exposée seulement après confirmation.' },
      { g: 'after', s: 'done', t: 'Import depuis Termius', d: 'portico import termius génère un fichier à inclure dans votre config et reprend tags et groupes. Aucun secret n’est importé.' },
      { g: 'after', s: 'done', t: 'Split panes', d: 'Jusqu’à 8 panneaux par onglet, sur la même session ou un autre hôte, au clavier comme à la souris, avec zoom.' },
      { g: 'after', s: 'wip', t: 'Enregistrement de sessions', d: 'Format asciicast v2, sur demande et par terminal, sortie seulement (jamais les saisies), indicateur REC visible. Moteur livré, relecture dans les UIs en cours.' },
      { g: 'after', s: 'done', t: 'Homebrew', d: 'Tap fs0ciety7000/portico : formule pour la TUI et cask pour l’app de bureau, mis à jour depuis chaque release.' },
      { g: 'after', s: 'wip', t: 'AUR', d: 'Paquets portico-bin et portico-gui-bin générés depuis chaque release. Publication sur l’AUR en cours.' },
      { g: 'after', s: 'next', t: 'Windows', d: 'Gestionnaire d’identifiants Windows, agent OpenSSH sur named pipe, permissions par ACL, Scoop et Winget.' },
    ] as { g: 'mvp' | 'after'; s: Status; t: string; d: string }[],
  },
  architecture: {
    label: 'Architecture',
    title: 'Événementiel, de bout en bout.',
    lead: 'Le moteur publie ses événements sur un plan de contrôle. Les octets des terminaux circulent sur des canaux dédiés et bornés. Une UI lente ne ralentit jamais une session.',
    points: [
      { k: 'Plan de contrôle', v: 'broadcast<EngineEvent>. Les UIs dérivent leur état des événements ; un abonné en retard se resynchronise.' },
      { k: 'Plan de données', v: 'Deux mpsc bornés par terminal. La backpressure remonte jusqu’à la fenêtre SSH, jamais jusqu’au bus.' },
      { k: 'Prompts', v: 'Clé hôte, mot de passe, passphrase : seule l’opération concernée attend votre réponse.' },
      { k: 'Acteurs', v: 'Une tâche par session possède la connexion. Fermer la session ferme PTY, SFTP et tunnels.' },
    ],
    figure: 'Fig. 02 · Moteur et interfaces',
    diagramLabel: 'Schéma : portico-core publie des EngineEvent vers la TUI et la GUI, et échange les octets des terminaux sur des canaux bornés. Chaque session est un acteur qui possède sa connexion russh.',
  },
  security: {
    label: 'Sécurité',
    title: 'Aucun secret en clair. Jamais.',
    lead: 'Sécurité by design, vérifiée par un agent d’audit à la fin de chaque phase : tous les constats critiques et élevés ont été corrigés avant de continuer.',
    items: [
      { k: 'Keyring système', v: 'Mots de passe et passphrases dans Keychain ou Secret Service, liés à l’identité vérifiée de l’hôte.' },
      { k: 'Clé modifiée = refus', v: 'Même avec StrictHostKeyChecking no. Aucun bouton « accepter » : la commande ssh-keygen -R exacte est affichée.' },
      { k: 'Pas de SHA-1', v: 'ssh-rsa retiré des algorithmes hôtes. Backend crypto aws-lc-rs, sans libssh2 en C.' },
      { k: 'Collage assaini', v: 'ESC et contrôles C1 retirés avant d’atteindre le terminal. Un collage ne répond jamais à un dialogue de clé.' },
      { k: 'Logs propres', v: 'Ni secret, ni contenu de terminal dans les logs ou les événements. Debug redigé.' },
      { k: 'Rust strict', v: 'forbid(unsafe_code), zéro unwrap hors tests, clippy pedantic sans warning.' },
    ],
    modal: {
      title: 'Clé d’hôte modifiée · db-prod',
      body: 'La clé présentée par db-prod ne correspond pas à celle enregistrée. Quelqu’un intercepte peut-être la connexion.',
      expected: 'Attendue',
      received: 'Reçue',
      fix: 'Si le changement est légitime :',
      close: 'Fermer',
      details: 'Voir les logs',
    },
  },
  keyboard: {
    label: 'Clavier',
    title: 'Les mains restent sur le clavier.',
    lead: 'Une seule grammaire pour la TUI et la GUI, et tous les raccourcis se règlent dans settings.toml. Appuyez sur les touches : les raccourcis s’allument.',
    hint: 'Astuce : la touche t change le thème de ce site, comme dans Portico.',
    groups: [
      {
        name: 'Hôtes',
        keys: [
          [['j', 'k'], 'Descendre / monter'],
          [['/'], 'Recherche : #tag, @groupe, *'],
          [['↵'], 'Se connecter'],
          [['f'], 'Fichiers (SFTP)'],
          [['p'], 'Tunnels'],
          [['i'], 'Clés, agent, vault'],
          [['s'], 'Snippets'],
          [['e'], 'Éditer l’hôte'],
          [['l'], 'Logs de session'],
          [['t'], 'Changer de thème'],
        ],
      },
      {
        name: 'Terminal · TUI',
        keys: [
          [['Ctrl', 'Space'], 'Préfixe des commandes'],
          [['␣', '%'], 'Panneau à droite'],
          [['␣', '"'], 'Panneau en dessous'],
          [['␣', 'z'], 'Zoom du panneau'],
          [['␣', 'n'], 'Nouvel onglet, même hôte'],
          [['␣', '1…9'], 'Aller à l’onglet n'],
          [['⇧', 'PgUp'], 'Historique'],
        ],
      },
      {
        name: 'GUI · ⌘ / Ctrl-Shift',
        keys: [
          [['⌘', 'K'], 'Palette de commandes'],
          [['⌘', 'D'], 'Panneau à droite'],
          [['⌘', '⇧', 'D'], 'Panneau en dessous'],
          [['⌘', '⇧', 'F'], 'Fichiers à côté du terminal'],
          [['⌘', '⇧', 'L'], 'Logs de session'],
          [['⌘', 'T'], 'Nouvel onglet'],
          [['⌘', '1…9'], 'Onglet n'],
        ],
      },
    ] as { name: string; keys: [string[], string][] }[],
    more: 'Tous les raccourcis',
  },
  roadmap: {
    label: 'Feuille de route',
    title: 'Livré par phases, vérifié à chaque étape.',
    phases: [
      { n: '0', s: 'done', t: 'Fondations', d: 'Workspace, lints stricts, parser ssh_config, inventaire, thèmes, coquilles TUI et GUI.' },
      { n: '1', s: 'done', t: 'Connexion interactive', d: 'Transport, known_hosts, auth dans l’ordre d’OpenSSH, ProxyJump, terminaux dans les deux UIs.' },
      { n: '2', s: 'done', t: 'SFTP et tunnels', d: 'Explorateurs de fichiers, transferts streamés, forwarding -L et -R.' },
      { n: '3', s: 'done', t: 'Clés, secrets, snippets', d: 'Génération, copy-id, agent, vault chiffré de repli, snippets avec placeholders.' },
      { n: '4', s: 'done', t: 'Finition du MVP', d: 'Récents, favoris, logs et config effective, raccourcis configurables, paquets, audit sécurité final.' },
      { n: '5', s: 'done', t: 'SOCKS5, import, distribution', d: 'Tunnel -D, import Termius, release v0.1.0 et tap Homebrew. AUR à publier.' },
      { n: '6', s: 'wip', t: 'Terminal', d: 'Split panes livrés dans les deux UIs. Enregistrement asciicast : moteur livré, relecture en cours.' },
      { n: '7', s: 'drop', t: 'Synchronisation', d: 'Sync locale des métadonnées via un dossier : abandonnée, Portico reste strictement local.' },
      { n: '8', s: 'next', t: 'Windows', d: 'Credential Manager, agent sur named pipe, ACL, WebView2, Scoop et Winget.' },
    ] as { n: string; s: Status; t: string; d: string }[],
    later: 'Ensuite',
    laterItems: ['ProxyCommand', 'Forwards persistants', 'Forwarding d’agent', 'Touch ID', 'Broadcast multi-hôtes', 'Recherche dans l’historique', 'Thème clair', 'Mosh', 'Certificats éphémères'],
  },
  install: {
    label: 'Installer',
    title: 'Installer Portico.',
    lead: 'La version 0.1.0 est publiée pour macOS et Linux : l’app de bureau et le binaire de terminal. Choisissez votre système.',
    release: { version: '0.1.0', date: '22 octobre 2026', notes: 'Notes de version', sums: 'SHA256SUMS', all: 'Tous les fichiers' },
    status: { ok: 'Disponible', soon: 'Bientôt' },
    platforms: [
      {
        id: 'macos',
        name: 'macOS',
        methods: [
          {
            k: 'Homebrew',
            s: 'ok',
            note: 'La méthode la plus simple : le tap fs0ciety7000/portico installe la TUI (formule) et l’app de bureau (cask), et brew upgrade suit les nouvelles versions.',
            steps: [
              { k: 'TUI', cmd: 'brew install fs0ciety7000/portico/portico' },
              { k: 'GUI', cmd: 'brew install --cask fs0ciety7000/portico/portico' },
            ],
          },
          {
            k: 'App de bureau (.dmg)',
            s: 'ok',
            note: 'Universelle (Apple Silicon et Intel), macOS 13 ou plus. La 0.1.0 n’est pas encore signée par Apple : après l’avoir glissée dans Applications, autorisez-la une fois.',
            files: [{ name: 'Portico_0.1.0_universal-unsigned.dmg', size: '12,9 Mo' }],
            steps: [{ k: 'Autoriser', cmd: 'xattr -dr com.apple.quarantine /Applications/Portico.app' }],
          },
          {
            k: 'Terminal (TUI)',
            s: 'ok',
            note: 'Un seul binaire, portico, à placer dans votre PATH.',
            steps: [
              { k: 'Apple Silicon', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-aarch64-apple-darwin.tar.gz | tar xz && sudo install portico-0.1.0-aarch64-apple-darwin/portico /usr/local/bin/' },
              { k: 'Intel', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-x86_64-apple-darwin.tar.gz | tar xz && sudo install portico-0.1.0-x86_64-apple-darwin/portico /usr/local/bin/' },
            ],
          },
        ],
      },
      {
        id: 'linux',
        name: 'Linux',
        methods: [
          {
            k: 'Debian, Ubuntu (.deb)',
            s: 'ok',
            note: 'Debian 12+, Ubuntu 22.04+. Installe l’app de bureau portico-gui et son entrée de menu.',
            steps: [
              { k: 'x86_64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_amd64.deb && sudo apt install ./Portico_0.1.0_amd64.deb' },
              { k: 'arm64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_arm64.deb && sudo apt install ./Portico_0.1.0_arm64.deb' },
            ],
          },
          {
            k: 'Arch Linux (AUR)',
            s: 'soon',
            note: 'Les paquets portico-bin et portico-gui-bin sont en cours de publication sur l’AUR.',
            steps: [
              { k: 'TUI', cmd: 'yay -S portico-bin' },
              { k: 'GUI', cmd: 'yay -S portico-gui-bin' },
            ],
          },
          {
            k: 'AppImage',
            s: 'ok',
            note: 'Toute distribution avec glibc 2.35 ou plus. Autonome : embarque WebKitGTK.',
            steps: [
              { k: 'x86_64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_amd64.AppImage && chmod +x Portico_0.1.0_amd64.AppImage && ./Portico_0.1.0_amd64.AppImage' },
              { k: 'aarch64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_aarch64.AppImage && chmod +x Portico_0.1.0_aarch64.AppImage && ./Portico_0.1.0_aarch64.AppImage' },
            ],
          },
          {
            k: 'Terminal (TUI)',
            s: 'ok',
            note: 'La variante gnu est recommandée (résolution par NSS : mDNS, sssd, LDAP). La variante musl, statique, tourne partout. Remplacez x86_64 par aarch64 sur ARM.',
            steps: [
              { k: 'glibc', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-x86_64-unknown-linux-gnu.tar.gz | tar xz && sudo install portico-0.1.0-x86_64-unknown-linux-gnu/portico /usr/local/bin/' },
              { k: 'musl', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-x86_64-unknown-linux-musl.tar.gz | tar xz && sudo install portico-0.1.0-x86_64-unknown-linux-musl/portico /usr/local/bin/' },
            ],
          },
        ],
      },
      {
        id: 'source',
        name: 'Sources',
        methods: [
          {
            k: 'Cargo et pnpm',
            s: 'ok',
            note: 'Rust 1.90 ou plus. Linux : la GUI demande libwebkit2gtk-4.1-dev.',
            steps: [
              { k: 'Cloner', cmd: 'git clone https://github.com/fs0ciety7000/Portico && cd Portico' },
              { k: 'TUI', cmd: 'cargo install --locked --path apps/portico-tui' },
              { k: 'GUI', cmd: 'cd apps/portico-gui && pnpm install --frozen-lockfile && pnpm tauri build' },
            ],
          },
        ],
      },
    ] as Platform[],
    verify: {
      k: 'Vérifier un téléchargement',
      note: 'Chaque fichier de la release a sa somme SHA-256. Sur macOS, remplacez sha256sum par shasum -a 256.',
      cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/SHA256SUMS && sha256sum -c SHA256SUMS --ignore-missing',
    },
    first: { k: 'Premier lancement', cmd: 'portico', note: 'Portico lit votre ~/.ssh/config tel quel : vos hôtes sont déjà là. portico --help liste les options.' },
    copy: 'Copier',
    copied: 'Copié',
  },
  faq: {
    label: 'Questions',
    title: 'Avant de commencer.',
    items: [
      { q: 'Portico modifie-t-il mon ~/.ssh/config ?', a: 'Non, jamais. Portico le lit. Ses propres métadonnées vivent dans hosts.toml. Les seules écritures dans ~/.ssh sont l’ajout dans known_hosts après votre accord, et les clés que vous demandez de générer.' },
      { q: 'Faut-il un compte ou une connexion Internet ?', a: 'Non. Aucun compte, aucun service distant, aucune télémétrie. Portico fonctionne entièrement hors ligne.' },
      { q: 'Pourquoi une TUI et une GUI ?', a: 'Parce que certains vivent dans tmux et d’autres dans des fenêtres. Le moteur est le même : comportement, sécurité et raccourcis identiques.' },
      { q: 'macOS dit que l’app ne peut pas être ouverte.', a: 'La 0.1.0 n’est pas encore signée ni notarisée par Apple. Autorisez-la une fois dans Réglages Système → Confidentialité et sécurité, ou avec xattr -dr com.apple.quarantine /Applications/Portico.app.' },
      { q: 'Je viens de Termius, puis-je reprendre mes hôtes ?', a: 'Oui : portico import termius FICHIER, ou « Import from Termius… » dans la palette de la GUI. Portico génère un fichier à inclure dans votre config, reprend tags et groupes, et n’importe aucun secret.' },
      { q: 'Et Windows ?', a: 'C’est la phase 8 de la feuille de route : keyring Windows, agent OpenSSH, permissions par ACL, Scoop et Winget.' },
      { q: 'Quelle est la licence ?', a: 'MIT OR Apache-2.0, au choix.' },
    ],
  },
  footer: {
    tagline: 'Gestionnaire de sessions SSH local-first, rapide et keyboard-first. Un moteur Rust, deux interfaces.',
    cols: [
      { t: 'Produit', l: [['#interfaces', 'Interfaces'], ['#fonctionnalites', 'Fonctionnalités'], ['#securite', 'Sécurité'], ['#clavier', 'Clavier']] },
      { t: 'Projet', l: [['#feuille-de-route', 'Feuille de route'], ['#installer', 'Installer'], ['#questions', 'Questions']] },
      { t: 'Code', l: [[REPO, 'Dépôt Portico'], [`${REPO}/blob/main/docs/KEYBINDINGS.md`, 'Raccourcis'], [`${REPO}/blob/main/docs/STACK.md`, 'Choix techniques'], [SITE_REPO, 'Code de ce site']] },
    ] as { t: string; l: [string, string][] }[],
    credit: 'Conçu et développé par',
    author: 'Nicolas Dessenius',
    studio: 'Cardor Interactive',
    studioUrl: 'https://interactive.cardormedia.com',
    license: 'MIT OR Apache-2.0',
    top: 'Haut de page',
    landscapeLabel: 'Gravure : un portique en ruine dans un désert de mesas, la nuit, son arche éclairée ; un voyageur portant une lanterne marche vers lui.',
  },
  tui: {
    hosts: 'Hosts',
    search: 'Rechercher',
    connecting: 'Connecting',
    authenticating: 'Authenticating · agent',
    connected: 'Connected',
  },
};

export type Dict = typeof fr;

const en: Dict = {
  lang: 'en',
  locale: 'en_US',
  meta: {
    title: 'Portico · Local-first SSH session manager, written in Rust',
    description:
      'A local-first, keyboard-first SSH client for macOS and Linux. One Rust engine, a TUI and a GUI. Your ~/.ssh/config stays the source of truth.',
  },
  skip: 'Skip to content',
  nav: {
    label: 'Main navigation',
    links: [
      ['#interfaces', 'Interfaces'],
      ['#fonctionnalites', 'Features'],
      ['#securite', 'Security'],
      ['#clavier', 'Keyboard'],
      ['#feuille-de-route', 'Roadmap'],
      ['#installer', 'Install'],
    ],
    github: 'GitHub',
    theme: 'Theme',
    themeHint: 'Switch theme (t key)',
    menu: 'Menu',
    close: 'Close',
    langSwitch: { href: '/', label: 'FR', title: 'Lire en français' },
  },
  hero: {
    eyebrow: 'SSH client · Rust · macOS & Linux',
    title: ['The gateway', 'to your servers.'],
    lead: 'Portico is a local-first, fast, keyboard-first SSH session manager. One Rust engine, two interfaces: a TUI and a GUI. Your ~/.ssh/config stays the source of truth.',
    primary: 'Install',
    secondary: 'View the code',
    release: 'v0.1.0 is out',
    releaseHint: 'The complete MVP, for macOS and Linux',
    tags: ['{rust:1.90}', '{unsafe:forbid}', '{cloud:0}', '{tui:25ms}'],
    figure: 'Fig. 01 · The threshold',
    figureMeta: 'kex curve25519-sha256',
    scroll: 'Scroll to step in',
    sceneLabel: '3D scene: the portico of the Portico logo, an entablature on two columns, its lit arch crossed by a tunnel of rings and a stream of particles.',
  },
  stats: {
    label: 'By the numbers',
    items: [
      { value: '0', unit: '', label: 'accounts, cloud or telemetry. Everything works offline.' },
      { value: '25', unit: 'ms', label: 'until the TUI is usable from cold with 50 hosts. The target was 100 ms.' },
      { value: '7', unit: 'MB', label: 'of memory at rest for the TUI, with a terminal open.' },
      { value: '400', unit: '+', label: 'tests, including interop with a real OpenSSH (13 scenarios) and an end-to-end test of the desktop app.' },
    ],
  },
  manifesto: {
    label: 'Principles',
    title: 'Your setup is the source of truth.',
    body: 'Portico reads ~/.ssh/config, known_hosts, ssh-agent and your keys. It never rewrites your configuration: its own metadata (tags, favourites, groups) lives alongside, in readable TOML. No account, no forced sync, no lock-in.',
    items: [
      { k: 'Zero lock-in', v: 'Data in readable, versionable TOML. Delete Portico and your SSH setup has not moved.' },
      { k: 'Keyboard-first', v: 'Every action has a shortcut. The ⌘K palette exposes everything; the mouse is never required.' },
      { k: 'Performance', v: 'The TUI is usable in under 100 ms from cold. No redraw when nothing changes.' },
      { k: 'OpenSSH semantics', v: 'Include, Match, ProxyJump, tokens, authentication order: exactly what OpenSSH does.' },
    ],
  },
  interfaces: {
    label: 'Interfaces',
    title: ['One engine.', 'Two interfaces.'],
    lead: 'portico-core does all the work: sessions, authentication, SFTP, tunnels. The TUI lives in your terminal, the GUI in a native window. Same engine, same shortcuts, same themes.',
    tabs: { tui: 'TUI · terminal', gui: 'GUI · app', tuiShort: 'TUI', guiShort: 'GUI' },
    tuiHint: 'Try it: j / k to move, ↵ to connect, / to search, t for the theme.',
    tuiFocus: 'Click or tab into the terminal to drive it from the keyboard.',
    tuiSpecs: [
      ['Rendering', 'ratatui 0.30 · crossterm'],
      ['Emulator', 'alacritty_terminal · 10,000 lines'],
      ['Tabs', 'and panes, Ctrl-Space prefix'],
    ],
    guiSpecs: [
      ['Shell', 'Tauri 2 · thin Rust layer'],
      ['Interface', 'Svelte 5 · xterm.js 6 WebGL'],
      ['Palette', '⌘K, every action'],
    ],
    guiAlt: 'The Portico app: host list on the left, details of the selected host, connection status.',
    themesTitle: 'Three dark themes',
    themes: [
      { id: 'obsidian', name: 'Obsidian', note: 'Mineral, brass accent' },
      { id: 'basalt', name: 'Basalt', note: 'Blue-grey, steel accent' },
      { id: 'travertine', name: 'Travertine Night', note: 'Warm stone, terracotta' },
    ],
    themesNote: 'This site runs on portico-theme tokens: switch theme and the whole page follows.',
  },
  features: {
    label: 'Features',
    title: 'The MVP has shipped. More is on the way.',
    lead: 'All fourteen MVP features have shipped in both interfaces. Each phase closes with three reviews: security, SSH protocols and design.',
    legend: { done: 'Shipped', wip: 'In progress', next: 'Planned', drop: 'Dropped' },
    groups: { mvp: 'MVP · 14 of 14', after: 'After the MVP' },
    items: [
      { g: 'mvp', s: 'done', t: '~/.ssh/config parsing', d: 'Host, Match, Include, wildcards, inheritance, tokens and ProxyJump, with OpenSSH first-wins semantics. Custom parser, fast even with 2,000 hosts.' },
      { g: 'mvp', s: 'done', t: 'Fuzzy search, tags and groups', d: 'nucleo matcher (from Helix). #tag, @group and * for favourites; tags, groups and notes are edited in hosts.toml.' },
      { g: 'mvp', s: 'done', t: 'Interactive SSH sessions', d: 'xterm-256color PTY, tabs, live resize, vim and htop work. Recursive ProxyJump, up to 8 hops.' },
      { g: 'mvp', s: 'done', t: 'SFTP browser and transfers', d: 'Dual panes in the TUI, list and drag-and-drop in the GUI. 1 GiB each way against OpenSSH, cancel with no leftover file.' },
      { g: 'mvp', s: 'done', t: 'Keys, ssh-agent and certificates', d: 'Local keys, agent identities (add with a lifetime, remove), OpenSSH certificates with their validity and a warning 7 days before expiry.' },
      { g: 'mvp', s: 'done', t: 'Key generation', d: 'ed25519 by default, RSA 3072 to 8192, ECDSA P-256/384/521, passphrase in OpenSSH format. An existing key is never overwritten.' },
      { g: 'mvp', s: 'done', t: 'Public key copy', d: 'The ssh-copy-id equivalent: idempotent, never rewrites what is there, then reconnects with that key alone to check.' },
      { g: 'mvp', s: 'done', t: 'Local and remote port forwarding', d: '-L and -R, on localhost by default. Listening on the network needs a confirmation, and forwards from ssh_config are offered, never started on their own.' },
      { g: 'mvp', s: 'done', t: 'Recents, favourites and tabs', d: 'The last 50 sessions, favourites, groups and several sessions open in tabs.' },
      { g: 'mvp', s: 'done', t: 'Snippets', d: 'Global, per host or per tag, with validated placeholders. Run in the active tab; a risky multi-line paste is refused.' },
      { g: 'mvp', s: 'done', t: 'Connection status and latency', d: 'connecting → authenticating → connected, with RTT measured through keepalive@openssh.com. Every error comes with an actionable hint.' },
      { g: 'mvp', s: 'done', t: 'Three themes, configurable shortcuts', d: 'Obsidian, Basalt, Travertine Night, contrast tested. Shortcuts set in settings.toml, documentation generated from the keymap.' },
      { g: 'mvp', s: 'done', t: 'Secrets in the keyring', d: 'Keychain on macOS, Secret Service on Linux. As a fallback, an encrypted vault (Argon2id, XChaCha20-Poly1305) unlocked at startup.' },
      { g: 'mvp', s: 'done', t: 'Session logs and effective config', d: 'Per-session connection logs, filterable, and the effective config à la ssh -G with the file:line origin of every option.' },
      { g: 'after', s: 'done', t: 'SOCKS5 proxy (-D)', d: 'Dynamic tunnel, DynamicForward from ssh_config offered, network listening only after a confirmation.' },
      { g: 'after', s: 'done', t: 'Import from Termius', d: 'portico import termius writes a file to include in your config and keeps tags and groups. No secret is imported.' },
      { g: 'after', s: 'done', t: 'Split panes', d: 'Up to 8 panes per tab, on the same session or another host, from the keyboard or the mouse, with zoom.' },
      { g: 'after', s: 'wip', t: 'Session recording', d: 'asciicast v2, on demand and per terminal, output only (never keystrokes), a visible REC indicator. Engine shipped, replay in the UIs in progress.' },
      { g: 'after', s: 'done', t: 'Homebrew', d: 'The fs0ciety7000/portico tap: a formula for the TUI and a cask for the desktop app, updated from every release.' },
      { g: 'after', s: 'wip', t: 'AUR', d: 'portico-bin and portico-gui-bin packages generated from every release. Publishing on the AUR is in progress.' },
      { g: 'after', s: 'next', t: 'Windows', d: 'Windows Credential Manager, OpenSSH agent over a named pipe, ACL permissions, Scoop and Winget.' },
    ],
  },
  architecture: {
    label: 'Architecture',
    title: 'Event-driven, end to end.',
    lead: 'The engine publishes events on a control plane. Terminal bytes travel on dedicated, bounded channels. A slow UI never slows a session down.',
    points: [
      { k: 'Control plane', v: 'broadcast<EngineEvent>. UIs derive their state from events; a lagging subscriber resynchronises.' },
      { k: 'Data plane', v: 'Two bounded mpsc per terminal. Backpressure reaches the SSH window, never the event bus.' },
      { k: 'Prompts', v: 'Host key, password, passphrase: only the operation that needs you waits for your answer.' },
      { k: 'Actors', v: 'One task per session owns the connection. Closing a session closes its PTYs, SFTP and tunnels.' },
    ],
    figure: 'Fig. 02 · Engine and interfaces',
    diagramLabel: 'Diagram: portico-core publishes EngineEvents to the TUI and the GUI, and exchanges terminal bytes over bounded channels. Each session is an actor that owns its russh connection.',
  },
  security: {
    label: 'Security',
    title: 'No secret in clear text. Ever.',
    lead: 'Secure by design, checked by an audit agent at the end of every phase: every critical and high finding was fixed before moving on.',
    items: [
      { k: 'System keyring', v: 'Passwords and passphrases in Keychain or Secret Service, bound to the host’s verified identity.' },
      { k: 'Changed key = refusal', v: 'Even with StrictHostKeyChecking no. No “accept” button: the exact ssh-keygen -R command is shown.' },
      { k: 'No SHA-1', v: 'ssh-rsa removed from host key algorithms. aws-lc-rs crypto backend, no libssh2 in C.' },
      { k: 'Sanitised paste', v: 'ESC and C1 controls stripped before reaching the terminal. A paste never answers a host key dialog.' },
      { k: 'Clean logs', v: 'No secret and no terminal content in logs or events. Debug output is redacted.' },
      { k: 'Strict Rust', v: 'forbid(unsafe_code), zero unwrap outside tests, clippy pedantic with no warning.' },
    ],
    modal: {
      title: 'Host key changed · db-prod',
      body: 'The key presented by db-prod does not match the one on record. Someone may be intercepting the connection.',
      expected: 'Expected',
      received: 'Received',
      fix: 'If the change is legitimate:',
      close: 'Close',
      details: 'Show logs',
    },
  },
  keyboard: {
    label: 'Keyboard',
    title: 'Hands stay on the keys.',
    lead: 'One grammar for the TUI and the GUI, and every shortcut can be changed in settings.toml. Press the keys: the shortcuts light up.',
    hint: 'Tip: the t key switches this site’s theme, just like in Portico.',
    groups: [
      {
        name: 'Hosts',
        keys: [
          [['j', 'k'], 'Move down / up'],
          [['/'], 'Search: #tag, @group, *'],
          [['↵'], 'Connect'],
          [['f'], 'Files (SFTP)'],
          [['p'], 'Tunnels'],
          [['i'], 'Keys, agent, vault'],
          [['s'], 'Snippets'],
          [['e'], 'Edit the host'],
          [['l'], 'Session logs'],
          [['t'], 'Switch theme'],
        ],
      },
      {
        name: 'Terminal · TUI',
        keys: [
          [['Ctrl', 'Space'], 'Command prefix'],
          [['␣', '%'], 'Pane to the right'],
          [['␣', '"'], 'Pane below'],
          [['␣', 'z'], 'Zoom the pane'],
          [['␣', 'n'], 'New tab, same host'],
          [['␣', '1…9'], 'Go to tab n'],
          [['⇧', 'PgUp'], 'Scrollback'],
        ],
      },
      {
        name: 'GUI · ⌘ / Ctrl-Shift',
        keys: [
          [['⌘', 'K'], 'Command palette'],
          [['⌘', 'D'], 'Pane to the right'],
          [['⌘', '⇧', 'D'], 'Pane below'],
          [['⌘', '⇧', 'F'], 'Files beside the terminal'],
          [['⌘', '⇧', 'L'], 'Session logs'],
          [['⌘', 'T'], 'New tab'],
          [['⌘', '1…9'], 'Tab n'],
        ],
      },
    ],
    more: 'All shortcuts',
  },
  roadmap: {
    label: 'Roadmap',
    title: 'Shipped in phases, checked at every step.',
    phases: [
      { n: '0', s: 'done', t: 'Foundations', d: 'Workspace, strict lints, ssh_config parser, inventory, themes, TUI and GUI shells.' },
      { n: '1', s: 'done', t: 'Interactive sessions', d: 'Transport, known_hosts, OpenSSH-order auth, ProxyJump, terminals in both UIs.' },
      { n: '2', s: 'done', t: 'SFTP and tunnels', d: 'File browsers, streamed transfers, -L and -R forwarding.' },
      { n: '3', s: 'done', t: 'Keys, secrets, snippets', d: 'Generation, copy-id, agent, encrypted fallback vault, snippets with placeholders.' },
      { n: '4', s: 'done', t: 'MVP polish', d: 'Recents, favourites, logs and effective config, configurable shortcuts, packages, final security audit.' },
      { n: '5', s: 'done', t: 'SOCKS5, import, distribution', d: '-D tunnel, Termius import, v0.1.0 release and Homebrew tap. AUR still to publish.' },
      { n: '6', s: 'wip', t: 'Terminal', d: 'Split panes shipped in both UIs. asciicast recording: engine shipped, replay in progress.' },
      { n: '7', s: 'drop', t: 'Sync', d: 'Local metadata sync through a folder: dropped, Portico stays strictly local.' },
      { n: '8', s: 'next', t: 'Windows', d: 'Credential Manager, agent over a named pipe, ACLs, WebView2, Scoop and Winget.' },
    ],
    later: 'After that',
    laterItems: ['ProxyCommand', 'Persistent forwards', 'Agent forwarding', 'Touch ID', 'Multi-host broadcast', 'Scrollback search', 'Light theme', 'Mosh', 'Ephemeral certificates'],
  },
  install: {
    label: 'Install',
    title: 'Install Portico.',
    lead: 'Version 0.1.0 is out for macOS and Linux: the desktop app and the terminal binary. Pick your system.',
    release: { version: '0.1.0', date: '22 October 2026', notes: 'Release notes', sums: 'SHA256SUMS', all: 'All files' },
    status: { ok: 'Available', soon: 'Soon' },
    platforms: [
      {
        id: 'macos',
        name: 'macOS',
        methods: [
          {
            k: 'Homebrew',
            s: 'ok',
            note: 'The easiest way: the fs0ciety7000/portico tap installs the TUI (formula) and the desktop app (cask), and brew upgrade follows new versions.',
            steps: [
              { k: 'TUI', cmd: 'brew install fs0ciety7000/portico/portico' },
              { k: 'GUI', cmd: 'brew install --cask fs0ciety7000/portico/portico' },
            ],
          },
          {
            k: 'Desktop app (.dmg)',
            s: 'ok',
            note: 'Universal (Apple Silicon and Intel), macOS 13 or later. 0.1.0 is not signed by Apple yet: after dragging it to Applications, allow it once.',
            files: [{ name: 'Portico_0.1.0_universal-unsigned.dmg', size: '12.9 MB' }],
            steps: [{ k: 'Allow', cmd: 'xattr -dr com.apple.quarantine /Applications/Portico.app' }],
          },
          {
            k: 'Terminal (TUI)',
            s: 'ok',
            note: 'A single binary, portico, to put on your PATH.',
            steps: [
              { k: 'Apple Silicon', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-aarch64-apple-darwin.tar.gz | tar xz && sudo install portico-0.1.0-aarch64-apple-darwin/portico /usr/local/bin/' },
              { k: 'Intel', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-x86_64-apple-darwin.tar.gz | tar xz && sudo install portico-0.1.0-x86_64-apple-darwin/portico /usr/local/bin/' },
            ],
          },
        ],
      },
      {
        id: 'linux',
        name: 'Linux',
        methods: [
          {
            k: 'Debian, Ubuntu (.deb)',
            s: 'ok',
            note: 'Debian 12+, Ubuntu 22.04+. Installs the portico-gui desktop app and its menu entry.',
            steps: [
              { k: 'x86_64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_amd64.deb && sudo apt install ./Portico_0.1.0_amd64.deb' },
              { k: 'arm64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_arm64.deb && sudo apt install ./Portico_0.1.0_arm64.deb' },
            ],
          },
          {
            k: 'Arch Linux (AUR)',
            s: 'soon',
            note: 'The portico-bin and portico-gui-bin packages are being published on the AUR.',
            steps: [
              { k: 'TUI', cmd: 'yay -S portico-bin' },
              { k: 'GUI', cmd: 'yay -S portico-gui-bin' },
            ],
          },
          {
            k: 'AppImage',
            s: 'ok',
            note: 'Any distribution with glibc 2.35 or later. Self-contained: it ships WebKitGTK.',
            steps: [
              { k: 'x86_64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_amd64.AppImage && chmod +x Portico_0.1.0_amd64.AppImage && ./Portico_0.1.0_amd64.AppImage' },
              { k: 'aarch64', cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/Portico_0.1.0_aarch64.AppImage && chmod +x Portico_0.1.0_aarch64.AppImage && ./Portico_0.1.0_aarch64.AppImage' },
            ],
          },
          {
            k: 'Terminal (TUI)',
            s: 'ok',
            note: 'The gnu build is recommended (name resolution through NSS: mDNS, sssd, LDAP). The static musl build runs anywhere. Replace x86_64 with aarch64 on ARM.',
            steps: [
              { k: 'glibc', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-x86_64-unknown-linux-gnu.tar.gz | tar xz && sudo install portico-0.1.0-x86_64-unknown-linux-gnu/portico /usr/local/bin/' },
              { k: 'musl', cmd: 'curl -L https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/portico-0.1.0-x86_64-unknown-linux-musl.tar.gz | tar xz && sudo install portico-0.1.0-x86_64-unknown-linux-musl/portico /usr/local/bin/' },
            ],
          },
        ],
      },
      {
        id: 'source',
        name: 'Source',
        methods: [
          {
            k: 'Cargo and pnpm',
            s: 'ok',
            note: 'Rust 1.90 or later. Linux: the GUI needs libwebkit2gtk-4.1-dev.',
            steps: [
              { k: 'Clone', cmd: 'git clone https://github.com/fs0ciety7000/Portico && cd Portico' },
              { k: 'TUI', cmd: 'cargo install --locked --path apps/portico-tui' },
              { k: 'GUI', cmd: 'cd apps/portico-gui && pnpm install --frozen-lockfile && pnpm tauri build' },
            ],
          },
        ],
      },
    ],
    verify: {
      k: 'Verify a download',
      note: 'Every file in the release has its SHA-256 sum. On macOS, use shasum -a 256 instead of sha256sum.',
      cmd: 'curl -LO https://github.com/fs0ciety7000/Portico/releases/download/v0.1.0/SHA256SUMS && sha256sum -c SHA256SUMS --ignore-missing',
    },
    first: { k: 'First run', cmd: 'portico', note: 'Portico reads your ~/.ssh/config as is: your hosts are already there. portico --help lists the options.' },
    copy: 'Copy',
    copied: 'Copied',
  },
  faq: {
    label: 'Questions',
    title: 'Before you start.',
    items: [
      { q: 'Does Portico modify my ~/.ssh/config?', a: 'No, never. Portico reads it. Its own metadata lives in hosts.toml. The only writes to ~/.ssh are known_hosts additions after you agree, and keys you ask it to generate.' },
      { q: 'Do I need an account or an Internet connection?', a: 'No. No account, no remote service, no telemetry. Portico works entirely offline.' },
      { q: 'Why both a TUI and a GUI?', a: 'Because some people live in tmux and others in windows. The engine is the same: identical behaviour, security and shortcuts.' },
      { q: 'macOS says the app cannot be opened.', a: '0.1.0 is not signed or notarised by Apple yet. Allow it once in System Settings → Privacy & Security, or with xattr -dr com.apple.quarantine /Applications/Portico.app.' },
      { q: 'I come from Termius, can I bring my hosts?', a: 'Yes: portico import termius FILE, or “Import from Termius…” in the GUI palette. Portico writes a file to include in your config, keeps tags and groups, and imports no secret.' },
      { q: 'What about Windows?', a: 'It is phase 8 of the roadmap: Windows keyring, OpenSSH agent, ACL permissions, Scoop and Winget.' },
      { q: 'What is the licence?', a: 'MIT OR Apache-2.0, at your option.' },
    ],
  },
  footer: {
    tagline: 'Local-first, fast, keyboard-first SSH session manager. One Rust engine, two interfaces.',
    cols: [
      { t: 'Product', l: [['#interfaces', 'Interfaces'], ['#fonctionnalites', 'Features'], ['#securite', 'Security'], ['#clavier', 'Keyboard']] },
      { t: 'Project', l: [['#feuille-de-route', 'Roadmap'], ['#installer', 'Install'], ['#questions', 'Questions']] },
      { t: 'Code', l: [[REPO, 'Portico repository'], [`${REPO}/blob/main/docs/KEYBINDINGS.md`, 'Shortcuts'], [`${REPO}/blob/main/docs/STACK.md`, 'Technical choices'], [SITE_REPO, 'This site’s code']] },
    ],
    credit: 'Designed and built by',
    author: 'Nicolas Dessenius',
    studio: 'Cardor Interactive',
    studioUrl: 'https://interactive.cardormedia.com',
    license: 'MIT OR Apache-2.0',
    top: 'Back to top',
    landscapeLabel: 'Engraving: a ruined portico in a desert of mesas at night, its arch lit; a traveller carrying a lantern walks towards it.',
  },
  tui: {
    hosts: 'Hosts',
    search: 'Search',
    connecting: 'Connecting',
    authenticating: 'Authenticating · agent',
    connected: 'Connected',
  },
};

export const dict: Record<Lang, Dict> = { fr, en };
