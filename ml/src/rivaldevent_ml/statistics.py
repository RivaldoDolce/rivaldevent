"""Statistiques pour l'évaluation du recommandeur.

Ce module fournit :
- Bootstrap CI (percentile) 95 % pour NDCG, Recall, MRR, etc.
- Test de permutation appariée pour comparer deux méthodes.
- Formats de sortie compatibles avec le benchmark JSON/MD.
"""

from __future__ import annotations

from collections.abc import Callable, Sequence
from dataclasses import dataclass
import numpy as np


@dataclass(frozen=True)
class BootstrapResult:
    """Résultat d'un bootstrap percentile."""
    mean: float
    ci_lower: float
    ci_upper: float
    n_iterations: int
    confidence_level: float

    def as_dict(self) -> dict[str, float | int]:
        return {
            "mean": self.mean,
            "ci_lower": self.ci_lower,
            "ci_upper": self.ci_upper,
            "n_iterations": self.n_iterations,
            "confidence_level": self.confidence_level,
        }


@dataclass(frozen=True)
class PermutationTestResult:
    """Résultat d'un test de permutation appariée."""
    statistic: float
    p_value: float
    n_permutations: int
    alternative: str  # "two-sided", "greater", "less"

    def as_dict(self) -> dict[str, float | int | str]:
        return {
            "statistic": self.statistic,
            "p_value": self.p_value,
            "n_permutations": self.n_permutations,
            "alternative": self.alternative,
        }


def bootstrap_ci(
    values: Sequence[float],
    *,
    n_iterations: int = 10_000,
    confidence_level: float = 0.95,
    statistic_fn: Callable[[np.ndarray], float] = np.mean,
    random_state: int | None = None,
) -> BootstrapResult:
    """
    Calcule un intervalle de confiance par bootstrap percentile.

    Args:
        values: Échantillon de valeurs (ex: NDCG@10 par profil).
        n_iterations: Nombre de rééchantillonnages (défaut 10 000).
        confidence_level: Niveau de confiance (défaut 0.95).
        statistic_fn: Fonction de statistique à appliquer (défaut moyenne).
        random_state: Graine pour la reproductibilité.

    Returns:
        BootstrapResult avec moyenne, borne inférieure/supérieure.
    """
    if len(values) == 0:
        return BootstrapResult(
            mean=0.0,
            ci_lower=0.0,
            ci_upper=0.0,
            n_iterations=n_iterations,
            confidence_level=confidence_level,
        )

    rng = np.random.default_rng(random_state)
    arr = np.asarray(values, dtype=float)
    n = len(arr)

    bootstrap_stats = np.empty(n_iterations, dtype=float)
    for i in range(n_iterations):
        sample = rng.choice(arr, size=n, replace=True)
        bootstrap_stats[i] = statistic_fn(sample)

    alpha = (1.0 - confidence_level) / 2.0
    lower = np.percentile(bootstrap_stats, 100 * alpha)
    upper = np.percentile(bootstrap_stats, 100 * (1.0 - alpha))

    return BootstrapResult(
        mean=float(statistic_fn(arr)),
        ci_lower=float(lower),
        ci_upper=float(upper),
        n_iterations=n_iterations,
        confidence_level=confidence_level,
    )


def paired_permutation_test(
    values_a: Sequence[float],
    values_b: Sequence[float],
    *,
    n_permutations: int = 10_000,
    alternative: str = "two-sided",
    random_state: int | None = None,
) -> PermutationTestResult:
    """
    Test de permutation appariée pour comparer deux méthodes sur les mêmes profils.

    H0 : la différence moyenne est nulle.
    H1 : selon `alternative` ("two-sided", "greater", "less").

    Args:
        values_a: Métriques de la méthode A par profil.
        values_b: Métriques de la méthode B par profil (même ordre de profils).
        n_permutations: Nombre de permutations (défaut 10 000).
        alternative: Type de test ("two-sided", "greater", "less").
        random_state: Graine pour la reproductibilité.

    Returns:
        PermutationTestResult avec p-value.
    """
    if len(values_a) != len(values_b):
        raise ValueError("values_a et values_b doivent avoir la même longueur")
    if len(values_a) == 0:
        return PermutationTestResult(
            statistic=0.0,
            p_value=1.0,
            n_permutations=n_permutations,
            alternative=alternative,
        )

    rng = np.random.default_rng(random_state)
    a = np.asarray(values_a, dtype=float)
    b = np.asarray(values_b, dtype=float)
    diff_observed = float(np.mean(a - b))

    # Distribution nulle : inversion aléatoire des signes des différences par profil
    diffs = a - b
    null_stats = np.empty(n_permutations, dtype=float)

    for i in range(n_permutations):
        signs = rng.choice([-1, 1], size=len(diffs))
        null_stats[i] = float(np.mean(signs * diffs))

    if alternative == "two-sided":
        p_value = float(np.mean(np.abs(null_stats) >= np.abs(diff_observed)))
    elif alternative == "greater":
        p_value = float(np.mean(null_stats >= diff_observed))
    elif alternative == "less":
        p_value = float(np.mean(null_stats <= diff_observed))
    else:
        raise ValueError(f"alternative invalide : {alternative}")

    return PermutationTestResult(
        statistic=diff_observed,
        p_value=p_value,
        n_permutations=n_permutations,
        alternative=alternative,
    )


def bootstrap_ci_per_profile(
    per_profile_values: Sequence[Sequence[float]],
    *,
    n_iterations: int = 10_000,
    confidence_level: float = 0.95,
    random_state: int | None = None,
) -> list[BootstrapResult]:
    """
    Calcule des IC bootstrap pour chaque méthode (colonne) à partir des valeurs par profil (lignes).

    Args:
        per_profile_values: Liste de listes [profils][méthodes] ou [méthodes][profils].
        n_iterations: Nombre d'itérations bootstrap.
        confidence_level: Niveau de confiance.
        random_state: Graine.

    Returns:
        Liste de BootstrapResult (une par méthode).
    """
    arr = np.asarray(per_profile_values, dtype=float)
    # S'assurer que l'axe 0 = profils, axe 1 = méthodes
    if arr.ndim != 2:
        raise ValueError("per_profile_values doit être 2D : [profils, méthodes]")
    if arr.size == 0:
        raise ValueError("per_profile_values ne peut pas être vide")
    if arr.shape[0] < 1 or arr.shape[1] < 1:
        raise ValueError("per_profile_values doit avoir au moins 1 profil et 1 méthode")

    n_profiles, n_methods = arr.shape
    results: list[BootstrapResult] = []

    for method_idx in range(n_methods):
        values = arr[:, method_idx]
        results.append(
            bootstrap_ci(
                values,
                n_iterations=n_iterations,
                confidence_level=confidence_level,
                random_state=random_state,
            )
        )
    return results


def format_ci_for_md(result: BootstrapResult, precision: int = 3) -> str:
    """Formate un BootstrapResult pour Markdown : `mean [ci_lower, ci_upper]`."""
    return f"{result.mean:.{precision}f} [{result.ci_lower:.{precision}f}, {result.ci_upper:.{precision}f}]"
