"""Shared OWASP Top 10 catalog loader backed by database JSON."""

from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any, Dict


OWASP_CATALOG_PATH = Path(__file__).resolve().parent.parent / "database" / "owasp_categories.json"


@lru_cache(maxsize=1)
def get_owasp_catalog() -> Dict[str, Dict[str, Any]]:
    """Load OWASP Top 10 category metadata from database JSON."""
    if not OWASP_CATALOG_PATH.exists():
        raise FileNotFoundError(f"OWASP category file not found: {OWASP_CATALOG_PATH}")

    with OWASP_CATALOG_PATH.open("r", encoding="utf-8") as file:
        data = json.load(file)

    # Normalize keys to uppercase short codes like A01, A02, ...
    normalized: Dict[str, Dict[str, Any]] = {}
    for code, meta in data.items():
        normalized[str(code).upper()] = dict(meta)
    return normalized


def get_owasp_category(code: str) -> Dict[str, Any]:
    """Return category metadata for a short OWASP code."""
    catalog = get_owasp_catalog()
    return catalog.get(str(code).upper(), {})


def get_owasp_label(code: str) -> str:
    """Build human-readable OWASP label from code and catalog name."""
    normalized_code = str(code).upper()
    category = get_owasp_category(normalized_code)
    name = str(category.get("name", "Unknown Category"))
    return f"{normalized_code} - {name}"
