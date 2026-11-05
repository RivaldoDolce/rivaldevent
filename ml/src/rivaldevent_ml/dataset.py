"""Chargement, validation et normalisation du catalogue d'evenements.

Ce module est la porte d'entree du pipeline ML. Il refuse les donnees
incoherentes plutot que de les corriger silencieusement : un identifiant
duplique, un prix negatif ou une date invalide doivent produire une erreur
exploitable.

Conventions :
- les textes francais et anglais sont conserves tels quels (accents inclus) ;
- les prix inconnus restent ``None`` et ne deviennent jamais ``0`` ;
- les dates sont obligatoirement horodatees avec un fuseau ;
- la version du dataset est derivee du contenu, pas de la date d'execution.
"""

from __future__ import annotations

import hashlib
import json
import re
import unicodedata
from collections.abc import Iterable, Sequence
from dataclasses import dataclass, replace
from datetime import datetime
from pathlib import Path

import pandas as pd

# ============================================================
# Vocabulaires controles
# ============================================================

CATEGORIES: frozenset[str] = frozenset(
    {
        "music",
        "festival",
        "culture",
        "arts",
        "technology",
        "entrepreneurship",
        "sport",
        "education",
        "entertainment",
        "conference",
        "theatre",
        "gala",
    }
)

SOURCE_TYPES: frozenset[str] = frozenset({"official", "public_listing", "demo_fixture"})

LANGUAGES: frozenset[str] = frozenset({"fr", "en"})

REQUIRED_EVENT_COLUMNS: tuple[str, ...] = (
    "event_id",
    "title",
    "description",
    "category",
    "city",
    "venue",
    "price_min",
    "price_max",
    "currency",
    "start_at",
    "end_at",
    "language",
    "tags",
    "source_type",
    "source_url",
    "collected_at",
    "verified_at",
    "is_demo",
)

REQUIRED_PROFILE_COLUMNS: tuple[str, ...] = (
    "profile_id",
    "display_name",
    "description",
    "city",
    "budget_min",
    "budget_max",
    "preferred_categories",
    "seed_event_ids",
    "language",
    "split",
    "is_demo",
)

REQUIRED_RELEVANCE_COLUMNS: tuple[str, ...] = (
    "profile_id",
    "event_id",
    "relevance",
    "annotator",
    "notes",
)

TEXT_TEMPLATE_VERSION = 1

#: Villes canoniques (sans accent) et variantes acceptees.
CITY_ALIASES: dict[str, str] = {
    "douala": "Douala",
    "yaounde": "Yaounde",
    "yaoundé": "Yaounde",
    "buea": "Buea",
    "limbe": "Limbe",
    "bafoussam": "Bafoussam",
    "kribi": "Kribi",
    "garoua": "Garoua",
    "bamenda": "Bamenda",
    "ngaoundere": "Ngaoundere",
    "ngaoundéré": "Ngaoundere",
}

#: Regions utilisees par le signal geographique du ranking.
CITY_REGIONS: dict[str, str] = {
    "Douala": "littoral",
    "Yaounde": "centre",
    "Buea": "south_west",
    "Limbe": "south_west",
    "Bafoussam": "west",
    "Kribi": "south",
    "Garoua": "north",
    "Bamenda": "north_west",
    "Ngaoundere": "adamaoua",
}

CATEGORY_ALIASES: dict[str, str] = {
    "musique": "music",
    "musical": "music",
    "concert": "music",
    "concerts": "music",
    "festivals": "festival",
    "art": "arts",
    "culturel": "culture",
    "technologie": "technology",
    "tech": "technology",
    "entrepreneuriat": "entrepreneurship",
    "conferences": "conference",
    "conférence": "conference",
    "sports": "sport",
    "education": "education",
    "éducation": "education",
    "divertissement": "entertainment",
    "theater": "theatre",
    "theatre": "theatre",
    "théâtre": "theatre",
    "galas": "gala",
}


class DatasetError(ValueError):
    """Erreur agregee de validation du dataset."""

    def __init__(self, messages: Iterable[str]) -> None:
        self.messages: tuple[str, ...] = tuple(messages)
        joined = "\n".join(f"- {message}" for message in self.messages)
        super().__init__(f"Validation du dataset echouee ({len(self.messages)} erreur(s)) :\n{joined}")


