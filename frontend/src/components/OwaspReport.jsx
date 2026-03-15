import React, { useState } from 'react';
import { Loader2, ShieldAlert, FileText, Info, Download, Maximize2, CheckCircle2 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { getPdfReport } from '../services/api';

const CATEGORY_COLORS = {
  A01: '#ef4444',
  A02: '#f97316',
  A03: '#eab308',
  A04: '#22c55e',
  A05: '#3b82f6',
  A06: '#8b5cf6',
  A07: '#ec4899',
  A08: '#14b8a6',
  A09: '#f59e0b',
  A10: '#64748b',
};

function barColor(category) {
  const prefix = (category || '').match(/^(A\d+)/)?.[1];
  return CATEGORY_COLORS[prefix] ?? '#64748b';
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm shadow-xl">
      <p className="font-medium text-slate-200 mb-1">{label}</p>
      <p className="text-blue-400">
        {payload[0].value} finding{payload[0].value !== 1 ? 's' : ''}
      </p>
    </div>
  );
};

export default function OwaspReport({ scanId, data, loading, onToggleFullscreen }) {
  const [isExporting, setIsExporting] = useState(false);
  const [exportState, setExportState] = useState({ type: null, message: '' });

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-400">
        <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
        <p>Loading OWASP report…</p>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4 text-slate-500">
        <FileText className="h-12 w-12" />
        <p>No OWASP report yet. Start a scan from the Scanner tab.</p>
      </div>
    );
  }

  const categories = data.counts_by_category ?? data.categories ?? data.owasp_categories ?? {};
  const chartData = Object.entries(categories)
    .map(([name, count]) => ({ name, count: Number(count) || 0 }))
    .sort((a, b) => b.count - a.count);
  const totalFindings = chartData.reduce((s, d) => s + d.count, 0);

  async function handleExport() {
    if (!scanId || isExporting) {
      return;
    }

    setIsExporting(true);
    setExportState({ type: null, message: '' });

    const { success, data: pdfData, error } = await getPdfReport(scanId);
    if (!success) {
      setExportState({ type: 'error', message: error });
      setIsExporting(false);
      return;
    }

    const fileName = `${scanId}-report.pdf`;
    const electronAPI = window.electronAPI;

    try {
      if (electronAPI?.saveReport) {
        const saveResult = await electronAPI.saveReport(pdfData, fileName);
        if (saveResult?.canceled) {
          setExportState({ type: null, message: '' });
        } else {
          setExportState({ type: 'success', message: `Saved to ${saveResult.filePath}` });
        }
      } else {
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = fileName;
        anchor.click();
        URL.revokeObjectURL(url);
        setExportState({ type: 'success', message: 'Report download started.' });
      }
    } catch (saveError) {
      setExportState({ type: 'error', message: saveError.message || 'Failed to save report.' });
    }

    setIsExporting(false);
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">OWASP Top 10 Report</h2>
          {scanId && (
            <p className="text-slate-400 text-sm mt-1 font-mono">{scanId}</p>
          )}
        </div>
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center gap-2 rounded-xl border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-sm font-medium text-blue-300 transition hover:bg-blue-500/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
            Save PDF Report
          </button>
          {window.electronAPI?.toggleFullscreen && (
            <button
              type="button"
              onClick={onToggleFullscreen}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800 px-4 py-2 text-sm font-medium text-slate-200 transition hover:bg-slate-700"
            >
              <Maximize2 className="h-4 w-4" />
              Fullscreen
            </button>
          )}
        </div>
      </div>

      {exportState.message && (
        <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${
          exportState.type === 'success'
            ? 'border-green-500/30 bg-green-950/30 text-green-200'
            : 'border-red-500/30 bg-red-950/40 text-red-200'
        }`}>
          <CheckCircle2 className={`mt-0.5 h-5 w-5 flex-shrink-0 ${exportState.type === 'success' ? 'text-green-400' : 'hidden'}`} />
          <Info className={`mt-0.5 h-5 w-5 flex-shrink-0 ${exportState.type === 'error' ? 'text-red-400' : 'hidden'}`} />
          <span>{exportState.message}</span>
        </div>
      )}

      {/* Summary */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
          <p className={`text-3xl font-bold ${totalFindings > 0 ? 'text-red-400' : 'text-green-400'}`}>
            {totalFindings}
          </p>
          <p className="text-slate-400 text-sm mt-1">Total Findings</p>
        </div>
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
          <p className="text-3xl font-bold text-blue-400">{chartData.length}</p>
          <p className="text-slate-400 text-sm mt-1">Categories Affected</p>
        </div>
      </div>

      {/* Bar chart */}
      {chartData.length > 0 && (
        <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5">
          <h3 className="font-semibold mb-5 flex items-center gap-2 text-slate-200">
            <ShieldAlert className="h-4 w-4 text-red-400" />
            Findings by OWASP Category
          </h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={chartData} margin={{ top: 4, right: 8, bottom: 64, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: '#94a3b8', fontSize: 11 }}
                angle={-35}
                textAnchor="end"
                interval={0}
              />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 12 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(148,163,184,0.08)' }} />
              <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.name} fill={barColor(entry.name)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Category list */}
      {chartData.length > 0 && (
        <div className="space-y-2">
          <h3 className="font-semibold text-slate-300 mb-3">Category Breakdown</h3>
          {chartData.map(({ name, count }) => (
            <div
              key={name}
              className="flex items-center gap-3 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3"
            >
              <span
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: barColor(name) }}
              />
              <span className="flex-1 text-sm text-slate-300">{name}</span>
              <span className="font-mono font-bold text-sm text-slate-200">{count}</span>
              <span className="text-xs text-slate-500">finding{count !== 1 ? 's' : ''}</span>
            </div>
          ))}
        </div>
      )}

      {/* No findings */}
      {totalFindings === 0 && (
        <div className="flex flex-col items-center justify-center py-14 gap-3 bg-slate-800 border border-slate-700 rounded-2xl">
          <Info className="h-8 w-8 text-green-500" />
          <p className="text-green-400 font-medium">No OWASP findings detected</p>
          <p className="text-sm text-slate-500">
            This scan found no vulnerabilities mapping to the OWASP Top 10.
          </p>
        </div>
      )}
    </div>
  );
}
