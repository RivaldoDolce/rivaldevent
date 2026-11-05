"""Metriques de ranking et de diversite.

Conventions documentees :
- un jugement est positif lorsque ``relevance >= 2`` (seuil configurable) ;
- NDCG utilise les labels gradues 0..3 avec un gain ``2**rel - 1`` ;
- Recall@K est calcule sur les evenements juges pertinents, pas sur tout le
  catalogue : les evenements non annotes ne sont pas supposes non pertinents,
  ils sont simplement hors du jeu de jugements ;
- la couverture est calculee au niveau methode (union des Top-K des profils) ;
- la diversite intra-liste est ``1 - similarite cosinus moyenne`` des paires.
"""

from __future__ import annotations

import math
from collections.abc import Mapping, Sequence

import numpy as np

from .recommenders import cosine_similarity

# ============================================================
# Metriques par profil
# ============================================================


def precision_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    if k <= 0:
        raise ValueError("k doit etre strictement positif")
    if not ranked:
        return 0.0
    window = ranked[:k]
    return sum(1 for event_id in window if event_id in relevant) / float(k)


def recall_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    if k <= 0:
        raise ValueError("k doit etre strictement positif")
    if not relevant:
        return 0.0
    window = set(ranked[:k])
    return len(window & relevant) / float(len(relevant))


def dcg(gains: Sequence[float]) -> float:
    return sum(gain / math.log2(index + 2) for index, gain in enumerate(gains))


def ndcg_at_k(ranked: Sequence[str], graded: Mapping[str, int], k: int) -> float:
    """NDCG@K avec labels gradues ; ignore les evenements non juges."""
    if k <= 0:
        raise ValueError("k doit etre strictement positif")
    if not graded:
        return 0.0
    actual = [2 ** graded.get(event_id, 0) - 1 for event_id in ranked[:k]]
    ideal = sorted((2**relevance - 1 for relevance in graded.values()), reverse=True)[:k]
    ideal_dcg = dcg(ideal)
    if ideal_dcg <= 0:
        return 0.0
    return dcg(actual) / ideal_dcg


def mrr_at_k(ranked: Sequence[str], relevant: set[str], k: int) -> float:
    if k <= 0:
        raise ValueError("k doit etre strictement positif")
    for index, event_id in enumerate(ranked[:k], start=1):
        if event_id in relevant:
            return 1.0 / float(index)
    return 0.0


def intra_list_diversity(
    event_ids: Sequence[str], vectors: Mapping[str, np.ndarray]
) -> float:
    """1 - similarite cosinus moyenne des paires ; 0 si moins de deux elements."""
    if len(event_ids) < 2:
        return 0.0
    available = [event_id for event_id in event_ids if event_id in vectors]
    if len(available) < 2:
        return 0.0
    similarities = [
        cosine_similarity(vectors[left], vectors[right])
        for index, left in enumerate(available)
        for right in available[index + 1 :]
    ]
    return 1.0 - float(np.mean(similarities))


def evaluate_profile(
    *,
    ranked: Sequence[str],
    graded: Mapping[str, int],
    k_values: Sequence[int],
    relevance_threshold: int,
    vectors: Mapping[str, np.ndarray],
    diversity_k: int = 10,
) -> dict[str, float]:
    relevant = {event_id for event_id, relevance in graded.items() if relevance >= relevance_threshold}
    metrics: dict[str, float] = {}
    for k in k_values:
        metrics[f"precision@{k}"] = precision_at_k(ranked, relevant, k)
        metrics[f"recall@{k}"] = recall_at_k(ranked, relevant, k)
        metrics[f"ndcg@{k}"] = ndcg_at_k(ranked, graded, k)
    metrics[f"mrr@{max(k_values)}"] = mrr_at_k(ranked, relevant, max(k_values))
    metrics[f"diversity@{diversity_k}"] = intra_list_diversity(
        ranked[:diversity_k], vectors
    )
    return metrics


# ============================================================
# Agregation
# ============================================================


def catalog_coverage(lists: Sequence[Sequence[str]], catalog_size: int, k: int) -> float:
    if catalog_size <= 0:
        return 0.0
    seen: set[str] = set()
    for ranked in lists:
        seen.update(ranked[:k])
    return len(seen) / float(catalog_size)


def macro_average(per_profile: Sequence[Mapping[str, float]]) -> dict[str, float]:
    """Moyenne macro : chaque profil pese pareil, quel que soit son nombre de jugements."""
    if not per_profile:
        return {}
    keys = sorted({key for metrics in per_profile for key in metrics})
    averages: dict[str, float] = {}
    for key in keys:
        values = [metrics[key] for metrics in per_profile if key in metrics]
        averages[key] = float(np.mean(values)) if values else 0.0
    return averages


def summarize(
    *,
    per_profile: Mapping[str, Mapping[str, float]],
    ranked_by_profile: Mapping[str, Sequence[str]],
    catalog_size: int,
    k_values: Sequence[int],
) -> dict[str, float]:
    overall = macro_average(list(per_profile.values()))
    for k in k_values:
        overall[f"coverage@{k}"] = catalog_coverage(
            list(ranked_by_profile.values()), catalog_size, k
        )
    return overall
