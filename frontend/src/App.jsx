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
    <div className="flex h-screen w-full bg-zinc-950 text-slate-200 overflow-hidden font-sans selection:bg-blue-500/30">
      
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="relative z-20 flex flex-col shrink-0 border-r border-white/5 bg-zinc-900/50 backdrop-blur-xl"
      >
        <div className="flex items-center h-20 px-6 border-b border-white/5">
          <Shield className="h-8 w-8 text-blue-500 min-w-[32px] drop-shadow-[0_0_12px_rgba(59,130,246,0.5)]" />
          <AnimatePresence>
            {isSidebarOpen && (
              <motion.div 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="ml-4 flex flex-col whitespace-nowrap"
              >
                <span className="font-bold text-lg tracking-wide text-white">BankShield</span>
                <span className="text-blue-400/80 text-xs font-medium uppercase tracking-widest">Network Scanner</span>
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
                className={`group relative flex w-full items-center px-3 py-3 rounded-xl transition-all duration-300 ${
                  isDisabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer hover:bg-white/5'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl bg-blue-500/10 border border-blue-500/20"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                
                <Icon className={`h-5 w-5 min-w-[20px] relative z-10 transition-colors duration-300 ${
                  isActive ? 'text-blue-400' : 'text-slate-400 group-hover:text-slate-200'
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
                        isActive ? 'text-blue-100' : 'text-slate-400 group-hover:text-slate-200'
                      }`}>
                        {label}
                      </span>
                      {id === 'results' && activeScanId && (
                        <span className="px-2 py-0.5 bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded text-[10px] font-mono font-bold tracking-wider">
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
        <div className="p-4 border-t border-white/5">
          <div className={`p-3 rounded-xl border flex items-center gap-3 transition-colors ${
            backendStatus === 'ok' ? 'bg-emerald-500/10 border-emerald-500/20' : 
            backendStatus === 'error' ? 'bg-rose-500/10 border-rose-500/20' : 
            'bg-amber-500/10 border-amber-500/20'
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
      <main className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Header */}
        <header className="h-20 px-8 flex items-center justify-between shrink-0 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 -ml-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <Menu className="h-5 w-5" />
            </button>
            <h1 className="text-xl font-semibold text-white/90">
              {TABS.find(t => t.id === activeTab)?.label}
            </h1>
          </div>

          <div className="flex items-center gap-3">
            {window.electronAPI?.toggleFullscreen && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="rounded-lg border border-white/10 bg-white/5 p-2 text-slate-300 transition-all hover:bg-white/10 hover:border-white/20 active:scale-95"
                title="Toggle fullscreen"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
            )}
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
        <div className="flex-1 overflow-auto p-6 md:p-10">
          <AnimatePresence mode="wait">
            {activeTab === 'scanner' && (
              <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="max-w-3xl mx-auto w-full">
                <ScanControl
                  onScanComplete={handleScanComplete}
                  backendStatus={backendStatus}
                />
              </motion.div>
            )}
            {activeTab === 'results' && (
              <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
                <ScanResults scanId={activeScanId} data={scanData} loading={loadingData} />
              </motion.div>
            )}
            {activeTab === 'owasp' && (
              <motion.div key="owasp" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="w-full">
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
