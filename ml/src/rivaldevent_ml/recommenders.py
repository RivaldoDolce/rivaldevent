"""Baselines et methodes de ranking.

Toutes les methodes recoivent le meme catalogue candidat et les memes profils.
Les scores sont deterministes : egalite de score => tri par ``event_id``.

Trois familles sont implementees :
- ``metadata`` : regles explicites categorie / ville / budget / temporalite ;
- ``tfidf`` : similarite lexicale entre le profil et les textes d'evenements ;
- ``e5`` : similarite cosinus dans l'espace des embeddings multilingues.

Les methodes ``e5_context`` et ``e5_context_mmr`` reutilisent les briques
contextuelles et MMR exposees ici.
"""

from __future__ import annotations

from collections.abc import Iterable, Mapping, Sequence
from dataclasses import dataclass
from datetime import datetime

import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer

from .dataset import CITY_REGIONS, Event, Profile, build_profile_text

# ============================================================
# Configuration du ranking
# ============================================================


@dataclass(frozen=True)
class RankingWeights:
    """Poids du score final. Ils sont normalises avant usage."""

    semantic: float = 0.60
    category: float = 0.16
    location: float = 0.10
    budget: float = 0.09
    temporal: float = 0.05

    @classmethod
    def from_mapping(cls, values: Mapping[str, float]) -> RankingWeights:
        return cls(
            semantic=float(values.get("semantic", cls.semantic)),
            category=float(values.get("category", cls.category)),
            location=float(values.get("location", cls.location)),
            budget=float(values.get("budget", cls.budget)),
            temporal=float(values.get("temporal", cls.temporal)),
        )

    def as_dict(self) -> dict[str, float]:
        return {
            "semantic": self.semantic,
            "category": self.category,
            "location": self.location,
            "budget": self.budget,
            "temporal": self.temporal,
        }

    def normalized(self, *, include_semantic: bool = True) -> dict[str, float]:
        raw = self.as_dict()
        if not include_semantic:
            raw["semantic"] = 0.0
        total = sum(raw.values())
        if total <= 0:
            raise ValueError("la somme des poids doit etre strictement positive")
        return {key: value / total for key, value in raw.items()}


@dataclass(frozen=True)
class TemporalConfig:
    near_days: int = 45
    mid_days: int = 120
    near_score: float = 1.0
    mid_score: float = 0.6
    far_score: float = 0.3


@dataclass(frozen=True)
class ContextBreakdown:
    category: float
    location: float
    budget: float
    temporal: float
    budget_known: bool

    def as_dict(self) -> dict[str, float]:
        return {
            "category": self.category,
            "location": self.location,
            "budget": self.budget,
            "temporal": self.temporal,
        }


# ============================================================
# Signaux contextuels
# ============================================================


def category_score(profile: Profile, event: Event) -> float:
    """1 si la categorie fait partie des preferences, 0 sinon."""
    return 1.0 if event.category in profile.preferred_categories else 0.0


def location_score(profile: Profile, event: Event) -> float:
    """Meme ville = 1, meme region = 0.4, sinon 0.

    Une ville differente ne supprime jamais l'evenement : elle reduit le score.
    """
    if event.city == profile.city:
        return 1.0
    if CITY_REGIONS.get(event.city) and CITY_REGIONS.get(event.city) == CITY_REGIONS.get(
        profile.city
    ):
        return 0.4
    return 0.0


def budget_score(profile: Profile, event: Event) -> tuple[float, bool]:
    """Chevauchement explicite entre budget du profil et prix de l'evenement.

    Un prix inconnu renvoie ``(0.0, False)`` : il n'est jamais interprete comme
    gratuit. Un evenement gratuit renvoie 1.0 seulement si le profil accepte 0.
    """
    if event.price_min is None or event.price_max is None:
        return 0.0, False

    low, high = event.price_min, event.price_max
    if low == 0 and high == 0:
        return (1.0 if profile.budget_min == 0 else 0.0), True

    if high < profile.budget_min or low > profile.budget_max:
        return 0.0, True

    overlap = min(high, profile.budget_max) - max(low, profile.budget_min)
    span = max(high - low, 1)
    return max(0.0, min(1.0, overlap / span)), True


def temporal_score(
    event: Event, reference: datetime, config: TemporalConfig | None = None
) -> float:
    """Proximite temporelle. Les evenements passes sont exclus en amont."""
    config = config or TemporalConfig()
    delta_days = (event.start_at - reference).total_seconds() / 86400.0
    if delta_days < 0:
        return 0.0
    if delta_days <= config.near_days:
        return config.near_score
    if delta_days <= config.mid_days:
        return config.mid_score
    return config.far_score


