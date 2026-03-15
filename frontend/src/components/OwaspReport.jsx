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
  A01: '#ef4444', // Red
  A02: '#f97316', // Orange
  A03: '#eab308', // Yellow
  A04: '#10b981', // Emerald
  A05: '#3b82f6', // Blue
  A06: '#8b5cf6', // Violet
  A07: '#ec4899', // Pink
  A08: '#14b8a6', // Teal
  A09: '#f59e0b', // Amber
  A10: '#94a3b8', // Slate
};

function barColor(category) {
  const prefix = (category || '').match(/^(A\d+)/)?.[1];
  return CATEGORY_COLORS[prefix] ?? '#64748b';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-zinc-900/90 border border-white/10 rounded-xl px-4 py-3 text-sm shadow-2xl backdrop-blur-xl">
      <p className="font-bold text-slate-200 mb-1.5">{label}</p>
      <div className="flex items-center gap-2">
        <div 
          className="w-3 h-3 rounded-full" 
          style={{ backgroundColor: payload[0].payload.fill || barColor(label), boxShadow: `0 0 8px ${payload[0].payload.fill || barColor(label)}` }} 
        />
        <p className="text-white font-mono font-bold tracking-wider">
          {payload[0].value} <span className="text-slate-400 font-sans font-medium text-xs ml-1">VULN{payload[0].value !== 1 ? 'S' : ''}</span>
        </p>
      </div>
    </div>
  );
};

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
      className="w-full space-y-8 pb-10"
    >
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-6">
        <div>
          <h2 className="bg-gradient-to-r from-slate-100 to-cyan-300 bg-clip-text text-3xl font-bold text-transparent">
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
            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-5 py-2.5 text-sm font-bold text-blue-300 transition-colors hover:bg-blue-500/20 hover:border-blue-500/50 disabled:cursor-not-allowed disabled:opacity-50 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            EXPORT PDF
          </motion.button>
          
          {window.electronAPI?.toggleFullscreen && (
            <motion.button
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-bold text-slate-300 transition-colors hover:bg-white/10 hover:border-white/20"
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

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <motion.div variants={itemVariants} className="panel-surface group relative overflow-hidden rounded-2xl p-6 shadow-xl">
          <div className={`absolute -bottom-10 -right-10 w-32 h-32 rounded-full blur-3xl transition-colors ${totalFindings > 0 ? 'bg-red-500/10 group-hover:bg-red-500/20' : 'bg-emerald-500/10 group-hover:bg-emerald-500/20'}`} />
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Total High-Risk Findings</p>
          <p className={`text-5xl font-black tracking-tight drop-shadow-md ${totalFindings > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
            {totalFindings}
          </p>
        </motion.div>
        
        <motion.div variants={itemVariants} className="panel-surface group relative overflow-hidden rounded-2xl p-6 shadow-xl">
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors" />
          <p className="text-xs uppercase font-bold tracking-widest text-slate-500 mb-2">Affected Vectors</p>
          <p className="text-5xl font-black text-blue-400 tracking-tight drop-shadow-md">{chartData.length}</p>
        </motion.div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="panel-surface relative overflow-hidden rounded-2xl p-6 shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-slate-500/5 rounded-full blur-3xl" />
          <h3 className="font-bold text-lg mb-8 flex items-center gap-3 text-slate-200">
            <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <ShieldAlert className="h-5 w-5 text-red-400" />
            </div>
            Threat Distribution
          </h3>
          <div ref={chartContainerRef} className="relative z-10 w-full h-80 min-h-[320px] min-w-0">
            {chartSize.width > 0 && chartSize.height > 0 && (
              <ResponsiveContainer width="100%" height="100%" minWidth={320} minHeight={280}>
                <BarChart data={chartData} margin={{ top: 10, right: 10, bottom: 40, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                    angle={-25}
                    textAnchor="end"
                    interval={0}
                    axisLine={{ stroke: 'rgba(255,255,255,0.1)' }}
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
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.02)' }} />
                  <Bar
                    dataKey="count"
                    radius={[6, 6, 0, 0]}
                    animationDuration={1500}
                    animationEasing="ease-out"
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

      {/* Finding details */}
      {findingItems.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="font-bold text-slate-300 mb-4 px-1 uppercase tracking-widest text-xs">Finding Details</h3>
          <div className="space-y-3">
            {findingItems.map((finding, index) => {
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
                  whileHover={{ scale: 1.01, backgroundColor: 'rgba(255,255,255,0.03)' }}
                  className="panel-surface rounded-2xl p-5"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-3">
                    <span className="font-semibold text-slate-100">{category}</span>
                    <span className={`px-2.5 py-1 rounded-lg border text-[11px] font-bold tracking-widest ${severityTone}`}>
                      {severity}
                    </span>
                  </div>

                  <p className="text-sm text-slate-300 leading-relaxed">
                    {finding.description || 'No vulnerability description available.'}
                  </p>

                  <p className="text-sm text-slate-400 leading-relaxed mt-2">
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
      )}

      {/* Category list */}
      {chartData.length > 0 && (
        <motion.div variants={itemVariants} className="space-y-3">
          <h3 className="font-bold text-slate-300 mb-4 px-1 uppercase tracking-widest text-xs">Vector Breakdown</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {chartData.map(({ name, count, fill }) => (
              <motion.div
                key={name}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.08)' }}
                className="flex items-center gap-4 bg-zinc-900/50 border border-white/5 rounded-xl px-5 py-4 cursor-default transition-colors"
              >
                <div
                  className="w-3 h-3 rounded-full flex-shrink-0"
                  style={{ backgroundColor: fill, boxShadow: `0 0 10px ${fill}` }}
                />
                <span className="flex-1 font-semibold text-sm text-slate-200 truncate pr-2" title={name}>{name}</span>
                <div className="flex flex-col items-end">
                  <span className="font-mono font-black text-lg text-white drop-shadow-md">{count}</span>
                  <span className="text-[10px] font-bold tracking-widest text-slate-500 uppercase">Hits</span>
                </div>
              </motion.div>
            ))}
          </div>
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
