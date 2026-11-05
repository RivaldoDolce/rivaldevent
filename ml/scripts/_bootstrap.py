"""Ajoute ``ml/src`` au chemin d'import pour executer les scripts sans install."""

from __future__ import annotations

import sys
from pathlib import Path

ML_ROOT = Path(__file__).resolve().parents[1]
SRC = ML_ROOT / "src"
if str(SRC) not in sys.path:
    sys.path.insert(0, str(SRC))
