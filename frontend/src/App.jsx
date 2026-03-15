/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, FileText, Wifi, WifiOff, RefreshCw, AlertTriangle, Maximize2, Menu } from 'lucide-react';
import { checkHealth, getScanResults, getOwaspReport } from './services/api';
import ScanControl from './components/ScanControl';
import ScanResults from './components/ScanResults';
import OwaspReport from './components/OwaspReport';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  { id: 'scanner', label: 'Scanner',      icon: Shield   },
  { id: 'results', label: 'Results',      icon: Activity },
  { id: 'owasp',   label: 'OWASP Report', icon: FileText },
];

export default function App() {
  const [activeTab,     setActiveTab]     = useState('scanner');
  const [backendStatus, setBackendStatus] = useState('checking');
  const [activeScanId,  setActiveScanId]  = useState(null);
  const [scanData,      setScanData]      = useState(null);
  const [owaspData,     setOwaspData]     = useState(null);
  const [loadingData,   setLoadingData]   = useState(false);
  const [desktopBackend, setDesktopBackend] = useState({ status: 'starting', message: 'Launching local backend…' });
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const hasElectronApi = Boolean(window.electronAPI);

  const pollHealth = useCallback(async () => {
    const { success } = await checkHealth();
    setBackendStatus(success ? 'ok' : 'error');
  }, []);

  useEffect(() => {
    // eslint-disable-next-line
    pollHealth();
    const id = setInterval(pollHealth, 10_000);
    return () => clearInterval(id);
  }, [pollHealth]);

  useEffect(() => {
    if (!hasElectronApi) return undefined;

    window.electronAPI.getBackendState().then(setDesktopBackend).catch(() => undefined);
    const unsubscribe = window.electronAPI.onBackendStatus((payload) => {
      setDesktopBackend(payload);
    });

    return unsubscribe;
  }, [hasElectronApi]);

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

  const statusColor = { checking: 'text-amber-400', ok: 'text-emerald-400', error: 'text-rose-400' }[backendStatus];
  const StatusIcon  = backendStatus === 'ok' ? Wifi : backendStatus === 'checking' ? RefreshCw : WifiOff;
  const statusLabel = { checking: 'Connecting…', ok: 'Connected', error: 'Backend offline' }[backendStatus];
  const desktopError = desktopBackend?.status === 'error' ? desktopBackend.message : '';

  const tabDisabled = (id) => (id === 'results' || id === 'owasp') && !activeScanId;

  const handleToggleFullscreen = useCallback(() => {
    if (window.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    }
  }, []);

  // Framer motion variants for page transitions
  const pageVariants = {
    initial: { opacity: 0, y: 15, scale: 0.98 },
    animate: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } },
    exit: { opacity: 0, y: -15, scale: 0.98, transition: { duration: 0.3, ease: [0.22, 1, 0.36, 1] } }
  };

  return (
    <div className="relative flex h-screen w-full overflow-hidden text-slate-100 selection:bg-sky-400/30">
      <div className="pointer-events-none absolute inset-0 app-grid-overlay opacity-60" />
      <div className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-[90px]" />
      <div className="pointer-events-none absolute right-10 top-10 h-80 w-80 rounded-full bg-sky-500/15 blur-[110px]" />
      <div className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px]" />
      
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-shell relative z-20 m-3 mr-0 flex shrink-0 flex-col rounded-2xl"
      >
        <div className="flex h-20 items-center border-b border-sky-300/10 px-6">
          <div className="rounded-2xl border border-sky-300/20 bg-sky-400/10 p-2 shadow-[0_0_20px_rgba(56,189,248,0.2)]">
            <Shield className="h-7 w-7 min-w-[28px] text-sky-300" />
          </div>
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-4 flex flex-col whitespace-nowrap"
              >
                <span className="text-lg font-bold tracking-wide text-slate-100">BankShield</span>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-300/80">Threat Command</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            const isDisabled = tabDisabled(id);
            
            return (
              <button
                key={id}
                onClick={() => !isDisabled && setActiveTab(id)}
                disabled={isDisabled}
                className={`group relative flex w-full items-center rounded-xl px-3 py-3 transition-all duration-300 ${
                  isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer hover:bg-slate-700/30'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl border border-sky-300/30 bg-gradient-to-r from-sky-500/25 to-cyan-400/15"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Icon className={`h-5 w-5 min-w-[20px] relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-sky-300' : 'text-slate-400 group-hover:text-slate-200'
                }`} />
                
                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 relative z-10 whitespace-nowrap overflow-hidden flex items-center justify-between flex-1"
                    >
                      <span className={`font-medium text-sm transition-colors duration-300 ${
                        isActive ? 'text-sky-100' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {label}
                      </span>
                      {id === 'results' && activeScanId && (
                        <span className="rounded border border-sky-300/25 bg-sky-400/10 px-2 py-0.5 text-[10px] font-bold tracking-wider text-cyan-200">
                          {activeScanId.slice(0, 5)}
                        </span>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </button>
            );
          })}
        </nav>

        {/* Backend Status Widget */}
        <div className="border-t border-sky-300/10 p-4">
          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            backendStatus === 'ok' ? 'border-emerald-300/30 bg-emerald-500/10' : 
            backendStatus === 'error' ? 'border-rose-300/30 bg-rose-500/10' : 
            'border-amber-300/30 bg-amber-500/10'
          }`}>
            <div className="relative flex min-w-[16px] items-center justify-center">
              {backendStatus === 'ok' && (
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-20"></span>
              )}
              <StatusIcon className={`h-4 w-4 relative z-10 ${statusColor} ${backendStatus === 'checking' ? 'animate-spin' : ''}`} />
            </div>
            
            <AnimatePresence>
              {isSidebarOpen && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="flex flex-col whitespace-nowrap overflow-hidden"
                >
                  <span className={`text-xs font-bold uppercase tracking-wider ${statusColor}`}>
                    {statusLabel}
                  </span>
                  {backendStatus === 'ok' && (
                    <span className="text-[10px] text-slate-500 font-mono">127.0.0.1:5000</span>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.aside>

      {/* ── Main Content Area ──────────────────────────────────────────── */}
      <main className="relative z-10 m-3 ml-3 flex min-w-0 flex-1 flex-col rounded-2xl glass-shell">
        {/* Top Header */}
        <header className="h-20 shrink-0 border-b border-sky-300/10 bg-slate-950/25 px-8 backdrop-blur-md">
          <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="-ml-2 rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-sky-300/20 hover:bg-sky-400/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <p className="hud-label">Operations View</p>
              <h1 className="text-xl font-semibold text-slate-100">
              {TABS.find(t => t.id === activeTab)?.label}
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {activeScanId && (
              <div className="hidden items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-400/10 px-3 py-1.5 text-xs font-semibold tracking-wider text-cyan-200 md:flex">
                ACTIVE SCAN
                <span className="font-mono text-slate-100">{activeScanId.slice(0, 8)}</span>
              </div>
            )}
            {window.electronAPI?.toggleFullscreen && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="rounded-lg border border-sky-300/20 bg-sky-400/10 p-2 text-slate-100 transition-all hover:border-sky-300/30 hover:bg-sky-400/20 active:scale-95"
                title="Toggle fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
          </div>
          </div>
        </header>

        {desktopError && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="m-6 mb-0 rounded-xl border border-rose-500/20 bg-rose-500/10 px-6 py-4 text-sm text-rose-200 backdrop-blur-md shadow-lg shadow-rose-900/20"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-rose-400" />
              <span>{desktopError}</span>
            </div>
          </motion.div>
        )}

        {/* Scrollable Content */}
        <div className="flex-1 overflow-auto p-5 md:p-9">
          <AnimatePresence mode="wait">
            {activeTab === 'scanner' && (
              <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto w-full min-w-0">
                <ScanControl
                  onScanComplete={handleScanComplete}
                  backendStatus={backendStatus}
                />
              </motion.div>
            )}
            {activeTab === 'results' && (
              <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full min-w-0">
                <ScanResults scanId={activeScanId} data={scanData} loading={loadingData} />
              </motion.div>
            )}
            {activeTab === 'owasp' && (
              <motion.div key="owasp" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full min-w-0">
                <OwaspReport
                  scanId={activeScanId}
                  data={owaspData}
                  loading={loadingData}
                  onToggleFullscreen={handleToggleFullscreen}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