def context_breakdown(
    profile: Profile,
    event: Event,
    reference: datetime,
    temporal_config: TemporalConfig | None = None,
) -> ContextBreakdown:
    budget, known = budget_score(profile, event)
    return ContextBreakdown(
        category=category_score(profile, event),
        location=location_score(profile, event),
        budget=budget,
        temporal=temporal_score(event, reference, temporal_config),
        budget_known=known,
    )


def combine_scores(
    *,
    semantic: float | None,
    breakdown: ContextBreakdown,
    weights: RankingWeights,
) -> dict[str, float]:
    """Combine les signaux avec des poids normalises (somme = 1)."""
    normalized = weights.normalized(include_semantic=semantic is not None)
    semantic_value = semantic if semantic is not None else 0.0
    components = {
        "semantic": normalized["semantic"] * semantic_value,
        "category": normalized["category"] * breakdown.category,
        "location": normalized["location"] * breakdown.location,
        "budget": normalized["budget"] * breakdown.budget,
        "temporal": normalized["temporal"] * breakdown.temporal,
    }
    components["total"] = sum(components.values())
    return components


# ============================================================
# Profils vectoriels
# ============================================================


def normalize_vector(vector: np.ndarray) -> np.ndarray | None:
    """Normalisation L2 ; un vecteur nul renvoie ``None``."""
    array = np.asarray(vector, dtype=np.float32)
    norm = float(np.linalg.norm(array))
    if not np.isfinite(norm) or norm <= 0:
        return None
    return array / norm


def build_profile_vector(
    seed_event_ids: Sequence[str],
    embeddings: Mapping[str, np.ndarray],
    *,
    dimension: int,
) -> np.ndarray | None:
    """Agrege les embeddings des evenements de reference puis normalise.

    Les identifiants sans vecteur sont ignores ; l'absence totale de vecteurs
    produit ``None`` (le runtime doit alors utiliser un repli documente).
    """
    vectors = [
        embeddings[event_id] for event_id in seed_event_ids if event_id in embeddings
    ]
    if not vectors:
        return None
    for vector in vectors:
        if vector.shape != (dimension,):
            raise ValueError(
                f"dimension inattendue: {vector.shape} au lieu de ({dimension},)"
            )
    aggregated = np.sum(np.stack(vectors), axis=0)
    return normalize_vector(aggregated)


def cosine_similarity(left: np.ndarray, right: np.ndarray) -> float:
    """Cosinus prudent : dimension verifiee, vecteurs nuls traites."""
    if left.shape != right.shape:
        raise ValueError(f"dimensions incompatibles: {left.shape} != {right.shape}")
    left_norm = float(np.linalg.norm(left))
    right_norm = float(np.linalg.norm(right))
    if left_norm == 0 or right_norm == 0:
        return 0.0
    return float(np.dot(left, right) / (left_norm * right_norm))


def semantic_scores(
    profile_vector: np.ndarray | None,
    event_ids: Sequence[str],
    embeddings: Mapping[str, np.ndarray],
) -> dict[str, float]:
    """Similarite cosinus entre le profil et chaque evenement candidat."""
    if profile_vector is None:
        return {event_id: 0.0 for event_id in event_ids}
    return {
        event_id: cosine_similarity(profile_vector, embeddings[event_id])
        for event_id in event_ids
        if event_id in embeddings
    }


# ============================================================
# Baseline lexicale
# ============================================================


@dataclass
class TfidfRecommender:
    """Baseline TF-IDF ajustee sur le catalogue candidat."""

    vectorizer: TfidfVectorizer
    matrix: np.ndarray
    event_ids: tuple[str, ...]

    @classmethod
    def fit(cls, events: Sequence[Event]) -> TfidfRecommender:
        vectorizer = TfidfVectorizer(
            lowercase=True,
            ngram_range=(1, 2),
            min_df=1,
            sublinear_tf=True,
            token_pattern=r"(?u)\b\w+\b",
        )
        matrix = vectorizer.fit_transform([event.text for event in events])
        return cls(
            vectorizer=vectorizer,
            matrix=matrix,
            event_ids=tuple(event.event_id for event in events),
        )

    def scores(self, profile: Profile, events_by_id: Mapping[str, Event]) -> dict[str, float]:
        from sklearn.metrics.pairwise import cosine_similarity as sklearn_cosine

        query = self.vectorizer.transform([build_profile_text(profile, dict(events_by_id))])
        similarities = sklearn_cosine(query, self.matrix).ravel()
        return {
            event_id: float(score)
            for event_id, score in zip(self.event_ids, similarities, strict=True)
        }


