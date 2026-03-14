"""Network scanning utilities using python-nmap."""

from __future__ import annotations

from datetime import datetime
import ipaddress
from typing import Any, Dict, List

import nmap

DEFAULT_PORTS = "20-23,25,80,443,3306,1433,3389,5432,5900,8080"

CRITICAL_PORT_RISKS = {
    21: "FTP control port exposed. Credentials may be intercepted if plaintext auth is used.",
    23: "Telnet exposed. Remote administration traffic may be sent in plaintext.",
    3306: "MySQL service exposed. Database attacks or unauthorized data access may be possible.",
    1433: "Microsoft SQL Server exposed. Increases risk of brute-force and SQL service exploitation.",
    3389: "RDP exposed. Common target for brute-force and remote access attacks.",
    5900: "VNC exposed. Remote desktop access may be vulnerable to weak authentication.",
}


def _validate_ip_range(ip_range: str) -> None:
    """Validate target input as IP, CIDR, or simple last-octet range."""
    target = ip_range.strip()
    if not target:
        raise ValueError("Invalid IP range: value cannot be empty.")

    # Allow single IP or CIDR targets.
    try:
        ipaddress.ip_network(target, strict=False)
        return
    except ValueError:
        pass

    # Allow a simple range format like 192.168.1.10-20.
    if "-" in target:
        left, right = target.rsplit(".", 1)
        if "-" in right:
            start_end = right.split("-", maxsplit=1)
            if len(start_end) == 2 and all(part.isdigit() for part in start_end):
                start, end = map(int, start_end)
                if 0 <= start <= 255 and 0 <= end <= 255 and start <= end:
                    ipaddress.ip_address(f"{left}.0")
                    return

    raise ValueError(f"Invalid IP range: {ip_range}")


def flag_critical_ports(ports_list: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """Annotate scanned ports with criticality and risk information."""
    flagged_ports: List[Dict[str, Any]] = []
    for port_info in ports_list:
        port_number = int(port_info.get("port", 0))
        is_critical = port_number in CRITICAL_PORT_RISKS

        enriched = dict(port_info)
        enriched["is_critical"] = is_critical
        if is_critical:
            enriched["risk"] = CRITICAL_PORT_RISKS[port_number]

        flagged_ports.append(enriched)

    return flagged_ports


def scan_network(ip_range: str, ports: str = DEFAULT_PORTS) -> Dict[str, Any]:
    """Scan a network range and return discovered hosts and open ports.

    Error handling includes:
    - Nmap not installed
    - Invalid IP range
    - Network unreachable
    """
    _validate_ip_range(ip_range)

    try:
        scanner = nmap.PortScanner()
    except nmap.PortScannerError as exc:
        raise RuntimeError("Nmap not installed or not found in PATH.") from exc

    try:
        scanner.scan(hosts=ip_range, ports=ports, arguments="-sV")
    except nmap.PortScannerError as exc:
        msg = str(exc)
        if "Network is unreachable" in msg:
            raise RuntimeError("Network unreachable.") from exc
        raise RuntimeError(f"Nmap scan failed: {msg}") from exc
    except Exception as exc:  # Catch transport/subprocess-level failures.
        msg = str(exc)
        if "Network is unreachable" in msg:
            raise RuntimeError("Network unreachable.") from exc
        raise RuntimeError(f"Unexpected scan failure: {msg}") from exc

    scan_hosts: List[Dict[str, Any]] = []
    for host in scanner.all_hosts():
        host_ports: List[Dict[str, Any]] = []
        host_data = scanner[host]

        for protocol in host_data.all_protocols():
            ports_data = host_data[protocol]
            for port_number in sorted(ports_data.keys()):
                port_meta = ports_data[port_number]
                host_ports.append(
                    {
                        "port": int(port_number),
                        "state": port_meta.get("state", "unknown"),
                        "service": port_meta.get("name", "unknown"),
                        "version": port_meta.get("version", ""),
                    }
                )

        scan_hosts.append(
            {
                "ip": host,
                "hostname": host_data.hostname() or "",
                "ports": flag_critical_ports(host_ports),
            }
        )

    return {
        "scan_id": f"scan_{datetime.utcnow().strftime('%Y%m%d%H%M%S')}",
        "network_range": ip_range,
        "hosts": scan_hosts,
    }
