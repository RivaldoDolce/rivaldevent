# Benchmark — recommandeur Rivald'event

Rapport genere automatiquement par `scripts/run_benchmark.py`. Les valeurs proviennent du code execute sur le dataset versionne ; aucune metrique n'est saisie manuellement.

- Version du dataset : `dataset-20261105-c8c944d938`
- Modele : `intfloat/multilingual-e5-small` @ `614241f622f53c4eeff9890bdc4f31cfecc418b3`
- Date de reference des evenements : `2026-11-05T00:00:00+01:00`
- Effectifs : 10 profils, 66 evenements candidats, 231 jugements
- Seuil de pertinence binaire : `relevance >= 2`

Les profils de test ne participent jamais au reglage des poids. Les annotations ont ete produites par un annotateur unique selon un guide ecrit ; il ne s'agit pas d'une verite terrain objective.

## Composition du catalogue

- Categories : {'arts': 8, 'conference': 2, 'culture': 4, 'education': 6, 'entertainment': 4, 'entrepreneurship': 9, 'festival': 8, 'gala': 2, 'music': 14, 'sport': 5, 'technology': 8, 'theatre': 2}
- Villes : {'Bafoussam': 5, 'Bamenda': 2, 'Buea': 9, 'Douala': 22, 'Garoua': 2, 'Kribi': 4, 'Limbe': 6, 'Ngaoundere': 1, 'Yaounde': 21}
- Langues : {'en': 14, 'fr': 58}
- Evenements expires a la date de reference : 6 (exclus des candidats)

## Resultats — Developpement

| Methode | ndcg@10 | ndcg@5 | recall@10 | precision@10 | mrr@10 | coverage@10 | diversity@10 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Metadata baseline | 0.771 | 0.757 | 0.754 | 0.483 | 1.000 | 0.606 | 0.159 |
| TF-IDF | 0.882 | 0.921 | 0.904 | 0.550 | 1.000 | 0.636 | 0.156 |
| E5 semantic | 0.853 | 0.907 | 0.812 | 0.500 | 1.000 | 0.636 | 0.146 |
| E5 + context | 0.860 | 0.848 | 0.850 | 0.533 | 1.000 | 0.606 | 0.152 |
| E5 + context + MMR | 0.853 | 0.854 | 0.829 | 0.517 | 1.000 | 0.621 | 0.153 |

## Resultats — Test

| Methode | ndcg@10 | ndcg@5 | recall@10 | precision@10 | mrr@10 | coverage@10 | diversity@10 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Metadata baseline | 0.893 | 0.929 | 0.885 | 0.425 | 1.000 | 0.515 | 0.169 |
| TF-IDF | 0.902 | 0.960 | 0.875 | 0.450 | 1.000 | 0.515 | 0.170 |
| E5 semantic | 0.903 | 0.975 | 0.927 | 0.450 | 1.000 | 0.485 | 0.159 |
| E5 + context | 0.942 | 0.961 | 0.958 | 0.475 | 1.000 | 0.515 | 0.167 |
| E5 + context + MMR | 0.935 | 0.958 | 0.958 | 0.475 | 1.000 | 0.530 | 0.168 |

## Reglage sur le split de developpement

Objectif : `ndcg@10`. Grille de 108 combinaisons de poids.

- Poids retenus (bruts) : `{'semantic': 0.7, 'category': 0.1, 'location': 0.05, 'budget': 0.05, 'temporal': 0.05}`
- Poids normalises : `{'semantic': 0.7368421052631579, 'category': 0.10526315789473685, 'location': 0.052631578947368425, 'budget': 0.052631578947368425, 'temporal': 0.052631578947368425}`
- Lambda MMR retenu : `0.6`

## Lecture des resultats

- E5 vs TF-IDF (NDCG@10, test) : +0.001 point.
- Ajout du contexte vs E5 seul (NDCG@10, test) : +0.039 point.
- MMR vs contexte (NDCG@10, test) : -0.006 point ; diversite intra-liste : +0.001 point.

Avec un petit nombre de profils de test, ces ecarts ont une incertitude elevee et ne doivent pas etre interpretes comme des effets statistiquement etablis.

## Limites

- Les profils sont des personas fictifs, pas des utilisateurs observes.
- Les jugements de pertinence sont des annotations guidees par une seule personne, pas des clics ou des achats reels.
- Les evenements du catalogue sont des fixtures de demonstration clairement identifiees (is_demo=true), pas des offres verifiees.
- Le catalogue est petit : les ecarts entre methodes ne sont pas statistiquement significatifs.
- Les embeddings E5 sont pre-entraines et ne sont pas fine-tunes sur Rivald'event.
- Le systeme est content-based : il ne demontre ni gain de conversion ni performance en production.

