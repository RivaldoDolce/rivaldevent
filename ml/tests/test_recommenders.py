"""Tests des briques de recommandation (signaux, vecteurs, MMR)."""

from __future__ import annotations

from datetime import UTC, datetime, timedelta, timezone

import numpy as np
import pytest

from rivaldevent_ml.dataset import Event, Profile
from rivaldevent_ml.recommenders import (
    RankingWeights,
    budget_score,
    build_profile_vector,
    category_score,
    combine_scores,
    context_breakdown,
    cosine_similarity,
    eligible_events,
    location_score,
    mmr_rerank,
    rank_scores,
    temporal_score,
)


def make_event(
    event_id: str = "evt_001",
    *,
    city: str = "Douala",
    category: str = "music",
    price_min: int | None = 5000,
    price_max: int | None = 15000,
    start_at: datetime | None = None,
    end_at: datetime | None = None,
) -> Event:
    start = start_at or datetime(2026, 12, 1, 19, 0, tzinfo=timezone(timedelta(hours=1)))
    return Event(
        event_id=event_id,
        title="Titre",
        description="Description",
        category=category,
        city=city,
        venue="Salle",
        price_min=price_min,
        price_max=price_max,
        currency="XAF",
        start_at=start,
        end_at=end_at,
        language="fr",
        tags=("test",),
        source_type="demo_fixture",
        source_url=None,
        collected_at="2026-11-05",
        verified_at=None,
        is_demo=True,
        text="passage: Titre. Description.",
    )


def make_profile(
    *,
    city: str = "Douala",
    budget_min: int = 5000,
    budget_max: int = 25000,
    categories: tuple[str, ...] = ("music", "festival"),
    seeds: tuple[str, ...] = ("evt_001",),
) -> Profile:
    return Profile(
        profile_id="profile",
        display_name="Profil",
        description="Persona",
        city=city,
        budget_min=budget_min,
        budget_max=budget_max,
        preferred_categories=categories,
        seed_event_ids=seeds,
        language="fr",
        split="dev",
        is_demo=True,
    )


# ============================================================
# Similarite et vecteurs
# ============================================================


def test_cosine_similarity_known_values():
    assert cosine_similarity(np.array([1.0, 0.0]), np.array([0.0, 1.0])) == pytest.approx(0.0)
    assert cosine_similarity(np.array([1.0, 1.0]), np.array([1.0, 0.0])) == pytest.approx(
        1 / np.sqrt(2)
    )
    assert cosine_similarity(np.array([1.0, 1.0]), np.array([1.0, 1.0])) == pytest.approx(1.0)


def test_cosine_rejects_dimension_mismatch():
    with pytest.raises(ValueError, match="dimensions incompatibles"):
        cosine_similarity(np.array([1.0, 0.0]), np.array([1.0, 0.0, 0.0]))


def test_cosine_with_zero_vector_is_zero():
    assert cosine_similarity(np.array([0.0, 0.0]), np.array([1.0, 0.0])) == 0.0


def test_build_profile_vector_normalizes_and_skips_missing_seeds():
    embeddings = {
        "a": np.array([3.0, 0.0], dtype=np.float32),
        "b": np.array([1.0, 0.0], dtype=np.float32),
    }
    vector = build_profile_vector(["a", "b", "absent"], embeddings, dimension=2)
    assert vector is not None
    assert np.allclose(vector, np.array([1.0, 0.0], dtype=np.float32))


def test_build_profile_vector_returns_none_without_vectors():
    assert build_profile_vector(["absent"], {}, dimension=2) is None


# ============================================================
# Signaux contextuels
# ============================================================


def test_category_score():
    profile = make_profile(categories=("music",))
    assert category_score(profile, make_event(category="music")) == 1.0
    assert category_score(profile, make_event(category="sport")) == 0.0


def test_location_score_same_city_same_region_other():
    profile = make_profile(city="Douala")
    assert location_score(profile, make_event(city="Douala")) == 1.0
    assert location_score(profile, make_event(city="Limbe")) == 0.0

    regional = make_profile(city="Buea")
    assert location_score(regional, make_event(city="Limbe")) == pytest.approx(0.4)


def test_budget_unknown_is_not_free():
    profile = make_profile(budget_min=0, budget_max=25000)
    score, known = budget_score(profile, make_event(price_min=None, price_max=None))
    assert score == 0.0
    assert known is False


