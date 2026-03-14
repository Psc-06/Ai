"""Flask REST API for BankShield scanning and persistence."""

from __future__ import annotations

from typing import Any, Dict

from flask import Flask, jsonify, request
from flask_cors import CORS
from pymongo.errors import PyMongoError

import db_connector
import cve_checker
import owasp_mapper
import scanner


app = Flask(__name__)
# Enable CORS for all routes.
CORS(app)


@app.errorhandler(Exception)
def handle_unexpected_error(error: Exception):
    """Return a consistent JSON response for unhandled exceptions."""
    return jsonify({"error": "Internal server error", "details": str(error)}), 500


@app.route("/api/scan/start", methods=["POST"])
def start_scan():
    """Start a scan, store the result in MongoDB, and return completion status."""
    try:
        payload: Dict[str, Any] = request.get_json(silent=True) or {}
        network_range = payload.get("network_range")
        ports = payload.get("ports")

        if not network_range or not ports:
            return (
                jsonify(
                    {
                        "error": "Invalid request body",
                        "details": "Both 'network_range' and 'ports' are required.",
                    }
                ),
                400,
            )

        scan_result = scanner.scan_network(str(network_range), str(ports))
        enriched_scan_result = cve_checker.enrich_scan_with_cves(scan_result)
        owasp_findings = owasp_mapper.categorize_findings(enriched_scan_result)

        db = db_connector.get_database()
        db[db_connector.SCAN_RESULTS_COLLECTION].insert_one(enriched_scan_result)

        return (
            jsonify(
                {
                    "scan_id": enriched_scan_result.get("scan_id"),
                    "status": "completed",
                    "owasp_findings_count": len(owasp_findings),
                }
            ),
            200,
        )
    except ValueError as exc:
        return jsonify({"error": "Validation failed", "details": str(exc)}), 400
    except RuntimeError as exc:
        return jsonify({"error": "Scan failed", "details": str(exc)}), 500
    except PyMongoError as exc:
        return jsonify({"error": "Database error", "details": str(exc)}), 500


@app.route("/api/scan/results/<scan_id>", methods=["GET"])
def get_scan_results(scan_id: str):
    """Fetch a stored scan result by scan_id, including CVE data on ports."""
    try:
        db = db_connector.get_database()
        scan_doc = db[db_connector.SCAN_RESULTS_COLLECTION].find_one({"scan_id": scan_id})

        if not scan_doc:
            return jsonify({"error": "Scan result not found", "scan_id": scan_id}), 404

        # Backfill CVE data for older scans that were stored before enrichment.
        has_missing_cves = any(
            "cves" not in port
            for host in scan_doc.get("hosts", [])
            for port in host.get("ports", [])
        )
        if has_missing_cves:
            scan_doc = cve_checker.enrich_scan_with_cves(scan_doc)
            db[db_connector.SCAN_RESULTS_COLLECTION].replace_one(
                {"scan_id": scan_id},
                scan_doc,
            )

        # ObjectId is not JSON serializable; hide MongoDB internal id.
        scan_doc.pop("_id", None)
        return jsonify(scan_doc), 200
    except PyMongoError as exc:
        return jsonify({"error": "Database error", "details": str(exc)}), 500


@app.route("/api/owasp/report/<scan_id>", methods=["GET"])
def get_owasp_report(scan_id: str):
    """Return OWASP categorized findings for a scan with summary counts."""
    try:
        db = db_connector.get_database()
        findings_cursor = db[db_connector.OWASP_FINDINGS_COLLECTION].find({"scan_id": scan_id})
        findings = []
        category_counts: Dict[str, int] = {}

        for finding in findings_cursor:
            finding.pop("_id", None)
            findings.append(finding)

            category_name = str(finding.get("category", "Unknown"))
            category_counts[category_name] = category_counts.get(category_name, 0) + 1

        if not findings:
            return (
                jsonify(
                    {
                        "error": "OWASP findings not found",
                        "scan_id": scan_id,
                    }
                ),
                404,
            )

        return (
            jsonify(
                {
                    "scan_id": scan_id,
                    "total_findings": len(findings),
                    "counts_by_category": category_counts,
                    "findings": findings,
                }
            ),
            200,
        )
    except PyMongoError as exc:
        return jsonify({"error": "Database error", "details": str(exc)}), 500


@app.route("/api/health", methods=["GET"])
def health_check():
    """Check API and MongoDB health."""
    try:
        connected = db_connector.test_connection()
        if connected:
            return jsonify({"status": "ok", "database": "connected"}), 200

        return jsonify({"status": "error", "database": "disconnected"}), 500
    except Exception as exc:
        return jsonify({"error": "Health check failed", "details": str(exc)}), 500


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
