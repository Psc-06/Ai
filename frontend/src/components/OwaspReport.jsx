/* eslint-disable no-unused-vars */
import React, { useEffect, useRef, useState } from 'react';
import { Loader2, ShieldAlert, FileText, Info, Download, Maximize2, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { getPdfReport } from '../services/api';

const CATEGORY_COLORS = {
  A01: '#ef4444',
  A02: '#f97316',
  A03: '#eab308',
  A04: '#10b981',
  A05: '#3b82f6',
  A06: '#8b5cf6',
  A07: '#ec4899',
  A08: '#14b8a6',
  A09: '#f59e0b',
  A10: '#94a3b8',
};

function barColor(category) {
  const prefix = (category || '').match(/^(A\d+)/)?.[1];
  return CATEGORY_COLORS[prefix] ?? '#64748b';
}

/* ── Richer Tooltip ──────────────────────────────────────────────── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  const color = payload[0].payload.fill || barColor(label);
  return (
    <div className="bg-zinc-950/95 border rounded-2xl px-4 py-3 text-sm shadow-2xl backdrop-blur-xl" style={{ borderColor: `${color}40` }}>
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }} />
        <p className="font-bold text-slate-200 text-xs tracking-wider">{label}</p>
      </div>
      <div className="flex items-baseline gap-1.5">
        <span className="font-mono text-xl font-black" style={{ color }}>{payload[0].value}</span>
        <span className="text-slate-400 text-xs">finding{payload[0].value !== 1 ? 's' : ''}</span>
      </div>
      <div className="mt-2 h-1 rounded-full w-full" style={{ background: `linear-gradient(90deg, ${color}60, ${color}20)` }} />
    </div>
  );
};

/* ── Custom gradient bar shape ───────────────────────────────────── */
function GradientBar(props) {
  const { x, y, width, height, fill } = props;
  if (!height || height <= 0) return null;
  const gradId = `gb-${fill?.replace('#', '')}`;

  return (
    <g>
      <defs>
        <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stopColor={fill} stopOpacity="0.95" />
          <stop offset="100%" stopColor={fill} stopOpacity="0.35" />
        </linearGradient>
      </defs>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={5}
        ry={5}
        fill={`url(#${gradId})`}
        style={{ filter: `drop-shadow(0 2px 8px ${fill}55)` }}
      />
      {/* top gleam */}
      <rect x={x + 2} y={y + 2} width={Math.max(0, width - 4)} height={3} rx={2} fill="rgba(255,255,255,0.18)" />
    </g>
  );
}

/* ── Shield category segments decoration ────────────────────────── */
function ShieldDecoration({ chartData = [] }) {
  const colors = chartData.slice(0, 8).map(d => d.fill);
  const total = chartData.reduce((s, d) => s + d.count, 0);
  if (total === 0 || colors.length === 0) return null;

  // Build a segmented arc for each category
  const cx = 50;
  const cy = 54;
  const r = 38;
  let cumAngle = -90;

  const segments = chartData.slice(0, 8).map((d) => {
    if (d.count === 0 || total === 0) return null;
    const angle = (d.count / total) * 300; // 300° arc (leave 60° gap at bottom)
    const startA = (cumAngle * Math.PI) / 180;
    const endA   = ((cumAngle + angle) * Math.PI) / 180;
    cumAngle += angle + 2; // 2° gap between segments

    const x1 = cx + r * Math.cos(startA);
    const y1 = cy + r * Math.sin(startA);
    const x2 = cx + r * Math.cos(endA);
    const y2 = cy + r * Math.sin(endA);
    const large = angle > 180 ? 1 : 0;

    return (
      <motion.path
        key={d.name}
        d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`}
        fill={d.fill}
        fillOpacity="0.22"
        stroke={d.fill}
        strokeWidth="0.8"
        strokeOpacity="0.6"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={{ transformOrigin: `${cx}px ${cy}px` }}
      />
    );
  });

  return (
    <svg
      className="pointer-events-none absolute top-0 right-0 h-28 w-28 opacity-70"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      {segments}
      {/* Shield outline */}
      <motion.path
        d="M50 10 L82 22 L82 50 C82 68 65 82 50 90 C35 82 18 68 18 50 L18 22 Z"
        stroke="rgba(255,255,255,0.12)"
        strokeWidth="1"
        fill="rgba(255,255,255,0.03)"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
      />
      {/* Center dot */}
      <circle cx="50" cy="50" r="4" fill="rgba(255,255,255,0.15)" />
    </svg>
  );
}

export default function OwaspReport({ scanId, data, loading, onToggleFullscreen }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportState, setExportState] = useState({ type: null, message: '' });
  const chartContainerRef = useRef(null);
  const [chartSize, setChartSize] = useState({ width: 0, height: 0 });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-6 text-slate-400">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
          className="relative p-4"
        >
          <div className="absolute inset-0 border-2 border-blue-500/20 border-t-blue-500 rounded-full" />
          <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        </motion.div>
        <p className="font-mono text-sm tracking-widest text-blue-400/80 uppercase">Compiling Vulnerability Intel...</p>
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
          <FileText className="h-12 w-12 text-slate-600 relative z-10" />
        </div>
        <p className="font-medium">Threat intel unavailable. Awaiting scan completion.</p>
      </motion.div>
    );
  }

  const categories = data.counts_by_category ?? data.categories ?? data.owasp_categories ?? {};
  const findingItems = Array.isArray(data.findings) ? data.findings : [];
  const previewFindings = findingItems.slice(0, 4);
  const chartData = Object.entries(categories)
    .map(([name, count]) => ({ name, count: Number(count) || 0, fill: barColor(name) }))
    .sort((a, b) => b.count - a.count);
  const totalFindings = chartData.reduce((s, d) => s + d.count, 0);

  useEffect(() => {
    const element = chartContainerRef.current;
    if (!element) return undefined;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const nextWidth = Math.floor(entry.contentRect.width);
      const nextHeight = Math.floor(entry.contentRect.height);
      setChartSize({
        width: Math.max(0, nextWidth),
        height: Math.max(0, nextHeight),
      });
    });

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  async function handleExport() {
    if (!scanId || isExporting) return;

    setIsExporting(true);
    setExportState({ type: null, message: '' });

    const { success, data: pdfData, error } = await getPdfReport(scanId);
    if (!success) {
      setExportState({ type: 'error', message: error });
      setIsExporting(false);
      return;
    }

    const fileName = `${scanId}-owasp-report.pdf`;
    const electronAPI = window.electronAPI;

    try {
      if (electronAPI?.saveReport) {
        const saveResult = await electronAPI.saveReport(pdfData, fileName);
        if (saveResult?.canceled) {
          setExportState({ type: null, message: '' });
        } else {
          setExportState({ type: 'success', message: `Intelligence exported to ${saveResult.filePath}` });
        }
      } else {
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
        setExportState({ type: 'success', message: 'Report download initiated.' });
      }
    } catch (saveError) {
      setExportState({ type: 'error', message: saveError.message || 'Failed to export report.' });
    }

    setIsExporting(false);
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      initial="hidden" animate="visible" variants={containerVariants}
      className="flex min-h-full flex-col gap-4 pb-4"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-3 border-b border-white/5 pb-3">
        <div>
          <h2 className="font-display aurora-text text-2xl font-bold">
            OWASP Vulnerability Matrix
          </h2>
          {scanId && (
            <p className="text-blue-400/80 text-sm mt-2 font-mono flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
              SESSION: {scanId}
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-4">
          <motion.button
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={handleExport}
            disabled={isExporting}
            className="button-primary px-5 py-2.5 text-sm disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            EXPORT PDF
          </motion.button>
          
          {window.electronAPI?.toggleFullscreen && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onToggleFullscreen}
              className="button-secondary px-5 py-2.5 text-sm"
            >
              <Maximize2 className="h-4 w-4" />
              FOCUS
            </motion.button>
          )}
        </div>
      </div>

      <AnimatePresence>
        {exportState.message && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
            className={`flex items-start gap-3 rounded-xl border p-4 text-sm backdrop-blur-md ${
              exportState.type === 'success'
                ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-200'
                : 'border-rose-500/30 bg-rose-500/10 text-rose-200'
            }`}
          >
            <CheckCircle2 className={`mt-0.5 h-5 w-5 flex-shrink-0 ${exportState.type === 'success' ? 'text-emerald-400' : 'hidden'}`} />
            <Info className={`mt-0.5 h-5 w-5 flex-shrink-0 ${exportState.type === 'error' ? 'text-rose-400' : 'hidden'}`} />
            <span className="font-medium tracking-wide">{exportState.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <motion.div whileHover={{ y: -3 }} variants={itemVariants} className="panel-premium group relative overflow-hidden rounded-2xl p-4 shadow-xl">
          <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-colors ${totalFindings > 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`} />
          <p className="mb-1 text-[11px] uppercase font-bold tracking-widest text-slate-500">Findings</p>
          <p className={`text-3xl font-black tracking-tight drop-shadow-md ${totalFindings > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {totalFindings}
          </p>
        </motion.div>
        
        <motion.div whileHover={{ y: -3 }} variants={itemVariants} className="panel-premium group relative overflow-hidden rounded-2xl p-4 shadow-xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
          <p className="mb-1 text-[11px] uppercase font-bold tracking-widest text-slate-500">Vectors</p>
          <p className="text-3xl font-black text-blue-400 tracking-tight drop-shadow-md">{chartData.length}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} variants={itemVariants} className="panel-premium group relative overflow-hidden rounded-2xl p-4 shadow-xl">
          <p className="mb-1 text-[11px] uppercase font-bold tracking-widest text-slate-500">Indicators</p>
          <p className="text-3xl font-black text-cyan-300 tracking-tight drop-shadow-md">{findingItems.reduce((sum, finding) => sum + (finding.matched_indicators?.length || 0), 0)}</p>
        </motion.div>
        <motion.div whileHover={{ y: -3 }} variants={itemVariants} className="panel-premium group relative overflow-hidden rounded-2xl p-4 shadow-xl">
          <p className="mb-1 text-[11px] uppercase font-bold tracking-widest text-slate-500">Preview</p>
          <p className="text-sm font-semibold text-slate-100">Top {previewFindings.length} categories</p>
          <p className="mt-1 text-xs text-slate-500">No scrolling, highest-value detail only.</p>
        </motion.div>
      </div>

      <div className="grid min-h-0 flex-1 grid-cols-1 gap-4 xl:grid-cols-[1.05fr_0.95fr]">
      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="panel-premium relative min-h-0 overflow-hidden rounded-2xl p-4 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl" />
          {/* Shield decoration */}
          <ShieldDecoration chartData={chartData} />
          <h3 className="mb-4 flex items-center gap-3 text-base font-bold text-slate-200 relative z-10">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="h-4 w-4 text-red-400" />
            </div>
            Threat Distribution
          </h3>
          <div ref={chartContainerRef} className="relative z-10 h-[260px] w-full min-w-0">
            {chartSize.width > 0 && chartSize.height > 0 && (
              <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={280}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
                  <defs>
                    {chartData.map((entry) => {
                      const id = `bg-${(entry.fill || '').replace('#', '')}`;
                      return (
                        <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%"   stopColor={entry.fill} stopOpacity="0.95" />
                          <stop offset="100%" stopColor={entry.fill} stopOpacity="0.35" />
                        </linearGradient>
                      );
                    })}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    axisLine={{ stroke: 'rgba(255,255,255,0.08)' }}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis
                    tick={{ fill: '#64748b', fontSize: 12, fontWeight: 600 }}
                    allowDecimals={false}
                    axisLine={false}
                    tickLine={false}
                    dx={-10}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.015)' }} />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1200}
                    animationEasing="ease-out"
                    shape={<GradientBar />}
                  >
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>
      )}

      <motion.div variants={itemVariants} className="panel-premium min-h-0 rounded-2xl p-4">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="px-1 text-xs font-bold uppercase tracking-widest text-slate-300">Finding Details</h3>
            {findingItems.length > previewFindings.length && (
              <span className="text-[11px] text-slate-500">+{findingItems.length - previewFindings.length} more</span>
            )}
          </div>
          <div className="grid gap-2">
            {previewFindings.map((finding, index) => {
              const category = finding.category || finding.owasp_code || 'Unknown Category';
              const severity = (finding.severity || 'Low').toUpperCase();
              const severityTone =
                severity === 'CRITICAL'
                  ? 'text-red-300 border-red-500/30 bg-red-500/10'
                  : severity === 'HIGH'
                    ? 'text-orange-300 border-orange-500/30 bg-orange-500/10'
                    : severity === 'MEDIUM'
                      ? 'text-amber-300 border-amber-500/30 bg-amber-500/10'
                      : 'text-blue-300 border-blue-500/30 bg-blue-500/10';

              const matched = Array.isArray(finding.matched_indicators)
                ? finding.matched_indicators.join(', ')
                : '';

              return (
                <motion.div
                  key={`${category}-${index}`}
                  whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
                  className="rounded-2xl border border-slate-300/10 bg-slate-950/40 p-3"
                >
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <span className="break-words font-semibold text-slate-100">{category}</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-widest ${severityTone}`}>
                      {severity}
                    </span>
                  </div>

                  <p className="break-words text-xs leading-relaxed text-slate-300">
                    {finding.description || 'No vulnerability description available.'}
                  </p>

                  <p className="mt-1.5 break-words text-xs leading-relaxed text-slate-400">
                    <span className="font-semibold text-slate-300">What it can do:</span>{' '}
                    {finding.impact || 'Potential unauthorized access, data exposure, or service disruption.'}
                  </p>

                  {matched && (
                    <p className="text-xs text-slate-500 font-mono mt-3">
                      Indicators: {matched}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
      </motion.div>
      </div>

      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-2 xl:grid-cols-4">
            {chartData.map(({ name, count, fill }) => (
              <motion.div
                key={name}
                whileHover={{ backgroundColor: 'rgba(255,255,255,0.08)' }}
                className="flex min-w-0 items-center gap-3 rounded-xl border border-white/5 bg-zinc-900/50 px-4 py-3 cursor-default transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fill, boxShadow: `0 0 10px ${fill}` }}
                />
                <span className="min-w-0 flex-1 truncate pr-2 text-xs font-semibold text-slate-200" title={name}>{name}</span>
                <div className="flex flex-col items-end">
                  <span className="font-mono text-base font-black text-white drop-shadow-md">{count}</span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Hits</span>
                </div>
              </motion.div>
            ))}
        </motion.div>
      )}

      {/* No findings */}
      {totalFindings === 0 && (
        <motion.div variants={itemVariants} className="flex flex-col items-center justify-center py-20 gap-4 bg-emerald-500/5 border border-emerald-500/20 rounded-3xl backdrop-blur-md relative overflow-hidden group">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none group-hover:bg-emerald-500/20 transition-colors" />
          <div className="p-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 relative z-10">
            <CheckCircle2 className="h-10 w-10 text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]" />
          </div>
          <p className="text-xl text-emerald-300 font-bold tracking-wide relative z-10">System Secure</p>
          <p className="text-sm font-medium text-emerald-500/70 relative z-10">
            Zero OWASP Top 10 vulnerabilities detected in the current vector.
          </p>
        </motion.div>
      )}
    </motion.div>
  );
}
