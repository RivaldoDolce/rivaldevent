# Rivald'event — pipeline ML du recommandeur

Système de recommandation événementielle **multilingue, content-based et
contextuel**, conçu pour le démarrage à froid (aucun historique de transactions).

Ce dossier est autonome : il possède son propre environnement Python et ne
partage aucune dépendance avec le bundle Expo.

## Périmètre

Inclus :

- catalogue expérimental de fixtures documentées (`data/raw/events.csv`) ;
- 10 personas de test (`data/raw/profiles.csv`) ;
- annotations de pertinence graduées 0–3 (`data/annotations/relevance.csv`) ;
- baseline metadata, baseline TF-IDF, embeddings E5, ranking contextuel, MMR ;
- métriques de ranking et de diversité calculées par le code ;
- export JSON versionné vers `../data/recommendations/generated/`.

Explicitement exclu : filtrage collaboratif, collecte d'interactions réelles,
backend ML, pgvector, fine-tuning du modèle, prédiction de ventes.

## Environnement

Python 3.12, géré avec [`uv`](https://docs.astral.sh/uv/). PyTorch est installé
depuis l'index CPU pour éviter les roues CUDA (plusieurs Go inutiles).

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

Chaque script accepte `--config` pour pointer une autre configuration.
`build_embeddings.py` réutilise le cache si le modèle, le template de texte et
la liste des événements n'ont pas changé ; `--force` recalcule tout.

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

`intfloat/multilingual-e5-small`, encodage hors ligne avec le préfixe
`passage:` pour les événements. La révision (commit SHA) est résolue au moment
de la génération et enregistrée dans `embeddings.meta.json`, puis dans
`embeddings.v1.json`. Les vecteurs sont normalisés L2 et arrondis à 6 décimales
à l'export.

## Protocole d'évaluation

- 10 profils : 6 `dev`, 4 `test` ; le split `test` ne sert jamais au réglage.
- Seuil de pertinence binaire : `relevance >= 2`.
- K = 5 et 10 ; couverture et diversité intra-liste à K = 10.
- Métriques macro-moyennées par profil.
- Événements expirés exclus des candidats à la date de référence
  (`2026-11-05T00:00:00+01:00`).
- Poids contextuels et `lambda` MMR choisis par grille sur `dev` uniquement.

## Limites à déclarer

- Les événements sont des **fixtures de démonstration** (`is_demo=true`) :
  ils ne représentent pas des offres vérifiées.
- Les profils sont des personas fictifs, pas des utilisateurs observés.
- Les annotations sont produites par un annotateur unique selon un guide écrit ;
  ce ne sont pas des clics ou des achats réels.
- Le catalogue est petit : les écarts entre méthodes ne sont pas
  statistiquement significatifs.
- E5 est pré-entraîné et n'est pas fine-tuné sur Rivald'event.
- Aucun gain de conversion ou de ventes n'est démontré.

## Tests

```bash
cd ml
source .venv/bin/activate
pytest
ruff check src scripts tests
```
