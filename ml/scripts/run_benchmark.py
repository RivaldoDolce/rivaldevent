#!/usr/bin/env python3
"""Execute le protocole comparatif et produit le rapport de benchmark.

Methodes comparees sur le meme catalogue et les memes profils :
1. metadata baseline (categorie, ville, budget, temporalite) ;
2. TF-IDF (similarite lexicale) ;
3. E5 semantic (cosinus) ;
4. E5 + context (ranking contextuel) ;
5. E5 + context + MMR (diversification).

Les poids contextuels et lambda sont choisis sur le split ``dev`` uniquement,
puis appliques tels quels au split ``test``. Les metriques sont macro-moyennees
par profil.
"""

from __future__ import annotations

import argparse
import itertools
import json
import subprocess
from collections.abc import Mapping, Sequence
from dataclasses import dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import numpy as np

import _bootstrap  # noqa: F401
from _common import load_config, resolve_path
from rivaldevent_ml.dataset import (
    DatasetError,
    Event,
    Profile,
    compute_dataset_version,
    load_events,
    load_judgements,
    load_profiles,
)
from rivaldevent_ml.embeddings import EmbeddingBundle, load_bundle
from rivaldevent_ml.metrics import evaluate_profile, summarize
from rivaldevent_ml.recommenders import (
    RankingWeights,
    TemporalConfig,
    TfidfRecommender,
    build_profile_vector,
    context_breakdown,
    eligible_events,
    mmr_rerank,
    rank_scores,
    semantic_scores,
)

METHODS: dict[str, str] = {
    "metadata": "Metadata baseline",
    "tfidf": "TF-IDF",
    "e5": "E5 semantic",
    "e5_context": "E5 + context",
    "e5_context_mmr": "E5 + context + MMR",
}


@dataclass
class ProfileSignals:
    """Signaux precalcules pour un profil (evite de recalculer dans la grille)."""

    profile: Profile
    components: dict[str, dict[str, float]]
    ranked_semantic: list[tuple[str, float]]
    tfidf_scores: dict[str, float]


# ============================================================
# Helpers
# ============================================================


def utc_now_iso() -> str:
    return datetime.now(UTC).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def git_commit() -> str | None:
    try:
        return (
            subprocess.check_output(
                ["git", "rev-parse", "HEAD"], cwd=Path(__file__).resolve().parents[1], text=True
            )
            .strip()
        )
    except Exception:  # pragma: no cover - hors depot git
        return None


def graded_judgements(
    judgements: Sequence, candidates: set[str]
) -> dict[str, dict[str, int]]:
    """Ne conserve que les jugements portant sur des candidats evaluables.

    Un evenement expire ne peut pas etre recommande : son jugement ne doit pas
    non plus compter dans l'IDCG.
    """
    graded: dict[str, dict[str, int]] = {}
    for item in judgements:
        if item.event_id not in candidates:
            continue
        graded.setdefault(item.profile_id, {})[item.event_id] = item.relevance
    return graded


def weighted_totals(
    components: Mapping[str, Mapping[str, float]], weights: RankingWeights
) -> dict[str, float]:
    normalized = weights.normalized(include_semantic=True)
    return {
        event_id: (
            normalized["semantic"] * values["semantic"]
            + normalized["category"] * values["category"]
            + normalized["location"] * values["location"]
            + normalized["budget"] * values["budget"]
            + normalized["temporal"] * values["temporal"]
        )
        for event_id, values in components.items()
    }


def metadata_totals(components: Mapping[str, Mapping[str, float]]) -> dict[str, float]:
    """Baseline metadata : aucun signal semantique, poids contextuels seuls."""
    normalized = {
        "category": 0.40,
        "location": 0.25,
        "budget": 0.20,
        "temporal": 0.15,
    }
    return {
        event_id: (
            normalized["category"] * values["category"]
            + normalized["location"] * values["location"]
            + normalized["budget"] * values["budget"]
            + normalized["temporal"] * values["temporal"]
        )
        for event_id, values in components.items()
    }