# ============================================================
# Structures
# ============================================================


@dataclass(frozen=True)
class Event:
    """Evenement normalise et pret pour l'encodage."""

    event_id: str
    title: str
    description: str
    category: str
    city: str
    venue: str | None
    price_min: int | None
    price_max: int | None
    currency: str
    start_at: datetime
    end_at: datetime | None
    language: str
    tags: tuple[str, ...]
    source_type: str
    source_url: str | None
    collected_at: str | None
    verified_at: str | None
    is_demo: bool
    text: str

    def is_expired(self, reference: datetime) -> bool:
        """Un evenement est expire quand sa fin (ou son debut) est passee."""
        moment = self.end_at or self.start_at
        return moment < reference

    def to_runtime_dict(self) -> dict[str, object]:
        return {
            "eventId": self.event_id,
            "title": self.title,
            "description": self.description,
            "category": self.category,
            "city": self.city,
            "venue": self.venue,
            "priceMin": self.price_min,
            "priceMax": self.price_max,
            "currency": self.currency,
            "startAt": self.start_at.isoformat(),
            "endAt": self.end_at.isoformat() if self.end_at else None,
            "language": self.language,
            "tags": list(self.tags),
            "sourceType": self.source_type,
            "sourceUrl": self.source_url,
            "verifiedAt": self.verified_at,
            "isDemo": self.is_demo,
        }


@dataclass(frozen=True)
class Profile:
    """Persona de test, fictif par construction."""

    profile_id: str
    display_name: str
    description: str
    city: str
    budget_min: int
    budget_max: int
    preferred_categories: tuple[str, ...]
    seed_event_ids: tuple[str, ...]
    language: str
    split: str
    is_demo: bool

    def to_runtime_dict(self) -> dict[str, object]:
        return {
            "profileId": self.profile_id,
            "displayName": self.display_name,
            "description": self.description,
            "city": self.city,
            "budgetMin": self.budget_min,
            "budgetMax": self.budget_max,
            "preferredCategories": list(self.preferred_categories),
            "seedEventIds": list(self.seed_event_ids),
            "language": self.language,
            "isDemo": self.is_demo,
        }


@dataclass(frozen=True)
class Judgement:
    """Jugement de pertinence gradue (0 a 3)."""

    profile_id: str
    event_id: str
    relevance: int
    annotator: str
    notes: str


# ============================================================
# Helpers
# ============================================================


def _clean(value: object) -> str:
    if value is None:
        return ""
    text = str(value)
    if text.lower() == "nan":
        return ""
    return re.sub(r"\s+", " ", text).strip()


def canonical_city(value: object) -> str:
    raw = _clean(value)
    if not raw:
        return ""
    key = unicodedata.normalize("NFC", raw.lower())
    return CITY_ALIASES.get(key, raw[0].upper() + raw[1:])


def canonical_category(value: object) -> str:
    raw = _clean(value).lower()
    return CATEGORY_ALIASES.get(raw, raw)


def _parse_int(value: object) -> int | None:
    raw = _clean(value)
    if raw == "":
        return None
    try:
        number = int(float(raw))
    except ValueError as exc:  # pragma: no cover - message teste indirectement
        raise ValueError(f"valeur numerique invalide: {raw!r}") from exc
    return number


def _parse_datetime(value: object) -> datetime | None:
    raw = _clean(value)
    if raw == "":
        return None
    # Les exports ISO 8601 sont tries par ordre de longueur pour eviter les
    # faux positifs de fromisoformat sur Python 3.11.
    try:
        return datetime.fromisoformat(raw.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"date ISO 8601 invalide: {raw!r}") from exc


def _parse_bool(value: object) -> bool:
    raw = _clean(value).lower()
    if raw in {"true", "1", "yes", "oui"}:
        return True
    if raw in {"false", "0", "no", "non", ""}:
        return False
    raise ValueError(f"booleen invalide: {value!r}")


def _strip_terminal_dot(text: str) -> str:
    return text[:-1] if text.endswith(".") else text


