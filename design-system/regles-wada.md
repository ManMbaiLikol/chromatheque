# Règles Wada

Comment une couleur choisie librement devient une palette complète. La logique est codée dans `window.MML` (`chercherAccords`, `deriverRoles`, `appliquerAccord`) et le dictionnaire complet est dans `assets/Wada/wada-348.json`.

## Ce qui vient de Sanzo Wada

- **Le dictionnaire** : 348 combinaisons publiées dans *A Dictionary of Color Combinations* — n° 1 à 120 à deux couleurs, 121 à 240 à trois, 241 à 348 à quatre. Valeurs hex issues de la conversion CMJN → HEX de HexPot : ce sont des **cibles**, à contrôler dans un logiciel de composition.
- **Les compagnes** : une fois la combinaison retenue, ses autres couleurs sont reprises **sans modification**.

## Ce que MML ajoute

| Règle | Détail |
| --- | --- |
| Correspondance | Distance OKLab entre ta couleur et chaque couleur du dictionnaire ; la plus proche est remplacée par la tienne |
| Fidélité | *fidèle* écart ≤ 6 · *proche* ≤ 12 · *libre* au-delà (l'accord devient une interprétation) |
| Ordre des propositions | Écart croissant ; à égalité, 3 couleurs puis 4 puis 2 |
| Transposition (option) | Décale la teinte des compagnes de l'écart entre ta couleur et sa correspondante ; utile en correspondance *libre*, mais ce n'est plus du Wada strict |
| Proportions | 2 couleurs 65/35 · 3 couleurs 60/30/10 · 4 couleurs 50/25/15/10 ; la couleur de départ domine |
| Neutres | Papier L 0.965, encre L 0.20, filet L 0.87, chroma ≤ 0.02, dans la teinte de la base |
| Lisibilité | Les versions `-texte` sont assombries (clair) ou éclaircies (sombre) jusqu'à 4.5:1, teinte conservée |

## Lire une combinaison

- **2 couleurs** : affiche, visuel `/VECTOR`, couverture.
- **3 couleurs** : le défaut ; correspond au paramètre « Palette : trois couleurs nommées » du manuel.
- **4 couleurs** : séries, scènes riches ; garder une couleur sombre ou neutre comme ancrage.

## Exemple

Départ **#1448c8** (bleu) → n° 161 *fidèle* : `#1448c8` · `#6c2b11` · `#f2ad78` ; n° 179 *proche* : `#1448c8` · `#e81900` · `#fa9442`.
Départ **#2e7d4f** (vert) → les propositions changent entièrement : chaque couleur de départ ouvre sa propre famille d'accords.
