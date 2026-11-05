"""Tests des metriques de ranking sur des cas calculables a la main."""

from __future__ import annotations

import math

import numpy as np
import pytest

from rivaldevent_ml.metrics import (
    catalog_coverage,
    evaluate_profile,
    macro_average,
    mrr_at_k,
    ndcg_at_k,
    precision_at_k,
    recall_at_k,
)


def test_precision_and_recall_at_k():
    ranked = ["a", "b", "c", "d"]
    relevant = {"b", "d", "z"}
    assert precision_at_k(ranked, relevant, 2) == pytest.approx(0.5)
    assert recall_at_k(ranked, relevant, 2) == pytest.approx(1 / 3)
    assert precision_at_k(ranked, relevant, 4) == pytest.approx(0.5)
    assert recall_at_k(ranked, relevant, 4) == pytest.approx(2 / 3)


def test_precision_is_zero_without_relevant_items():
    assert precision_at_k(["a"], set(), 3) == 0.0
    assert recall_at_k(["a"], set(), 3) == 0.0


def test_mrr_at_k():
    assert mrr_at_k(["x", "b", "c"], {"b"}, 10) == pytest.approx(0.5)
    assert mrr_at_k(["x", "y"], {"b"}, 1) == 0.0


def test_ndcg_manual_value():
    graded = {"a": 0, "b": 3, "c": 2}
    ranked = ["b", "a", "c"]

    dcg = (2**3 - 1) / math.log2(2) + (2**0 - 1) / math.log2(3) + (2**2 - 1) / math.log2(4)
    ideal = sorted([0, 7, 3], reverse=True)
    idcg = ideal[0] / math.log2(2) + ideal[1] / math.log2(3) + ideal[2] / math.log2(4)

    assert ndcg_at_k(ranked, graded, 3) == pytest.approx(dcg / idcg)
    assert ndcg_at_k(ranked, graded, 3) <= 1.0


def test_ndcg_ignores_unjudged_items_but_penalizes_position():
    graded = {"b": 3}
    assert ndcg_at_k(["b"], graded, 5) == pytest.approx(1.0)
    assert ndcg_at_k(["x", "b"], graded, 5) == pytest.approx(1 / math.log2(3))


def test_catalog_coverage():
    lists = [["a", "b"], ["b", "c"]]
    assert catalog_coverage(lists, catalog_size=4, k=2) == pytest.approx(0.75)
    assert catalog_coverage([], catalog_size=4, k=2) == 0.0


def test_evaluate_profile_reports_all_metrics():
    graded = {"a": 3, "b": 2, "c": 1, "d": 0}
    vectors = {
        event_id: np.array([1.0, 0.0], dtype=np.float32)
        for event_id in ["a", "b", "c", "d"]
    }
    metrics = evaluate_profile(
        ranked=["a", "b", "c", "d"],
        graded=graded,
        k_values=[2, 4],
        relevance_threshold=2,
        vectors=vectors,
        diversity_k=4,
    )
    assert metrics["precision@2"] == pytest.approx(1.0)
    assert metrics["recall@2"] == pytest.approx(1.0)
    assert metrics["ndcg@2"] == pytest.approx(1.0)
    assert metrics["mrr@4"] == pytest.approx(1.0)
    assert metrics["diversity@4"] == pytest.approx(0.0)


def test_macro_average_gives_each_profile_equal_weight():
    per_profile = [
        {"ndcg@10": 1.0, "recall@10": 0.5},
        {"ndcg@10": 0.0, "recall@10": 1.0},
    ]
    averaged = macro_average(per_profile)
    assert averaged["ndcg@10"] == pytest.approx(0.5)
    assert averaged["recall@10"] == pytest.approx(0.75)
