import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, FileText, Wifi, WifiOff, RefreshCw, AlertTriangle, Maximize2 } from 'lucide-react';
import { checkHealth, getScanResults, getOwaspReport } from './services/api';
import ScanControl from './components/ScanControl';
import ScanResults from './components/ScanResults';
import OwaspReport from './components/OwaspReport';

const TABS = [
  { id: 'scanner', label: 'Scanner',      icon: Shield   },
  { id: 'results', label: 'Results',      icon: Activity },
  { id: 'owasp',   label: 'OWASP Report', icon: FileText },
];

export default function App() {
  const [activeTab,     setActiveTab]     = useState('scanner');
  const [backendStatus, setBackendStatus] = useState('checking'); // 'checking' | 'ok' | 'error'
  const [activeScanId,  setActiveScanId]  = useState(null);
  const [scanData,      setScanData]      = useState(null);
  const [owaspData,     setOwaspData]     = useState(null);
  const [loadingData,   setLoadingData]   = useState(false);
  const [desktopBackend, setDesktopBackend] = useState({ status: 'starting', message: 'Launching local backend…' });

  const hasElectronApi = Boolean(window.electronAPI);

  // ── Backend health polling ─────────────────────────────────────────────
  const pollHealth = useCallback(async () => {
    const { success } = await checkHealth();
    setBackendStatus(success ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    pollHealth();
    const id = setInterval(pollHealth, 10_000);
    return () => clearInterval(id);
  }, [pollHealth]);

  useEffect(() => {
    if (!hasElectronApi) {
      return undefined;
    }

    window.electronAPI.getBackendState().then(setDesktopBackend).catch(() => undefined);
    const unsubscribe = window.electronAPI.onBackendStatus((payload) => {
      setDesktopBackend(payload);
    });

    return unsubscribe;
  }, [hasElectronApi]);

  // ── Called by ScanControl when a scan finishes ─────────────────────────
  const handleScanComplete = useCallback(async (scanId) => {
    setActiveScanId(scanId);
    setActiveTab('results');
    setLoadingData(true);
    setScanData(null);
    setOwaspData(null);

    const [resultsRes, owaspRes] = await Promise.all([
      getScanResults(scanId),
      getOwaspReport(scanId),
    ]);

    if (resultsRes.success) setScanData(resultsRes.data);
    if (owaspRes.success)   setOwaspData(owaspRes.data);
    setLoadingData(false);
  }, []);

  const statusColor = { checking: 'text-yellow-400', ok: 'text-green-400', error: 'text-red-400' }[backendStatus];
  const StatusIcon  = backendStatus === 'ok' ? Wifi : backendStatus === 'checking' ? RefreshCw : WifiOff;
  const statusLabel = { checking: 'Connecting…', ok: 'Connected', error: 'Backend offline' }[backendStatus];
  const desktopError = desktopBackend?.status === 'error' ? desktopBackend.message : '';

  const tabDisabled = (id) => (id === 'results' || id === 'owasp') && !activeScanId;

  const handleToggleFullscreen = useCallback(() => {
    if (window.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    }
  }, []);

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <header className="border-b border-slate-700/60 bg-slate-800/70 backdrop-blur-sm px-6 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Shield className="h-7 w-7 text-blue-400" />
          <span className="font-bold text-lg tracking-wide">BankShield</span>
          <span className="text-slate-500 text-sm hidden sm:block select-none">
            Network Security Scanner
          </span>
        </div>
        <div className="flex items-center gap-4">
          {window.electronAPI?.toggleFullscreen && (
            <button
              type="button"
              onClick={handleToggleFullscreen}
              className="hidden rounded-lg border border-slate-700 bg-slate-900/60 p-2 text-slate-300 transition hover:bg-slate-700 sm:inline-flex"
              title="Toggle fullscreen"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
          )}
          <div className={`flex items-center gap-1.5 text-sm font-medium ${statusColor}`}>
            <StatusIcon
              className={`h-4 w-4 ${backendStatus === 'checking' ? 'animate-spin' : ''}`}
            />
            <span className="hidden sm:inline">{statusLabel}</span>
          </div>
        </div>
      </header>

      {desktopError && (
        <div className="border-b border-red-500/20 bg-red-950/40 px-6 py-3 text-sm text-red-200">
          <div className="mx-auto flex max-w-6xl items-start gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-400" />
            <span>{desktopError}</span>
          </div>
        </div>
      )}

      {/* ── Tab bar ────────────────────────────────────────────────────── */}
      <nav className="border-b border-slate-700/60 bg-slate-800/40 px-4 flex gap-0.5 shrink-0">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => !tabDisabled(id) && setActiveTab(id)}
            disabled={tabDisabled(id)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === id
                ? 'border-blue-500 text-blue-400'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            } ${tabDisabled(id) ? 'opacity-40 cursor-not-allowed' : ''}`}
          >
            <Icon className="h-4 w-4" />
            {label}
            {id === 'results' && activeScanId && (
              <span className="ml-1 px-1.5 py-0.5 bg-blue-500/20 text-blue-300 rounded text-xs font-mono">
                {activeScanId.slice(0, 8)}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* ── Main content ───────────────────────────────────────────────── */}
      <main className="flex-1 p-6 overflow-auto">
        {activeTab === 'scanner' && (
          <div className="max-w-2xl mx-auto">
            <ScanControl
              onScanComplete={handleScanComplete}
              backendStatus={backendStatus}
            />
          </div>
        )}
        {activeTab === 'results' && (
          <ScanResults scanId={activeScanId} data={scanData} loading={loadingData} />
        )}
        {activeTab === 'owasp' && (
          <OwaspReport
            scanId={activeScanId}
            data={owaspData}
            loading={loadingData}
            onToggleFullscreen={handleToggleFullscreen}
          />
        )}
      </main>
    </div>
  );
}
