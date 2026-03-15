/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle, Network, RadioTower, Zap } from 'lucide-react';
import { startScan } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Radar illustration motif ─────────────────────────────────────── */
function RadarMotif() {
  return (
    <svg
      className="pointer-events-none absolute -top-6 -right-6 h-48 w-48 opacity-[0.18]"
      viewBox="0 0 200 200"
      fill="none"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
          <stop offset="0%"   stopColor="#22d3ee" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#22d3ee" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* Concentric rings */}
      <circle cx="100" cy="100" r="25"  stroke="#22d3ee" strokeWidth="0.7" opacity="0.6" />
      <circle cx="100" cy="100" r="50"  stroke="#22d3ee" strokeWidth="0.7" opacity="0.4" />
      <circle cx="100" cy="100" r="75"  stroke="#22d3ee" strokeWidth="0.7" opacity="0.28" />
      <circle cx="100" cy="100" r="100" stroke="#22d3ee" strokeWidth="0.7" opacity="0.16" />
      {/* Crosshair */}
      <line x1="100" y1="0"   x2="100" y2="200" stroke="#22d3ee" strokeWidth="0.5" opacity="0.22" />
      <line x1="0"   y1="100" x2="200" y2="100" stroke="#22d3ee" strokeWidth="0.5" opacity="0.22" />
      <line x1="29"  y1="29"  x2="171" y2="171" stroke="#22d3ee" strokeWidth="0.4" opacity="0.14" strokeDasharray="4 6" />
      <line x1="171" y1="29"  x2="29"  y2="171" stroke="#22d3ee" strokeWidth="0.4" opacity="0.14" strokeDasharray="4 6" />
      {/* Sweep arm */}
      <motion.g
        animate={{ rotate: 360 }}
        transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        style={{ originX: '100px', originY: '100px' }}
      >
        <path
          d="M100,100 L100,0 A100,100 0 0,1 200,100 Z"
          fill="url(#radarSweepGrad)"
          opacity="0.8"
        />
        <line x1="100" y1="100" x2="100" y2="0" stroke="#22d3ee" strokeWidth="1" opacity="0.7" />
      </motion.g>
      {/* Blip targets */}
      <circle cx="138" cy="62"  r="3" fill="#22d3ee" className="radar-blip" />
      <circle cx="60"  cy="130" r="2.5" fill="#f59e0b" className="radar-blip-2" />
      <circle cx="155" cy="115" r="2" fill="#22d3ee" opacity="0.5" />
      {/* Center dot */}
      <circle cx="100" cy="100" r="3.5" fill="#22d3ee" opacity="0.9" />
      <circle cx="100" cy="100" r="6"   stroke="#22d3ee" strokeWidth="0.8" opacity="0.35" />
    </svg>
  );
}

