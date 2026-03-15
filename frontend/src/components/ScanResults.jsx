/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Monitor, ChevronDown, ChevronRight, AlertTriangle, Shield, Server, Globe, Loader2, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SEVERITY_STYLES = {
  critical: { badge: 'bg-red-500/10 text-red-400 border-red-500/30', dot: 'bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]' },
  high:     { badge: 'bg-orange-500/10 text-orange-400 border-orange-500/30', dot: 'bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.8)]' },
  medium:   { badge: 'bg-amber-500/10 text-amber-400 border-amber-500/30', dot: 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]' },
  low:      { badge: 'bg-blue-500/10 text-blue-400 border-blue-500/30', dot: 'bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.8)]' },
  info:     { badge: 'bg-slate-500/10 text-slate-400 border-slate-500/30', dot: 'bg-slate-500 shadow-[0_0_8px_rgba(100,116,139,0.8)]' },
};

function getSeverityStyle(severity) {
  return SEVERITY_STYLES[(severity || 'info').toLowerCase()] ?? SEVERITY_STYLES.info;
}

const cardVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

function CveCard({ cve }) {
  const [expanded, setExpanded] = useState(false);
  const style = getSeverityStyle(cve.severity);

  return (
    <motion.div layout className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
      <motion.button
        layout="position"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/5 text-left transition-colors group"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${style.dot}`} />
        <span className="font-mono text-sm font-semibold text-slate-200 flex-1">{cve.id}</span>
        {cve.cvss_score != null && (
          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-widest border ${style.badge}`}>
            CVSS {Number(cve.cvss_score).toFixed(1)}
          </span>
        )}
        <span className={`px-2.5 py-0.5 rounded-full text-[10px] uppercase font-bold tracking-widest border ${style.badge}`}>
          {cve.severity || 'info'}
        </span>
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expanded && cve.description && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 bg-black/40 text-sm text-slate-400 border-t border-white/5 leading-relaxed">
              {cve.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function PortRow({ port }) {
  const [open, setOpen] = useState(false);
  const cveCount = port.cves?.length ?? 0;

  return (
    <motion.div layout className="border border-white/5 rounded-xl overflow-hidden bg-black/20">
      <motion.button
        layout="position"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-4 px-5 py-4 hover:bg-white/5 text-left transition-colors group relative"
      >
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-blue-500/0 opacity-0 group-hover:opacity-100 transition-opacity" />
        <Globe className="h-4 w-4 text-blue-400/70 flex-shrink-0" />
        <span className="font-mono text-sm font-bold text-slate-200 w-20 flex-shrink-0">
          {port.port}/{port.protocol || 'tcp'}
        </span>
        <span className="text-sm text-slate-400 flex-1 truncate">{port.service || 'unknown'}</span>
        <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold capitalize flex-shrink-0 border ${
          (port.state || 'open') === 'open'
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-slate-800 border-white/5 text-slate-400'
        }`}>
          {port.state || 'open'}
        </span>
        {cveCount > 0 ? (
          <span className="px-3 py-1 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-bold tracking-wide flex-shrink-0">
            {cveCount} CVE{cveCount !== 1 ? 's' : ''}
          </span>
        ) : (
          <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold tracking-wide flex-shrink-0 opacity-70">
            CLEAN
          </span>
        )}
        <motion.div animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-4 w-4 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {open && cveCount > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-5 py-4 space-y-2 bg-black/40 border-t border-white/5">
              {port.cves.map((cve, i) => (
                <CveCard key={cve.id ?? i} cve={cve} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function HostCard({ host }) {
  const [expanded, setExpanded] = useState(true);
  const totalCves = (host.ports || []).reduce((sum, p) => sum + (p.cves?.length ?? 0), 0);

  return (
    <motion.div variants={cardVariants} layout className="bg-zinc-900/40 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md shadow-xl group">
      <motion.button
        layout="position"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-4 px-6 py-5 hover:bg-white/5 text-left transition-all"
      >
        <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/20">
          <Monitor className="h-5 w-5 text-blue-400 flex-shrink-0 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]" />
        </div>
        <span className="font-mono text-lg font-bold text-slate-100 tracking-tight drop-shadow-sm">{host.ip}</span>
        <span className="text-sm font-medium text-slate-500 flex-1 ml-2">
          {host.ports?.length ?? 0} open port{host.ports?.length !== 1 ? 's' : ''}
        </span>
        {totalCves > 0 ? (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl text-xs font-bold tracking-wider flex-shrink-0 shadow-[0_0_15px_rgba(239,68,68,0.1)]">
            <AlertTriangle className="h-3.5 w-3.5" />
            {totalCves} VULN{totalCves !== 1 ? 'S' : ''}
          </span>
        ) : (
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs font-bold tracking-wider flex-shrink-0">
            <Shield className="h-3.5 w-3.5" />
            SECURE
          </span>
        )}
        <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
          <ChevronDown className="h-5 w-5 text-slate-500 group-hover:text-slate-300 transition-colors flex-shrink-0 ml-2" />
        </motion.div>
      </motion.button>
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 pt-2 space-y-3 border-t border-white/5 bg-black/20">
              {host.ports?.length ? (
                host.ports.map((port, i) => (
                  <PortRow key={`${port.port}-${i}`} port={port} />
                ))
              ) : (
                <p className="text-sm text-slate-500 py-4 font-medium text-center bg-black/20 rounded-xl border border-white/5">No active ports identified.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default function ScanResults({ scanId, data, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-slate-400">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="relative"
        >
          <div className="absolute inset-0 bg-blue-500/20 rounded-full blur-2xl flex-shrink-0" />
          <Loader2 className="h-10 w-10 animate-spin text-blue-400 relative z-10" />
        </motion.div>
        <p className="font-mono text-sm tracking-widest text-blue-400/80 uppercase">Processing Telemetry...</p>
      </div>
    );
  }

  if (!data) {
    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center h-[60vh] gap-5 text-slate-500"
      >
        <div className="p-5 rounded-full bg-slate-800/50 border border-white/5 relative group">
          <div className="absolute inset-0 bg-slate-600/20 rounded-full blur-xl group-hover:bg-slate-600/30 transition-colors" />
          <Server className="h-12 w-12 text-slate-600 relative z-10" />
        </div>
        <p className="font-medium">No intel gathered yet. Initiate a scan vector.</p>
      </motion.div>
    );
  }

  const hosts = data.hosts || [];
  const totalPorts = hosts.reduce((s, h) => s + (h.ports?.length ?? 0), 0);
  const totalCves = hosts.reduce((s, h) => s + (h.ports || []).reduce((ps, p) => ps + (p.cves?.length ?? 0), 0), 0);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="w-full space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/5 pb-6">
        <div>
          <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
            Reconnaissance Report
          </h2>
          <p className="text-emerald-400/80 text-sm mt-2 font-mono flex items-center gap-2">
            <Activity className="h-4 w-4" />
            <span className="tracking-widest">NETWORK: {data.network_range}</span>
          </p>
        </div>
        {data.timestamp && (
          <div className="text-right">
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1">Time of Scan</p>
            <p className="font-mono text-sm text-slate-300 bg-white/5 px-3 py-1.5 rounded-lg border border-white/5 inline-block">
              {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      {/* Summary stats */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-5"
      >
        {[
          { label: 'Active Targets', value: hosts.length, color: 'text-blue-400', glow: 'shadow-[0_0_30px_rgba(59,130,246,0.1)]' },
          { label: 'Ports Exposed',  value: totalPorts,   color: 'text-amber-400', glow: 'shadow-[0_0_30px_rgba(251,191,36,0.1)]' },
          {
            label: 'Vulnerabilities',
            value: totalCves,
            color: totalCves > 0 ? 'text-red-400' : 'text-emerald-400',
            glow: totalCves > 0 ? 'shadow-[0_0_30px_rgba(239,68,68,0.1)]' : 'shadow-[0_0_30px_rgba(16,185,129,0.1)]',
          },
        ].map(({ label, value, color, glow }) => (
          <motion.div 
            variants={cardVariants}
            key={label} 
            className={`bg-zinc-900/40 border border-white/10 rounded-2xl p-6 relative overflow-hidden backdrop-blur-md group ${glow}`}
          >
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl group-hover:bg-white/10 transition-colors" />
            <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">{label}</p>
            <p className={`text-4xl font-black ${color} tracking-tight drop-shadow-md`}>{value}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Host list */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="space-y-4"
      >
        <h3 className="text-lg font-semibold text-white/90 mb-4 px-1">Detected Hosts</h3>
        {hosts.length === 0 ? (
          <motion.div variants={cardVariants} className="text-center py-16 text-slate-500 bg-zinc-900/40 border border-white/10 rounded-2xl backdrop-blur-md">
            No live hosts responded in the targeted range.
          </motion.div>
        ) : (
          hosts.map((host, i) => (
            <HostCard key={host.ip ?? i} host={host} />
          ))
        )}
      </motion.div>
    </div>
  );
}
