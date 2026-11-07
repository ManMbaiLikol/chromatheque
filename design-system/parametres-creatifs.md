# Paramètres créatifs

Les réglages par défaut appliqués à toute création ou retouche d'image dans l'univers MML. Ils reprennent le manuel *Retoucheur Codes Image* ; la palette, elle, part toujours d'une couleur de départ choisie au début de la créa. Une demande explicite remplace toujours un réglage.

## Méthode : la couleur, puis 7 étapes

| Étape | Consigne |
| --- | --- |
| 0 Couleur | Choisir la couleur de départ, puis l'accord Wada (composant `AccordWada`). |
| 1 Définir | Formuler un objectif visible et vérifiable. |
| 2 Préparer | Fournir l'original, nommer les images **A** (sujet), **B** (décor), **C** (style). |
| 3 Choisir | Une commande principale ; chaque crochet reçoit une seule valeur. Une variable vide reste à compléter, elle n'est pas devinée. |
| 4 Développer | Prompt maître de la fiche + instructions des modificateurs. |
| 5 Produire | Une passe cohérente ; pour une retouche, désigner l'image à modifier. |
| 6 Vérifier | Identité, géométrie, matière, texte, ombres, format. |
| 7 Livrer | Garder le maître validé, le prompt final et les références ; décliner chaque format depuis le maître. |

## Réglages par défaut

| Paramètre | Valeur par défaut | Contrôle |
| --- | --- | --- |
| Sujet et zone | Toujours nommer l'objet et son emplacement | Aucune modification hors zone |
| Référence | A sujet · B décor · C style | Pas de confusion contenu / ambiance |
| Intensité | **Moyenne** ; **faible** pour la retouche fidèle ; **forte** seulement pour une transformation assumée | Écart à l'original |
| Lumière | Direction, taille, teinte et source précisées | Ombres et reflets cohérents |
| Palette | **Couleur de départ + ses compagnes Wada**, 3 couleurs par défaut, annoncées avec `MML.palettePrompt` | Cible à vérifier, pas une mesure de fidélité |
| Ratio | **4:5** pour le portrait et les réseaux, **16:9** pour l'écran, un seul ratio par sortie | Confirmé à l'export |
| Texte | Orthographe, accents et chiffres copiés à l'identique | Relire et recomposer si altéré |
| Données techniques | Plan, cote, unité, source validés | Jamais d'invention |

## Modificateurs actifs par défaut

- `+LOCK` sur tout portrait : identité, morphologie et carnation préservées ; en conflit, le verrou prime.
- `+WHY` : expliquer lumière, cadrage et couleur après chaque résultat.
- `+CLEAN` sur les visuels de création : aucun texte, logo ou filigrane inventé. Retiré dès que le texte est le livrable (`/MAGAZINE_COVER`, affiches légendées).
- `+X3` uniquement pour explorer, sur une vue unique — trois variantes numérotées, différences annoncées.

## Taille de l'accord selon la famille

La couleur de départ reste libre ; seul le nombre de couleurs varie selon le travail.

| Familles MML | Accord conseillé |
| --- | --- |
| 01–04 Qualité, fond, prise de vue, transformation | Pas d'accord imposé : on respecte les couleurs de l'image source |
| 05 Style · 08 Formats · 14 Marque et imprimés | **2 couleurs** : contraste franc, lisible de loin |
| 06 Produit · 10 Portrait · 15 Commerce · 19 Pédagogie | **3 couleurs** (défaut) |
| 12 Lumière · 16 Architecture · 17 Nature · 18 Événements | **4 couleurs** : scènes riches, une couleur sombre comme ancrage |
| 20 Séries et livraison | Reprendre l'accord du maître, sans changement |

## Prompt type

```
/VECTOR 3 couleurs [base], [accord-1], [accord-2] (Sanzo Wada n° [N]) +4:5 +LOCK +CLEAN +WHY
Préserve strictement le visage, la morphologie et la carnation du sujet (image A).
Aplats juxtaposés en bandes verticales, proportions 60/30/10, fond [papier].
```

À éviter : `/SATURATE` fort après étalonnage, peau orange, ciel violet, écrêtage des rouges, rendu HDR ou CGI.
