"""Risk scoring helpers for vulnerability findings."""

from __future__ import annotations

from typing import Any, Dict, List


SEVERITY_POINTS = {
    "Critical": 10,
    "High": 7,
    "Medium": 5,
    "Low": 2,
}

SEVERITY_COLORS = {
    "Critical": "Red",
    "High": "Orange",
    "Medium": "Yellow",
    "Low": "Green",
}


def calculate_network_risk(findings: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Calculate aggregate risk and network security score out of 100."""
    severity_summary = {"Critical": 0, "High": 0, "Medium": 0, "Low": 0}
    total_risk_score = 0

    for finding in findings:
        severity = str(finding.get("severity", "Low")).title()
        if severity not in severity_summary:
            severity = "Low"

        severity_summary[severity] += 1
        total_risk_score += SEVERITY_POINTS[severity]

    network_security_score = max(0, 100 - total_risk_score)

    return {
        "total_risk_score": total_risk_score,
        "network_security_score": network_security_score,
        "severity_summary": severity_summary,
        "severity_points": SEVERITY_POINTS,
        "severity_colors": SEVERITY_COLORS,
    }
