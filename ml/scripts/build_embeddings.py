#!/usr/bin/env python3
"""Calcule les embeddings E5 des evenements.

Usage :
    python scripts/build_embeddings.py [--config ...] [--force]

Le cache ``data/processed/embeddings.npz`` est reutilise si le modele, le
template de texte et la liste des evenements n'ont pas change. ``--force``
recalcule tout.
"""

from __future__ import annotations

import argparse
import json
import platform
import time
from pathlib import Path

import numpy as np

import _bootstrap  # noqa: F401
from _common import configure_hf_cache, load_config, resolve_path
from rivaldevent_ml.dataset import (
    DatasetError,
    compute_dataset_version,
    load_events,
    load_judgements,
    load_profiles,
)
from rivaldevent_ml.embeddings import (
    encode_events,
    load_bundle,
    load_encoder,
    resolve_model_revision,
    save_bundle,
)


def cache_is_valid(
    meta_path: Path,
    *,
    event_ids: list[str],
    model_id: str,
    template_version: int,
) -> bool:
    if not meta_path.exists():
        return False
    try:
        metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError):
        return False
    return (
        metadata.get("model") == model_id
        and int(metadata.get("textTemplateVersion", -1)) == template_version
        and list(metadata.get("eventIds", [])) == event_ids
    )


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=None)
    parser.add_argument("--force", action="store_true", help="recalcule meme si le cache est valide")
    args = parser.parse_args()

    configure_hf_cache()
    config = load_config(args.config)
    dataset_config = config["dataset"]
    model_config = config["model"]
    outputs = config["outputs"]

    events = load_events(resolve_path(dataset_config["events"]))
    profiles = load_profiles(resolve_path(dataset_config["profiles"]), events)
    judgements = load_judgements(resolve_path(dataset_config["relevance"]), profiles, events)
    dataset_version = compute_dataset_version(events, profiles, judgements)

    npz_path = resolve_path(outputs["embeddings"])
    meta_path = resolve_path(outputs["embeddings_meta"])
    event_ids = [event.event_id for event in events]
    model_id = str(model_config["id"])

    if not args.force and cache_is_valid(
        meta_path,
        event_ids=event_ids,
        model_id=model_id,
        template_version=1,
    ):
        bundle = load_bundle(npz_path, meta_path)
        print(f"Cache valide : {npz_path} ({bundle.matrix.shape[0]} vecteurs, dim {bundle.dimension})")
        print("Utiliser --force pour recalculer.")
        return 0

    revision = resolve_model_revision(model_id, str(model_config.get("revision", "main")))
    print(f"Modele   : {model_id} @ {revision}")
    print(f"Appareil : {model_config.get('device', 'cpu')}")
    print(f"Textes   : {len(events)} evenements, template v1")

    started = time.perf_counter()
    encoder = load_encoder(model_id, revision=revision, device=str(model_config.get("device", "cpu")))
    bundle = encode_events(
        events,
        encoder,
        model_id=model_id,
        model_revision=revision,
        batch_size=int(model_config.get("batch_size", 16)),
        normalize=bool(model_config.get("normalize", True)),
        show_progress_bar=True,
    )
    elapsed = time.perf_counter() - started

    import sentence_transformers
    import torch
    import transformers

    save_bundle(
        bundle,
        npz_path,
        meta_path,
        library_versions={
            "python": platform.python_version(),
            "numpy": np.__version__,
            "torch": torch.__version__,
            "transformers": transformers.__version__,
            "sentence-transformers": sentence_transformers.__version__,
        },
        extra_metadata={"datasetVersion": dataset_version},
    )

    size_kb = npz_path.stat().st_size / 1024
    print(f"Termine en {elapsed:.1f}s — dimension {bundle.dimension}, {npz_path} ({size_kb:.0f} Ko)")
    print(f"Metadonnees : {meta_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except DatasetError as error:  # pragma: no cover - CLI
        print(error)
        raise SystemExit(1) from error
