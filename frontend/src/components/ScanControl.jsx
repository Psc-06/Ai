import React, { useState } from 'react';
import { Shield, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { startScan } from '../services/api';

const ScanControl = ({ onScanComplete }) => {
  const [networkRange, setNetworkRange] = useState('192.168.43.0/24');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [error, setError] = useState(null);

  const handleStartScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setError(null);

    // Call startScan from API service.
    const { success, data, error: apiError } = await startScan(networkRange); 

    if (success && data?.scan_id) {
      setScanResult(data.scan_id);
      if (onScanComplete) {
        onScanComplete(data.scan_id);
      }
    } else {
      setError(apiError || 'Failed to initiate scan. Please try again.');
    }
    
    setIsScanning(false);
  };

  return (
    <div className="bg-slate-900 text-white p-6 rounded-2xl shadow-xl w-full max-w-md border border-slate-800 mx-auto">
      <div className="flex items-center mb-6">
        <Shield className="h-6 w-6 text-blue-500 mr-2" />
        <h2 className="text-xl font-semibold">Security Scanner</h2>
      </div>

      <div className="space-y-5">
        <div>
          <label htmlFor="network-range" className="block text-sm font-medium mb-1.5 text-slate-300">
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

        <button
          onClick={handleStartScan}
          disabled={isScanning || !networkRange.trim()}
          className="flex items-center justify-center w-full py-3.5 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 disabled:bg-blue-500/50 disabled:cursor-not-allowed rounded-xl font-semibold text-white transition-all shadow-lg shadow-blue-500/25"
        >
          {isScanning ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Initiating...
            </>
          ) : (
            <>
              <Shield className="mr-2 h-5 w-5" />
              Start Scan
            </>
          )}
        </button>

        {error && (
          <div className="flex items-start p-4 mt-4 bg-red-950/50 border border-red-500/30 rounded-xl">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0 mt-0.5" />
            <span className="text-sm text-red-200">{error}</span>
          </div>
        )}

        {scanResult && !error && !isScanning && (
          <div className="flex flex-col items-center justify-center p-5 mt-4 bg-green-950/30 border border-green-500/30 rounded-xl">
            <CheckCircle className="h-8 w-8 text-green-500 mb-3" />
            <p className="text-green-300 font-medium text-center">Scan Initiated Successfully</p>
            <div className="text-sm text-green-200/80 mt-2 flex flex-col items-center gap-1.5">
              <span>Scan ID:</span>
              <span className="font-mono bg-black/40 px-3 py-1.5 rounded-lg text-green-400 select-all border border-green-500/20 shadow-sm w-full text-center">
                {scanResult}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScanControl;
