import React, { useState } from 'react';
import { Monitor, ChevronDown, ChevronRight, AlertTriangle, Shield, Server, Globe, Loader2 } from 'lucide-react';

const SEVERITY_STYLES = {
  critical: { badge: 'bg-red-900/50 text-red-300 border-red-700/50', dot: 'bg-red-500' },
  high:     { badge: 'bg-orange-900/50 text-orange-300 border-orange-700/50', dot: 'bg-orange-500' },
  medium:   { badge: 'bg-yellow-900/50 text-yellow-300 border-yellow-700/50', dot: 'bg-yellow-500' },
  low:      { badge: 'bg-blue-900/50 text-blue-300 border-blue-700/50', dot: 'bg-blue-500' },
  info:     { badge: 'bg-slate-700/50 text-slate-300 border-slate-600', dot: 'bg-slate-500' },
};

function getSeverityStyle(severity) {
  return SEVERITY_STYLES[(severity || 'info').toLowerCase()] ?? SEVERITY_STYLES.info;
}

function CveCard({ cve }) {
  const [expanded, setExpanded] = useState(false);
  const style = getSeverityStyle(cve.severity);

  return (
    <div className="border border-slate-700 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 bg-slate-800 hover:bg-slate-700/60 text-left transition-colors"
      >
        <span className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className="font-mono text-sm font-medium text-slate-200 flex-1">{cve.id}</span>
        {cve.cvss_score != null && (
          <span className={`px-2 py-0.5 rounded text-xs font-medium border ${style.badge}`}>
            CVSS {Number(cve.cvss_score).toFixed(1)}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded text-xs font-medium border capitalize ${style.badge}`}>
          {cve.severity || 'info'}
        </span>
        {expanded
          ? <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
          : <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />}
      </button>
      {expanded && cve.description && (
        <div className="px-4 py-3 bg-slate-900/60 text-sm text-slate-400 border-t border-slate-700 leading-relaxed">
          {cve.description}
        </div>
      )}
    </div>
  );
}

function PortRow({ port }) {
  const [open, setOpen] = useState(false);
  const cveCount = port.cves?.length ?? 0;

  return (
    <div className="border border-slate-700 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3.5 bg-slate-800/60 hover:bg-slate-800 text-left transition-colors"
      >
        <Globe className="h-4 w-4 text-slate-500 flex-shrink-0" />
        <span className="font-mono text-sm font-bold text-slate-200 w-20 flex-shrink-0">
          {port.port}/{port.protocol || 'tcp'}
        </span>
        <span className="text-sm text-slate-400 flex-1 truncate">{port.service || 'unknown'}</span>
        <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize flex-shrink-0 ${
          (port.state || 'open') === 'open'
            ? 'bg-green-900/30 text-green-400'
            : 'bg-slate-700 text-slate-400'
        }`}>
          {port.state || 'open'}
        </span>
        {cveCount > 0 ? (
          <span className="px-2 py-0.5 bg-red-900/40 border border-red-700/40 text-red-300 rounded text-xs flex-shrink-0">
            {cveCount} CVE{cveCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="px-2 py-0.5 bg-green-900/30 border border-green-700/30 text-green-400 rounded text-xs flex-shrink-0">
            Clean
          </span>
        )}
        {open
          ? <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
          : <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />}
      </button>
      {open && cveCount > 0 && (
        <div className="px-4 py-3 space-y-2 bg-slate-900/50 border-t border-slate-700">
          {port.cves.map((cve, i) => (
            <CveCard key={cve.id ?? i} cve={cve} />
          ))}
        </div>
      )}
    </div>
  );
}

function HostCard({ host }) {
  const [expanded, setExpanded] = useState(true);
  const totalCves = (host.ports || []).reduce((sum, p) => sum + (p.cves?.length ?? 0), 0);

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-700/40 text-left transition-colors"
      >
        <Monitor className="h-5 w-5 text-blue-400 flex-shrink-0" />
        <span className="font-mono font-bold text-slate-100">{host.ip}</span>
        <span className="text-sm text-slate-400 flex-1">
          {host.ports?.length ?? 0} open port{host.ports?.length !== 1 ? 's' : ''}
        </span>
        {totalCves > 0 ? (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-red-900/40 border border-red-700/40 text-red-300 rounded-lg text-xs flex-shrink-0">
            <AlertTriangle className="h-3 w-3" />
            {totalCves} vuln{totalCves !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-green-900/30 border border-green-700/30 text-green-400 rounded-lg text-xs flex-shrink-0">
            <Shield className="h-3 w-3" />
            Clean
          </span>
        )}
        {expanded
          ? <ChevronDown className="h-4 w-4 text-slate-500 flex-shrink-0" />
          : <ChevronRight className="h-4 w-4 text-slate-500 flex-shrink-0" />}
      </button>
      {expanded && (
        <div className="px-5 pb-5 pt-2 space-y-2 border-t border-slate-700">
          {host.ports?.length ? (
            host.ports.map((port, i) => (
              <PortRow key={`${port.port}-${i}`} port={port} />
            ))
          ) : (
            <p className="text-sm text-slate-500 py-3">No open ports found on this host.</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function ScanResults({ scanId, data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <p>Loading scan results…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <Server className="h-12 w-12" />
        <p>No results yet. Start a scan from the Scanner tab.</p>
      </div>
    );
  }

  const hosts = data.hosts || [];
  const totalPorts = hosts.reduce((s, h) => s + (h.ports?.length ?? 0), 0);
  const totalCves = hosts.reduce((s, h) => s + (h.ports || []).reduce((ps, p) => ps + (p.cves?.length ?? 0), 0), 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Scan Results</h2>
        <p className="text-slate-400 text-sm mt-1">
          <span className="font-mono">{data.network_range}</span>
          {data.timestamp && (
            <span className="ml-3 text-slate-500">
              {new Date(data.timestamp).toLocaleString()}
            </span>
          )}
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Hosts Discovered', value: hosts.length, color: 'text-blue-400' },
          { label: 'Open Ports',        value: totalPorts,   color: 'text-yellow-400' },
          {
            label: 'CVEs Found',
            value: totalCves,
            color: totalCves > 0 ? 'text-red-400' : 'text-green-400',
          },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
            <p className={`text-3xl font-bold ${color}`}>{value}</p>
            <p className="text-slate-400 text-sm mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Host list */}
      <div className="space-y-3">
        {hosts.length === 0 ? (
          <div className="text-center py-14 text-slate-500 bg-slate-800 border border-slate-700 rounded-2xl">
            No live hosts found in the scanned range.
          </div>
        ) : (
          hosts.map((host, i) => (
            <HostCard key={host.ip ?? i} host={host} />
          ))
        )}
      </div>
    </div>
  );
}
