"""Pipeline ML du recommandeur Rivald'event."""

from .dataset import (
    CATEGORIES,
    Event,
    Judgement,
    Profile,
    build_event_text,
    compute_dataset_version,
    load_events,
    load_judgements,
    load_profiles,
)
from .embeddings import EmbeddingBundle, encode_events, load_bundle, save_bundle
from .export import export_runtime_assets
from .metrics import evaluate_profile, macro_average, ndcg_at_k, precision_at_k
from .recommenders import (
    RankingWeights,
    build_profile_vector,
    cosine_similarity,
    mmr_rerank,
    rank_scores,
)

__all__ = [
    "CATEGORIES",
    "EmbeddingBundle",
    "Event",
    "Judgement",
    "Profile",
    "RankingWeights",
    "build_event_text",
    "build_profile_vector",
    "compute_dataset_version",
    "cosine_similarity",
    "encode_events",
    "evaluate_profile",
    "export_runtime_assets",
    "load_bundle",
    "load_events",
    "load_judgements",
    "load_profiles",
    "macro_average",
    "mmr_rerank",
    "ndcg_at_k",
    "precision_at_k",
    "rank_scores",
    "save_bundle",
]
