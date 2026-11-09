# La Chromathèque de Man Mbaï Likol — consignes du projet

**La Chromathèque de Man Mbaï Likol**, sous-titre « l'atelier des accords de couleur » (anciennement « Accords Wada »). Application web qui part d'une couleur (choisie ou prélevée sur une image) et propose les accords qui la contiennent : par défaut ceux du *Dictionary of Color Combinations* de Sanzo Wada, au choix ceux d'autres sources (kasane no irome, traditions africaines, règles d'harmonie). Elle montre ensuite leur effet dans 15 métiers de la création. Public : designers d'intérieur, stylistes, graphistes. Auteur : Manso Olivier (MAN MBAÏ LIKOL).

## Structure

- `index.html` — la page (aucune étape de build : s'ouvre directement dans le navigateur). Ordre des scripts : `core.js`, `i18n.js`, `wada-data.js`, `sources-data.js`, `models-data.js`, `scenes.js`, `proposal.js`, `recolor.js`, `app.js`. Parcours en étapes numérotées : 01 couleur, 02 accords suggérés (avec le sélecteur compact « Puiser dans » Wada · Kasane · Afrique · Règles), 03 accord, 04 métier, 05 livrer, 06 bibliothèque, 07 sources (« Explorer les collections », juste avant le répertoire de la source). La source n'est pas une décision préalable : Wada par défaut, on en change en chemin (sélecteur, barre de réglages → `#suggestions`) ; un clic dans la section des sources ramène aux accords suggérés. Mise en page dans l'esprit d'Awwwards Academy (structure seulement, aucun élément copié) : bandeau défilant, barre de réglages (couleur, source, métier), titre géant centré et carte « accord du moment », grandes cartes blanches à pied « écart → » souligné de la couleur de départ, dock flottant (lien, planche, garder, pistes).
- `src/core.js` — fonctions **pures**, sans DOM : gamme (`scaleOf`, `scaleText`), recoloration (`recolorLab`), note d'intention (`intentFacts`), proposition (`cleanProposal`, `cleanResponse`, `packLink`, `unpackLink`), conversions sRGB ↔ OKLab/OKLCH, noms FR/EN, valeurs pro, recherche (`createSearch`, `build`), règles d'harmonie (`ruleCombos`), analyses par métier (`JOBS`, `jobChecks`), simulations, exports (`metaOf`), lien (`readHash`, `hashOf`, `keyOf`), `cleanItems`. UMD : `window.WadaCore` dans le navigateur, `require` dans Node.
- `src/i18n.js` — textes FR (référence) et EN (`window.WADA_I18N`). Clés `h.*` : textes fixes de `index.html` (attributs `data-i18n`, `data-i18n-html`, `data-i18n-attr`), le français étant lu dans la page.
- `src/app.js` — interface : état, DOM, sources, métiers, image (k-moyennes en OKLab), planche client (canvas), projets, langue, PWA.
- `src/proposal.js` — proposition client : studio, note d'intention, pistes A/B/C, dossier PDF, vue client `#p=` et réponse `#r=`. `src/recolor.js` — gamme (11 paliers) et recoloration d'une photo. Les deux sont des **extensions** de `app.js` : chargées avant lui, elles s'inscrivent dans `window.ChromaExt` (`init`, `detail`, `scene`, `item`, `projects`, `lang`) et reçoivent son API interne `window.ChromaApp` ; `window.ChromaStudio` sert la planche.
- `src/scenes.js` — mises en situation SVG, dessins originaux MML ; UMD `window.WadaScenes` (`render(job, cs, { model })`, `models(job)`, `size(job, model)`, `roleVars`). Par métier : **4 supports** du catalogue MML (n° 1 à 4, 800 × 540, n° 1 par défaut) et l'**esquisse** d'origine (n° 0, 480 × 340). Aucun modèle de banque d'images (Magnific/Freepik interdisent la redistribution, même modifiée).
- `src/models-data.js` — les 60 supports (`window.WADA_MODELS`), **générés** par `tools/build-models.js` depuis `data/modeles-60.json` (catalogue « 60 modèles pour 15 métiers », titres FR du catalogue, titres EN dans le script) : ne pas modifier à la main. Les SVG portent des variables `--chroma-primary`, `-secondary`, `-accent`, `-accent-2` (+ `-text`) que `scenes.js` remplace : dominante, secondaire, 3e couleur (sinon la 2e), 4e (sinon la 3e, sinon la dominante) ; textes blanc ou noir selon `readableOn`. Identifiants internes préfixés à chaque rendu (plusieurs SVG dans la page). Le script refuse tout SVG à contenu actif (script, `on…=`, `href`, `<image>`).
- `src/sources-data.js` — sources autres que Wada (`window.WADA_SOURCES`) : 16 kasane no irome, 20 accords de traditions africaines (kente, ndebele, bogolan, yoruba/adire). Chaque accord : `{ jp?, fr, en, g, colors }`.
- `src/styles.css` — styles de l'app et des fiches ; toutes les couleurs d'interface sont des variables `:root`, avec thème sombre (`prefers-color-scheme` + `[data-theme]`).
- `src/wada-data.js` — les 348 combinaisons (`window.WADA_DATA`), chargé avant `app.js`.
- `manifest.webmanifest`, `sw.js`, `icons/` — PWA installable et hors ligne. `sw.js` : réseau d'abord **avec revalidation** (`cache: "no-cache"`), cache en secours ; **changer `VERSION`** quand la liste `SHELL` change. Dans `index.html`, les scripts et la feuille de style portent `?v=AAAAMMJJ` : **le changer à chaque livraison** qui touche `src/`, sinon un navigateur peut mêler une page neuve et d'anciens scripts (l'app plante au démarrage).
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
- Recherche à deux couleurs (deux couleurs imposées) : chacune occupe une case différente de l'accord ; l'écart retenu (fidélité, tri) est le **pire** des deux, départagé par leur somme. La transposition suit la teinte de la couleur 1.
- La couleur de départ remplace sa correspondante ; les couleurs compagnes restent **exactement** celles du dictionnaire. La transposition de teinte est une option MML, toujours signalée comme « plus du Wada strict ».
- Le détail dit si l'accord est **original** (couleurs exactes de la source) ou **adapté** (couleur remplacée ou compagnes transposées) — `kindOf` — montre la couleur d'origine à côté de la tienne avec l'écart, et explique la méthode (distance OKLab × 100).
- Proportions (convention MML, pas Wada) : 65/35, 60/30/10, 50/25/15/10 par défaut, **réglables** sous la grande bande (un curseur par couleur ; `setPart` : entiers, somme 100, 5 % au moins, les autres au prorata). Gardées dans le lien (`p=70.15.9.6`, ignoré par `keyOf`), le projet, la planche, le dossier, la vue client et les exports (`partsOf`) ; remises par défaut quand on change d'accord.
- Numérotation : n° 1–120 à deux couleurs, 121–240 à trois, 241–348 à quatre. Les hex viennent de la conversion HexPot : ce sont des cibles, à présenter comme telles.
- Combinaison n° 55 = `#d94d99 #ffffff` (une lecture antérieure ajoutait à tort un gris de contour).

## Couleurs imposées

- La couleur « à essayer » (sélecteur, hex, pastille ou clic sur l'image) pilote la recherche en direct **tant qu'aucune couleur n'est imposée**. Le bouton « Valider cette couleur » (ou Entrée dans le champ hex) l'impose ; **2 au plus**. Dès qu'une couleur est imposée, la couleur à essayer ne fait que préparer la suivante. Après la 1re validation, l'outil propose d'emblée une 2e couleur (la première compagne de l'accord en tête) : le champ devient « 2e couleur à essayer », le bouton « Valider comme 2e couleur », et une case pointillée rappelle que la 2e est facultative.
- 1 imposée : les accords la contiennent. 2 imposées : seuls les accords de **3 ou 4 couleurs** sont proposés (1 ou 2 compagnes venues de la source) ; le filtre « 2 » est désactivé ; kasane n'a rien à proposer et le dit. Règles d'harmonie à deux couleurs : `ruleCombos2` (médiane, contrepoint, clair-obscur, neutres accordés), les deux imposées restent exactes.
- Pas de 3e couleur imposée ni d'accords à 6 couleurs : aucune source n'en a, et l'aide à la décision perdrait en fiabilité. Piste à part : « étendre en gamme » (clairs/foncés) depuis un accord validé.
- Les imposées sont marquées « · imposée » dans le détail et sur la planche. État local : `draft` et `locked` dans `accords-wada` (l'ancienne « 2e couleur » est relue comme 2 imposées).

## Sources

- Wada reste la source par défaut et ses règles ne changent pas. Les autres sont des **interprétations MML**, toujours signalées comme telles (note de source, planche, exports).
- Kasane no irome : 2 couleurs, rôles endroit (*omote*) / envers (*ura*). Traditions africaines : 2 à 4 couleurs, d'après des pratiques documentées ; ne pas attribuer de palette à un artiste vivant.
- Règles (`ruleCombos`) : complémentaires, analogues, camaïeu (Chevreul), triade, complémentaires voisines, tétrade (Itten), calculées en OKLCH ; la couleur de départ reste exacte ; pas de recherche à deux couleurs ni de transposition.
- Même recherche, mêmes seuils de fidélité et même tri pour toutes les sources à répertoire. Le numéro `n` d'un accord est son rang dans sa source (1-indexé).
- Ajouter une source : données dans `sources-data.js`, identifiant dans `SOURCES` (`core.js`), textes `src.<id>.*` dans les deux langues.

## Métiers

- 15 métiers en 5 familles (`JOBS` dans `core.js`) ; l'identifiant sert de `sc=` dans le lien (les anciennes scènes `interieur`, `mode`, `graphisme` en font partie).
- Chaque métier a 4 supports + l'esquisse, au choix sous la liste des métiers (« Support ») ; le choix est gardé dans le lien (`m=0…4`, absent = 1, ignoré par `keyOf`), l'état local, les pistes (qui suivent métier **et** support), la planche, le dossier et la vue client. La légende décrit le support (`support.note`) ou, pour l'esquisse, ses rôles (`scene.<job>`). Les images autonomes (comparateur, planche, dossier) passent par `withNs` : un seul `xmlns`, taille tirée du `viewBox`.
- **Usages** (panneau du détail, mode Expert) : quelle couleur sert de **fond**, de **surface secondaire**, de **texte** (une couleur de l'accord, ou blanc / noir) et d'**accent** (boutons, icônes). Fonctions `defaultUsage`, `usageOf`, `usageHex`, `usageChecks` (core). Lien `u=fond.surface.texte.accent` (indices dans l'accord affiché, `w`/`k` pour le texte ; absent = par défaut ; texte = fond refusé ; ignoré par `keyOf`) ; remis par défaut quand on change d'accord. Les supports MML suivent les usages (`roleVars(cs, usage)` : primary = fond, secondary = surface, accent = accent ; le texte choisi là où il atteint 4,5:1, sinon blanc ou noir).
- Les analyses « texte », « éléments graphiques » et « rôles » de `jobChecks` portent sur les **couples réellement utilisés** (`u.text`, `u.acc`, `u.btn`, plus `u.surf` dans le panneau) : chaque alerte nomme le composant (fond, surface, accent, libellé de bouton) et donne une correction ; celle du texte s'applique d'un clic. `intentFacts(cs, job, usage)`.
- Chaque métier a une mise en situation (`scenes.js`) et 4 analyses (`jobChecks` → `{ k, lv, v }`, textes `chk.<k>.<lv>`). Repères : WCAG 2.2 (4.5:1 texte, 3:1 éléments), 30 points de LRV entre surfaces, plage vidéo 16–235, mélange optique en RGB linéaire. Analyses indicatives, calculées sur les vraies couleurs (pas sur l'aperçu simulé).

## Proposition client

- **Studio** (`accords-wada-studio` : `{ name, contact, logo, intents }`) : logo redessiné en PNG (240 px de haut au plus), nom, contact. Sur la planche (en-tête, pied), le dossier et la vue client. Le projet porte aussi un `client`.
- **Note d'intention** : générée depuis l'accord (source, harmonie, température, contraste, rôles, analyse du métier du lien) avec les textes `intent.*`. Retouchée, elle est gardée par accord (`intents[keyOf]`) et dans l'item du projet (`intent`, 1500 car.) ; « Régénérer » efface la retouche.
- **Pistes** : 1 à 3 accords du projet marqués A, B, C (une lettre par accord), avec un **statut** (proposé, validé, refusé) et sa date. On les choisit avec les boutons **A · B · C sous chaque accord suggéré** (`keepAccord` le garde dans le projet sans l'ouvrir), sous l'accord affiché (barre « Proposer au client comme ») ou dans la bibliothèque. Le comparateur **« Tes pistes, côte à côte »** (sous les suggestions) montre pour chaque piste sa palette, **la même mise en situation du métier** (même dessin, même cadrage : seules les couleurs changent ; en `<img>` data URL, jamais d'`innerHTML`), sa source et sa fidélité, harmonie, température, contraste et les 4 analyses du métier ; il signale quand les pistes n'ont pas le même nombre de couleurs. La page comparatif du dossier reprend ces mises en situation. Les pistes suivent le métier choisi : leur `sc=` est mis à jour quand on en change. Les boutons « Dossier » et « Lien client » (`data-pitch`) sont dans le comparateur et la carte « Proposition client » de la bibliothèque (la carte « Pour ton client » de Livrer y renvoie par un lien) ; sans piste, ils l'expliquent et ramènent au comparateur. Le dock porte « Pistes n/3 ». Les messages nomment les sections et donnent un lien direct, jamais un numéro d'étape. La carte « Proposition client » montre les 3 étapes et les pistes A/B/C.
- **Dossier de proposition (PDF)** : pages A4 paysage en canvas imprimées ensemble (`html.has-pages`) — couverture, une page par piste (bande, note, mise en situation du métier, analyses, valeurs), comparatif, valeurs techniques, « Bon pour accord » à signer.
- **Vue client** : le lien `#p=<JSON encodé>` (`packLink`) porte la proposition (projet, client, studio, pistes avec liens d'accord et notes) ; `html.present` masque l'outil. Le client choisit une piste, commente, et renvoie un lien `#r=` (copié, ou par e-mail si le contact du studio en contient un). Ouvert par le studio, il valide la piste choisie, refuse les autres et garde la réponse (`project.responses`, 20 au plus). Tout est revalidé (`cleanProposal`, `cleanResponse`), jamais d'`innerHTML` avec ces données ; `updateLink` ne réécrit pas un lien `#p=` / `#r=`.

## Gamme et photo

- **Gamme** : 11 paliers 50…950 par couleur (`scaleOf`, OKLCH, même teinte, chroma atténué aux extrêmes) ; le palier le plus proche reprend la couleur exacte (marqué ●). Copie CSS, Tailwind v4, tokens W3C (`scaleText`).
- **Photo client** : découpée en 2 à 6 zones (k-moyennes en OKLab, la lumière pèse 0.55) ; la plus grande zone prend la dominante, etc. ; un clic sur une zone passe à la couleur suivante. `recolorLab` garde 100 % du relief de lumière et 30 % des nuances. Suit les simulations de lumière et de vision ; téléchargeable en PNG ; ne quitte jamais le navigateur.

## Livrables client

- **Lien partageable** : tout l'état tient dans le hash, `#c=…&c2=…&k=1&n=…&o=…&t=…&ex=0&tr=1&sc=…&s=…&lg=en` (`s` absent = Wada ; `c2` = 2 couleurs imposées, `k=1` = `c` imposée seule, aucun des deux = exploration). Un ancien lien à deux couleurs visant un accord à 2 couleurs (n° 55) le rouvre tel quel (couleurs sans `#`, ordre `o` en indices séparés par des points). Un lien passe avant `localStorage`. Garder ce format rétrocompatible : des liens circulent chez les clients.
- **Sections** : la destination est séparée des réglages (`sectionOf`, `withSection`) — `#metier` seul garde la palette mémorisée, `…&go=metier` s'ajoute aux réglages ; `keyOf` et « Copier le lien » l'ignorent. Les clics sur les liens internes font `pushState` (le retour arrière revient à la section précédente) ; ouverture directe et rechargement y mènent.
- **Valeurs** : HEX, RGB, HSL, OKLCH, CMJN et LRV. Le CMJN est naïf (sans profil ICC) et le LRV estimé (luminance Y × 100 depuis le sRGB) : toujours les marquer « ≈ » et les présenter comme à confirmer sur nuancier.
- **Planche** : A4 paysage, 300 dpi, dessinée en canvas (unités 1754 × 1240, ×2). Elle porte toujours le n° Wada (ou le nom de l'accord et sa source), la fidélité, le métier et ses analyses, la mention de transposition si active, et la note sur les hex HexPot. « Imprimer ou PDF » imprime cette planche via `@media print`.
- **Exports logiciels** : `.ase` (Adobe, binaire construit par `aseBytes`), design tokens au format W3C (`$type`/`$value`), thème Tailwind v4 (`@theme`, équivalent v3 en commentaire), palette `.gpl` (GIMP, Inkscape). Fonctions pures `aseBytes`, `tokensText`, `tailwindText`, `gplText`.

## Simulations

- Lumière 6500 / 4000 / 2700 K (adaptation de Bradford, `KEEP` = 0.5 de la teinte de la lampe conservée) et daltonisme (matrices de Machado 2009, en RGB linéaire). Elles ne touchent que l'aperçu (grande bande, mise en situation) : valeurs, copies, exports et planche restent les couleurs de l'accord.
- Alerte daltonisme : paire dont l'écart OKLab simulé est < 0.04, testée pour les trois types.

## Projets et favoris

- `localStorage` clé `accords-wada-projets` : `{ v: 1, current, projects: [{ id, name, items }], history }`. Un item = `{ hash, n, colors, note, added, piste, status, statusDate, intent }` ; l'historique garde les 12 derniers accords.
- Deux liens désignent le même accord s'ils ne diffèrent que par le métier, le filtre ou la langue (`keyOf`) ; la source compte. Les accords gardés ne mémorisent pas la langue.
- Export/import JSON `{ format: "accords-wada-projet", version: 1, name, client, items }`. À l'import, tout est revalidé : liens relus puis resérialisés (`hashOf`), hex vérifiés, textes bornés ; jamais d'`innerHTML` avec des données importées.

## Conventions

- Interface en **français** (référence), tutoiement, phrases courtes et concrètes. Version **anglaise** dans `src/i18n.js` : tout nouveau texte va dans les deux langues, jamais en dur dans `app.js`. Langue : lien (`lg=`) > choix mémorisé > langue du navigateur. Le nom « La Chromathèque de Man Mbaï Likol » ne se traduit pas (seul le sous-titre se traduit) ; nom court : « La Chromathèque ». Les identifiants techniques gardent l'ancien nom pour ne rien casser : clés `localStorage` `accords-wada*`, format d'import `accords-wada-projet`, cache `accords-wada-v*`, `window.WadaCore`.
- JavaScript sans dépendance ni framework, compatible navigateur sans build. Toute fonction pure va dans `core.js`, avec un test dans `tests/`.
- Si `data/modeles-60.json` change : relancer `node tools/build-models.js`, puis changer `VERSION` dans `sw.js` si la liste `SHELL` change.
- Si `data/`, `core.js` ou les textes des fiches changent : relancer `node tools/generate-pages.js` avec `--base=https://manmbailikol.github.io/chromatheque/`.
- **En ligne** : https://manmbailikol.github.io/chromatheque/ (GitHub Pages, dépôt `ManMbaiLikol/chromatheque`, branche `main`, dossier racine). Un push sur `main` met le site à jour en une à deux minutes.
- Contraste (WCAG 2.2, 1.4.3) : jugé sur la valeur **non arrondie** (`textUse`) — ≥ 4.5:1 texte courant ; 3 à 4.5:1 « grand texte seulement » (24 px, ou 19 px gras) ; sous 3:1 « insuffisant pour du texte », même pour un titre. Ratios affichés **tronqués** (`ratioText` : 4.46 → « 4.4 »). Sous 4.5:1, l'analyse « Texte » propose blanc ou noir et une version ajustée de la couleur (`towards`).
- Chaque accord suggéré porte une justification courte faite **de mesures seulement** (`whyOf` : contraste maximal et son usage, couleurs trop proches, couleurs imposées gardées) — pas de note d'harmonie.
- **Mode Simple / Expert** (barre de réglages, `html.simple`, mémorisé dans `accords-wada-mode` ; Simple par défaut pour un nouveau visiteur) : les blocs `data-expert` (options de correspondance et transposition, simulations, tableau de valeurs, exports logiciels, gamme, CSS) et la méthode de l'écart sont masqués. CSS seulement : le projet, les couleurs et le lien ne changent pas.
- Accessibilité : focus visible, `aria-pressed` sur les boutons bascule, `prefers-reduced-motion` respecté, pas de défilement horizontal à 400 px.
- Fond d'interface gris neutre : ne pas teinter les surfaces de travail (panneau, cartes, mises en situation), pour juger les couleurs sans biais. La vie vient de décors aux couleurs de l'accord en cours (`--c1`…`--c4`) : aura animée derrière l'en-tête, filet en tête des bandes, numéros d'étape, trame de points neutre. Surfaces en verre translucide (glassmorphism : `--glass`, flou `backdrop-filter`, liseré clair) sur un dégradé gris doux, avec des reflets fixes de l'accord derrière la page. Le bouton « Fond neutre » du dock (`html.calm`, mémorisé dans `accords-wada-calme`) retire tous ces décors et rend les surfaces opaques.
- Polices Google Fonts : Bricolage Grotesque (titres, `--display`, 800, serré), Fraunces italique (accents : signature « de Man Mbaï Likol », sous-titre, descriptions de métier, `--serif`), Plus Jakarta Sans (texte, `--body`), IBM Plex Mono (valeurs, `--mono`). Shippori Mincho seulement pour les kanji (repli automatique, noms kasane). Même lien de polices dans `index.html` et `tools/generate-pages.js`.

## Vérifier avant de livrer

Lancer `node --test` (tout doit passer). Servir le dossier (`python -m http.server 8000`), tester une couleur saisie, une image déposée, la validation d'une puis de deux couleurs imposées (et leur retrait), le filtre 2/3/4, la transposition, les trois mises en situation, les copies, un lien partagé rouvert dans un nouvel onglet, la planche PNG et l'aperçu d'impression, les quatre exports logiciels, les simulations lumière et vision, un favori ajouté puis rouvert, l'export puis l'import d'un projet, la note d'intention retouchée, le dossier de proposition (3 pistes), le lien client puis la réponse rouverte, la gamme, une photo recolorée, le passage FR ⇄ EN, une fiche `accord/N/` et son lien vers l'outil, le rechargement hors ligne (serveur arrêté), puis le thème sombre et une largeur de 400 px. Aucune erreur dans la console.

## Pistes d'évolution

- Correspondances nuanciers (RAL, Pantone, peintures murales) — uniquement avec une source de données licite.
- Matrice de contraste WCAG de toutes les paires, proportions réglables.
- Fiche fournisseur : valeurs cibles, finition, tolérance ΔE, contrôle des échantillons reçus.
- Owen Jones (*Grammar of Ornament*, 1856), William Morris, E.-A. Séguy : palettes à relever sur des planches du domaine public (sources citées), annoncées « en préparation » sur la page.
- Image Open Graph par accord pour les partages sur les réseaux.