def evaluate_rankings(
    *,
    rankings: Mapping[str, Sequence[str]],
    graded: Mapping[str, Mapping[str, int]],
    vectors: Mapping[str, np.ndarray],
    k_values: Sequence[int],
    relevance_threshold: int,
    diversity_k: int,
    catalog_size: int,
) -> tuple[dict[str, float], dict[str, dict[str, float]]]:
    per_profile: dict[str, dict[str, float]] = {}
    for profile_id, ranked in rankings.items():
        per_profile[profile_id] = evaluate_profile(
            ranked=ranked,
            graded=graded.get(profile_id, {}),
            k_values=k_values,
            relevance_threshold=relevance_threshold,
            vectors=vectors,
            diversity_k=diversity_k,
        )
    overall = summarize(
        per_profile=per_profile,
        ranked_by_profile=rankings,
        catalog_size=catalog_size,
        k_values=k_values,
    )
    return overall, per_profile


def pick_best(candidates: list[tuple[float, Any]], objective: str) -> tuple[Any, float]:
    """Selection deterministe : meilleur score, puis configuration la plus simple."""
    best_value = max(score for score, _ in candidates)
    for score, configuration in candidates:
        if score == best_value:
            return configuration, score
    raise AssertionError("aucun candidat")  # pragma: no cover


# ============================================================
# Pipeline
# ============================================================


def build_signals(
    *,
    profiles: Sequence[Profile],
    candidates: Sequence[Event],
    events_by_id: Mapping[str, Event],
    embeddings: Mapping[str, np.ndarray],
    dimension: int,
    reference: datetime,
    temporal_config: TemporalConfig,
) -> dict[str, ProfileSignals]:
    tfidf = TfidfRecommender.fit(candidates)
    candidate_ids = [event.event_id for event in candidates]
    signals: dict[str, ProfileSignals] = {}

    for profile in profiles:
        profile_vector = build_profile_vector(
            profile.seed_event_ids, embeddings, dimension=dimension
        )
        semantic = semantic_scores(profile_vector, candidate_ids, embeddings)
        components: dict[str, dict[str, float]] = {}
        for event in candidates:
            breakdown = context_breakdown(profile, event, reference, temporal_config)
            components[event.event_id] = {
                "semantic": semantic.get(event.event_id, 0.0),
                "category": breakdown.category,
                "location": breakdown.location,
                "budget": breakdown.budget,
                "temporal": breakdown.temporal,
            }
        signals[profile.profile_id] = ProfileSignals(
            profile=profile,
            components=components,
            ranked_semantic=rank_scores(semantic),
            tfidf_scores=tfidf.scores(profile, events_by_id),
        )
    return signals


def rankings_for_split(
    *,
    profile_ids: Sequence[str],
    signals: Mapping[str, ProfileSignals],
    weights: RankingWeights,
    lambda_mmr: float,
    embeddings: Mapping[str, np.ndarray],
    top_k: int,
    mmr_pool: int,
) -> dict[str, dict[str, list[str]]]:
    rankings: dict[str, dict[str, list[str]]] = {
        method: {} for method in METHODS
    }

    for profile_id in profile_ids:
        signal = signals[profile_id]
        metadata = rank_scores(metadata_totals(signal.components), k=top_k)
        tfidf = rank_scores(signal.tfidf_scores, k=top_k)
        semantic = signal.ranked_semantic[:top_k]
        context_all = rank_scores(weighted_totals(signal.components, weights))
        mmr = mmr_rerank(
            context_all,
            embeddings,
            k=top_k,
            lambda_=lambda_mmr,
            pool_size=mmr_pool,
        )

        rankings["metadata"][profile_id] = [event_id for event_id, _ in metadata]
        rankings["tfidf"][profile_id] = [event_id for event_id, _ in tfidf]
        rankings["e5"][profile_id] = [event_id for event_id, _ in semantic]
        rankings["e5_context"][profile_id] = [event_id for event_id, _ in context_all[:top_k]]
        rankings["e5_context_mmr"][profile_id] = [event_id for event_id, _ in mmr]

    return rankings


