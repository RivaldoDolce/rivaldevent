"""Serialisation des artefacts consommes par le runtime TypeScript.

Les quatre artefacts partagent la meme ``datasetVersion`` et un ``schemaVersion``
explicite. L'export refuse un fichier incomplet :

- un evenement sans vecteur ;
- un vecteur de mauvaise dimension ;
- un benchmark vide ou rattache a une autre version de dataset ;
- des identifiants dupliques.

Les metriques ne sont jamais ecrites a la main : elles proviennent du fichier
produit par ``run_benchmark.py``.
"""

from __future__ import annotations

import json
import math
from collections.abc import Mapping, Sequence
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

from .dataset import TEXT_TEMPLATE_VERSION, Event, Profile
from .embeddings import EmbeddingBundle

SCHEMA_VERSION = 1


class ExportError(ValueError):
    """Export refuse : contrat runtime non respecte."""


def utc_now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def _write_json(path: Path, payload: Mapping[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(
        json.dumps(payload, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8",
    )


def build_events_artifact(
    events: Sequence[Event],
    *,
    dataset_version: str,
    generated_at: str,
) -> dict[str, Any]:
    event_ids = [event.event_id for event in events]
    if len(event_ids) != len(set(event_ids)):
        raise ExportError("identifiants d'evenements dupliques dans le catalogue")
    return {
        "schemaVersion": SCHEMA_VERSION,
        "datasetVersion": dataset_version,
        "generatedAt": generated_at,
        "textTemplateVersion": TEXT_TEMPLATE_VERSION,
        "eventCount": len(events),
        "events": [event.to_runtime_dict() for event in events],
    }


def build_embeddings_artifact(
    bundle: EmbeddingBundle,
    events: Sequence[Event],
    *,
    dataset_version: str,
    generated_at: str,
    decimals: int = 6,
) -> dict[str, Any]:
    event_ids = {event.event_id for event in events}
    bundle_ids = set(bundle.event_ids)

    missing = sorted(event_ids - bundle_ids)
    if missing:
        raise ExportError(f"evenements sans embedding: {', '.join(missing)}")
    orphan = sorted(bundle_ids - event_ids)
    if orphan:
        raise ExportError(f"embeddings sans evenement correspondant: {', '.join(orphan)}")

    if bundle.dimension <= 0:
        raise ExportError("dimension d'embedding invalide")
    if bundle.matrix.shape != (len(bundle.event_ids), bundle.dimension):
        raise ExportError(
            f"matrice incoherente: {bundle.matrix.shape} != "
            f"({len(bundle.event_ids)}, {bundle.dimension})"
        )

    vectors: dict[str, list[float]] = {}
    for index, event_id in enumerate(bundle.event_ids):
        vector = bundle.matrix[index]
        if vector.shape != (bundle.dimension,):
            raise ExportError(f"vecteur mal dimensionne pour {event_id}: {vector.shape}")
        if not all(math.isfinite(float(value)) for value in vector):
            raise ExportError(f"vecteur non fini pour {event_id}")
        vectors[event_id] = [round(float(value), decimals) for value in vector]

    return {
        "schemaVersion": SCHEMA_VERSION,
        "datasetVersion": dataset_version,
        "generatedAt": generated_at,
        "model": bundle.model_id,
        "modelRevision": bundle.model_revision,
        "dimension": bundle.dimension,
        "normalized": bundle.normalized,
        "textTemplateVersion": bundle.text_template_version,
        "vectors": vectors,
    }


def build_profiles_artifact(
    profiles: Sequence[Profile],
    *,
    dataset_version: str,
    generated_at: str,
) -> dict[str, Any]:
    return {
        "schemaVersion": SCHEMA_VERSION,
        "datasetVersion": dataset_version,
        "generatedAt": generated_at,
        "profileCount": len(profiles),
        "profiles": [profile.to_runtime_dict() for profile in profiles],
    }


def build_benchmark_artifact(
    benchmark: Mapping[str, Any],
    *,
    dataset_version: str,
    generated_at: str,
) -> dict[str, Any]:
    benchmark_version = benchmark.get("datasetVersion")
    if benchmark_version != dataset_version:
        raise ExportError(
            f"benchmark rattache a {benchmark_version!r}, dataset courant {dataset_version!r}"
        )

    results = benchmark.get("results") or []
    if not results:
        raise ExportError("benchmark vide: aucune metrique a exporter")

    sample_counts = benchmark.get("sampleCounts") or {}
    for key in ("profiles", "events", "judgments"):
        if not sample_counts.get(key):
            raise ExportError(f"sampleCounts.{key} manquant ou nul")

    for result in results:
        if not result.get("metrics"):
            raise ExportError(f"resultat sans metriques: {result.get('method')!r}")

    return {
        "schemaVersion": SCHEMA_VERSION,
        "datasetVersion": dataset_version,
        "generatedAt": generated_at,
        **{key: value for key, value in benchmark.items() if key != "datasetVersion"},
    }


def export_runtime_assets(
    *,
    events: Sequence[Event],
    profiles: Sequence[Profile],
    bundle: EmbeddingBundle,
    benchmark: Mapping[str, Any],
    dataset_version: str,
    output_dir: str | Path,
) -> dict[str, Path]:
    """Ecrit les quatre artefacts et verifie leur coherence globale."""
    if not events or not profiles:
        raise ExportError("catalogue ou profils vides")

    generated_at = utc_now_iso()
    output = Path(output_dir)

    events_payload = build_events_artifact(
        events, dataset_version=dataset_version, generated_at=generated_at
    )
    embeddings_payload = build_embeddings_artifact(
        bundle,
        events,
        dataset_version=dataset_version,
        generated_at=generated_at,
    )
    profiles_payload = build_profiles_artifact(
        profiles, dataset_version=dataset_version, generated_at=generated_at
    )
    benchmark_payload = build_benchmark_artifact(
        benchmark, dataset_version=dataset_version, generated_at=generated_at
    )

    versions = {
        payload["datasetVersion"]
        for payload in (events_payload, embeddings_payload, profiles_payload, benchmark_payload)
    }
    if len(versions) != 1:
        raise ExportError(f"versions de dataset incoherentes: {sorted(versions)}")

    paths = {
        "events": output / "events.v1.json",
        "embeddings": output / "embeddings.v1.json",
        "profiles": output / "profiles.v1.json",
        "benchmark": output / "benchmark.v1.json",
    }
    _write_json(paths["events"], events_payload)
    _write_json(paths["embeddings"], embeddings_payload)
    _write_json(paths["profiles"], profiles_payload)
    _write_json(paths["benchmark"], benchmark_payload)
    return paths
