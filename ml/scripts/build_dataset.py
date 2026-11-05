#!/usr/bin/env python3
"""Prepare et valide le catalogue experimental.

Usage :
    python scripts/build_dataset.py [--config configs/recommender.yaml]

Sorties :
    data/processed/events.processed.csv
    data/processed/profiles.processed.csv
    data/processed/relevance.processed.csv
    data/processed/dataset.summary.json
"""

from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime

import _bootstrap  # noqa: F401  (effet de bord : chemin d'import)
from _common import configure_hf_cache, load_config, resolve_path
from rivaldevent_ml.dataset import (
    DatasetError,
    compute_dataset_version,
    load_events,
    load_judgements,
    load_profiles,
    write_processed_dataset,
)


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=None, help="fichier YAML de configuration")
    parser.add_argument("--output", default=None, help="repertoire de sortie (processed)")
    args = parser.parse_args()

    configure_hf_cache()
    config = load_config(args.config)
    dataset_config = config["dataset"]
    evaluation = config.get("evaluation", {})

    events_path = resolve_path(dataset_config["events"])
    profiles_path = resolve_path(dataset_config["profiles"])
    relevance_path = resolve_path(dataset_config["relevance"])
    output_dir = resolve_path(args.output or dataset_config["processed_dir"])

    reference = datetime.fromisoformat(str(evaluation["reference_date"]))

    try:
        events = load_events(events_path)
        profiles = load_profiles(profiles_path, events)
        judgements = load_judgements(relevance_path, profiles, events)
    except DatasetError as error:
        print(error, file=sys.stderr)
        return 1

    version = compute_dataset_version(events, profiles, judgements)
    paths = write_processed_dataset(
        events, profiles, judgements, output_dir, reference_date=reference
    )

    summary = json.loads(paths["summary"].read_text(encoding="utf-8"))
    expired = sum(1 for event in events if event.is_expired(reference))
    active = len(events) - expired
    demo = sum(1 for event in events if event.is_demo)
    judged_pairs = len({(item.profile_id, item.event_id) for item in judgements})

    print("Dataset valide")
    print(f"  version          : {version}")
    print(f"  evenements       : {len(events)} (dont {demo} fixtures de demonstration)")
    print(f"  actifs / expires : {active} / {expired} a la date de reference {reference.isoformat()}")
    print(f"  profils          : {len(profiles)}")
    print(f"  jugements        : {len(judgements)} ({judged_pairs} paires profil-evenement)")
    print(f"  categories       : {summary['eventsByCategory']}")
    print(f"  villes           : {summary['eventsByCity']}")
    print(f"  langues          : {summary['eventsByLanguage']}")
    print(f"  sorties          : {output_dir}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
