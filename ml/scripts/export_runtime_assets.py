#!/usr/bin/env python3
"""Exporte les artefacts JSON consommes par l'application Expo.

Usage :
    python scripts/export_runtime_assets.py [--config ...]

Sorties (dans ``data/recommendations/generated/``) :
    events.v1.json
    embeddings.v1.json
    profiles.v1.json
    benchmark.v1.json

L'export est refuse si un evenement n'a pas de vecteur, si une dimension est
incorrecte ou si le benchmark ne correspond pas a la version du dataset.
"""

from __future__ import annotations

import argparse
import json
import sys

import _bootstrap  # noqa: F401
from _common import load_config, resolve_path
from rivaldevent_ml.dataset import (
    DatasetError,
    compute_dataset_version,
    load_events,
    load_judgements,
    load_profiles,
)
from rivaldevent_ml.embeddings import load_bundle
from rivaldevent_ml.export import ExportError, export_runtime_assets


def validate_outputs(directory, dimension: int) -> dict[str, float]:
    sizes: dict[str, float] = {}
    for name in ("events", "embeddings", "profiles", "benchmark"):
        path = directory / f"{name}.v1.json"
        if not path.exists():
            raise ExportError(f"artefact manquant apres export: {path}")
        payload = json.loads(path.read_text(encoding="utf-8"))
        if payload.get("schemaVersion") != 1:
            raise ExportError(f"schemaVersion inattendu dans {path.name}")
        if name == "embeddings":
            if int(payload.get("dimension", 0)) != dimension:
                raise ExportError(f"dimension incoherente dans {path.name}")
            for event_id, vector in payload["vectors"].items():
                if len(vector) != dimension:
                    raise ExportError(
                        f"vecteur {event_id} de longueur {len(vector)} au lieu de {dimension}"
                    )
        sizes[name] = path.stat().st_size / 1024
    return sizes


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=None)
    args = parser.parse_args()

    config = load_config(args.config)
    dataset_config = config["dataset"]
    outputs = config["outputs"]

    events = load_events(resolve_path(dataset_config["events"]))
    profiles = load_profiles(resolve_path(dataset_config["profiles"]), events)
    judgements = load_judgements(resolve_path(dataset_config["relevance"]), profiles, events)
    dataset_version = compute_dataset_version(events, profiles, judgements)

    bundle = load_bundle(
        resolve_path(outputs["embeddings"]), resolve_path(outputs["embeddings_meta"])
    )
    benchmark_path = resolve_path(outputs["benchmark_json"])
    if not benchmark_path.exists():
        raise ExportError(
            f"benchmark introuvable: {benchmark_path}. Executer scripts/run_benchmark.py"
        )
    benchmark = json.loads(benchmark_path.read_text(encoding="utf-8"))

    runtime_dir = resolve_path(outputs["runtime_dir"])
    paths = export_runtime_assets(
        events=events,
        profiles=profiles,
        bundle=bundle,
        benchmark=benchmark,
        dataset_version=dataset_version,
        output_dir=runtime_dir,
    )
    sizes = validate_outputs(runtime_dir, bundle.dimension)

    print(f"Dataset  : {dataset_version}")
    print(f"Modele   : {bundle.model_id} @ {bundle.model_revision}")
    print(f"Dimension: {bundle.dimension}")
    for name, path in paths.items():
        print(f"  {name:<10} {path} ({sizes[name]:.0f} Ko)")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (DatasetError, ExportError) as error:
        print(error, file=sys.stderr)
        raise SystemExit(1) from error
