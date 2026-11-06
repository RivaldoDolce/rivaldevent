# Rivald'event — pipeline ML du recommandeur

Système de recommandation événementielle content-based et contextuel, conçu pour le démarrage à froid (aucun historique de transactions). Aucun filtrage collaboratif, aucune collecte de données personnelles, aucun appel réseau au runtime.

Ce dossier est autonome : il possède son propre environnement Python et ne partage aucune dépendance avec le bundle Expo.

## Périmètre

Inclus :

- catalogue expérimental de fixtures documentées (`data/raw/events.csv`) ;
- 10 personas de test (`data/raw/profiles.csv`) ;
- annotations de pertinence graduées 0–3 (`data/annotations/relevance.csv`) ;
- baseline metadata, baseline TF-IDF, embeddings E5, ranking contextuel, MMR ;
- métriques de ranking et de diversité calculées par le code ;
- intervalles de confiance bootstrap et test de permutation appariée ;
- export JSON versionné vers `../data/recommendations/generated/`.

Explicitement exclu : filtrage collaboratif, collecte d'interactions réelles, backend ML, pgvector, fine-tuning du modèle, prédiction de ventes, démonstration de gain commercial.

## Environnement

Python 3.12, géré avec [`uv`](https://docs.astral.sh/uv/). PyTorch est installé depuis l'index CPU pour éviter les roues CUDA (plusieurs Go inutiles).

```bash
cd ml
uv venv --python 3.12 .venv
uv pip install -e ".[dev]"
```

Le cache du modèle Hugging Face est placé dans `ml/.cache/` (ignoré par git).

## Pipeline

```bash
cd ml
source .venv/bin/activate

python scripts/build_dataset.py
python scripts/build_embeddings.py
python scripts/run_benchmark.py
python scripts/export_runtime_assets.py
```

Chaque script accepte `--config` pour pointer une autre configuration. `build_embeddings.py` réutilise le cache si le modèle, le template de texte et la liste des événements n'ont pas changé ; `--force` recalcule tout.

### Sorties

| Fichier | Rôle |
|---|---|
| `data/processed/dataset.summary.json` | effectifs et composition du catalogue |
| `data/processed/embeddings.npz` | matrice d'embeddings (cache) |
| `data/processed/embeddings.meta.json` | modèle, révision, dimension, versions |
| `reports/benchmark.json` | résultats bruts du benchmark |
| `reports/benchmark.md` | rapport lisible |
| `../data/recommendations/generated/*.json` | artefacts consommés par Expo |

## Modèle

`intfloat/multilingual-e5-small`, encodage hors ligne avec le préfixe `passage:` pour les événements. La révision (commit SHA) est résolue au moment de la génération et enregistrée dans `embeddings.meta.json`, puis dans `embeddings.v1.json`. Les vecteurs sont normalisés L2 et arrondis à 6 décimales à l'export.

## Protocole d'évaluation

- 10 profils : 6 `dev`, 4 `test` ; le split `test` ne sert jamais au réglage.
- Seuil de pertinence binaire : `relevance >= 2`.
- K = 5 et 10 ; couverture et diversité intra-liste à K = 10.
- Métriques macro-moyennées par profil.
- Événements expirés exclus des candidats à la date de référence (`2026-11-05T00:00:00+01:00`).
- Poids contextuels et `lambda` MMR choisis par grille sur `dev` uniquement.
- Seeds exclus du pool candidat pour éviter la circularité (le vecteur de profil est la moyenne des vecteurs des seeds).

## Résultats du benchmark

Exécuté le 2026-11-05 sur le dataset `dataset-20261105-c8c944d938` (72 événements, 66 candidats actifs, 10 profils, 231 jugements).

| Méthode | Split | NDCG@10 | MRR@10 | Coverage@10 | Diversity@10 |
|---|---|---:|---:|---:|---:|
| Metadata baseline | test | 0.820 | 0.375 | 0.783 | 0.166 |
| TF-IDF | test | 0.337 | 0.300 | 0.913 | 0.171 |
| E5 semantic | test | 0.557 | 0.375 | 0.739 | 0.160 |
| E5 + context | test | 0.975 | 0.500 | 0.826 | 0.166 |
| E5 + context + MMR | test | 0.982 | 0.500 | 0.826 | 0.170 |

### Réglage retenu

| Paramètre | Valeur |
|---|---|
| Poids normalisés | `semantic: 0.625, category: 0.125, location: 0.125, budget: 0.125, temporal: 0.0` |
| Lambda MMR | 0.6 |
| Objectif | `ndcg@10` sur `dev` |
| Taille de grille | 108 combinaisons |

### Analyse statistique (P3)

Intervalles de confiance bootstrap percentile (10 000 itérations) et test de permutation appariée (10 000 permutations) intégrés dans `benchmark.v1.json` et `reports/benchmark.md`.

Exemple — NDCG@10 sur le split test :

| Méthode | Moyenne [IC 95%] |
|---|---|
| Metadata baseline | 0.820 [0.680, 0.955] |
| TF-IDF | 0.337 [0.000, 0.675] |
| E5 semantic | 0.557 [0.367, 0.827] |
| E5 + context | 0.975 [0.939, 1.000] |
| E5 + context + MMR | 0.982 [0.959, 1.000] |

Test de permutation (E5 + context + MMR vs E5 + context) : différence moyenne +0.007, p = 1.0000 (non significatif à α=0.05).

## Artefacts runtime

Quatre fichiers JSON versionnés sont exportés vers `../data/recommendations/generated/` et consommés par l'application Expo :

| Fichier | Contenu |
|---|---|
| `events.v1.json` | 72 événements avec métadonnées |
| `embeddings.v1.json` | 72 vecteurs 384 dimensions + révision du modèle |
| `profiles.v1.json` | 10 personas avec seeds, budget, ville |
| `benchmark.v1.json` | métriques par méthode + intervalles de confiance + test de permutation |

## Limites à déclarer

- Les événements sont des fixtures de démonstration (`is_demo=true`) : ils ne représentent pas des offres vérifiées.
- Les profils sont des personas fictifs, pas des utilisateurs observés.
- Les annotations sont produites par un annotateur unique selon un guide écrit ; ce ne sont pas des clics ou des achats réels.
- Le catalogue est petit : les écarts entre méthodes ne sont pas statistiquement significatifs.
- E5 est pré-entraîné et n'est pas fine-tuné sur Rivald'event.
- Aucun gain de conversion ou de ventes n'est démontré.

## Tests

```bash
cd ml
source .venv/bin/activate
pytest
ruff check src scripts tests
```