def test_budget_free_event_only_scores_if_profile_accepts_zero():
    free_event = make_event(price_min=0, price_max=0)
    assert budget_score(make_profile(budget_min=0), free_event) == (1.0, True)
    assert budget_score(make_profile(budget_min=5000), free_event) == (0.0, True)


def test_budget_partial_overlap_is_proportional():
    profile = make_profile(budget_min=5000, budget_max=15000)
    score, known = budget_score(profile, make_event(price_min=10000, price_max=25000))
    assert known is True
    assert score == pytest.approx(5000 / 15000)


def test_budget_outside_range_scores_zero():
    profile = make_profile(budget_min=5000, budget_max=10000)
    score, known = budget_score(profile, make_event(price_min=50000, price_max=60000))
    assert (score, known) == (0.0, True)


def test_temporal_score_buckets():
    reference = datetime(2026, 11, 5, tzinfo=UTC)
    assert temporal_score(make_event(start_at=reference + timedelta(days=10)), reference) == 1.0
    assert temporal_score(make_event(start_at=reference + timedelta(days=70)), reference) == 0.6
    assert temporal_score(make_event(start_at=reference + timedelta(days=300)), reference) == 0.3
    assert temporal_score(make_event(start_at=reference - timedelta(days=1)), reference) == 0.0


def test_expired_events_are_filtered():
    reference = datetime(2026, 11, 5, tzinfo=UTC)
    past = make_event("evt_past", start_at=reference - timedelta(days=30))
    future = make_event("evt_future", start_at=reference + timedelta(days=30))
    selected = eligible_events([past, future], reference)
    assert [event.event_id for event in selected] == ["evt_future"]


def test_combine_scores_renormalizes_without_semantic():
    profile = make_profile()
    event = make_event()
    breakdown = context_breakdown(
        profile, event, datetime(2026, 11, 6, tzinfo=UTC)
    )
    components = combine_scores(
        semantic=None, breakdown=breakdown, weights=RankingWeights()
    )
    assert components["semantic"] == 0.0
    assert components["total"] == pytest.approx(
        sum(value for key, value in components.items() if key != "total")
    )
    assert components["total"] <= 1.0


# ============================================================
# Tri et diversification
# ============================================================


def test_rank_scores_is_deterministic_on_ties():
    assert rank_scores({"b": 1.0, "a": 1.0, "c": 0.5}) == [("a", 1.0), ("b", 1.0), ("c", 0.5)]


def test_mmr_prefers_diversity_when_relevance_is_close():
    embeddings = {
        "a": np.array([1.0, 0.0], dtype=np.float32),
        "b": np.array([1.0, 0.0], dtype=np.float32),
        "c": np.array([0.0, 1.0], dtype=np.float32),
    }
    ranked = [("a", 1.0), ("b", 0.9), ("c", 0.85)]
    selected = mmr_rerank(ranked, embeddings, k=2, lambda_=0.5)
    assert [event_id for event_id, _ in selected] == ["a", "c"]


def test_mmr_is_deterministic_and_keeps_original_scores():
    embeddings = {
        "a": np.array([1.0, 0.0], dtype=np.float32),
        "b": np.array([0.0, 1.0], dtype=np.float32),
        "c": np.array([0.7, 0.7], dtype=np.float32),
    }
    ranked = [("a", 1.0), ("b", 0.8), ("c", 0.6)]
    first = mmr_rerank(ranked, embeddings, k=3, lambda_=0.7)
    second = mmr_rerank(ranked, embeddings, k=3, lambda_=0.7)
    assert first == second
    assert dict(first) == {"a": 1.0, "b": 0.8, "c": 0.6}


def test_mmr_breaks_ties_by_event_id_even_without_selection():
    embeddings = {
        "z": np.array([1.0, 0.0], dtype=np.float32),
        "a": np.array([0.0, 1.0], dtype=np.float32),
    }
    ranked = [("z", 0.5), ("a", 0.5)]
    selected = mmr_rerank(ranked, embeddings, k=2, lambda_=0.5)
    assert [event_id for event_id, _ in selected] == ["a", "z"]


def test_mmr_rejects_invalid_lambda():
    with pytest.raises(ValueError, match="lambda"):
        mmr_rerank([("a", 1.0)], {}, k=1, lambda_=1.5)