def build_event_text(
    *,
    title: str,
    category: str,
    description: str,
    city: str,
    venue: str | None,
    tags: Sequence[str],
) -> str:
    """Construit le texte d'encodage E5 (template v1, prefixe ``passage:``).

    Les champs absents sont omis : on n'insere jamais de valeur inventee.
    Aucun champ n'est duplique pour gonfler artificiellement l'embedding.
    """
    parts = [f"passage: {_strip_terminal_dot(_clean(title))}."]
    if category:
        parts.append(f"Categorie: {category}.")
    if description:
        parts.append(f"Description: {_strip_terminal_dot(_clean(description))}.")
    if city:
        parts.append(f"Lieu: {city}.")
    if venue:
        parts.append(f"Salle: {_clean(venue)}.")
    if tags:
        parts.append(f"Mots-cles: {', '.join(tags)}.")
    return " ".join(parts)


def build_profile_text(profile: Profile, events_by_id: dict[str, Event]) -> str:
    """Texte de requete pour la baseline lexicale TF-IDF.

    Le profil est decrit par ses champs declares et par le contenu de ses
    evenements de reference. Ce texte n'alimente jamais E5 (le vecteur de
    profil est agrege a partir des embeddings pre-calcules).
    """
    chunks = [
        profile.display_name,
        profile.description,
        f"Ville: {profile.city}",
        f"Categories: {', '.join(profile.preferred_categories)}",
    ]
    for event_id in profile.seed_event_ids:
        event = events_by_id.get(event_id)
        if event is None:
            continue
        chunks.append(f"{event.title}. {event.description}")
    return " ".join(chunk for chunk in chunks if chunk).strip()


# ============================================================
# Chargement des evenements
# ============================================================


def load_events(path: str | Path) -> list[Event]:
    """Charge et valide ``events.csv``.

    Toutes les erreurs sont collectees avant le leve de ``DatasetError`` afin
    de faciliter la correction d'un lot de donnees.
    """
    path = Path(path)
    if not path.exists():
        raise DatasetError([f"fichier introuvable: {path}"])

    frame = pd.read_csv(path, dtype=str, keep_default_na=False)
    errors: list[str] = []

    missing = [column for column in REQUIRED_EVENT_COLUMNS if column not in frame.columns]
    if missing:
        raise DatasetError([f"colonnes manquantes dans {path.name}: {', '.join(missing)}"])

    seen: set[str] = set()
    events: list[Event] = []

    for line_number, row in enumerate(frame.to_dict(orient="records"), start=2):
        prefix = f"ligne {line_number}"
        event_id = _clean(row.get("event_id"))
        if not event_id:
            errors.append(f"{prefix}: event_id manquant")
            continue
        if event_id in seen:
            errors.append(f"{prefix}: event_id duplique {event_id!r}")
            continue

        title = _clean(row.get("title"))
        description = _clean(row.get("description"))
        if not title:
            errors.append(f"{event_id}: titre vide")
        if not description:
            errors.append(f"{event_id}: description vide")

        category = canonical_category(row.get("category"))
        if category not in CATEGORIES:
            errors.append(f"{event_id}: categorie inconnue {category!r}")

        city = canonical_city(row.get("city"))
        if not city:
            errors.append(f"{event_id}: ville manquante")

        currency = _clean(row.get("currency")).upper()
        if currency != "XAF":
            errors.append(f"{event_id}: devise attendue XAF, recue {currency!r}")

        try:
            price_min = _parse_int(row.get("price_min"))
            price_max = _parse_int(row.get("price_max"))
        except ValueError as exc:
            errors.append(f"{event_id}: {exc}")
            price_min = price_max = None
        else:
            for label, price in (("price_min", price_min), ("price_max", price_max)):
                if price is not None and price < 0:
                    errors.append(f"{event_id}: {label} negatif ({price})")
            if price_min is not None and price_max is not None and price_min > price_max:
                errors.append(f"{event_id}: price_min ({price_min}) > price_max ({price_max})")

        try:
            start_at = _parse_datetime(row.get("start_at"))
            end_at = _parse_datetime(row.get("end_at"))
        except ValueError as exc:
            errors.append(f"{event_id}: {exc}")
            continue

        if start_at is None:
            errors.append(f"{event_id}: start_at obligatoire")
            continue
        if start_at.tzinfo is None:
            errors.append(f"{event_id}: start_at doit porter un fuseau horaire")
        if end_at is not None:
            if end_at.tzinfo is None:
                errors.append(f"{event_id}: end_at doit porter un fuseau horaire")
            elif start_at.tzinfo is not None and end_at < start_at:
                errors.append(f"{event_id}: end_at anterieur a start_at")

        language = _clean(row.get("language")).lower()
        if language not in LANGUAGES:
            errors.append(f"{event_id}: langue non supportee {language!r}")

        source_type = _clean(row.get("source_type"))
        if source_type not in SOURCE_TYPES:
            errors.append(f"{event_id}: source_type inconnu {source_type!r}")

        try:
            is_demo = _parse_bool(row.get("is_demo"))
        except ValueError as exc:
            errors.append(f"{event_id}: {exc}")
            is_demo = False

        tags = tuple(tag.strip() for tag in _clean(row.get("tags")).split("|") if tag.strip())
        venue = _clean(row.get("venue")) or None
        source_url = _clean(row.get("source_url")) or None
        collected_at = _clean(row.get("collected_at")) or None
        verified_at = _clean(row.get("verified_at")) or None

        text = build_event_text(
            title=title,
            category=category,
            description=description,
            city=city,
            venue=venue,
            tags=tags,
        )

        seen.add(event_id)
        events.append(
            Event(
                event_id=event_id,
                title=title,
                description=description,
                category=category,
                city=city,
                venue=venue,
                price_min=price_min,
                price_max=price_max,
                currency=currency,
                start_at=start_at,
                end_at=end_at,
                language=language,
                tags=tags,
                source_type=source_type,
                source_url=source_url,
                collected_at=collected_at,
                verified_at=verified_at,
                is_demo=is_demo,
                text=text,
            )
        )

    if errors:
        raise DatasetError(errors)
    return events


