"""PDF report generation helpers for BankShield."""

from __future__ import annotations

from io import BytesIO
from typing import Any, Dict, Iterable, List

from reportlab.lib.pagesizes import letter
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas


LEFT_MARGIN = 0.75 * inch
TOP_MARGIN = 0.75 * inch
LINE_HEIGHT = 14
BOTTOM_MARGIN = 0.75 * inch


def _new_page(pdf: canvas.Canvas) -> float:
    pdf.showPage()
    pdf.setFont("Helvetica", 10)
    return letter[1] - TOP_MARGIN


def _write_line(pdf: canvas.Canvas, text: str, y_pos: float, *, font: str = "Helvetica", size: int = 10) -> float:
    pdf.setFont(font, size)
    pdf.drawString(LEFT_MARGIN, y_pos, text)
    return y_pos - LINE_HEIGHT


def _write_wrapped(pdf: canvas.Canvas, text: str, y_pos: float, max_width: int = 95) -> float:
    remaining = text.strip()
    while remaining:
        if y_pos <= BOTTOM_MARGIN:
            y_pos = _new_page(pdf)

        line = remaining[:max_width]
        split_at = line.rfind(" ") if len(remaining) > max_width else len(line)
        if split_at <= 0:
            split_at = len(line)

        current = remaining[:split_at].strip()
        remaining = remaining[split_at:].strip()
        y_pos = _write_line(pdf, current, y_pos)

    return y_pos


def _iter_host_lines(scan_doc: Dict[str, Any]) -> Iterable[str]:
    for host in scan_doc.get("hosts", []):
        ip_address = host.get("ip", "unknown-host")
        hostname = host.get("hostname") or "no-hostname"
        yield f"Host: {ip_address} ({hostname})"

        for port in host.get("ports", []):
            version = f" {port.get('version')}" if port.get("version") else ""
            base = (
                f"  - {port.get('port', 'n/a')}/{port.get('protocol', 'tcp')} "
                f"{port.get('state', 'unknown')} {port.get('service', 'unknown')}{version}"
            )
            yield base

            risk = port.get("risk")
            if risk:
                yield f"      risk: {risk}"

            for cve in port.get("cves", []):
                cve_id = cve.get("cve_id") or cve.get("id") or "unknown-cve"
                severity = cve.get("severity", "UNKNOWN")
                score = cve.get("cvss_score")
                suffix = f" (CVSS {score})" if score is not None else ""
                yield f"      CVE: {cve_id} [{severity}]{suffix}"


def build_pdf_report(scan_doc: Dict[str, Any], findings: List[Dict[str, Any]]) -> bytes:
    """Generate a PDF vulnerability report as bytes."""
    buffer = BytesIO()
    pdf = canvas.Canvas(buffer, pagesize=letter)
    y_pos = letter[1] - TOP_MARGIN

    y_pos = _write_line(pdf, "BankShield Vulnerability Report", y_pos, font="Helvetica-Bold", size=18)
    y_pos = _write_line(pdf, f"Scan ID: {scan_doc.get('scan_id', 'unknown')}", y_pos - 6)
    y_pos = _write_line(pdf, f"Network Range: {scan_doc.get('network_range', 'unknown')}", y_pos)
    y_pos = _write_line(pdf, f"Generated At: {scan_doc.get('timestamp', 'unknown')}", y_pos)
    y_pos -= 10

    total_hosts = len(scan_doc.get("hosts", []))
    total_ports = sum(len(host.get("ports", [])) for host in scan_doc.get("hosts", []))
    total_cves = sum(
        len(port.get("cves", []))
        for host in scan_doc.get("hosts", [])
        for port in host.get("ports", [])
    )

    y_pos = _write_line(pdf, "Executive Summary", y_pos, font="Helvetica-Bold", size=13)
    y_pos = _write_line(pdf, f"Hosts discovered: {total_hosts}", y_pos)
    y_pos = _write_line(pdf, f"Open ports detected: {total_ports}", y_pos)
    y_pos = _write_line(pdf, f"Matched CVEs: {total_cves}", y_pos)
    y_pos = _write_line(pdf, f"OWASP findings: {len(findings)}", y_pos)
    y_pos -= 10

    y_pos = _write_line(pdf, "OWASP Findings", y_pos, font="Helvetica-Bold", size=13)
    if findings:
        for finding in findings:
            line = f"- {finding.get('category', 'Unknown')} [{finding.get('severity', 'UNKNOWN')}]"
            if y_pos <= BOTTOM_MARGIN:
                y_pos = _new_page(pdf)
            y_pos = _write_line(pdf, line, y_pos)
            description = finding.get("description")
            if description:
                y_pos = _write_wrapped(pdf, f"  {description}", y_pos)
    else:
        y_pos = _write_line(pdf, "No OWASP findings were stored for this scan.", y_pos)

    y_pos -= 10
    if y_pos <= BOTTOM_MARGIN:
        y_pos = _new_page(pdf)

    y_pos = _write_line(pdf, "Host and Service Details", y_pos, font="Helvetica-Bold", size=13)
    for line in _iter_host_lines(scan_doc):
        if y_pos <= BOTTOM_MARGIN:
            y_pos = _new_page(pdf)
        y_pos = _write_wrapped(pdf, line, y_pos)

    pdf.save()
    return buffer.getvalue()