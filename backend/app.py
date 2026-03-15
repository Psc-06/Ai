"""Flask REST API for BankShield scanning and persistence."""

from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, List

from flask import Flask, jsonify, request, send_file
from flask_cors import CORS
from pymongo.errors import PyMongoError

import db_connector
import cve_checker
import owasp_mapper
import report_generator
import scanner


app = Flask(__name__)
# Enable CORS for all routes.
CORS(app)


@app.errorhandler(Exception)
def handle_unexpected_error(error: Exception):
    """Return a consistent JSON response for unhandled exceptions."""
    return jsonify({"error": "Internal server error", "details": str(error)}), 500


def _get_scan_document(scan_id: str) -> Dict[str, Any] | None:
    """Fetch a scan document by id from MongoDB."""
    db = db_connector.get_database()
    scan_doc = db[db_connector.SCAN_RESULTS_COLLECTION].find_one({"scan_id": scan_id})
    if scan_doc:
        scan_doc.pop("_id", None)
    return scan_doc


def _get_owasp_findings(scan_id: str) -> List[Dict[str, Any]]:
    """Fetch OWASP findings for a scan and remove MongoDB ids."""
    db = db_connector.get_database()
    findings_cursor = db[db_connector.OWASP_FINDINGS_COLLECTION].find({"scan_id": scan_id})
    findings: List[Dict[str, Any]] = []
    for finding in findings_cursor:
        finding.pop("_id", None)
        findings.append(finding)
    return findings


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
        scan_doc = _get_scan_document(scan_id)

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

        return jsonify(scan_doc), 200
    except PyMongoError as exc:
        return jsonify({"error": "Database error", "details": str(exc)}), 500


@app.route("/api/owasp/report/<scan_id>", methods=["GET"])
def get_owasp_report(scan_id: str):
    """Return OWASP categorized findings for a scan with summary counts."""
    try:
        findings = _get_owasp_findings(scan_id)
        category_counts: Dict[str, int] = {}

        for finding in findings:
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


@app.route("/api/reports/<scan_id>/pdf", methods=["GET"])
def export_pdf_report(scan_id: str):
    """Generate a PDF report for a completed scan and return it as a download."""
    try:
        scan_doc = _get_scan_document(scan_id)
        if not scan_doc:
            return jsonify({"error": "Scan result not found", "scan_id": scan_id}), 404

        findings = _get_owasp_findings(scan_id)
        pdf_bytes = report_generator.build_pdf_report(scan_doc, findings)
        return send_file(
            BytesIO(pdf_bytes),
            as_attachment=True,
            download_name=f"{scan_id}-report.pdf",
            mimetype="application/pdf",
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
