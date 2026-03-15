import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle, Network, RadioTower } from 'lucide-react';
import { startScan } from '../services/api';

const ScanControl = ({ onScanComplete, backendStatus }) => {
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24');
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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Desktop Scanner</h2>
        <p className="mt-2 text-sm text-slate-400">
          All scans run locally against your internal network. No data leaves this machine.
        </p>
      </div>

      <div className="rounded-3xl border border-slate-700 bg-slate-800/80 p-6 shadow-2xl shadow-slate-950/30">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-2xl bg-blue-500/10 p-3 text-blue-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <p className="text-lg font-semibold text-slate-100">Scan Configuration</p>
            <p className="text-sm text-slate-400">Choose the target range and ports to probe.</p>
          </div>
        </div>

        <div className="space-y-5">
        <div>
          <label htmlFor="network-range" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
            <Network className="h-4 w-4 text-slate-500" />
            Target Network Range
          </label>
          <input
            id="network-range"
            type="text"
            value={networkRange}
            onChange={(e) => setNetworkRange(e.target.value)}
            disabled={isScanning}
            className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50 transition-all font-mono text-sm shadow-inner"
            placeholder="e.g. 192.168.1.0/24"
          />
        </div>

          <div>
            <label htmlFor="ports" className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-300">
              <RadioTower className="h-4 w-4 text-slate-500" />
              Ports to Scan
            </label>
            <input
              id="ports"
              type="text"
              value={ports}
              onChange={(e) => setPorts(e.target.value)}
              disabled={isScanning}
              className="w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 font-mono text-sm text-white shadow-inner transition-all placeholder:text-slate-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              placeholder="e.g. 22,80,443,3306"
            />
            <p className="mt-1.5 text-xs text-slate-500">Use a comma-separated list or compact range supported by Nmap.</p>
          </div>

          <button
            onClick={handleStartScan}
            disabled={!canScan}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-500 py-3.5 font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-400 active:bg-blue-600 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-400"
          >
            {isScanning ? (
              <>
                <Loader2 className="h-5 w-5 animate-spin" />
                Scanning network...
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                Start Vulnerability Scan
              </>
            )}
          </button>

          {backendStatus !== 'ok' && (
            <div className="flex items-start gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-4 text-sm text-amber-200">
              <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-400" />
              <span>The local backend is still starting. Wait for the header status to turn green before launching a scan.</span>
            </div>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-500/30 bg-red-950/50 p-4">
          <AlertCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-200">Scan failed</p>
            <span className="text-sm text-red-200">{error}</span>
          </div>
        </div>
      )}

      {scanResult && !error && !isScanning && (
        <div className="rounded-xl border border-green-500/30 bg-green-950/30 p-5">
          <div className="flex items-start gap-3">
            <CheckCircle className="mt-0.5 h-6 w-6 flex-shrink-0 text-green-400" />
            <div>
              <p className="text-sm font-semibold text-green-300">Scan completed successfully</p>
              <p className="mt-1 text-xs uppercase tracking-wide text-green-200/70">Scan ID</p>
              <p className="mt-1 rounded-lg border border-green-500/20 bg-black/30 px-3 py-2 font-mono text-sm text-green-300">
                {scanResult.scan_id}
              </p>
              <p className="mt-3 text-sm text-green-200/80">
                {scanResult.owasp_findings_count ?? 0} OWASP finding{scanResult.owasp_findings_count === 1 ? '' : 's'} detected.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScanControl;
