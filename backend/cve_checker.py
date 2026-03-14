"""CVE matching and scan enrichment helpers."""

from __future__ import annotations

import copy
import re
from typing import Any, Dict, List, Optional, Tuple

import db_connector


def _normalize_software_name(name: str) -> str:
    """Normalize service names to dataset software names."""
    lowered = (name or "").strip().lower()
    mapping = {
        "mysql": "MySQL",
        "apache": "Apache",
        "apache httpd": "Apache",
        "httpd": "Apache",
        "openssl": "OpenSSL",
        "microsoft sql server": "Microsoft SQL Server",
        "ms sql server": "Microsoft SQL Server",
        "mssql": "Microsoft SQL Server",
        "ms-sql-s": "Microsoft SQL Server",
        "sql server": "Microsoft SQL Server",
    }
    return mapping.get(lowered, name.strip())


def _extract_version_parts(version: str) -> Optional[List[int]]:
    """Return numeric version parts or None if non-numeric version text."""
    if version is None:
        return None

    cleaned = version.strip()
    if not cleaned:
        return None

    if not re.fullmatch(r"\d+(?:\.\d+)*", cleaned):
        return None

    return [int(part) for part in cleaned.split(".")]


def _compare_versions(left: str, right: str) -> Optional[int]:
    """Compare semantic-ish dotted numeric versions.

    Returns:
        -1 if left < right
         0 if left == right
         1 if left > right
         None if versions are non-comparable.
    """
    l_parts = _extract_version_parts(left)
    r_parts = _extract_version_parts(right)

    if l_parts is None or r_parts is None:
        return None

    max_len = max(len(l_parts), len(r_parts))
    l_parts.extend([0] * (max_len - len(l_parts)))
    r_parts.extend([0] * (max_len - len(r_parts)))

    for l_val, r_val in zip(l_parts, r_parts):
        if l_val < r_val:
            return -1
        if l_val > r_val:
            return 1
    return 0


def _is_version_affected(version: str, versions_affected: List[str]) -> bool:
    """Check whether a given version is within the affected version constraints."""
    if not version:
        return False

    if not versions_affected:
        return False

    # Direct exact match support.
    if version in versions_affected:
        return True

    # If two bounds are provided, treat as inclusive range.
    if len(versions_affected) >= 2:
        lower = str(versions_affected[0])
        upper = str(versions_affected[1])
        cmp_low = _compare_versions(version, lower)
        cmp_high = _compare_versions(version, upper)

        if cmp_low is not None and cmp_high is not None:
            return cmp_low >= 0 and cmp_high <= 0

    return False


def check_vulnerabilities(software: str, version: str) -> List[Dict[str, Any]]:
    """Query CVE database and return vulnerabilities matching software and version."""
    normalized_software = _normalize_software_name(software)
    db = db_connector.get_database()
    collection = db[db_connector.CVE_DATABASE_COLLECTION]

    # Case-insensitive match for software names from Nmap output.
    cursor = collection.find({"software": {"$regex": f"^{re.escape(normalized_software)}$", "$options": "i"}})

    matches: List[Dict[str, Any]] = []
    for cve_doc in cursor:
        affected_versions = cve_doc.get("versions_affected", [])
        if _is_version_affected(version, affected_versions):
            match = {
                "cve_id": cve_doc.get("cve_id"),
                "software": cve_doc.get("software"),
                "severity": cve_doc.get("severity"),
                "cvss_score": cve_doc.get("cvss_score"),
                "description": cve_doc.get("description"),
                "published_date": cve_doc.get("published_date"),
            }
            matches.append(match)

    return matches


def parse_service_version(service_string: str) -> Tuple[str, str]:
    """Extract software and version from Nmap-style service text.

    Examples:
        MySQL 5.7.42 -> (MySQL, 5.7.42)
        Apache/2.4.49 -> (Apache, 2.4.49)
    """
    raw = (service_string or "").strip()
    if not raw:
        return "", ""

    slash_match = re.match(r"^([A-Za-z][A-Za-z0-9\s\-]*)\s*/\s*(\d+(?:\.\d+)*)", raw)
    if slash_match:
        software = _normalize_software_name(slash_match.group(1))
        return software, slash_match.group(2)

    space_match = re.match(r"^([A-Za-z][A-Za-z0-9\s\-]*)\s+(\d+(?:\.\d+)*)", raw)
    if space_match:
        software = _normalize_software_name(space_match.group(1))
        return software, space_match.group(2)

    # Fallback if no version token is present.
    return _normalize_software_name(raw), ""


def enrich_scan_with_cves(scan_results: Dict[str, Any]) -> Dict[str, Any]:
    """Add CVE matches to each detected service in scan results."""
    enriched_results = copy.deepcopy(scan_results)

    for host in enriched_results.get("hosts", []):
        for port in host.get("ports", []):
            service = str(port.get("service", ""))
            version = str(port.get("version", ""))

            if version:
                service_string = f"{service} {version}".strip()
            else:
                service_string = service

            software, parsed_version = parse_service_version(service_string)

            if software and parsed_version:
                cves = check_vulnerabilities(software, parsed_version)
            else:
                cves = []

            port["cves"] = cves

    return enriched_results