def tune_on_dev(
    *,
    dev_ids: Sequence[str],
    signals: Mapping[str, ProfileSignals],
    graded: Mapping[str, Mapping[str, int]],
    embeddings: Mapping[str, np.ndarray],
    tuning: Mapping[str, Any],
    k_values: Sequence[int],
    relevance_threshold: int,
    diversity_k: int,
    catalog_size: int,
    mmr_pool: int,
) -> tuple[RankingWeights, float, dict[str, Any]]:
    objective = str(tuning.get("objective", "ndcg@10"))
    candidates: list[tuple[float, RankingWeights]] = []

    grid = itertools.product(
        [float(value) for value in tuning["semantic_weights"]],
        [float(value) for value in tuning["category_weights"]],
        [float(value) for value in tuning["location_weights"]],
        [float(value) for value in tuning["budget_weights"]],
        [float(value) for value in tuning["temporal_weights"]],
    )
    for semantic_w, category_w, location_w, budget_w, temporal_w in grid:
        weights = RankingWeights(
            semantic=semantic_w,
            category=category_w,
            location=location_w,
            budget=budget_w,
            temporal=temporal_w,
        )
        rankings = {
            profile_id: [
                event_id
                for event_id, _ in rank_scores(
                    weighted_totals(signals[profile_id].components, weights), k=max(k_values)
                )
            ]
            for profile_id in dev_ids
        }
        overall, _ = evaluate_rankings(
            rankings=rankings,
            graded=graded,
            vectors=embeddings,
            k_values=k_values,
            relevance_threshold=relevance_threshold,
            diversity_k=diversity_k,
            catalog_size=catalog_size,
        )
        candidates.append((overall[objective], weights))

    best_weights, best_score = pick_best(candidates, objective)

    lambda_candidates: list[tuple[float, float]] = []
    for lambda_value in [float(value) for value in tuning["mmr_lambdas"]]:
        rankings = {
            profile_id: [
                event_id
                for event_id, _ in mmr_rerank(
                    rank_scores(weighted_totals(signals[profile_id].components, best_weights)),
                    embeddings,
                    k=max(k_values),
                    lambda_=lambda_value,
                    pool_size=mmr_pool,
                )
            ]
            for profile_id in dev_ids
        }
        overall, _ = evaluate_rankings(
            rankings=rankings,
            graded=graded,
            vectors=embeddings,
            k_values=k_values,
            relevance_threshold=relevance_threshold,
            diversity_k=diversity_k,
            catalog_size=catalog_size,
        )
        lambda_candidates.append((overall[objective], lambda_value))

    best_lambda, best_lambda_score = pick_best(lambda_candidates, objective)

    details = {
        "objective": objective,
        "gridSize": len(candidates),
        "devProfiles": list(dev_ids),
        "selectedWeights": best_weights.as_dict(),
        "selectedWeightsNormalized": best_weights.normalized(),
        "devScoreAtSelection": round(best_score, 6),
        "lambdaCandidates": {
            f"{value:.1f}": round(score, 6) for score, value in lambda_candidates
        },
        "selectedMmrLambda": best_lambda,
        "devScoreAtLambdaSelection": round(best_lambda_score, 6),
    }
    return best_weights, best_lambda, details


