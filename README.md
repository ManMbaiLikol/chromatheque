# Accords Wada

Choisis une couleur ou dépose une image : l'application propose les accords qui la contiennent (ou qui contiennent deux couleurs à la fois), avec proportions, contrastes et export (hex, CSS, prompt, tableau pour tableur).

Quatre sources : Sanzo Wada (*A Dictionary of Color Combinations*, 1933–34, par défaut), kasane no irome (Japon, époque Heian), traditions africaines (kente, peinture ndebele, bogolan, yoruba et adire) et règles d'harmonie calculées (Chevreul, Itten). Les sources autres que Wada sont des interprétations, signalées comme telles.

Quinze métiers (graphiste, motion designer, directeur artistique, packaging, UX, UI, web, jeu, architecte d'intérieur, retail, scénographe, produit, transport, styliste, textile) : pour chacun, une mise en situation dessinée et quatre analyses (lisibilité, impression, vidéo, lumière, LRV, daltonisme, mélange optique…).

Pour tes clients : un lien partageable qui rouvre exactement l'accord, un tableau de valeurs (HEX, RGB, HSL, OKLCH, CMJN et LRV approximatifs) et une planche A4 en PNG ou en PDF via l'impression.

Pour tes logiciels : nuancier Adobe `.ase`, design tokens JSON, thème Tailwind, palette GIMP/Inkscape `.gpl`.

Pour vérifier : aperçu sous lumière du jour, neutre ou chaude (6500, 4000, 2700 K) et en protanopie, deutéranopie ou tritanopie, avec une alerte quand deux couleurs se confondent.

Pour t'organiser : projets nommés avec favoris et notes, historique récent, export et import JSON (tout reste dans ton navigateur).

En français et en anglais, installable comme une application et utilisable hors ligne. Chaque combinaison a aussi sa propre page (`accord/55/`, `en/accord/55/`).

## Lancer

Sers le dossier avec un petit serveur local, puis ouvre http://localhost:8000 :

```bash
python -m http.server 8000
```

Ouvrir `index.html` directement marche aussi, mais sans mémoire du navigateur, sans mode hors ligne et sans installation.

## Mettre en ligne

Le site est statique : aucun build, il suffit de publier le dossier tel quel.

**GitHub Pages**
1. Crée un dépôt vide sur github.com (par exemple `accords-wada`).
2. Relie ce dossier au dépôt et pousse la branche `master`.
3. Dans le dépôt : *Settings → Pages → Deploy from a branch*, branche `master`, dossier `/ (root)`.
4. Le site sera à `https://<ton-compte>.github.io/accords-wada/`.

**Netlify** : glisse le dossier sur app.netlify.com/drop (ou relie le dépôt GitHub), sans commande de build.

Une fois l'adresse connue, régénère les fiches avec leurs liens canoniques, le `sitemap.xml` et le `robots.txt`, puis republie :

```bash
node tools/generate-pages.js --base=https://<ton-compte>.github.io/accords-wada/
```

## Développer

```bash
node --test
```

| Dossier | Rôle |
| --- | --- |
| `src/` | `core.js` (fonctions pures), `i18n.js` (textes FR/EN), `scenes.js` (mises en situation), `sources-data.js` (autres sources), `app.js` (interface), styles, données Wada |
| `accord/`, `en/accord/` | fiches statiques générées (ne pas modifier à la main) |
| `tools/` | génération des fiches et des icônes |
| `tests/` | tests des fonctions pures |
| `icons/`, `manifest.webmanifest`, `sw.js` | application installable et hors ligne |
| `data/` | le dictionnaire Wada en JSON |
| `design-system/` | système de design MML Codes Image (tokens, règles, composants) |

Les règles et conventions de développement sont dans `CLAUDE.md`.

Valeurs hex : conversion CMJN → HEX de HexPot, à traiter comme des cibles à vérifier sur le support réel.
