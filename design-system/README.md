# MML Codes Image

Le système de design de **MAN MBAÏ LIKOL — Création / Image / Design**, construit à partir du manuel *Retoucheur Codes Image — 250 commandes de création et de retouche* (édition illustrée 1.1) et du *Dictionary of Color Combinations* de Sanzo Wada. Il fixe la méthode, la typographie et la mise en page MML ; les couleurs, elles, naissent à chaque créa d'une couleur de départ choisie librement et des accords de Wada.

> Méthode : préciser la transformation, protéger les invariants, contrôler le résultat.

## Principes

1. **Le résultat d'abord.** On part de l'effet attendu, on identifie la famille, puis on applique le prompt complet.
2. **Protéger les invariants.** Identité, géométrie, matière, texte : ce qui doit rester intact est nommé avant ce qui change.
3. **Une palette libre mais réglée.** Tu choisis la couleur de départ ; le dictionnaire de Wada fournit les compagnes. Trois couleurs par défaut.
4. **Vérifier, puis livrer.** Comparer à l'original, corriger localement (`+FIX:`) plutôt que tout redemander, livrer depuis un maître validé.

## Ton et écriture

- **Tutoiement et impératif** : « Commence par le résultat attendu », « Conserve l'original ».
- **Phrases courtes, vérifiables** : un objectif visible, pas une ambiance vague. *Remplace le fond par un bureau clair en conservant le visage, la tenue et les mains.*
- **Structure fixe des fiches** : Ce qui change · Ce qui reste intact · Le regard du designer · Commandes · À essayer.
- **Honnêteté technique** : « 8K RAW » décrit un rendu, pas un fichier ; une valeur hex est une cible, pas une mesure. On ne remplace jamais une donnée absente par une invention.
- **Codes intouchables** : `/COMMANDE` en capitales, modificateurs `+LOCK`, `+X3`, `+4:5`, `+CLEAN`, `+WHY`, `+FIX:` jamais traduits.

## Couleur : aucune couleur fixe

Le système **n'impose aucune couleur de marque**. Chaque créa commence par une **couleur de départ** que tu choisis librement ; tout le reste en découle selon les règles de Sanzo Wada :

1. **Choisir la couleur de départ** (composant `AccordWada`, ou une valeur hex donnée en début de conversation).
2. **Chercher dans le dictionnaire** les 348 combinaisons de Wada (`assets/Wada/wada-348.json`) celles qui contiennent une couleur proche (distance OKLab). Les accords à 3 couleurs passent en premier, puis 4, puis 2.
3. **Substituer** : ta couleur prend la place de sa correspondante ; les couleurs compagnes restent **exactement** celles de Wada. Correspondance *fidèle* (écart ≤ 6), *proche* (≤ 12), *libre* au-delà.
4. **Dériver les rôles** : neutres (papier, encre, filet, teintes) légèrement teintés de ta couleur, et versions lisibles (`base-texte`, `accord-texte`, `alerte-texte`) ajustées à 4.5:1 dans les deux thèmes.

| Rôle | Ce qu'il contient |
| --- | --- |
| `base` | Ta couleur de départ, telle quelle : aplats dominants, bloc logo, en-têtes |
| `accord-1` · `accord-2` · `accord-3` | Les couleurs compagnes de la combinaison Wada |
| `papier` · `papier-clair` · `filet` | Fonds et filets, neutres teintés de la base |
| `encre` · `encre-douce` | Textes |
| `teinte` · `teinte-douce` | Lignes de tableau, blocs de prompt |
| `base-texte` · `accord-texte` · `texte-tableau` · `alerte-texte` | Versions lisibles pour le texte |
| `sur-base` · `sur-accord` | Blanc ou encre posé sur un aplat |

Les valeurs enregistrées dans les tokens ne sont qu'un **exemple** (départ cobalt #1448c8, Wada n° 179) ; `MML.appliquerAccord` les remplace à l'exécution.

**Règles de composition** (convention MML) : proportions 60/30/10 pour 3 couleurs (65/35, 50/25/15/10) ; aplats juxtaposés, jamais de dégradé entre couleurs d'accord ; une couleur compagne ne porte jamais de petit texte, ce sont ses versions `-texte` qui le font.

## Démarrer une créa

Avant toute création, demander : **« Quelle couleur de départ ? »** Puis proposer 3 accords Wada (numéro, couleurs, fidélité), faire choisir, et annoncer la palette dans le prompt avec `MML.palettePrompt` :

```
3 couleurs #1448c8, #e81900, #fa9442 (Sanzo Wada n° 179, proportions 60/30/10)
```

## Typographie

- **Lato** (titres ; le manuel utilise Carlito, de la même famille) en gras : couverture, titres de page numérotés (`05 Choisir un langage graphique`), intertitres en `base-texte`.
- **Helvetica / Arial** (texte) : corps, tableaux, codes en gras cobalt, surtitres en capitales espacées.
- Pas d'italique décoratif ; l'emphase passe par le gras et `base-texte`.

## Mise en page

- Angles droits par défaut (`radius-0`) ; `radius-sm` seulement pour les étapes et boutons.
- En-tête courant (`EnTete`) : bloc logo **MML** sur `base` + filet vertical `accord-1`, surtitre `RETOUCHEUR / CODES IMAGE`.
- Planches comparatives en triptyque (avant / variante / variante) avec un bandeau `base` de légendes.
- Pied de page : `MAN MBAÏ LIKOL / ÉDITION ILLUSTRÉE` + folio.
- Le mode opératoire se dessine en chaîne : **Source → Structure → Lumière → Style → Formats**, extrémités en `base`, étapes en `papier-clair`, flèches en `accord-texte`.

## Iconographie et images

- Pas de jeu d'icônes : la flèche `→` en `accord-texte` et les codes `/` font office de pictogrammes.
- Images : portraits à peau réelle et lumineuse, carnations préservées (`+LOCK`), contrastés par des aplats `base` / `accord-1` façon collage ; gravure noir et blanc en contrepoint.
- **Logo** : aucun fichier source fourni. Le bloc **MML** est recomposé en Lato gras sur `base`, suivi d'un filet `accord-1` et de « MAN MBAÏ LIKOL / CRÉATION / IMAGE / DESIGN ». À remplacer par le fichier vectoriel officiel dès qu'il est disponible.

## Sections

- **Règles Wada** : comment la couleur de départ devient une palette, et des points de départ suggérés par famille.
- **Paramètres créatifs** : les réglages par défaut pour la création et la retouche (méthode, paramètres, modificateurs).
- **Composants** : `AccordWada` (choix de la couleur), `Nuancier`, `EnTete`, `ModeOperatoire`, `FicheCommande`, `BlocPrompt`, `TableauParametres`, `Bouton`, dans `window.MML`.