# ============================================================
# Profils et annotations
# ============================================================


def load_profiles(path: str | Path, events: Sequence[Event] | None = None) -> list[Profile]:
    path = Path(path)
    if not path.exists():
        raise DatasetError([f"fichier introuvable: {path}"])

    frame = pd.read_csv(path, dtype=str, keep_default_na=False)
    errors: list[str] = []
    missing = [column for column in REQUIRED_PROFILE_COLUMNS if column not in frame.columns]
    if missing:
        raise DatasetError([f"colonnes manquantes dans {path.name}: {', '.join(missing)}"])

    event_ids = {event.event_id for event in events} if events is not None else None
    seen: set[str] = set()
    profiles: list[Profile] = []

    for line_number, row in enumerate(frame.to_dict(orient="records"), start=2):
        prefix = f"ligne {line_number}"
        profile_id = _clean(row.get("profile_id"))
        if not profile_id:
            errors.append(f"{prefix}: profile_id manquant")
            continue
        if profile_id in seen:
            errors.append(f"{prefix}: profile_id duplique {profile_id!r}")
            continue

        try:
            budget_min = _parse_int(row.get("budget_min"))
            budget_max = _parse_int(row.get("budget_max"))
        except ValueError as exc:
            errors.append(f"{profile_id}: {exc}")
            continue
        if budget_min is None or budget_max is None:
            errors.append(f"{profile_id}: budget incomplet")
            continue
        if budget_min < 0 or budget_max < budget_min:
            errors.append(f"{profile_id}: bornes de budget invalides")

        city = canonical_city(row.get("city"))
        if not city:
            errors.append(f"{profile_id}: ville manquante")

        categories = tuple(
            canonical_category(item)
            for item in _clean(row.get("preferred_categories")).split("|")
            if item.strip()
        )
        unknown_categories = sorted(set(categories) - CATEGORIES)
        if unknown_categories:
            errors.append(f"{profile_id}: categories inconnues {unknown_categories}")
        if not categories:
            errors.append(f"{profile_id}: aucune categorie preferee")

        seeds = tuple(
            item.strip()
            for item in _clean(row.get("seed_event_ids")).split("|")
            if item.strip()
        )
        if not seeds:
            errors.append(f"{profile_id}: aucun evenement de reference")
        if event_ids is not None:
            unknown_seeds = sorted(set(seeds) - event_ids)
            if unknown_seeds:
                errors.append(f"{profile_id}: seeds inconnus {unknown_seeds}")

        split = _clean(row.get("split")).lower()
        if split not in {"dev", "test"}:
            errors.append(f"{profile_id}: split attendu dev|test, recu {split!r}")

        try:
            is_demo = _parse_bool(row.get("is_demo"))
        except ValueError as exc:
            errors.append(f"{profile_id}: {exc}")
            is_demo = False

        seen.add(profile_id)
        profiles.append(
            Profile(
                profile_id=profile_id,
                display_name=_clean(row.get("display_name")),
                description=_clean(row.get("description")),
                city=city,
                budget_min=budget_min,
                budget_max=budget_max,
                preferred_categories=categories,
                seed_event_ids=seeds,
                language=_clean(row.get("language")).lower(),
                split=split,
                is_demo=is_demo,
            )
        )

    if errors:
        raise DatasetError(errors)
    return profiles


