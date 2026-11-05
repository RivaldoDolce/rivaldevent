# Guide d'annotation de la pertinence

## Avertissement

Les annotations actuelles ont été produites par **un seul annotateur**
(`author_rubric_v1`), à partir du guide ci-dessous. Ce ne sont **pas** des
clics, des achats ou des jugements d'utilisateurs réels. Elles servent à
comparer des méthodes sur un même jeu de référence, pas à établir une vérité
terrain.

## Échelle graduée

| Note | Signification | Exemple |
|---|---|---|
| `0` | Non pertinent | autre ville, autre thème, hors budget de façon rédhibitoire |
| `1` | Faiblement pertinent | thème ou ville proche, mais un facteur important ne correspond pas |
| `2` | Pertinent | correspond aux intérêts, à la ville ou au budget, avec une réserve |
| `3` | Très pertinent | correspond aux intérêts, à la ville, au budget et à l'horizon temporel |

La note est **globale** : elle ne se déduit pas mécaniquement d'une somme de
critères. Le seuil binaire utilisé par le benchmark est `relevance >= 2`.

## Procédure suivie

Pour chaque persona :

1. inclure systématiquement ses événements de référence ;
2. inclure les événements de sa ville ou de sa région ;
3. inclure les événements des catégories qu'il préfère, même dans une autre
   ville ;
4. ajouter un échantillon d'événements sans lien apparent (négatifs) ;
5. ne pas inclure les événements non examinés : ils restent hors du jeu jugé et
   ne sont **pas** supposés non pertinents.

Les événements expirés sont annotés mais exclus des candidats au moment de
l'évaluation : ils ne peuvent pas être recommandés comme offres actuelles.

## Effectifs

| Profil | Jugements | Positifs (`>=2`) | Négatifs (`0`) |
|---|---:|---:|---:|
| `music_fan_douala` | 28 | 7 | 13 |
| `tech_enthusiast_yaounde` | 26 | 8 | 10 |
| `culture_lover_douala` | 25 | 9 | 7 |
| `student_buea` | 22 | 5 | 8 |
| `family_bafoussam` | 21 | 6 | 8 |
| `entrepreneur_douala` | 24 | 8 | 9 |
| `sport_fan_yaounde` | 21 | 3 | 11 |
| `english_arts_limbe` | 23 | 9 | 4 |
| `gala_professional_yaounde` | 21 | 6 | 5 |
| `weekend_kribi` | 20 | 4 | 11 |
| **Total** | **231** | **65** | **86** |

## Conséquences pour l'interprétation

- Recall@10 a un dénominateur petit (3 à 9 positifs par profil) : un seul
  résultat pertinent déplace fortement la valeur.
- Les événements non jugés comptent comme non pertinents dans NDCG et
  Precision, ce qui pénalise toutes les méthodes de la même façon mais rend les
  valeurs absolues peu comparables à la littérature.
- Une seule personne a jugé : un biais de subjectivité est inévitable.
- Pour une évaluation publiable, il faudrait au minimum deux annotateurs
  indépendants, un calcul d'accord (Krippendorff α ou Cohen κ) et un
  échantillonnage aléatoire documenté.

## Format du fichier

`relevance.csv` :

| Colonne | Contenu |
|---|---|
| `profile_id` | identifiant du persona |
| `event_id` | identifiant de l'événement |
| `relevance` | entier 0–3 |
| `annotator` | identifiant de l'annotateur |
| `notes` | justification courte |

Le pipeline rejette : un identifiant inconnu, une note hors 0–3, un doublon
`(profil, événement, annotateur)` et un annotateur vide.
