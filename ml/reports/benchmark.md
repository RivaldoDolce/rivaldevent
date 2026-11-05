# Benchmark — recommandeur Rivald'event

Rapport genere automatiquement par `scripts/run_benchmark.py`. Les valeurs proviennent du code execute sur le dataset versionne ; aucune metrique n'est saisie manuellement.

- Version du dataset : `dataset-20261105-c8c944d938`
- Modele : `intfloat/multilingual-e5-small` @ `614241f622f53c4eeff9890bdc4f31cfecc418b3`
- Date de reference des evenements : `2026-11-05T00:00:00+01:00`
- Effectifs : 10 profils, 23 evenements candidats, 231 jugements
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
| Metadata baseline | 0.779 | 0.768 | 0.500 | 0.067 | 0.306 | 1.000 | 0.173 |
| TF-IDF | 0.532 | 0.445 | 0.500 | 0.067 | 0.228 | 0.957 | 0.166 |
| E5 semantic | 0.744 | 0.681 | 0.500 | 0.067 | 0.271 | 0.870 | 0.161 |
| E5 + context | 0.849 | 0.807 | 0.500 | 0.067 | 0.306 | 1.000 | 0.172 |
| E5 + context + MMR | 0.844 | 0.802 | 0.500 | 0.067 | 0.306 | 1.000 | 0.172 |

## Resultats — Test

| Methode | ndcg@10 | ndcg@5 | recall@10 | precision@10 | mrr@10 | coverage@10 | diversity@10 |
|---|---:|---:|---:|---:|---:|---:|---:|
| Metadata baseline | 0.820 | 0.820 | 0.500 | 0.050 | 0.375 | 0.783 | 0.166 |
| TF-IDF | 0.337 | 0.337 | 0.500 | 0.050 | 0.300 | 0.913 | 0.171 |
| E5 semantic | 0.557 | 0.458 | 0.500 | 0.050 | 0.375 | 0.739 | 0.160 |
| E5 + context | 0.975 | 0.952 | 0.500 | 0.050 | 0.500 | 0.826 | 0.166 |
| E5 + context + MMR | 0.982 | 0.982 | 0.500 | 0.050 | 0.500 | 0.826 | 0.170 |

## Reglage sur le split de developpement

Objectif : `ndcg@10`. Grille de 108 combinaisons de poids.

- Poids retenus (bruts) : `{'semantic': 0.5, 'category': 0.1, 'location': 0.1, 'budget': 0.1, 'temporal': 0.0}`
- Poids normalises : `{'semantic': 0.625, 'category': 0.125, 'location': 0.125, 'budget': 0.125, 'temporal': 0.0}`
- Lambda MMR retenu : `0.6`

## Lecture des resultats

- E5 vs TF-IDF (NDCG@10, test) : +0.219 point.
- Ajout du contexte vs E5 seul (NDCG@10, test) : +0.419 point.
- MMR vs contexte (NDCG@10, test) : +0.007 point ; diversite intra-liste : +0.004 point.

Avec un petit nombre de profils de test, ces ecarts ont une incertitude elevee et ne doivent pas etre interpretes comme des effets statistiquement etablis.

## Analyse statistique (Bootstrap CI 95% + Test de permutation)

Intervalle de confiance percentile (10 000 itérations) par méthode sur le split test. Test de permutation appariée (10 000 permutations) comparant E5+context+MMR vs E5+context.

### NDCG@10

| Méthode | Moyenne [IC 95%] |
|---|---|
| Metadata baseline | 0.820 [0.680, 0.955] |
| TF-IDF | 0.337 [0.000, 0.675] |
| E5 semantic | 0.557 [0.367, 0.827] |
| E5 + context | 0.975 [0.939, 1.000] |
| E5 + context + MMR | 0.982 [0.959, 1.000] |

**Test de permutation (E5+context+MMR vs E5+context)** : différence moyenne = +0.007, p = 1.0000 (non significatif à α=0.05, 10000 permutations, alternative=two-sided).

### RECALL@10

| Méthode | Moyenne [IC 95%] |
|---|---|
| Metadata baseline | 0.500 [0.000, 1.000] |
| TF-IDF | 0.500 [0.000, 1.000] |
| E5 semantic | 0.500 [0.000, 1.000] |
| E5 + context | 0.500 [0.000, 1.000] |
| E5 + context + MMR | 0.500 [0.000, 1.000] |

**Test de permutation (E5+context+MMR vs E5+context)** : différence moyenne = +0.000, p = 1.0000 (non significatif à α=0.05, 10000 permutations, alternative=two-sided).

### MRR@10

| Méthode | Moyenne [IC 95%] |
|---|---|
| Metadata baseline | 0.375 [0.000, 0.750] |
| TF-IDF | 0.300 [0.000, 0.750] |
| E5 semantic | 0.375 [0.000, 0.750] |
| E5 + context | 0.500 [0.000, 1.000] |
| E5 + context + MMR | 0.500 [0.000, 1.000] |

**Test de permutation (E5+context+MMR vs E5+context)** : différence moyenne = +0.000, p = 1.0000 (non significatif à α=0.05, 10000 permutations, alternative=two-sided).

## Limites

- Les profils sont des personas fictifs, pas des utilisateurs observes.
- Les jugements de pertinence sont des annotations guidees par une seule personne, pas des clics ou des achats reels.
- Les evenements du catalogue sont des fixtures de demonstration clairement identifiees (is_demo=true), pas des offres verifiees.
- Le catalogue est petit : les ecarts entre methodes ne sont pas statistiquement significatifs.
- Les embeddings E5 sont pre-entraines et ne sont pas fine-tunes sur Rivald'event.
- Le systeme est content-based : il ne demontre ni gain de conversion ni performance en production.

