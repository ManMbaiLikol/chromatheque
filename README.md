# Accords Wada

Choisis une couleur ou dépose une image : l'application propose les combinaisons de Sanzo Wada (*A Dictionary of Color Combinations*, 1933–34) qui la contiennent — ou qui contiennent deux couleurs à la fois —, avec proportions, contrastes, mises en situation (intérieur, mode, graphisme) et export (hex, CSS, prompt, tableau pour tableur).

Pour tes clients : un lien partageable qui rouvre exactement l'accord, un tableau de valeurs (HEX, RGB, HSL, OKLCH, CMJN et LRV approximatifs) et une planche A4 en PNG ou en PDF via l'impression.

Pour tes logiciels : nuancier Adobe `.ase`, design tokens JSON, thème Tailwind, palette GIMP/Inkscape `.gpl`.

Pour vérifier : aperçu sous lumière du jour, neutre ou chaude (6500, 4000, 2700 K) et en protanopie, deutéranopie ou tritanopie, avec une alerte quand deux couleurs se confondent.

Pour t'organiser : projets nommés avec favoris et notes, historique récent, export et import JSON (tout reste dans ton navigateur).

## Lancer

Ouvre `index.html` dans un navigateur. Aucune installation.

Pour un serveur local (facultatif) : `python -m http.server 8000` dans ce dossier, puis http://localhost:8000.

## Contenu

| Dossier | Rôle |
| --- | --- |
| `src/` | styles, logique, données de l'application |
| `data/` | le dictionnaire Wada en JSON |
| `design-system/` | système de design MML Codes Image (tokens, règles, composants) |

Les règles et conventions de développement sont dans `CLAUDE.md`.

Valeurs hex : conversion CMJN → HEX de HexPot, à traiter comme des cibles à vérifier sur le support réel.