def build_report(
    *,
    benchmark: Mapping[str, Any],
    dataset_summary: Mapping[str, Any],
    output_path: Path,
) -> None:
    results = benchmark["results"]
    lines: list[str] = []
    lines.append("# Benchmark — recommandeur Rivald'event")
    lines.append("")
    lines.append(
        "Rapport genere automatiquement par `scripts/run_benchmark.py`. "
        "Les valeurs proviennent du code execute sur le dataset versionne ; "
        "aucune metrique n'est saisie manuellement."
    )
    lines.append("")
    lines.append(f"- Version du dataset : `{benchmark['datasetVersion']}`")
    lines.append(f"- Modele : `{benchmark['model']['id']}` @ `{benchmark['model']['revision']}`")
    lines.append(f"- Date de reference des evenements : `{benchmark['protocol']['referenceDate']}`")
    lines.append(
        f"- Effectifs : {benchmark['sampleCounts']['profiles']} profils, "
        f"{benchmark['sampleCounts']['events']} evenements candidats, "
        f"{benchmark['sampleCounts']['judgments']} jugements"
    )
    lines.append(
        f"- Seuil de pertinence binaire : `relevance >= {benchmark['protocol']['relevanceThreshold']}`"
    )
    lines.append("")
    lines.append(
        "Les profils de test ne participent jamais au reglage des poids. "
        "Les annotations ont ete produites par un annotateur unique selon un guide "
        "ecrit ; il ne s'agit pas d'une verite terrain objective."
    )
    lines.append("")

    lines.append("## Composition du catalogue")
    lines.append("")
    lines.append(f"- Categories : {dataset_summary.get('eventsByCategory', {})}")
    lines.append(f"- Villes : {dataset_summary.get('eventsByCity', {})}")
    lines.append(f"- Langues : {dataset_summary.get('eventsByLanguage', {})}")
    lines.append(
        f"- Evenements expires a la date de reference : "
        f"{dataset_summary.get('expiredAtReference')} (exclus des candidats)"
    )
    lines.append("")

    metrics_order = [
        "ndcg@10",
        "ndcg@5",
        "recall@10",
        "precision@10",
        "mrr@10",
        "coverage@10",
        "diversity@10",
    ]
    for split, label in (("dev", "Developpement"), ("test", "Test")):
        lines.append(f"## Resultats — {label}")
        lines.append("")
        lines.append("| Methode | " + " | ".join(metrics_order) + " |")
        lines.append("|---|" + "---:|" * len(metrics_order))
        for result in results:
            if result["split"] != split:
                continue
            values = [f"{result['metrics'].get(metric, float('nan')):.3f}" for metric in metrics_order]
            lines.append(f"| {result['label']} | " + " | ".join(values) + " |")
        lines.append("")

    tuning = benchmark["tuning"]
    lines.append("## Reglage sur le split de developpement")
    lines.append("")
    lines.append(
        f"Objectif : `{tuning['objective']}`. Grille de {tuning['gridSize']} combinaisons de poids."
    )
    lines.append("")
    lines.append(f"- Poids retenus (bruts) : `{tuning['selectedWeights']}`")
    lines.append(f"- Poids normalises : `{tuning['selectedWeightsNormalized']}`")
    lines.append(f"- Lambda MMR retenu : `{tuning['selectedMmrLambda']}`")
    lines.append("")

    test_results = [result for result in results if result["split"] == "test"]
    by_method = {result["method"]: result for result in test_results}

    lines.append("## Lecture des resultats")
    lines.append("")
    e5 = by_method.get("e5", {}).get("metrics", {})
    tfidf = by_method.get("tfidf", {}).get("metrics", {})
    context = by_method.get("e5_context", {}).get("metrics", {})
    mmr = by_method.get("e5_context_mmr", {}).get("metrics", {})

    def delta(left: Mapping[str, float], right: Mapping[str, float], key: str) -> float:
        return float(left.get(key, 0.0)) - float(right.get(key, 0.0))

    lines.append(
        f"- E5 vs TF-IDF (NDCG@10, test) : {delta(e5, tfidf, 'ndcg@10'):+.3f} point."
    )
    lines.append(
        f"- Ajout du contexte vs E5 seul (NDCG@10, test) : {delta(context, e5, 'ndcg@10'):+.3f} point."
    )
    lines.append(
        f"- MMR vs contexte (NDCG@10, test) : {delta(mmr, context, 'ndcg@10'):+.3f} point ; "
        f"diversite intra-liste : {delta(mmr, context, 'diversity@10'):+.3f} point."
    )
    lines.append("")
    lines.append(
        "Avec un petit nombre de profils de test, ces ecarts ont une incertitude elevee "
        "et ne doivent pas etre interpretes comme des effets statistiquement etablis."
    )
    lines.append("")

    lines.append("## Limites")
    lines.append("")
    for limitation in benchmark.get("limitations", []):
        lines.append(f"- {limitation}")
    lines.append("")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text("\n".join(lines) + "\n", encoding="utf-8")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--config", default=None)
    args = parser.parse_args()

    config = load_config(args.config)
    dataset_config = config["dataset"]
    evaluation = config["evaluation"]
    ranking_config = config["ranking"]
    tuning_config = config["tuning"]
    outputs = config["outputs"]

    events = load_events(resolve_path(dataset_config["events"]))
    profiles = load_profiles(resolve_path(dataset_config["profiles"]), events)
    judgements = load_judgements(resolve_path(dataset_config["relevance"]), profiles, events)
    dataset_version = compute_dataset_version(events, profiles, judgements)
    events_by_id = {event.event_id: event for event in events}

    bundle: EmbeddingBundle = load_bundle(
        resolve_path(outputs["embeddings"]), resolve_path(outputs["embeddings_meta"])
    )

    reference = datetime.fromisoformat(str(evaluation["reference_date"]))
    # Collect all seed event IDs across all profiles to exclude from candidate pool
    # (avoids circularity: profile vector = mean of seed vectors → cos(profile, seed) ≈ 1)
    all_seed_ids: set[str] = set()
    for profile in profiles:
        all_seed_ids.update(profile.seed_event_ids)
    candidates = eligible_events(
        events,
        reference,
        include_expired=not bool(evaluation.get("exclude_expired", True)),
        exclude_event_ids=all_seed_ids,
    )
    candidate_ids = {event.event_id for event in candidates}

    if set(bundle.event_ids) != set(events_by_id):
        raise SystemExit("les embeddings ne couvrent pas exactement le catalogue courant")

    embeddings = bundle.as_mapping()
    graded = graded_judgements(judgements, candidate_ids)
    k_values = [int(value) for value in evaluation["k_values"]]
    relevance_threshold = int(evaluation["relevance_threshold"])
    diversity_k = int(evaluation["diversity_k"])
    top_k = max(k_values)
    mmr_pool = int(ranking_config["mmr"]["pool_size"])

    temporal_config = TemporalConfig(
        near_days=int(ranking_config["temporal"]["near_days"]),
        mid_days=int(ranking_config["temporal"]["mid_days"]),
        near_score=float(ranking_config["temporal"]["near_score"]),
        mid_score=float(ranking_config["temporal"]["mid_score"]),
        far_score=float(ranking_config["temporal"]["far_score"]),
    )
    default_weights = RankingWeights.from_mapping(ranking_config["weights"])

    signals = build_signals(
        profiles=profiles,
        candidates=candidates,
        events_by_id=events_by_id,
        embeddings=embeddings,
        dimension=bundle.dimension,
        reference=reference,
        temporal_config=temporal_config,
    )

    dev_ids = [profile.profile_id for profile in profiles if profile.split == "dev"]
    test_ids = [profile.profile_id for profile in profiles if profile.split == "test"]
    if not dev_ids or not test_ids:
        raise SystemExit("les splits dev/test doivent contenir au moins un profil")

    if bool(tuning_config.get("enabled", True)):
        weights, lambda_mmr, tuning_details = tune_on_dev(
            dev_ids=dev_ids,
            signals=signals,
            graded=graded,
            embeddings=embeddings,
            tuning=tuning_config,
            k_values=k_values,
            relevance_threshold=relevance_threshold,
            diversity_k=diversity_k,
            catalog_size=len(candidates),
            mmr_pool=mmr_pool,
        )
    else:
        weights = default_weights
        lambda_mmr = float(ranking_config["mmr"]["lambda"])
        tuning_details = {
            "objective": "ndcg@10",
            "gridSize": 0,
            "devProfiles": list(dev_ids),
            "selectedWeights": weights.as_dict(),
            "selectedWeightsNormalized": weights.normalized(),
            "selectedMmrLambda": lambda_mmr,
            "note": "reglage desactive : poids par defaut de la configuration",
        }

    results: list[dict[str, Any]] = []
    for split, profile_ids in (("dev", dev_ids), ("test", test_ids)):
        split_rankings = rankings_for_split(
            profile_ids=profile_ids,
            signals=signals,
            weights=weights,
            lambda_mmr=lambda_mmr,
            embeddings=embeddings,
            top_k=top_k,
            mmr_pool=mmr_pool,
        )
        for method, label in METHODS.items():
            overall, per_profile = evaluate_rankings(
                rankings=split_rankings[method],
                graded=graded,
                vectors=embeddings,
                k_values=k_values,
                relevance_threshold=relevance_threshold,
                diversity_k=diversity_k,
                catalog_size=len(candidates),
            )
            results.append(
                {
                    "method": method,
                    "label": label,
                    "split": split,
                    "metrics": {key: round(value, 6) for key, value in overall.items()},
                    "perProfile": {
                        profile_id: {
                            key: round(value, 6)
                            for key, value in metrics.items()
                            if key in {"ndcg@10", "recall@10", "precision@10"}
                        }
                        for profile_id, metrics in per_profile.items()
                    },
                }
            )

    benchmark = {
        "schemaVersion": 1,
        "datasetVersion": dataset_version,
        "evaluationVersion": str(evaluation.get("evaluation_version", "v1")),
        "generatedAt": utc_now_iso(),
        "gitCommit": git_commit(),
        "model": {
            "id": bundle.model_id,
            "revision": bundle.model_revision,
            "dimension": bundle.dimension,
            "normalized": bundle.normalized,
            "textTemplateVersion": bundle.text_template_version,
        },
        "protocol": {
            "referenceDate": reference.isoformat(),
            "relevanceThreshold": relevance_threshold,
            "kValues": k_values,
            "diversityK": diversity_k,
            "splitStrategy": "documented-profile-holdout",
            "aggregation": "macro-average-per-profile",
            "expiredEventsExcluded": bool(evaluation.get("exclude_expired", True)),
            "annotationProtocol": "single-annotator-guided-rubric",
        },
        "sampleCounts": {
            "profiles": len(profiles),
            "devProfiles": len(dev_ids),
            "testProfiles": len(test_ids),
            "events": len(candidates),
            "catalogEvents": len(events),
            "judgments": len(judgements),
            "judgedProfileEventPairs": sum(len(values) for values in graded.values()),
            "expiredEvents": len(events) - len(candidates),
        },
        "tuning": tuning_details,
        "runtimeConfig": {
            "weights": weights.as_dict(),
            "mmr": {
                "enabled": bool(ranking_config["mmr"].get("enabled", True)),
                "lambda": lambda_mmr,
                "poolSize": mmr_pool,
            },
            "temporal": {
                "nearDays": temporal_config.near_days,
                "midDays": temporal_config.mid_days,
                "nearScore": temporal_config.near_score,
                "midScore": temporal_config.mid_score,
                "farScore": temporal_config.far_score,
            },
        },
        "results": results,
        "limitations": [
            "Les profils sont des personas fictifs, pas des utilisateurs observes.",
            "Les jugements de pertinence sont des annotations guidees par une seule personne, pas des clics ou des achats reels.",
            "Les evenements du catalogue sont des fixtures de demonstration clairement identifiees (is_demo=true), pas des offres verifiees.",
            "Le catalogue est petit : les ecarts entre methodes ne sont pas statistiquement significatifs.",
            "Les embeddings E5 sont pre-entraines et ne sont pas fine-tunes sur Rivald'event.",
            "Le systeme est content-based : il ne demontre ni gain de conversion ni performance en production.",
        ],
    }

    benchmark_path = resolve_path(outputs["benchmark_json"])
    benchmark_path.parent.mkdir(parents=True, exist_ok=True)
    benchmark_path.write_text(
        json.dumps(benchmark, indent=2, ensure_ascii=False) + "\n", encoding="utf-8"
    )

    dataset_summary_path = resolve_path(dataset_config["processed_dir"]) / "dataset.summary.json"
    dataset_summary = (
        json.loads(dataset_summary_path.read_text(encoding="utf-8"))
        if dataset_summary_path.exists()
        else {}
    )

    report_path = resolve_path(outputs["benchmark_md"])
    build_report(benchmark=benchmark, dataset_summary=dataset_summary, output_path=report_path)

    test_ndcg = {
        result["label"]: result["metrics"].get("ndcg@10", 0.0)
        for result in results
        if result["split"] == "test"
    }
    print(f"Dataset      : {dataset_version}")
    print(f"Candidats    : {len(candidates)} / {len(events)} (expires exclus)")
    print(f"Poids retenus: {tuning_details['selectedWeights']} (lambda={lambda_mmr})")
    print("NDCG@10 test :")
    for label, value in test_ndcg.items():
        print(f"  {label:<24} {value:.3f}")
    print(f"Benchmark    : {benchmark_path}")
    print(f"Rapport      : {report_path}")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except DatasetError as error:  # pragma: no cover - CLI
        print(error)
        raise SystemExit(1) from error