def load_judgements(
    path: str | Path,
    profiles: Sequence[Profile],
    events: Sequence[Event],
) -> list[Judgement]:
    path = Path(path)
    if not path.exists():
        raise DatasetError([f"fichier introuvable: {path}"])

    frame = pd.read_csv(path, dtype=str, keep_default_na=False)
    errors: list[str] = []
    missing = [column for column in REQUIRED_RELEVANCE_COLUMNS if column not in frame.columns]
    if missing:
        raise DatasetError([f"colonnes manquantes dans {path.name}: {', '.join(missing)}"])

    profile_ids = {profile.profile_id for profile in profiles}
    event_ids = {event.event_id for event in events}
    seen: set[tuple[str, str, str]] = set()
    judgements: list[Judgement] = []

    for line_number, row in enumerate(frame.to_dict(orient="records"), start=2):
        prefix = f"ligne {line_number}"
        profile_id = _clean(row.get("profile_id"))
        event_id = _clean(row.get("event_id"))
        annotator = _clean(row.get("annotator"))

        if profile_id not in profile_ids:
            errors.append(f"{prefix}: profil inconnu {profile_id!r}")
            continue
        if event_id not in event_ids:
            errors.append(f"{prefix}: evenement inconnu {event_id!r}")
            continue
        if not annotator:
            errors.append(f"{prefix}: annotator manquant")
            continue

        try:
            relevance = _parse_int(row.get("relevance"))
        except ValueError as exc:
            errors.append(f"{prefix}: {exc}")
            continue
        if relevance is None or relevance not in {0, 1, 2, 3}:
            errors.append(f"{prefix}: relevance doit etre dans 0..3 (recu {relevance!r})")
            continue

        key = (profile_id, event_id, annotator)
        if key in seen:
            errors.append(f"{prefix}: jugement duplique {key}")
            continue

        seen.add(key)
        judgements.append(
            Judgement(
                profile_id=profile_id,
                event_id=event_id,
                relevance=relevance,
                annotator=annotator,
                notes=_clean(row.get("notes")),
            )
        )

    if errors:
        raise DatasetError(errors)
    return judgements


def judgements_to_frame(judgements: Sequence[Judgement]) -> pd.DataFrame:
    return pd.DataFrame(
        [
            {
                "profile_id": item.profile_id,
                "event_id": item.event_id,
                "relevance": item.relevance,
                "annotator": item.annotator,
                "notes": item.notes,
            }
            for item in judgements
        ]
    )


# ============================================================
# Versionnement
# ============================================================


