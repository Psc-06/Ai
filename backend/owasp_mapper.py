"""OWASP Top 10 mapping utilities for scan findings."""

from __future__ import annotations

from datetime import datetime
from typing import Any, Dict, List

from pymongo.errors import PyMongoError

import db_connector


OWASP_CATEGORIES = {
    "A01:2021 - Broken Access Control": {
        "indicators": [
            "open_port_3306",  # MySQL
            "open_port_5432",  # PostgreSQL
            "open_port_1433",  # MS SQL
        ],
        "severity": "CRITICAL",
        "description": "Database ports exposed to network",
    },
    "A02:2021 - Cryptographic Failures": {
        "indicators": ["ssl_tls_1.0", "ssl_tls_1.1", "weak_cipher"],
        "severity": "HIGH",
    },
    "A05:2021 - Security Misconfiguration": {
        "indicators": [
            "open_port_3389",  # RDP
            "open_port_21",  # FTP
            "open_port_23",  # Telnet
        ],
        "severity": "CRITICAL",
    },
    "A06:2021 - Vulnerable Components": {
        "indicators": ["outdated_software", "cve_critical"],
        "severity": "HIGH",
    },
}


def map_port_to_indicator(port_number: int) -> str:
    """Convert a port number into an OWASP indicator key."""
    return f"open_port_{int(port_number)}"


def categorize_findings(scan_results: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Map scan findings to OWASP categories and store the results in MongoDB.

    Args:
        scan_results: Scan payload with hosts and ports, typically from scanner.scan_network.

    Returns:
        List of OWASP finding dictionaries including matched indicators and severity.
    """
    hosts = scan_results.get("hosts", [])
    detected_indicators = set()

    for host in hosts:
        for port_info in host.get("ports", []):
            state = str(port_info.get("state", "")).lower()
            if state == "open":
                indicator = map_port_to_indicator(int(port_info.get("port", 0)))
                detected_indicators.add(indicator)

    owasp_findings: List[Dict[str, Any]] = []
    for category_name, category_meta in OWASP_CATEGORIES.items():
        category_indicators = set(category_meta.get("indicators", []))
        matched = sorted(detected_indicators.intersection(category_indicators))

        if matched:
            finding = {
                "category": category_name,
                "severity": category_meta.get("severity", "MEDIUM"),
                "matched_indicators": matched,
                "scan_id": scan_results.get("scan_id"),
                "timestamp": datetime.utcnow().isoformat() + "Z",
            }
            if "description" in category_meta:
                finding["description"] = category_meta["description"]
            owasp_findings.append(finding)

    try:
        db = db_connector.get_database()
        if owasp_findings:
            db[db_connector.OWASP_FINDINGS_COLLECTION].insert_many(owasp_findings)
    except PyMongoError as exc:
        raise RuntimeError(f"Failed to save OWASP findings: {exc}") from exc

    return owasp_findings
