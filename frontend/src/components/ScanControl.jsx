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
        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
          Target Acquisition
        </h2>
        <p className="mt-2 text-sm text-slate-400">
          Deploy deep network probes. All scans are isolated and processed locally.
        </p>
      </div>

      <div className="relative rounded-3xl border border-white/10 bg-zinc-900/60 p-8 shadow-2xl backdrop-blur-xl overflow-hidden group">
        {/* Subtle glowing orb in the background */}
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl group-hover:bg-blue-500/20 transition-colors duration-700 pointer-events-none" />
        
        <div className="relative z-10 mb-8 flex items-center gap-4">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400 ring-1 ring-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
            <Zap className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xl font-semibold text-slate-100 tracking-tight">Configuration Parameters</p>
            <p className="text-sm text-slate-400">Define the vector of analysis.</p>
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
                className="relative z-10 w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50 transition-all font-mono text-sm shadow-inner group-hover/input:border-white/20"
                placeholder="e.g. 192.168.1.0/24"
              />
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
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
                className="relative z-10 w-full px-5 py-3.5 bg-black/40 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/50 disabled:opacity-50 transition-all font-mono text-sm shadow-inner group-hover/input:border-white/20"
                placeholder="e.g. 22,80,443,3306"
              />
              <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/5 to-blue-500/0 opacity-0 transition-opacity duration-300 group-focus-within/input:opacity-100" />
            </div>
            <p className="mt-2 text-xs text-slate-500 font-medium">Standard short form or comprehensive comma-separated list.</p>
          </div>

          <motion.button
            whileHover={{ scale: canScan ? 1.01 : 1 }}
            whileTap={{ scale: canScan ? 0.98 : 1 }}
            onClick={handleStartScan}
            disabled={!canScan}
            className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-xl bg-blue-600 px-8 py-4 font-bold text-white shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all hover:bg-blue-500 hover:shadow-[0_0_25px_rgba(37,99,235,0.5)] disabled:cursor-not-allowed disabled:bg-zinc-800 disabled:text-slate-500 disabled:shadow-none"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                <span className="tracking-wide">INFILTRATING NETWORK...</span>
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
                <span className="tracking-wide">COMMENCE DEEP SCAN</span>
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
                  <span>Awaiting local backend initialization. The nexus control stream must be established before issuing scan vectors.</span>
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
              <p className="text-sm font-bold text-rose-200 uppercase tracking-wider">Scan Objective Failed</p>
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
            className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 shadow-[0_0_30px_rgba(16,185,129,0.1)] backdrop-blur-md relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl" />
            <div className="relative z-10 flex items-start gap-4">
              <CheckCircle className="h-8 w-8 flex-shrink-0 text-emerald-400 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]" />
              <div>
                <p className="text-lg font-bold text-emerald-300">Scan Objective Completed</p>
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
