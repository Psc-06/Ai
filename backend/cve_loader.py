"""CVE sample data loader for BankShield demos."""

from __future__ import annotations

from typing import Any, Dict, List

import db_connector


def download_sample_cves() -> List[Dict[str, Any]]:
    """Return sample CVE data for common banking stack software."""
    return [
        {
            "cve_id": "CVE-2023-11001",
            "software": "MySQL",
            "versions_affected": ["5.7.0", "5.7.42"],
            "severity": "CRITICAL",
            "cvss_score": 9.8,
            "description": "Remote code execution vulnerability in MySQL plugin handling.",
            "published_date": "2023-05-15",
        },
        {
            "cve_id": "CVE-2022-11002",
            "software": "MySQL",
            "versions_affected": ["5.7.12", "5.7.38"],
            "severity": "HIGH",
            "cvss_score": 8.1,
            "description": "Privilege escalation issue in MySQL authentication path.",
            "published_date": "2022-11-03",
        },
        {
            "cve_id": "CVE-2021-11003",
            "software": "MySQL",
            "versions_affected": ["5.7.9", "5.7.36"],
            "severity": "HIGH",
            "cvss_score": 7.8,
            "description": "Denial of service via crafted replication traffic.",
            "published_date": "2021-09-20",
        },
        {
            "cve_id": "CVE-2020-11004",
            "software": "MySQL",
            "versions_affected": ["5.7.5", "5.7.30"],
            "severity": "MEDIUM",
            "cvss_score": 6.5,
            "description": "Information disclosure through improper error handling.",
            "published_date": "2020-07-09",
        },
        {
            "cve_id": "CVE-2023-22001",
            "software": "Apache",
            "versions_affected": ["2.2.0", "2.2.34"],
            "severity": "CRITICAL",
            "cvss_score": 9.0,
            "description": "Path traversal leading to unauthorized file access.",
            "published_date": "2023-03-11",
        },
        {
            "cve_id": "CVE-2022-22002",
            "software": "Apache",
            "versions_affected": ["2.4.7", "2.4.49"],
            "severity": "CRITICAL",
            "cvss_score": 9.8,
            "description": "Remote code execution due to request normalization bypass.",
            "published_date": "2022-10-06",
        },
        {
            "cve_id": "CVE-2021-22003",
            "software": "Apache",
            "versions_affected": ["2.4.0", "2.4.46"],
            "severity": "HIGH",
            "cvss_score": 8.2,
            "description": "Request smuggling vulnerability in proxy module.",
            "published_date": "2021-08-14",
        },
        {
            "cve_id": "CVE-2020-22004",
            "software": "Apache",
            "versions_affected": ["2.2.15", "2.2.31"],
            "severity": "MEDIUM",
            "cvss_score": 6.1,
            "description": "Open redirect weakness in URI parsing flow.",
            "published_date": "2020-06-02",
        },
        {
            "cve_id": "CVE-2023-33001",
            "software": "OpenSSL",
            "versions_affected": ["1.0.2", "1.0.2u"],
            "severity": "CRITICAL",
            "cvss_score": 9.1,
            "description": "Memory corruption in certificate parsing routine.",
            "published_date": "2023-04-18",
        },
        {
            "cve_id": "CVE-2022-33002",
            "software": "OpenSSL",
            "versions_affected": ["1.1.1", "1.1.1t"],
            "severity": "HIGH",
            "cvss_score": 8.4,
            "description": "Denial of service via malformed TLS handshake packets.",
            "published_date": "2022-12-01",
        },
        {
            "cve_id": "CVE-2021-33003",
            "software": "OpenSSL",
            "versions_affected": ["1.1.0", "1.1.1k"],
            "severity": "HIGH",
            "cvss_score": 7.9,
            "description": "Signature verification bypass in edge-case validation.",
            "published_date": "2021-05-27",
        },
        {
            "cve_id": "CVE-2020-33004",
            "software": "OpenSSL",
            "versions_affected": ["1.0.1", "1.0.2r"],
            "severity": "MEDIUM",
            "cvss_score": 6.2,
            "description": "Side-channel leakage on specific cipher operations.",
            "published_date": "2020-02-13",
        },
        {
            "cve_id": "CVE-2023-44001",
            "software": "Microsoft SQL Server",
            "versions_affected": ["2016", "2019"],
            "severity": "CRITICAL",
            "cvss_score": 9.7,
            "description": "Remote code execution in SQL service endpoint.",
            "published_date": "2023-07-25",
        },
        {
            "cve_id": "CVE-2022-44002",
            "software": "Microsoft SQL Server",
            "versions_affected": ["2014", "2017"],
            "severity": "HIGH",
            "cvss_score": 8.8,
            "description": "Privilege escalation through unsafe CLR integration.",
            "published_date": "2022-09-13",
        },
        {
            "cve_id": "CVE-2021-44003",
            "software": "Microsoft SQL Server",
            "versions_affected": ["2012", "2016"],
            "severity": "HIGH",
            "cvss_score": 8.0,
            "description": "Authentication bypass under constrained delegation conditions.",
            "published_date": "2021-04-29",
        },
        {
            "cve_id": "CVE-2020-44004",
            "software": "Microsoft SQL Server",
            "versions_affected": ["2008", "2014"],
            "severity": "MEDIUM",
            "cvss_score": 6.4,
            "description": "Information disclosure from verbose SQL error messages.",
            "published_date": "2020-01-17",
        },
        {
            "cve_id": "CVE-2023-55001",
            "software": "Apache",
            "versions_affected": ["2.4.17", "2.4.52"],
            "severity": "HIGH",
            "cvss_score": 8.3,
            "description": "HTTP/2 stream reset abuse causing service instability.",
            "published_date": "2023-11-02",
        },
        {
            "cve_id": "CVE-2022-55002",
            "software": "OpenSSL",
            "versions_affected": ["3.0.0", "3.0.8"],
            "severity": "CRITICAL",
            "cvss_score": 9.3,
            "description": "Remote code execution via certificate name constraints parsing.",
            "published_date": "2022-10-31",
        },
        {
            "cve_id": "CVE-2021-55003",
            "software": "MySQL",
            "versions_affected": ["5.7.21", "5.7.41"],
            "severity": "HIGH",
            "cvss_score": 8.5,
            "description": "SQL parser flaw enabling controlled server crash.",
            "published_date": "2021-12-08",
        },
        {
            "cve_id": "CVE-2020-55004",
            "software": "Microsoft SQL Server",
            "versions_affected": ["2017", "2022"],
            "severity": "HIGH",
            "cvss_score": 8.6,
            "description": "Improper input validation in SQL Agent job execution.",
            "published_date": "2020-03-04",
        },
    ]


def load_cves_to_mongodb() -> int:
    """Load sample CVEs into MongoDB and return number of inserted documents."""
    cve_entries = download_sample_cves()
    db = db_connector.get_database()
    collection = db[db_connector.CVE_DATABASE_COLLECTION]

    # Compound index for efficient software/version queries.
    collection.create_index([("software", 1), ("versions_affected", 1)])

    if not cve_entries:
        return 0

    result = collection.insert_many(cve_entries)
    return len(result.inserted_ids)
