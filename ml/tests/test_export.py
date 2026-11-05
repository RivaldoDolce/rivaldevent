"""Tests de l'export runtime : contrats, dimensions et versions."""

from __future__ import annotations

from datetime import datetime, timedelta, timezone

import numpy as np
import pytest

from rivaldevent_ml.dataset import Event, Profile
from rivaldevent_ml.embeddings import EmbeddingBundle
from rivaldevent_ml.export import (
    ExportError,
    build_benchmark_artifact,
    build_embeddings_artifact,
    export_runtime_assets,
)


def make_event(event_id: str = "evt_001") -> Event:
    start = datetime(2027, 1, 10, 19, 0, tzinfo=timezone(timedelta(hours=1)))
    return Event(
        event_id=event_id,
        title="Concert",
        description="Description",
        category="music",
        city="Douala",
        venue=None,
        price_min=0,
        price_max=10000,
        currency="XAF",
        start_at=start,
        end_at=None,
        language="fr",
        tags=("concert",),
        source_type="demo_fixture",
        source_url=None,
        collected_at="2026-11-05",
        verified_at=None,
        is_demo=True,
        text="passage: Concert. Description.",
    )


def make_profile() -> Profile:
    return Profile(
        profile_id="profile",
        display_name="Profil",
        description="Persona",
        city="Douala",
        budget_min=0,
        budget_max=15000,
        preferred_categories=("music",),
        seed_event_ids=("evt_001",),
        language="fr",
        split="dev",
        is_demo=True,
    )


def make_bundle(event_ids: list[str], dimension: int = 3) -> EmbeddingBundle:
    matrix = np.tile(np.array([1.0, 0.0, 0.0], dtype=np.float32), (len(event_ids), 1))
    return EmbeddingBundle(
        event_ids=tuple(event_ids),
        matrix=matrix,
        model_id="intfloat/multilingual-e5-small",
        model_revision="abc123",
        dimension=dimension,
        normalized=True,
        text_template_version=1,
        generated_at="2026-11-05T10:00:00Z",
        encode_seconds=1.0,
    )


def make_benchmark(dataset_version: str = "dataset-v1") -> dict:
    return {
        "datasetVersion": dataset_version,
        "results": [
            {
                "method": "e5",
                "label": "E5 semantic",
                "split": "test",
                "metrics": {"ndcg@10": 0.5},
            }
        ],
        "sampleCounts": {"profiles": 10, "events": 72, "judgments": 200},
    }


def test_build_embeddings_artifact_checks_dimensions():
    events = [make_event()]
    bundle = make_bundle(["evt_001"], dimension=3)
    payload = build_embeddings_artifact(bundle, events, dataset_version="v1", generated_at="now")
    assert payload["dimension"] == 3
    assert len(payload["vectors"]["evt_001"]) == 3


def test_export_refuses_missing_embedding():
    events = [make_event("evt_001"), make_event("evt_002")]
    bundle = make_bundle(["evt_001"])
    with pytest.raises(ExportError, match="sans embedding"):
        build_embeddings_artifact(bundle, events, dataset_version="v1", generated_at="now")


def test_export_refuses_orphan_embedding():
    events = [make_event("evt_001")]
    bundle = make_bundle(["evt_001", "evt_002"])
    with pytest.raises(ExportError, match="sans evenement"):
        build_embeddings_artifact(bundle, events, dataset_version="v1", generated_at="now")


def test_export_refuses_version_mismatch():
    with pytest.raises(ExportError, match="benchmark rattache"):
        build_benchmark_artifact(
            make_benchmark("dataset-v2"), dataset_version="dataset-v1", generated_at="now"
        )


def test_export_refuses_empty_benchmark():
    benchmark = make_benchmark()
    benchmark["results"] = []
    with pytest.raises(ExportError, match="benchmark vide"):
        build_benchmark_artifact(benchmark, dataset_version="dataset-v1", generated_at="now")


def test_full_export_writes_four_artifacts(tmp_path):
    events = [make_event()]
    profiles = [make_profile()]
    paths = export_runtime_assets(
        events=events,
        profiles=profiles,
        bundle=make_bundle(["evt_001"]),
        benchmark=make_benchmark(),
        dataset_version="dataset-v1",
        output_dir=tmp_path,
    )
    assert set(paths) == {"events", "embeddings", "profiles", "benchmark"}
    for path in paths.values():
        assert path.exists()
        assert '"schemaVersion": 1' in path.read_text(encoding="utf-8")
