/* eslint-disable no-unused-vars */
import React, { useState, useEffect } from 'react';
import { Monitor, ChevronDown, AlertTriangle, Shield, Server, Globe, Loader2, Activity, Radar, ShieldAlert, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Count-up hook ───────────────────────────────────────────────── */
function useCountUp(target, duration = 1100) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    if (typeof target !== 'number' || target === 0) { setValue(0); return; }
    let start = null;
    let rafId;
    const step = (ts) => {
      if (!start) start = ts;
      const progress = Math.min((ts - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setValue(Math.round(eased * target));
      if (progress < 1) rafId = requestAnimationFrame(step);
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [target, duration]);
  return value;
}

/* ── Circular gauge ring ─────────────────────────────────────────── */
function GaugeRing({ score = 0, size = 108 }) {
  const r = 42;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.max(0, Math.min(100, score)) / 100);
  const color = score >= 80 ? '#34d399' : score >= 60 ? '#f59e0b' : '#f87171';
  const countedScore = useCountUp(score);
  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" aria-label={`Security score ${score}`}>
        {/* Track */}
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="9" />
        {/* Arc */}
        <motion.circle
          cx="50" cy="50" r={r}
          fill="none"
          stroke={color}
          strokeWidth="9"
          strokeLinecap="round"
          strokeDasharray={circ}
          initial={{ strokeDashoffset: circ }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.3, ease: [0.22, 1, 0.36, 1] }}
          className="gauge-arc"
          style={{ filter: `drop-shadow(0 0 7px ${color})` }}
        />
        {/* Tick marks */}
        {[0, 25, 50, 75].map((pct) => {
          const angle = (pct / 100) * 360 - 90;
          const rad = (angle * Math.PI) / 180;
          const x1 = 50 + (r - 5) * Math.cos(rad);
          const y1 = 50 + (r - 5) * Math.sin(rad);
          const x2 = 50 + (r + 2) * Math.cos(rad);
          const y2 = 50 + (r + 2) * Math.sin(rad);
          return <line key={pct} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255,255,255,0.15)" strokeWidth="1.5" />;
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-mono text-xl font-black leading-none" style={{ color }}>
          {countedScore}
        </span>
        <span className="text-[8px] font-bold uppercase tracking-widest text-slate-500 mt-0.5">score</span>
      </div>
    </div>
  );
}

/* ── Network topology background motif ───────────────────────────── */
function NetworkTopologyBg() {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.12]"
      viewBox="0 0 320 400"
      fill="none"
      aria-hidden="true"
      preserveAspectRatio="xMidYMid slice"
    >
      {/* Edges */}
      <line x1="60"  y1="80"  x2="160" y2="140" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="4 5" />
      <line x1="160" y1="140" x2="260" y2="90"  stroke="#818cf8" strokeWidth="0.8" strokeDasharray="4 5" />
      <line x1="160" y1="140" x2="120" y2="240" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="4 5" />
      <line x1="120" y1="240" x2="210" y2="300" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="4 5" />
      <line x1="160" y1="140" x2="210" y2="300" stroke="#818cf8" strokeWidth="0.5" strokeDasharray="3 7" opacity="0.5" />
      <line x1="60"  y1="80"  x2="120" y2="240" stroke="#6366f1" strokeWidth="0.5" strokeDasharray="3 7" opacity="0.4" />
      <line x1="260" y1="90"  x2="280" y2="210" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="4 5" />
      <line x1="280" y1="210" x2="210" y2="300" stroke="#818cf8" strokeWidth="0.8" strokeDasharray="4 5" />
      {/* Hub node */}
      <circle cx="160" cy="140" r="7" fill="#818cf8" className="network-node" />
      <circle cx="160" cy="140" r="14" stroke="#818cf8" strokeWidth="0.6" fill="none" opacity="0.35" />
      {/* Leaf nodes */}
      <circle cx="60"  cy="80"  r="4.5" fill="#6366f1" className="network-node-b" />
      <circle cx="260" cy="90"  r="4.5" fill="#6366f1" className="network-node-c" />
      <circle cx="120" cy="240" r="5"   fill="#f87171" className="network-node" />
      <circle cx="210" cy="300" r="4"   fill="#f59e0b" className="network-node-b" />
      <circle cx="280" cy="210" r="3.5" fill="#6366f1" className="network-node-c" />
      {/* Tiny dots */}
      <circle cx="60"  cy="80"  r="10" stroke="#6366f1" strokeWidth="0.5" fill="none" opacity="0.25" />
      <circle cx="120" cy="240" r="9"  stroke="#f87171" strokeWidth="0.5" fill="none" opacity="0.2" />
    </svg>
  );
}

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

