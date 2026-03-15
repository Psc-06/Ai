"""OWASP Top 10 mapping utilities for scan findings."""

from __future__ import annotations

from datetime import datetime
import re
from typing import Any, Dict, List

from pymongo.errors import PyMongoError

import db_connector
import owasp_catalog
import vulnerability_mapper


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
    analyzed = vulnerability_mapper.analyze_scan_document(scan_results)
    port_findings = analyzed.get("findings", [])

    grouped: Dict[str, Dict[str, Any]] = {}
    for port_finding in port_findings:
        category_label = str(port_finding.get("owasp_category", "A05 - Security Misconfiguration"))
        match = re.match(r"^(A\d+)", category_label)
        category_code = match.group(1) if match else "A05"

        if category_label not in grouped:
            grouped[category_label] = {
                "owasp_code": category_code,
                "category": category_label,
                "matched_indicators": [],
                "severity": "Low",
            }

        grouped[category_label]["matched_indicators"].append(
            map_port_to_indicator(int(port_finding.get("port", 0)))
        )

        current_severity = str(port_finding.get("severity", "Low"))
        ranked = {"Low": 1, "Medium": 2, "High": 3, "Critical": 4}
        existing_severity = str(grouped[category_label].get("severity", "Low"))
        if ranked.get(current_severity, 1) > ranked.get(existing_severity, 1):
            grouped[category_label]["severity"] = current_severity

    catalog = owasp_catalog.get_owasp_catalog()
    owasp_findings: List[Dict[str, Any]] = []
    for category_label, grouped_item in grouped.items():
        category_code = str(grouped_item.get("owasp_code", "A05"))
        meta = catalog.get(category_code, {})
        finding = {
            "owasp_code": category_code,
            "category": category_label,
            "severity": grouped_item.get("severity", meta.get("severity", "Medium")),
            "matched_indicators": sorted(set(grouped_item.get("matched_indicators", []))),
            "scan_id": scan_results.get("scan_id"),
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "description": meta.get("description", ""),
            "impact": meta.get("impact", ""),
        }
        owasp_findings.append(finding)

    try:
        db = db_connector.get_database()
        if owasp_findings:
            db[db_connector.OWASP_FINDINGS_COLLECTION].insert_many(owasp_findings)
    except PyMongoError as exc:
        raise RuntimeError(f"Failed to save OWASP findings: {exc}") from exc

    return owasp_findings