const ScanControl = ({ onScanComplete, backendStatus }) => {
  const [networkRange, setNetworkRange] = useState('127.0.0.1');
  const [ports, setPorts] = useState('22,80,443,8080,3306,5432,27017,6379');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const canScan = !isScanning && networkRange.trim() && ports.trim() && backendStatus === 'ok';
  const presets = [
    { label: 'Core Web', value: '80,443,8080' },
    { label: 'Admin', value: '22,3389,5900' },
    { label: 'Databases', value: '1433,3306,5432,6379,27017' },
  ];

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);

    const { success, data, error: apiError } = await startScan(
      networkRange.trim(),
      ports.trim(),
    );

    if (success && data?.scan_id) {
      setScanResult(data);
      if (onScanComplete) onScanComplete(data.scan_id);
    } else {
      setError(apiError || 'Failed to initiate scan. Check the backend is running.');
    }
    setIsScanning(false);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col gap-4"
    >
      <div>
        <h2 className="font-display aurora-text text-2xl font-bold md:text-3xl">
          Mission Control
        </h2>
        <p className="mt-1.5 text-sm text-slate-400">
          Enter a target IP or CIDR range, choose ports, and launch the scan.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[1.4fr_0.9fr]">
        <div className="panel-premium relative overflow-hidden rounded-3xl p-6 group">
        {/* Radar illustration motif */}
        <RadarMotif />
        {/* Hex-grid overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: 'radial-gradient(circle, #22d3ee 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            maskImage: 'radial-gradient(ellipse at top right, black 0%, transparent 65%)',
          }}
        />
        
        <div className="relative z-10 mb-5 flex items-center gap-4">
          <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/22 to-cyan-400/10 p-3 text-amber-100 shadow-[0_0_18px_rgba(245,158,11,0.14)]">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold tracking-tight text-slate-100">Scan Parameters</p>
            <p className="text-xs text-slate-400">Define your target and exposure profile.</p>
          </div>
        </div>

        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => !isScanning && setPorts(preset.value)}
                className="rounded-full border border-slate-300/15 bg-slate-900/60 px-4 py-2 text-xs font-semibold tracking-[0.18em] text-slate-300 transition-all hover:border-amber-300/25 hover:bg-gradient-to-r hover:from-amber-400/12 hover:to-cyan-400/8 hover:text-amber-100"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <div className="group/input">
            <label htmlFor="network-range" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Network className="h-4 w-4 text-blue-400" />
              IP Address or CIDR Range
            </label>
            <div className="relative">
              <input
                id="network-range"
                type="text"
                value={networkRange}
                onChange={(e) => setNetworkRange(e.target.value)}
                disabled={isScanning}
                className="relative z-10 w-full rounded-xl border border-slate-400/25 bg-slate-950/70 px-4 py-3 font-mono text-sm text-white shadow-inner transition-all focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/40 disabled:opacity-50 group-hover/input:border-slate-300/30"
                placeholder="e.g. 192.168.1.10 or 192.168.1.0/24"
              />
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan-400/0 via-cyan-300/8 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
            </div>
          </div>

          <div className="group/input">
            <label htmlFor="ports" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <RadioTower className="h-4 w-4 text-blue-400" />
              Target Ports
            </label>
            <div className="relative">
              <input
                id="ports"
                type="text"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                disabled={isScanning}
                className="relative z-10 w-full rounded-xl border border-slate-400/25 bg-slate-950/70 px-4 py-3 font-mono text-sm text-white shadow-inner transition-all focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/40 disabled:opacity-50 group-hover/input:border-slate-300/30"
                placeholder="e.g. 22,80,443,3306"
              />
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan-400/0 via-cyan-300/8 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
            </div>
            <p className="mt-1.5 text-xs font-medium text-slate-500">Use comma-separated ports. Example: 21,22,80,443,3306,6379.</p>
          </div>

          {backendStatus !== 'ok' && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-xs text-amber-200">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
              <span>Backend is not connected yet. Start the local API service before launching a scan.</span>
            </div>
          )}

          <motion.button
            whileHover={{ scale: canScan ? 1.01 : 1 }}
            whileTap={{ scale: canScan ? 0.98 : 1 }}
            onClick={handleStartScan}
            disabled={!canScan}
            className="button-primary group relative mt-2 w-full overflow-hidden px-8 py-3.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="tracking-wide">Running Deep Scan...</span>
                <motion.div
                  className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                  animate={{ translateX: ['100%', '-100%'] }}
                  transition={{ repeat: Infinity, duration: 1.5, ease: "linear" }}
                />
              </>
            ) : (
              <>
                <Shield className="h-5 w-5 transition-transform group-hover:scale-110" />
                <span className="tracking-wide">Start Assessment</span>
              </>
            )}
          </motion.button>
        </div>
      </div>

        <div className="grid grid-cols-1 gap-3 md:grid-cols-3 xl:grid-cols-1">
          <motion.div whileHover={{ y: -3 }} className="panel-surface-soft panel-glow rounded-2xl p-4">
            <p className="hud-label">Coverage</p>
            <p className="mt-1.5 text-xl font-black text-slate-100">Host + Ports</p>
            <p className="mt-1 text-xs text-slate-400">Discovery and service exposure in one workflow.</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="panel-surface-soft panel-glow rounded-2xl p-4">
            <p className="hud-label">Scoring</p>
            <p className="mt-1.5 text-xl font-black text-cyan-200">Risk Weighted</p>
            <p className="mt-1 text-xs text-slate-400">Severity and OWASP context in one pass.</p>
          </motion.div>
          <motion.div whileHover={{ y: -3 }} className="panel-surface-soft panel-glow rounded-2xl p-4">
            <p className="hud-label">Execution</p>
            <p className="mt-1.5 text-xl font-black text-emerald-200">Local Engine</p>
            <p className="mt-1 text-xs text-slate-400">Desktop-native results and export flow.</p>
          </motion.div>
          {scanResult && !error && !isScanning && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-4 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.1)]">
              <p className="hud-label text-emerald-300/80">Latest Run</p>
              <p className="mt-1.5 text-base font-bold text-emerald-300">Scan Completed</p>
              <div className="mt-3 grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-emerald-500/20 bg-black/30 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/70 mb-1">Session</p>
                  <p className="font-mono text-xs text-emerald-300">{scanResult.scan_id}</p>
                </div>
                <div className="rounded-xl border border-emerald-500/20 bg-black/30 p-3">
                  <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/70 mb-1">OWASP</p>
                  <p className="text-lg font-bold text-emerald-300">{scanResult.owasp_findings_count ?? 0}</p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-rose-500/30 bg-rose-500/10 p-4 backdrop-blur-md">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-500" />
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-rose-200">Scan Failed</p>
                <span className="mt-1 block text-xs text-rose-200/80">{error}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ScanControl;