/* ── Animated stat card with count-up ───────────────────────────────── */
function AnimatedStatCard({ label, value, color, glow, accentBg, accentBorder }) {
  const counted = useCountUp(value);
  return (
    <motion.div
      whileHover={{ y: -3 }}
      variants={cardVariants}
      className={`panel-premium group relative overflow-hidden rounded-2xl p-4 ${glow}`}
    >
      <div className={`absolute -bottom-8 -right-8 w-28 h-28 rounded-full blur-2xl transition-colors duration-500 ${accentBg} group-hover:opacity-150`} />
      {/* Accent corner bar */}
      <div className={`absolute top-0 right-0 w-12 h-1 rounded-bl-full ${accentBg} border-b ${accentBorder} opacity-80`} />
      <p className="mb-1 text-[11px] uppercase font-bold tracking-widest text-slate-500">{label}</p>
      <p className={`text-3xl font-black ${color} tracking-tight drop-shadow-md count-snap`}>{counted}</p>
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
  const intelligence = data.port_intelligence || {};
  const riskSummary = intelligence.risk_summary || {};
  const severitySummary = riskSummary.severity_summary || {};
  const networkSecurityScore = Number(riskSummary.network_security_score ?? 100);
  const findingPriority = { Critical: 4, High: 3, Medium: 2, Low: 1 };
  const previewHosts = hosts.slice(0, 3);
  const remainingHostCount = Math.max(0, hosts.length - previewHosts.length);
  const topFindings = [...(intelligence.findings || [])]
    .sort((a, b) => {
      const severityDiff = (findingPriority[b.severity] || 0) - (findingPriority[a.severity] || 0);
      if (severityDiff !== 0) return severityDiff;
      return Number(b.score || 0) - Number(a.score || 0);
    })
    .slice(0, 4);
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  return (
    <div className="flex min-h-full flex-col gap-4 pb-4">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="font-display aurora-text text-2xl font-bold">
            Exposure Report
          </h2>
          <p className="mt-1 text-xs font-mono flex items-center gap-2 text-emerald-400/80">
            <Activity className="h-4 w-4" />
            <span className="tracking-widest">NETWORK: {data.network_range}</span>
          </p>
        </div>
        {data.timestamp && (
          <div className="text-right">
            <p className="mb-1 text-xs font-bold uppercase tracking-widest text-slate-500">Time of Scan</p>
            <p className="inline-block rounded-lg border border-slate-300/15 bg-slate-900/40 px-3 py-1.5 font-mono text-sm text-slate-300">
              {new Date(data.timestamp).toLocaleString()}
            </p>
          </div>
        )}
      </div>

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 gap-3 xl:grid-cols-4"
      >
        {[
          { label: 'Active Targets', value: hosts.length,           color: 'text-blue-400',    glow: 'shadow-[0_0_30px_rgba(59,130,246,0.12)]',  accentBg: 'bg-blue-500/10',    accentBorder: 'border-blue-500/20' },
          { label: 'Ports Exposed',  value: totalPorts,             color: 'text-amber-400',   glow: 'shadow-[0_0_30px_rgba(251,191,36,0.12)]',  accentBg: 'bg-amber-500/10',   accentBorder: 'border-amber-500/20' },
          {
            label: 'Vulnerabilities',
            value: totalCves,
            color: totalCves > 0 ? 'text-red-400' : 'text-emerald-400',
            glow:  totalCves > 0 ? 'shadow-[0_0_30px_rgba(239,68,68,0.12)]' : 'shadow-[0_0_30px_rgba(16,185,129,0.12)]',
            accentBg: totalCves > 0 ? 'bg-red-500/10' : 'bg-emerald-500/10',
            accentBorder: totalCves > 0 ? 'border-red-500/20' : 'border-emerald-500/20',
          },
          { label: 'Score', value: networkSecurityScore, color: 'text-cyan-300', glow: 'shadow-[0_0_30px_rgba(34,211,238,0.12)]', accentBg: 'bg-cyan-500/10', accentBorder: 'border-cyan-500/20' },
        ].map(({ label, value, color, glow, accentBg, accentBorder }) => (
          <AnimatedStatCard key={label} label={label} value={value} color={color} glow={glow} accentBg={accentBg} accentBorder={accentBorder} />
        ))}
      </motion.div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[0.92fr_1.08fr]">
        <motion.div variants={cardVariants} className="panel-premium flex min-h-0 flex-col rounded-2xl p-4 relative overflow-hidden">
            {/* Network topology background motif */}
            <NetworkTopologyBg />
            <div className="mb-3 flex items-center justify-between gap-2 relative z-10">
              <div className="flex items-center gap-2">
              <Radar className="h-4 w-4 text-cyan-300" />
              <p className="hud-label">Risk Pulse</p>
              </div>
              {remainingHostCount > 0 && <span className="text-[11px] text-slate-500">+{remainingHostCount} more hosts</span>}
            </div>
            {/* Gauge ring + score */}
            <div className="flex items-center gap-4 relative z-10">
              <GaugeRing score={networkSecurityScore} size={108} />
              <div>
                <p className="text-xs text-slate-400">Network security score</p>
                <p className="mt-1 text-xs font-semibold text-slate-300">
                  {networkSecurityScore >= 80 ? 'Strong posture' : networkSecurityScore >= 60 ? 'Moderate risk' : 'High exposure'}
                </p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-sm relative z-10">
              <div className="rounded-xl border border-red-400/20 bg-red-500/10 p-2.5">
                <p className="text-xs text-red-300/80 uppercase tracking-wider font-semibold">Critical</p>
                <p className="mt-1 text-xl font-bold text-red-300">{severitySummary.Critical || 0}</p>
              </div>
              <div className="rounded-xl border border-orange-300/20 bg-orange-500/10 p-2.5">
                <p className="text-xs text-orange-200/80 uppercase tracking-wider font-semibold">High</p>
                <p className="mt-1 text-xl font-bold text-orange-200">{severitySummary.High || 0}</p>
              </div>
              <div className="rounded-xl border border-amber-300/20 bg-amber-500/10 p-2.5">
                <p className="text-xs text-amber-200/80 uppercase tracking-wider font-semibold">Medium</p>
                <p className="mt-1 text-xl font-bold text-amber-200">{severitySummary.Medium || 0}</p>
              </div>
              <div className="rounded-xl border border-sky-300/20 bg-sky-500/10 p-2.5">
                <p className="text-xs text-sky-200/80 uppercase tracking-wider font-semibold">Low</p>
                <p className="mt-1 text-xl font-bold text-sky-200">{severitySummary.Low || 0}</p>
              </div>
            </div>

            <div className="mt-4 min-h-0 flex-1 relative z-10">
              <div className="mb-3 flex items-center justify-between gap-2">
                <p className="hud-label">Host Preview</p>
                <span className="text-[11px] text-slate-500">Top {previewHosts.length}</span>
              </div>
              <div className="grid gap-2">
                {previewHosts.length === 0 ? (
                  <div className="rounded-xl border border-slate-300/10 bg-slate-950/40 p-3 text-xs text-slate-500">No hosts discovered.</div>
                ) : (
                  previewHosts.map((host, index) => (
                    <div key={host.ip ?? index} className="rounded-xl border border-slate-300/10 bg-slate-950/40 p-3">
                      <div className="flex items-center justify-between gap-3">
                        <span className="font-mono text-sm font-semibold text-slate-100">{host.ip}</span>
                        <span className="text-[11px] text-slate-500">{host.ports?.length ?? 0} ports</span>
                      </div>
                      <p className="mt-2 text-xs text-slate-400 truncate">
                        {(host.ports || []).slice(0, 4).map((port) => `${port.port}/${port.protocol || 'tcp'} ${port.service || 'unknown'}`).join(' • ') || 'No service details'}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
        </motion.div>

        <motion.div variants={cardVariants} className="panel-premium flex min-h-0 flex-col rounded-2xl p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-rose-300" />
                <p className="hud-label">Priority Findings</p>
              </div>
              <span className="text-[11px] text-slate-500">Top {topFindings.length} by severity</span>
            </div>
            <div className="grid gap-2">
              {topFindings.map((finding, index) => {
                const severity = (finding.severity || 'Low').toLowerCase();
                const severityBadge =
                  severity === 'critical'
                    ? 'border-red-400/30 bg-red-500/10 text-red-300'
                    : severity === 'high'
                      ? 'border-orange-300/30 bg-orange-500/10 text-orange-200'
                      : severity === 'medium'
                        ? 'border-amber-300/30 bg-amber-500/10 text-amber-200'
                        : 'border-sky-300/30 bg-sky-500/10 text-sky-200';

                return (
                  <div key={`${finding.port}-${index}`} className="rounded-xl border border-slate-400/20 bg-slate-900/45 p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-100">Port {finding.port} - {finding.service}</span>
                      <span className={`rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${severityBadge}`}>
                        {finding.severity || 'Low'}
                      </span>
                    </div>
                    <p className="mt-1.5 text-xs text-slate-300 leading-relaxed">
                      {finding.description || finding.risk || 'Open service detected with potential exposure risk.'}
                    </p>
                    <p className="mt-1.5 text-xs text-slate-400">
                      <span className="font-semibold text-slate-300">Recommendation:</span>{' '}
                      {finding.firewall_recommendation || finding.recommendation || 'Restrict access to trusted hosts and harden authentication.'}
                    </p>
                  </div>
                );
              })}
            </div>
            {intelligence.findings?.length > topFindings.length && (
              <div className="rounded-xl border border-slate-300/10 bg-slate-950/35 p-3 text-xs text-slate-500">
                +{intelligence.findings.length - topFindings.length} more findings are available. This screen shows the highest-priority items only to keep the layout on one page.
              </div>
            )}
        </motion.div>
      </div>
    </div>
  );
}
