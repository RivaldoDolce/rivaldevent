"""Helpers partages par les scripts du pipeline."""

from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml

ML_ROOT = Path(__file__).resolve().parents[1]
DEFAULT_CONFIG = ML_ROOT / "configs" / "recommender.yaml"


def load_config(path: str | Path | None = None) -> dict[str, Any]:
    config_path = Path(path) if path else DEFAULT_CONFIG
    if not config_path.exists():
        raise FileNotFoundError(f"configuration introuvable: {config_path}")
    with config_path.open("r", encoding="utf-8") as handle:
        payload = yaml.safe_load(handle)
    if not isinstance(payload, dict):
        raise ValueError(f"configuration invalide: {config_path}")
    return payload


def resolve_path(value: str | Path) -> Path:
    """Resout un chemin relatif par rapport a la racine ``ml/``."""
    path = Path(value)
    return path if path.is_absolute() else (ML_ROOT / path).resolve()


def configure_hf_cache() -> None:
    """Place le cache Hugging Face dans ``ml/.cache`` (ignore par git)."""
    cache = ML_ROOT / ".cache" / "huggingface"
    cache.mkdir(parents=True, exist_ok=True)
    os.environ.setdefault("HF_HOME", str(cache))
    os.environ.setdefault("TOKENIZERS_PARALLELISM", "false")
