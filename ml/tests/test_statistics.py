"""Tests pour le module statistics."""

from __future__ import annotations

import numpy as np
import pytest

from rivaldevent_ml.statistics import (
    BootstrapResult,
    PermutationTestResult,
    bootstrap_ci,
    bootstrap_ci_per_profile,
    format_ci_for_md,
    paired_permutation_test,
)


def test_bootstrap_ci_basic():
    """Test bootstrap CI sur un échantillon simple."""
    values = [0.5, 0.6, 0.7, 0.8, 0.9]
    result = bootstrap_ci(values, n_iterations=1000, random_state=42)

    assert isinstance(result, BootstrapResult)
    assert result.n_iterations == 1000
    assert result.confidence_level == 0.95
    assert 0.5 <= result.mean <= 0.9
    assert result.ci_lower <= result.mean <= result.ci_upper


def test_bootstrap_ci_empty():
    """Test bootstrap CI sur échantillon vide."""
    result = bootstrap_ci([])
    assert result.mean == 0.0
    assert result.ci_lower == 0.0
    assert result.ci_upper == 0.0


def test_bootstrap_ci_custom_statistic():
    """Test bootstrap CI avec statistique personnalisée (médiane)."""
    values = [1.0, 2.0, 3.0, 4.0, 100.0]  # outlier
    result = bootstrap_ci(
        values, n_iterations=500, statistic_fn=np.median, random_state=42
    )
    # La médiane devrait être robuste à l'outlier
    assert 2.5 <= result.mean <= 3.5


def test_paired_permutation_test_basic():
    """Test permutation test apparié - différence claire."""
    # Méthode A systématiquement meilleure que B
    values_a = [0.8, 0.9, 0.85, 0.9, 0.8]
    values_b = [0.5, 0.6, 0.55, 0.6, 0.5]

    result = paired_permutation_test(
        values_a, values_b, n_permutations=2000, alternative="greater", random_state=42
    )

    assert isinstance(result, PermutationTestResult)
    assert result.n_permutations == 2000
    assert result.alternative == "greater"
    assert result.statistic > 0  # A > B en moyenne
    assert result.p_value < 0.05  # Significatif


def test_paired_permutation_test_no_difference():
    """Test permutation test - pas de différence."""
    values_a = [0.5, 0.6, 0.7]
    values_b = [0.5, 0.6, 0.7]

    result = paired_permutation_test(
        values_a, values_b, n_permutations=1000, alternative="two-sided", random_state=42
    )

    assert result.statistic == 0.0
    assert result.p_value == 1.0  # Impossible de rejeter H0


def test_paired_permutation_test_mismatched_lengths():
    """Test permutation test - longueurs différentes."""
    with pytest.raises(ValueError):
        paired_permutation_test([0.5, 0.6], [0.5])


def test_paired_permutation_test_alternative_less():
    """Test permutation test - alternative 'less'."""
    # B systématiquement meilleur que A - plus d'échantillons pour plus de puissance
    values_a = [0.2, 0.3, 0.25, 0.35, 0.3]
    values_b = [0.8, 0.9, 0.85, 0.9, 0.85]

    result = paired_permutation_test(
        values_a, values_b, n_permutations=2000, alternative="less", random_state=42
    )

    assert result.alternative == "less"
    assert result.statistic < 0
    assert result.p_value < 0.05


def test_bootstrap_ci_per_profile():
    """Test bootstrap CI par méthode à partir de valeurs par profil."""
    # 5 profils, 3 méthodes
    per_profile = [
        [0.8, 0.5, 0.6],  # profil 1
        [0.9, 0.6, 0.7],  # profil 2
        [0.85, 0.55, 0.65],  # profil 3
        [0.9, 0.6, 0.7],  # profil 4
        [0.8, 0.5, 0.6],  # profil 5
    ]

    results = bootstrap_ci_per_profile(per_profile, n_iterations=500, random_state=42)

    assert len(results) == 3  # 3 méthodes
    for res in results:
        assert isinstance(res, BootstrapResult)
        assert res.n_iterations == 500
        assert res.ci_lower <= res.mean <= res.ci_upper

    # Méthode 0 (première colonne) devrait avoir la moyenne la plus haute
    assert results[0].mean > results[1].mean
    assert results[0].mean > results[2].mean


def test_bootstrap_ci_per_profile_wrong_shape():
    """Test bootstrap CI par profil - forme incorrecte."""
    # 1D list should fail
    with pytest.raises(ValueError):
        bootstrap_ci_per_profile([0.5, 0.6])  # 1D

    # Empty list should fail
    with pytest.raises(ValueError):
        bootstrap_ci_per_profile([])


def test_format_ci_for_md():
    """Test formatage Markdown d'un BootstrapResult."""
    result = BootstrapResult(
        mean=0.842,
        ci_lower=0.712,
        ci_upper=0.931,
        n_iterations=10000,
        confidence_level=0.95,
    )
    formatted = format_ci_for_md(result, precision=3)
    assert formatted == "0.842 [0.712, 0.931]"

    formatted2 = format_ci_for_md(result, precision=2)
    assert formatted2 == "0.84 [0.71, 0.93]"


def test_as_dict_methods():
    """Test sérialisation en dict."""
    boot = BootstrapResult(0.5, 0.3, 0.7, 1000, 0.95)
    assert boot.as_dict() == {
        "mean": 0.5,
        "ci_lower": 0.3,
        "ci_upper": 0.7,
        "n_iterations": 1000,
        "confidence_level": 0.95,
    }

    perm = PermutationTestResult(0.2, 0.03, 5000, "two-sided")
    assert perm.as_dict() == {
        "statistic": 0.2,
        "p_value": 0.03,
        "n_permutations": 5000,
        "alternative": "two-sided",
    }


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
