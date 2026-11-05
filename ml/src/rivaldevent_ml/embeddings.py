"""Encodage multilingue des evenements avec ``intfloat/multilingual-e5-small``.

Le modele n'est execute qu'en Python, hors ligne. Les vecteurs sont ensuite
exportes en JSON pour le runtime TypeScript. Le prefixe ``passage:`` est
applique aux textes d'evenements, conformement a la carte du modele E5.

La revision exacte (commit SHA) du modele est resolue a la generation et
enregistree dans les metadonnees : un modele telecharge plus tard ne peut pas
changer silencieusement les resultats.
"""

from __future__ import annotations

import json
import platform
import time
from collections.abc import Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path

import numpy as np

from .dataset import TEXT_TEMPLATE_VERSION, Event

DEFAULT_MODEL_ID = "intfloat/multilingual-e5-small"


@dataclass(frozen=True)
class EmbeddingBundle:
    """Matrice d'embeddings et metadonnees de generation."""

    event_ids: tuple[str, ...]
    matrix: np.ndarray
    model_id: str
    model_revision: str
    dimension: int
    normalized: bool
    text_template_version: int
    generated_at: str
    encode_seconds: float

    def as_mapping(self) -> dict[str, np.ndarray]:
        return {
            event_id: self.matrix[index]
            for index, event_id in enumerate(self.event_ids)
        }

    def metadata(self) -> dict[str, object]:
        return {
            "model": self.model_id,
            "modelRevision": self.model_revision,
            "dimension": self.dimension,
            "normalized": self.normalized,
            "textTemplateVersion": self.text_template_version,
            "generatedAt": self.generated_at,
            "encodeSeconds": round(self.encode_seconds, 3),
            "eventCount": len(self.event_ids),
            "dtype": str(self.matrix.dtype),
        }


def resolve_model_revision(model_id: str, revision: str = "main") -> str:
    """Resout un nom de revision en commit SHA (retombe sur la valeur brute)."""
    try:
        from huggingface_hub import model_info

        return str(model_info(model_id, revision=revision).sha)
    except Exception:  # pragma: no cover - depend du reseau
        return revision


def load_encoder(
    model_id: str = DEFAULT_MODEL_ID,
    *,
    revision: str = "main",
    device: str = "cpu",
):
    """Charge le SentenceTransformer (telechargement au premier usage)."""
    from sentence_transformers import SentenceTransformer

    model = SentenceTransformer(model_id, revision=revision, device=device)
    model.eval()
    return model


def encode_events(
    events: Sequence[Event],
    model,
    *,
    model_id: str = DEFAULT_MODEL_ID,
    model_revision: str = "main",
    batch_size: int = 16,
    normalize: bool = True,
    show_progress_bar: bool = False,
) -> EmbeddingBundle:
    """Encode tous les evenements et verifie la coherence de la matrice."""
    if not events:
        raise ValueError("aucun evenement a encoder")

    texts = [event.text for event in events]
    started = time.perf_counter()
    with np.errstate(all="raise"):
        matrix = model.encode(
            texts,
            batch_size=batch_size,
            normalize_embeddings=normalize,
            show_progress_bar=show_progress_bar,
            convert_to_numpy=True,
        )
    elapsed = time.perf_counter() - started

    array = np.asarray(matrix, dtype=np.float32)
    if array.ndim != 2:
        raise ValueError(f"matrice d'embeddings invalide: shape={array.shape}")
    if array.shape[0] != len(events):
        raise ValueError(
            f"nombre de vecteurs ({array.shape[0]}) different du nombre d'evenements ({len(events)})"
        )
    if not np.isfinite(array).all():
        raise ValueError("les embeddings contiennent des valeurs non finies")
    if normalize:
        norms = np.linalg.norm(array, axis=1)
        if not np.allclose(norms, 1.0, atol=1e-3):
            raise ValueError("les vecteurs ne sont pas normalises L2 apres encodage")

    revision = model_revision

    return EmbeddingBundle(
        event_ids=tuple(event.event_id for event in events),
        matrix=array,
        model_id=model_id,
        model_revision=revision,
        dimension=int(array.shape[1]),
        normalized=normalize,
        text_template_version=TEXT_TEMPLATE_VERSION,
        generated_at=datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z"),
        encode_seconds=elapsed,
    )


def save_bundle(
    bundle: EmbeddingBundle,
    npz_path: str | Path,
    meta_path: str | Path,
    *,
    library_versions: dict[str, str] | None = None,
    extra_metadata: dict[str, object] | None = None,
) -> None:
    npz_path = Path(npz_path)
    meta_path = Path(meta_path)
    npz_path.parent.mkdir(parents=True, exist_ok=True)
    meta_path.parent.mkdir(parents=True, exist_ok=True)

    np.savez_compressed(
        npz_path,
        event_ids=np.array(bundle.event_ids, dtype=object),
        matrix=bundle.matrix,
    )

    metadata = bundle.metadata()
    metadata.update(
        {
            "libraryVersions": library_versions
            or {
                "python": platform.python_version(),
                "numpy": np.__version__,
            },
            "eventIds": list(bundle.event_ids),
        }
    )
    if extra_metadata:
        metadata.update(extra_metadata)
    meta_path.write_text(json.dumps(metadata, indent=2, ensure_ascii=False), encoding="utf-8")


def load_bundle(npz_path: str | Path, meta_path: str | Path) -> EmbeddingBundle:
    npz_path = Path(npz_path)
    meta_path = Path(meta_path)
    if not npz_path.exists():
        raise FileNotFoundError(
            f"embeddings introuvables: {npz_path}. Executer scripts/build_embeddings.py"
        )
    if not meta_path.exists():
        raise FileNotFoundError(f"metadonnees d'embeddings introuvables: {meta_path}")

    metadata = json.loads(meta_path.read_text(encoding="utf-8"))
    with np.load(npz_path, allow_pickle=True) as payload:
        event_ids = tuple(str(item) for item in payload["event_ids"].tolist())
        matrix = np.asarray(payload["matrix"], dtype=np.float32)

    dimension = int(metadata["dimension"])
    if matrix.shape != (len(event_ids), dimension):
        raise ValueError(
            f"matrice incoherente: {matrix.shape} pour {len(event_ids)} ids et dimension {dimension}"
        )

    return EmbeddingBundle(
        event_ids=event_ids,
        matrix=matrix,
        model_id=str(metadata["model"]),
        model_revision=str(metadata["modelRevision"]),
        dimension=dimension,
        normalized=bool(metadata["normalized"]),
        text_template_version=int(metadata["textTemplateVersion"]),
        generated_at=str(metadata["generatedAt"]),
        encode_seconds=float(metadata.get("encodeSeconds", 0.0)),
    )