# ============================================================
# Diversification MMR
# ============================================================


def rank_scores(scores: Mapping[str, float], k: int | None = None) -> list[tuple[str, float]]:
    """Tri deterministe par score decroissant puis identifiant croissant."""
    ranked = sorted(scores.items(), key=lambda item: (-item[1], item[0]))
    return ranked[:k] if k is not None else ranked


def mmr_rerank(
    ranked: Sequence[tuple[str, float]],
    embeddings: Mapping[str, np.ndarray],
    *,
    k: int,
    lambda_: float,
    pool_size: int = 30,
) -> list[tuple[str, float]]:
    """Diversification Maximal Marginal Relevance.

    ``Rel`` est normalise min-max sur le pool pour que lambda reste
    interpretable ; ``Sim`` est la similarite cosinus avec les elements deja
    selectionnes. Le resultat conserve le score de pertinence d'origine.
    """
    if not 0.0 <= lambda_ <= 1.0:
        raise ValueError("lambda doit appartenir a [0, 1]")

    pool = [(event_id, score) for event_id, score in ranked[: max(k, pool_size)]]
    if len(pool) <= k:
        # Meme sans selection a operer, l'ordre reste deterministe : score
        # decroissant puis identifiant croissant (aligne sur le runtime TS).
        return sorted(pool, key=lambda item: (-item[1], item[0]))

    scores = [score for _, score in pool]
    low, high = min(scores), max(scores)
    span = high - low
    relevance = {
        event_id: (score - low) / span if span > 0 else 1.0 for event_id, score in pool
    }

    selected: list[tuple[str, float]] = []
    candidates = list(pool)
    while candidates and len(selected) < k:
        best: tuple[str, float] | None = None
        best_value = float("-inf")
        for event_id, score in candidates:
            if selected:
                max_similarity = max(
                    cosine_similarity(embeddings[event_id], embeddings[chosen])
                    for chosen, _ in selected
                )
            else:
                max_similarity = 0.0
            value = lambda_ * relevance[event_id] - (1.0 - lambda_) * max_similarity
            if value > best_value or (
                value == best_value and best is not None and event_id < best[0]
            ):
                best_value = value
                best = (event_id, score)
        if best is None:  # pragma: no cover - garde-fou
            break
        selected.append(best)
        candidates = [item for item in candidates if item[0] != best[0]]

    return selected


# ============================================================
# Methodes completes
# ============================================================


def eligible_events(
    events: Iterable[Event], reference: datetime, *, include_expired: bool = False
) -> list[Event]:
    """Filtre les evenements expires avant tout calcul de score."""
    if include_expired:
        return list(events)
    return [event for event in events if not event.is_expired(reference)]


def score_candidates(
    *,
    profile: Profile,
    candidates: Sequence[Event],
    reference: datetime,
    weights: RankingWeights,
    semantic: Mapping[str, float] | None = None,
    temporal_config: TemporalConfig | None = None,
) -> dict[str, dict[str, float]]:
    """Calcule le detail du score pour chaque candidat.

    ``semantic=None`` produit la baseline contextuelle seule : les poids sont
    alors renormalises sur les quatre signaux contextuels.
    """
    results: dict[str, dict[str, float]] = {}
    for event in candidates:
        breakdown = context_breakdown(profile, event, reference, temporal_config)
        results[event.event_id] = combine_scores(
            semantic=semantic.get(event.event_id) if semantic is not None else None,
            breakdown=breakdown,
            weights=weights,
        )
    return results


def rank_from_details(details: Mapping[str, Mapping[str, float]]) -> list[tuple[str, float]]:
    return rank_scores({event_id: values["total"] for event_id, values in details.items()})


def intra_list_diversity(
    event_ids: Sequence[str], embeddings: Mapping[str, np.ndarray]
) -> float:
    """1 - similarite cosinus moyenne des paires (0 si moins de deux elements)."""
    if len(event_ids) < 2:
        return 0.0
    similarities: list[float] = []
    for index, left in enumerate(event_ids):
        for right in event_ids[index + 1 :]:
            similarities.append(cosine_similarity(embeddings[left], embeddings[right]))
    return 1.0 - float(np.mean(similarities))
