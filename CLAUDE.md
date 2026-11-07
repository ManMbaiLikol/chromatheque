# Accords Wada — consignes du projet

Application web qui part d'une couleur (choisie ou prélevée sur une image) et propose les accords qui la contiennent : par défaut ceux du *Dictionary of Color Combinations* de Sanzo Wada, au choix ceux d'autres sources (kasane no irome, traditions africaines, règles d'harmonie). Elle montre ensuite leur effet dans 15 métiers de la création. Public : designers d'intérieur, stylistes, graphistes. Auteur : Manso Olivier (MAN MBAÏ LIKOL).

## Structure

- `index.html` — la page (aucune étape de build : s'ouvre directement dans le navigateur). Ordre des scripts : `core.js`, `i18n.js`, `wada-data.js`, `sources-data.js`, `scenes.js`, `app.js`. Parcours en étapes numérotées : 01 sources, 02 couleur, 03 accords, 04 accord, 05 métier, 06 livrer, 07 bibliothèque, puis le répertoire de la source.
- `src/core.js` — fonctions **pures**, sans DOM : conversions sRGB ↔ OKLab/OKLCH, noms FR/EN, valeurs pro, recherche (`createSearch`, `build`), règles d'harmonie (`ruleCombos`), analyses par métier (`JOBS`, `jobChecks`), simulations, exports (`metaOf`), lien (`readHash`, `hashOf`, `keyOf`), `cleanItems`. UMD : `window.WadaCore` dans le navigateur, `require` dans Node.
- `src/i18n.js` — textes FR (référence) et EN (`window.WADA_I18N`). Clés `h.*` : textes fixes de `index.html` (attributs `data-i18n`, `data-i18n-html`, `data-i18n-attr`), le français étant lu dans la page.
- `src/app.js` — interface : état, DOM, sources, métiers, image (k-moyennes en OKLab), planche client (canvas), projets, langue, PWA.
- `src/scenes.js` — les 15 mises en situation SVG (une par métier, 480 × 340), dessins originaux MML ; UMD `window.WadaScenes`. Aucun modèle de banque d'images (Magnific/Freepik interdisent la redistribution, même modifiée).
- `src/sources-data.js` — sources autres que Wada (`window.WADA_SOURCES`) : 16 kasane no irome, 20 accords de traditions africaines (kente, ndebele, bogolan, yoruba/adire). Chaque accord : `{ jp?, fr, en, g, colors }`.
- `src/styles.css` — styles de l'app et des fiches ; toutes les couleurs d'interface sont des variables `:root`, avec thème sombre (`prefers-color-scheme` + `[data-theme]`).
- `src/wada-data.js` — les 348 combinaisons (`window.WADA_DATA`), chargé avant `app.js`.
- `manifest.webmanifest`, `sw.js`, `icons/` — PWA installable et hors ligne. `sw.js` : réseau d'abord, cache en secours ; **changer `VERSION`** quand la liste `SHELL` change.
- `accord/N/` et `en/accord/N/` — 698 fiches statiques (une par combinaison et par langue) + deux index. **Générées** par `tools/generate-pages.js`, commitées : ne pas les modifier à la main.
- `tools/` — `generate-pages.js` (fiches, et avec `--base=URL` : liens canoniques, hreflang, `sitemap.xml`, `robots.txt`) ; `make-icons.py` (icônes PNG/SVG, sans dépendance).
- `tests/core.test.js` — tests des fonctions pures : `node --test`.
- `.claude/launch.json` — serveur local (`python -m http.server 8000`) pour tester : ouverte en `file://`, la page ne garde pas l'état local et le service worker ne s'active pas.
- `.nojekyll` — pour GitHub Pages.
- `data/wada-348.json` — même dictionnaire, lisible (`numero`, `couleurs`).
- `design-system/` — le système MML Codes Image (tokens, règles, composants `window.MML`) dont l'application reprend la logique.

## Règles Wada (à ne pas casser)

- Distance de correspondance : OKLab euclidienne. Fidélité : *fidèle* ≤ 0.06, *proche* ≤ 0.12, *libre* au-delà.
- Tri : écart croissant ; à égalité 3 couleurs, puis 4, puis 2, puis numéro.
- Recherche à deux couleurs : chacune occupe une case différente de l'accord ; l'écart retenu (fidélité, tri) est le **pire** des deux, départagé par leur somme. La transposition suit la teinte de la couleur 1.
- La couleur de départ remplace sa correspondante ; les couleurs compagnes restent **exactement** celles du dictionnaire. La transposition de teinte est une option MML, toujours signalée comme « plus du Wada strict ».
- Proportions (convention MML, pas Wada) : 65/35, 60/30/10, 50/25/15/10.
- Numérotation : n° 1–120 à deux couleurs, 121–240 à trois, 241–348 à quatre. Les hex viennent de la conversion HexPot : ce sont des cibles, à présenter comme telles.
- Combinaison n° 55 = `#d94d99 #ffffff` (une lecture antérieure ajoutait à tort un gris de contour).

## Sources

- Wada reste la source par défaut et ses règles ne changent pas. Les autres sont des **interprétations MML**, toujours signalées comme telles (note de source, planche, exports).
- Kasane no irome : 2 couleurs, rôles endroit (*omote*) / envers (*ura*). Traditions africaines : 2 à 4 couleurs, d'après des pratiques documentées ; ne pas attribuer de palette à un artiste vivant.
- Règles (`ruleCombos`) : complémentaires, analogues, camaïeu (Chevreul), triade, complémentaires voisines, tétrade (Itten), calculées en OKLCH ; la couleur de départ reste exacte ; pas de recherche à deux couleurs ni de transposition.
- Même recherche, mêmes seuils de fidélité et même tri pour toutes les sources à répertoire. Le numéro `n` d'un accord est son rang dans sa source (1-indexé).
- Ajouter une source : données dans `sources-data.js`, identifiant dans `SOURCES` (`core.js`), textes `src.<id>.*` dans les deux langues.

## Métiers

- 15 métiers en 5 familles (`JOBS` dans `core.js`) ; l'identifiant sert de `sc=` dans le lien (les anciennes scènes `interieur`, `mode`, `graphisme` en font partie).
- Chaque métier a une mise en situation (`scenes.js`) et 4 analyses (`jobChecks` → `{ k, lv, v }`, textes `chk.<k>.<lv>`). Repères : WCAG 2.2 (4.5:1 texte, 3:1 éléments), 30 points de LRV entre surfaces, plage vidéo 16–235, mélange optique en RGB linéaire. Analyses indicatives, calculées sur les vraies couleurs (pas sur l'aperçu simulé).

## Livrables client

- **Lien partageable** : tout l'état tient dans le hash, `#c=…&c2=…&n=…&o=…&t=…&ex=0&tr=1&sc=…&s=…&lg=en` (`s` absent = Wada) (couleurs sans `#`, ordre `o` en indices séparés par des points). Un lien passe avant `localStorage`. Garder ce format rétrocompatible : des liens circulent chez les clients.
- **Valeurs** : HEX, RGB, HSL, OKLCH, CMJN et LRV. Le CMJN est naïf (sans profil ICC) et le LRV estimé (luminance Y × 100 depuis le sRGB) : toujours les marquer « ≈ » et les présenter comme à confirmer sur nuancier.
- **Planche** : A4 paysage, 300 dpi, dessinée en canvas (unités 1754 × 1240, ×2). Elle porte toujours le n° Wada (ou le nom de l'accord et sa source), la fidélité, le métier et ses analyses, la mention de transposition si active, et la note sur les hex HexPot. « Imprimer ou PDF » imprime cette planche via `@media print`.
- **Exports logiciels** : `.ase` (Adobe, binaire construit par `aseBytes`), design tokens au format W3C (`$type`/`$value`), thème Tailwind v4 (`@theme`, équivalent v3 en commentaire), palette `.gpl` (GIMP, Inkscape). Fonctions pures `aseBytes`, `tokensText`, `tailwindText`, `gplText`.

## Simulations

- Lumière 6500 / 4000 / 2700 K (adaptation de Bradford, `KEEP` = 0.5 de la teinte de la lampe conservée) et daltonisme (matrices de Machado 2009, en RGB linéaire). Elles ne touchent que l'aperçu (grande bande, mise en situation) : valeurs, copies, exports et planche restent les couleurs de l'accord.
- Alerte daltonisme : paire dont l'écart OKLab simulé est < 0.04, testée pour les trois types.

## Projets et favoris

- `localStorage` clé `accords-wada-projets` : `{ v: 1, current, projects: [{ id, name, items }], history }`. Un item = `{ hash, n, colors, note, added }` ; l'historique garde les 12 derniers accords.
- Deux liens désignent le même accord s'ils ne diffèrent que par le métier, le filtre ou la langue (`keyOf`) ; la source compte. Les accords gardés ne mémorisent pas la langue.
- Export/import JSON `{ format: "accords-wada-projet", version: 1, name, items }`. À l'import, tout est revalidé : liens relus puis resérialisés (`hashOf`), hex vérifiés, textes bornés ; jamais d'`innerHTML` avec des données importées.

## Conventions

- Interface en **français** (référence), tutoiement, phrases courtes et concrètes. Version **anglaise** dans `src/i18n.js` : tout nouveau texte va dans les deux langues, jamais en dur dans `app.js`. Langue : lien (`lg=`) > choix mémorisé > langue du navigateur. Le nom « Accords Wada » ne se traduit pas.
- JavaScript sans dépendance ni framework, compatible navigateur sans build. Toute fonction pure va dans `core.js`, avec un test dans `tests/`.
- Si `data/`, `core.js` ou les textes des fiches changent : relancer `node tools/generate-pages.js` (avec `--base=` une fois le site en ligne).
- Contraste : texte ≥ 4.5:1, signalé « titres seulement » en dessous.
- Accessibilité : focus visible, `aria-pressed` sur les boutons bascule, `prefers-reduced-motion` respecté, pas de défilement horizontal à 400 px.
- Fond d'interface gris neutre : ne pas teinter les surfaces, pour juger les couleurs sans biais.
- Polices Google Fonts : Shippori Mincho (titres), Zen Kaku Gothic New (texte), IBM Plex Mono (valeurs).

## Vérifier avant de livrer

Lancer `node --test` (tout doit passer). Servir le dossier (`python -m http.server 8000`), tester une couleur saisie, une image déposée, la recherche à deux couleurs (pastilles « Couleur 1 / Couleur 2 »), le filtre 2/3/4, la transposition, les trois mises en situation, les copies, un lien partagé rouvert dans un nouvel onglet, la planche PNG et l'aperçu d'impression, les quatre exports logiciels, les simulations lumière et vision, un favori ajouté puis rouvert, l'export puis l'import d'un projet, le passage FR ⇄ EN, une fiche `accord/N/` et son lien vers l'outil, le rechargement hors ligne (serveur arrêté), puis le thème sombre et une largeur de 400 px. Aucune erreur dans la console.

## Pistes d'évolution

- Correspondances nuanciers (RAL, Pantone, peintures murales) — uniquement avec une source de données licite.
- Matrice de contraste WCAG de toutes les paires, proportions réglables, déclinaisons claires/foncées.
- Owen Jones (*Grammar of Ornament*, 1856), William Morris, E.-A. Séguy : palettes à relever sur des planches du domaine public (sources citées), annoncées « en préparation » sur la page.
- Mise en ligne (GitHub Pages ou Netlify), puis régénérer les fiches avec `--base=` pour le sitemap.
- Image Open Graph par accord pour les partages sur les réseaux.
