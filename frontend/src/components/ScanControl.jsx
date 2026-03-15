/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle, Network, RadioTower, Zap } from 'lucide-react';
import { startScan } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';

const ScanControl = ({ onScanComplete, backendStatus }) => {
  const [networkRange, setNetworkRange] = useState('127.0.0.1');
  const [ports, setPorts] = useState('22,80,443,8080,3306,5432,27017,6379');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const canScan = !isScanning && networkRange.trim() && ports.trim() && backendStatus === 'ok';

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
      className="space-y-8"
    >
      <div>
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-cyan-300">
          Mission Control
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Configure range and ports, then run a local security assessment with live OWASP mapping.
        </p>
      </div>

      <div className="panel-surface relative overflow-hidden rounded-3xl p-8 group">
        {/* Subtle glowing orb in the background */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl transition-colors duration-700 group-hover:bg-cyan-300/20" />
        
        <div className="relative z-10 mb-8 flex items-center gap-4">
          <div className="rounded-2xl border border-cyan-300/20 bg-cyan-400/10 p-3 text-cyan-300 shadow-[0_0_15px_rgba(34,211,238,0.2)]">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-semibold tracking-tight text-slate-100">Scan Parameters</p>
            <p className="text-sm text-slate-400">Define your target and exposure profile.</p>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <div className="group/input">
            <label htmlFor="network-range" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <Network className="h-4 w-4 text-blue-400" />
              CIDR Network Range
            </label>
            <div className="relative">
              <input
                id="network-range"
                type="text"
                value={networkRange}
                onChange={(e) => setNetworkRange(e.target.value)}
                disabled={isScanning}
                className="relative z-10 w-full rounded-xl border border-slate-400/25 bg-slate-950/70 px-5 py-3.5 font-mono text-sm text-white shadow-inner transition-all focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/40 disabled:opacity-50 group-hover/input:border-slate-300/30"
                placeholder="e.g. 192.168.1.0/24"
              />
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan-400/0 via-cyan-300/8 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
            </div>
          </div>

          <div className="group/input">
            <label htmlFor="ports" className="mb-2 flex items-center gap-2 text-sm font-medium text-slate-300">
              <RadioTower className="h-4 w-4 text-blue-400" />
              Target Protocol Ports
            </label>
            <div className="relative">
              <input
                id="ports"
                type="text"
                value={ports}
                onChange={(e) => setPorts(e.target.value)}
                disabled={isScanning}
                className="relative z-10 w-full rounded-xl border border-slate-400/25 bg-slate-950/70 px-5 py-3.5 font-mono text-sm text-white shadow-inner transition-all focus:border-cyan-300/50 focus:outline-none focus:ring-1 focus:ring-cyan-300/40 disabled:opacity-50 group-hover/input:border-slate-300/30"
                placeholder="e.g. 22,80,443,3306"
              />
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-cyan-400/0 via-cyan-300/8 to-cyan-400/0 opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
            </div>
            <p className="mt-2 text-xs font-medium text-slate-500">Use comma-separated ports. Example: 21,22,80,443,3306,6379.</p>
          </div>

          <motion.button
            whileHover={{ scale: canScan ? 1.01 : 1 }}
            whileTap={{ scale: canScan ? 0.98 : 1 }}
            onClick={handleStartScan}
            disabled={!canScan}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-gradient-to-r from-sky-500 to-cyan-500 px-8 py-4 font-bold text-slate-950 shadow-[0_0_24px_rgba(14,165,233,0.35)] transition-all hover:from-sky-400 hover:to-cyan-400 hover:shadow-[0_0_32px_rgba(34,211,238,0.45)] disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400 disabled:shadow-none"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="tracking-wide">Running Deep Scan...</span>
                {/* Scanning sweep animation overlay */}
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

          <AnimatePresence>
            {backendStatus !== 'ok' && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }} 
                animate={{ opacity: 1, height: 'auto' }} 
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
                  <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-500" />
                  <span>Backend is not connected yet. Start the local API service before launching a scan.</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex items-start gap-3 rounded-xl border border-rose-500/30 bg-rose-500/10 p-5 backdrop-blur-md"
          >
            <AlertCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-rose-500" />
            <div>
              <p className="text-sm font-bold uppercase tracking-wider text-rose-200">Scan Failed</p>
              <span className="text-sm text-rose-200/80 mt-1 block">{error}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {scanResult && !error && !isScanning && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl border border-emerald-400/30 bg-emerald-500/10 p-6 backdrop-blur-md shadow-[0_0_30px_rgba(16,185,129,0.1)]"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-start gap-4">
              <CheckCircle className="h-8 w-8 flex-shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <div>
                <p className="text-lg font-bold text-emerald-300">Scan Completed</p>
                <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-3">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/70 mb-1">Session ID</p>
                    <p className="font-mono text-sm text-emerald-300">{scanResult.scan_id}</p>
                  </div>
                  <div className="rounded-xl border border-emerald-500/20 bg-black/40 p-3 flex items-center">
                    <div>
                      <p className="text-[10px] uppercase font-bold tracking-widest text-emerald-500/70 mb-1">OWASP Violations</p>
                      <p className="text-lg font-bold text-emerald-300">
                        {scanResult.owasp_findings_count ?? 0}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ScanControl;
