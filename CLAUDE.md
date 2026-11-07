# Accords Wada — consignes du projet

Application web qui part d'une couleur (choisie ou prélevée sur une image) et propose les combinaisons du *Dictionary of Color Combinations* de Sanzo Wada qui la contiennent. Public : designers d'intérieur, stylistes, graphistes. Auteur : Manso Olivier (MAN MBAÏ LIKOL).

## Structure

- `index.html` — la page (aucune étape de build : s'ouvre directement dans le navigateur).
- `src/styles.css` — styles ; toutes les couleurs d'interface sont des variables `:root`, avec thème sombre (`prefers-color-scheme` + `[data-theme]`).
- `src/app.js` — logique : conversions sRGB ↔ OKLab/OKLCH, recherche Wada, extraction de couleurs d'image (k-moyennes en OKLab), mises en situation SVG, export.
- `src/wada-data.js` — les 348 combinaisons (`window.WADA_DATA`), chargé avant `app.js`.
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

## Conventions

- Interface et textes en **français**, tutoiement, phrases courtes et concrètes.
- JavaScript sans dépendance ni framework, compatible navigateur sans build ; garder les fonctions de couleur pures et testables.
- Contraste : texte ≥ 4.5:1, signalé « titres seulement » en dessous.
- Accessibilité : focus visible, `aria-pressed` sur les boutons bascule, `prefers-reduced-motion` respecté, pas de défilement horizontal à 400 px.
- Fond d'interface gris neutre : ne pas teinter les surfaces, pour juger les couleurs sans biais.
- Polices Google Fonts : Shippori Mincho (titres), Zen Kaku Gothic New (texte), IBM Plex Mono (valeurs).

## Vérifier avant de livrer

Ouvrir `index.html`, tester une couleur saisie, une image déposée, la recherche à deux couleurs (pastilles « Couleur 1 / Couleur 2 »), le filtre 2/3/4, la transposition, les trois mises en situation, les copies, puis le thème sombre et une largeur de 400 px. Aucune erreur dans la console.

## Pistes d'évolution

- Simulation de daltonisme (protanopie, deutéranopie) sur l'accord choisi.
- Correspondances nuanciers (RAL, Pantone, peintures murales) — uniquement avec une source de données licite.
- Export d'une planche PNG (rendu canvas) et d'un fichier `.ase` pour Adobe.
- Favoris et historique des accords (localStorage).
- Mises en situation supplémentaires : cuisine, façade, packaging, interface mobile.
- Version installable (PWA) et déploiement (GitHub Pages ou Netlify).
