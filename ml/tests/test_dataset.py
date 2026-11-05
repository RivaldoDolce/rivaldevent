"""Tests de validation et de normalisation du dataset."""

from __future__ import annotations

import pandas as pd
import pytest

from rivaldevent_ml.dataset import (
    DatasetError,
    build_event_text,
    compute_dataset_version,
    load_events,
    load_judgements,
    load_profiles,
)


def event_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "event_id": "evt_001",
        "title": "Concert Echo du Wouri",
        "description": "Concert de musique camerounaise avec des artistes locaux.",
        "category": "music",
        "city": "Douala",
        "venue": "Canal Olympia",
        "price_min": "5000",
        "price_max": "15000",
        "currency": "XAF",
        "start_at": "2027-01-10T19:00:00+01:00",
        "end_at": "2027-01-10T22:00:00+01:00",
        "language": "fr",
        "tags": "concert|musique",
        "source_type": "demo_fixture",
        "source_url": "",
        "collected_at": "2026-11-05",
        "verified_at": "",
        "is_demo": "true",
    }
    row.update(overrides)
    return row


def profile_row(**overrides: object) -> dict[str, object]:
    row: dict[str, object] = {
        "profile_id": "music_fan",
        "display_name": "Amateur de musique",
        "description": "Persona de test interesse par les concerts.",
        "city": "Douala",
        "budget_min": "5000",
        "budget_max": "25000",
        "preferred_categories": "music|festival",
        "seed_event_ids": "evt_001",
        "language": "fr",
        "split": "dev",
        "is_demo": "true",
    }
    row.update(overrides)
    return row


def write_csv(tmp_path, name: str, rows: list[dict[str, object]]):
    path = tmp_path / name
    pd.DataFrame(rows).to_csv(path, index=False)
    return path


def test_load_events_normalizes_and_builds_text(tmp_path):
    path = write_csv(tmp_path, "events.csv", [event_row()])
    events = load_events(path)

    assert len(events) == 1
    event = events[0]
    assert event.city == "Douala"
    assert event.price_min == 5000
    assert event.text.startswith("passage: Concert Echo du Wouri.")
    assert "Categorie: music." in event.text
    assert "Lieu: Douala." in event.text
    assert "Salle: Canal Olympia." in event.text


def test_unknown_price_stays_none(tmp_path):
    path = write_csv(
        tmp_path,
        "events.csv",
        [event_row(price_min="", price_max="")],
    )
    event = load_events(path)[0]
    assert event.price_min is None
    assert event.price_max is None


def test_duplicate_event_id_is_rejected(tmp_path):
    path = write_csv(tmp_path, "events.csv", [event_row(), event_row()])
    with pytest.raises(DatasetError, match="duplique"):
        load_events(path)


def test_incoherent_price_bounds_are_rejected(tmp_path):
    path = write_csv(
        tmp_path, "events.csv", [event_row(price_min="20000", price_max="10000")]
    )
    with pytest.raises(DatasetError, match="price_min"):
        load_events(path)


def test_invalid_category_and_currency_are_rejected(tmp_path):
    path = write_csv(
        tmp_path,
        "events.csv",
        [event_row(event_id="evt_002", category="cuisine", currency="EUR")],
    )
    with pytest.raises(DatasetError) as error:
        load_events(path)
    message = str(error.value)
    assert "categorie inconnue" in message
    assert "devise attendue XAF" in message


def test_timezone_is_required(tmp_path):
    path = write_csv(tmp_path, "events.csv", [event_row(start_at="2027-01-10T19:00:00")])
    with pytest.raises(DatasetError, match="fuseau"):
        load_events(path)


def test_empty_description_is_rejected(tmp_path):
    path = write_csv(tmp_path, "events.csv", [event_row(description="")])
    with pytest.raises(DatasetError, match="description vide"):
        load_events(path)


def test_profile_requires_known_seed_events(tmp_path):
    events = load_events(write_csv(tmp_path, "events.csv", [event_row()]))
    profiles_path = write_csv(
        tmp_path,
        "profiles.csv",
        [profile_row(seed_event_ids="evt_999")],
    )
    with pytest.raises(DatasetError, match="seeds inconnus"):
        load_profiles(profiles_path, events)


def test_judgements_validate_range_and_uniqueness(tmp_path):
    events = load_events(write_csv(tmp_path, "events.csv", [event_row()]))
    profiles = load_profiles(write_csv(tmp_path, "profiles.csv", [profile_row()]), events)

    bad_range = write_csv(
        tmp_path,
        "relevance.csv",
        [
            {
                "profile_id": "music_fan",
                "event_id": "evt_001",
                "relevance": "4",
                "annotator": "test",
                "notes": "",
            }
        ],
    )
    with pytest.raises(DatasetError, match="0..3"):
        load_judgements(bad_range, profiles, events)

    duplicate = write_csv(
        tmp_path,
        "relevance2.csv",
        [
            {
                "profile_id": "music_fan",
                "event_id": "evt_001",
                "relevance": "2",
                "annotator": "test",
                "notes": "",
            }
        ]
        * 2,
    )
    with pytest.raises(DatasetError, match="duplique"):
        load_judgements(duplicate, profiles, events)


def test_dataset_version_is_deterministic(tmp_path):
    events = load_events(write_csv(tmp_path, "events.csv", [event_row()]))
    profiles = load_profiles(write_csv(tmp_path, "profiles.csv", [profile_row()]), events)
    judgements = load_judgements(
        write_csv(
            tmp_path,
            "relevance.csv",
            [
                {
                    "profile_id": "music_fan",
                    "event_id": "evt_001",
                    "relevance": "3",
                    "annotator": "test",
                    "notes": "",
                }
            ],
        ),
        profiles,
        events,
    )
    first = compute_dataset_version(events, profiles, judgements)
    second = compute_dataset_version(events, profiles, judgements)
    assert first == second
    assert first.startswith("dataset-20261105-")


def test_build_event_text_keeps_accents_and_skips_missing_fields():
    text = build_event_text(
        title="Nuit des Merveilles",
        category="culture",
        description="Une soirée à Yaoundé, mémoire et récits.",
        city="Yaounde",
        venue=None,
        tags=["culture", "récit"],
    )
    assert "mémoire" in text
    assert "récit" in text
    assert "Yaounde" in text
    assert "Salle:" not in text
    assert text.count("passage:") == 1