def compute_dataset_version(
    events: Sequence[Event],
    profiles: Sequence[Profile],
    judgements: Sequence[Judgement],
) -> str:
    """Version deterministe derivee du contenu (pas de la date d'execution)."""
    payload = {
        "events": [
            {
                "event_id": event.event_id,
                "title": event.title,
                "description": event.description,
                "category": event.category,
                "city": event.city,
                "price_min": event.price_min,
                "price_max": event.price_max,
                "start_at": event.start_at.isoformat(),
                "end_at": event.end_at.isoformat() if event.end_at else None,
                "language": event.language,
                "tags": list(event.tags),
                "is_demo": event.is_demo,
            }
            for event in sorted(events, key=lambda item: item.event_id)
        ],
        "profiles": [
            {
                "profile_id": profile.profile_id,
                "city": profile.city,
                "budget": [profile.budget_min, profile.budget_max],
                "categories": list(profile.preferred_categories),
                "seeds": list(profile.seed_event_ids),
                "split": profile.split,
            }
            for profile in sorted(profiles, key=lambda item: item.profile_id)
        ],
        "judgements": [
            [item.profile_id, item.event_id, item.relevance, item.annotator]
            for item in sorted(
                judgements, key=lambda item: (item.profile_id, item.event_id, item.annotator)
            )
        ],
        "text_template_version": TEXT_TEMPLATE_VERSION,
    }
    digest = hashlib.sha256(json.dumps(payload, sort_keys=True).encode("utf-8")).hexdigest()[:10]
    dates = [event.collected_at for event in events if event.collected_at]
    stamp = max(dates).replace("-", "") if dates else "unknown"
    return f"dataset-{stamp}-{digest}"


def write_processed_dataset(
    events: Sequence[Event],
    profiles: Sequence[Profile],
    judgements: Sequence[Judgement],
    output_dir: str | Path,
    *,
    reference_date: datetime | None = None,
) -> dict[str, Path]:
    """Ecrit les donnees normalisees dans ``data/processed``."""
    output = Path(output_dir)
    output.mkdir(parents=True, exist_ok=True)

    events_path = output / "events.processed.csv"
    profiles_path = output / "profiles.processed.csv"
    judgements_path = output / "relevance.processed.csv"
    summary_path = output / "dataset.summary.json"

    pd.DataFrame(
        [
            {
                "event_id": event.event_id,
                "title": event.title,
                "category": event.category,
                "city": event.city,
                "price_min": event.price_min,
                "price_max": event.price_max,
                "start_at": event.start_at.isoformat(),
                "end_at": event.end_at.isoformat() if event.end_at else "",
                "language": event.language,
                "tags": "|".join(event.tags),
                "text": event.text,
            }
            for event in events
        ]
    ).to_csv(events_path, index=False)

    pd.DataFrame(
        [
            {
                "profile_id": profile.profile_id,
                "city": profile.city,
                "budget_min": profile.budget_min,
                "budget_max": profile.budget_max,
                "preferred_categories": "|".join(profile.preferred_categories),
                "seed_event_ids": "|".join(profile.seed_event_ids),
                "split": profile.split,
            }
            for profile in profiles
        ]
    ).to_csv(profiles_path, index=False)

    judgements_to_frame(judgements).to_csv(judgements_path, index=False)

    version = compute_dataset_version(events, profiles, judgements)
    summary = {
        "datasetVersion": version,
        "textTemplateVersion": TEXT_TEMPLATE_VERSION,
        "events": len(events),
        "profiles": len(profiles),
        "judgements": len(judgements),
        "eventsByCategory": _count_by(events, "category"),
        "eventsByCity": _count_by(events, "city"),
        "eventsByLanguage": _count_by(events, "language"),
        "demoFixtures": sum(1 for event in events if event.is_demo),
        "expiredAtReference": (
            sum(1 for event in events if reference_date and event.is_expired(reference_date))
            if reference_date
            else None
        ),
        "profilesBySplit": {
            split: sum(1 for profile in profiles if profile.split == split)
            for split in ("dev", "test")
        },
    }
    summary_path.write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
    return {
        "events": events_path,
        "profiles": profiles_path,
        "relevance": judgements_path,
        "summary": summary_path,
    }


def _count_by(items: Sequence[Event], attribute: str) -> dict[str, int]:
    counts: dict[str, int] = {}
    for item in items:
        value = getattr(item, attribute)
        counts[str(value)] = counts.get(str(value), 0) + 1
    return dict(sorted(counts.items()))


def refresh_event_text(event: Event) -> Event:
    """Utile aux tests : recalcule le texte apres modification d'un champ."""
    return replace(
        event,
        text=build_event_text(
            title=event.title,
            category=event.category,
            description=event.description,
            city=event.city,
            venue=event.venue,
            tags=event.tags,
        ),
    )
