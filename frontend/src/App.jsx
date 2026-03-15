/* eslint-disable no-unused-vars */
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Activity, FileText, Wifi, WifiOff, RefreshCw, AlertTriangle, Maximize2, Menu } from 'lucide-react';
import { checkHealth, getScanResults, getOwaspReport } from './services/api';
import ScanControl from './components/ScanControl';
import ScanResults from './components/ScanResults';
import OwaspReport from './components/OwaspReport';
import { motion, AnimatePresence } from 'framer-motion';

const TABS = [
  {
    id: 'scanner', label: 'Scanner', icon: Shield,
    // cyan/teal — radar / scan identity
    color:       '#22d3ee',
    colorDim:    'rgba(34,211,238,0.18)',
    colorBorder: 'rgba(34,211,238,0.35)',
    colorGlow:   'rgba(34,211,238,0.25)',
    desc: 'Target & Launch',
  },
  {
    id: 'results', label: 'Results', icon: Activity,
    // indigo/blue — data / intelligence identity
    color:       '#818cf8',
    colorDim:    'rgba(129,140,248,0.18)',
    colorBorder: 'rgba(129,140,248,0.35)',
    colorGlow:   'rgba(129,140,248,0.25)',
    desc: 'Intelligence',
  },
  {
    id: 'owasp',   label: 'OWASP Report', icon: FileText,
    // violet/purple — compliance / reporting identity
    color:       '#c084fc',
    colorDim:    'rgba(192,132,252,0.18)',
    colorBorder: 'rgba(192,132,252,0.35)',
    colorGlow:   'rgba(192,132,252,0.25)',
    desc: 'Compliance',
  },
];

const HERO_CONTENT = {
  scanner: {
    eyebrow: 'Command Center',
    title: 'Prepare and launch a focused security assessment.',
    description: 'Define the target range, choose ports, and run a local scan with risk scoring and OWASP mapping built into the workflow.',
    chips: ['Local Engine', 'Guided Presets', 'OWASP Mapping'],
  },
  results: {
    eyebrow: 'Command Center',
    title: 'Review host exposure and prioritize the most important findings.',
    description: 'Correlate open services, CVE evidence, and service-level risk so the highest-value remediation work is obvious at a glance.',
    chips: ['Host Telemetry', 'Risk Pulse', 'Priority Findings'],
  },
  owasp: {
    eyebrow: 'Command Center',
    title: 'Translate technical exposure into OWASP-aligned security themes.',
    description: 'Use categorized findings to explain why discovered weaknesses matter to auditors, engineers, and stakeholders.',
    chips: ['OWASP Matrix', 'Category Trends', 'Executive Export'],
  },
};

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
  const activeTabContent = HERO_CONTENT[activeTab] ?? HERO_CONTENT.scanner;
  const heroStats = [
    {
      label: 'Backend',
      value: backendStatus === 'ok' ? 'Connected' : backendStatus === 'checking' ? 'Checking' : 'Offline',
      tone: backendStatus === 'ok' ? 'text-emerald-200' : backendStatus === 'error' ? 'text-rose-200' : 'text-amber-200',
    },
    {
      label: 'Scan Session',
      value: activeScanId ? activeScanId.slice(0, 8) : 'Not Started',
      tone: 'text-slate-100',
    },
    {
      label: 'Workspace',
      value: TABS.find((tab) => tab.id === activeTab)?.label ?? 'Scanner',
      tone: 'text-cyan-200',
    },
  ];

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
      <div className="noise-overlay" />
      <motion.div
        className="pointer-events-none absolute -left-16 top-24 h-72 w-72 rounded-full bg-cyan-400/20 blur-[90px] ambient-orb"
        animate={{ opacity: [0.55, 0.8, 0.55] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute right-10 top-10 h-80 w-80 rounded-full bg-sky-500/15 blur-[110px] ambient-orb-delayed"
        animate={{ opacity: [0.45, 0.75, 0.45] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="pointer-events-none absolute bottom-0 left-1/2 h-72 w-[40rem] -translate-x-1/2 rounded-full bg-blue-500/10 blur-[120px] ambient-orb-slow"
        animate={{ opacity: [0.35, 0.6, 0.35] }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
      />
      
      {/* ── Sidebar ────────────────────────────────────────────────────── */}
      <motion.aside 
        animate={{ width: isSidebarOpen ? 260 : 80 }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        className="glass-shell relative z-20 m-3 mr-0 flex shrink-0 flex-col rounded-2xl"
      >
        <div className="shell-rail" />
        <div className="flex h-20 items-center border-b border-sky-300/10 px-6">
          {/* Animated pulse rings behind the shield icon */}
          <div className="relative flex-shrink-0">
            <span className="ring-ping-1 absolute inset-0 rounded-2xl border border-amber-400/30" />
            <span className="ring-ping-2 absolute inset-0 rounded-2xl border border-cyan-400/20" />
            <div className="rounded-2xl border border-amber-300/20 bg-gradient-to-br from-amber-400/20 to-sky-400/10 p-2 shadow-[0_0_24px_rgba(245,158,11,0.16)] relative z-10">
              <Shield className="h-7 w-7 min-w-[28px] text-amber-200" />
            </div>
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
                <span className="font-display aurora-text text-xl font-bold tracking-wide">BankShield</span>
                <span className="text-xs font-semibold uppercase tracking-[0.22em] text-amber-200/80">Threat Command</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <nav className="flex-1 px-3 py-6 space-y-1.5">
          {TABS.map(({ id, label, icon: Icon, color, colorDim, colorBorder, colorGlow, desc }) => {
            const isActive = activeTab === id;
            const isDisabled = tabDisabled(id);

            return (
              <button
                key={id}
                onClick={() => !isDisabled && setActiveTab(id)}
                disabled={isDisabled}
                style={isActive ? {
                  background: `linear-gradient(90deg, ${colorDim} 0%, transparent 100%)`,
                  border: `1px solid ${colorBorder}`,
                  boxShadow: `inset 4px 0 0 ${color}, 0 0 20px ${colorGlow}`,
                } : {}}
                className={`group relative flex w-full items-center rounded-xl px-3 py-3 transition-all duration-300 ${
                  isDisabled ? 'cursor-not-allowed opacity-35' : 'cursor-pointer'
                } ${isActive ? '' : 'border border-transparent hover:border-slate-600/30 hover:bg-slate-700/20'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="activeTabIndicator"
                    className="absolute inset-0 rounded-xl pointer-events-none"
                    transition={{ type: 'spring', bounce: 0.18, duration: 0.55 }}
                  />
                )}

                {/* Icon — section-colored when active via inline style */}
                <Icon
                  className="h-5 w-5 min-w-[20px] relative z-10 transition-all duration-300 group-hover:text-slate-200"
                  style={isActive
                    ? { color, filter: `drop-shadow(0 0 6px ${color})` }
                    : { color: '#64748b' }}
                />

                <AnimatePresence>
                  {isSidebarOpen && (
                    <motion.div
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="ml-3 relative z-10 whitespace-nowrap overflow-hidden flex items-center justify-between flex-1"
                    >
                      <div className="flex flex-col items-start">
                        <span
                          className="font-semibold text-sm leading-tight transition-colors duration-300 group-hover:text-slate-100"
                          style={{ color: isActive ? '#f8fafc' : '#94a3b8' }}
                        >
                          {label}
                        </span>
                        {isActive && (
                          <span
                            className="text-[9px] font-bold tracking-[0.18em] uppercase leading-tight mt-0.5"
                            style={{ color, opacity: 0.80 }}
                          >
                            {desc}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 ml-2">
                        {id === 'results' && activeScanId && (
                          <span
                            className="rounded border px-2 py-0.5 text-[10px] font-bold tracking-wider"
                            style={{ color, borderColor: colorBorder, backgroundColor: colorDim }}
                          >
                            {activeScanId.slice(0, 5)}
                          </span>
                        )}
                        {isActive && (
                          <span
                            className="h-1.5 w-1.5 rounded-full flex-shrink-0"
                            style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
                          />
                        )}
                      </div>
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
        <header className="h-20 shrink-0 border-b border-sky-300/10 bg-slate-950/25 px-6 backdrop-blur-md">
          <div className="flex h-full items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="-ml-2 rounded-lg border border-transparent p-2 text-slate-400 transition-colors hover:border-amber-300/20 hover:bg-amber-400/10 hover:text-white"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div>
              <span className="section-kicker">Operations View</span>
              <h1 className="font-display aurora-text mt-2 text-xl font-semibold">
              {TABS.find(t => t.id === activeTab)?.label}
              </h1>
              <p className="mt-0.5 text-xs text-slate-400 md:text-sm">
                Real-time local network intelligence with risk scoring, host telemetry, and OWASP context.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden xl:flex items-center gap-2">
              <span className="accent-pill">
                Local First
              </span>
              <span className={`status-pill ${backendStatus === 'ok' ? 'border-emerald-300/20 bg-emerald-500/10 text-emerald-200' : backendStatus === 'error' ? 'border-rose-300/20 bg-rose-500/10 text-rose-200' : 'border-amber-300/20 bg-amber-500/10 text-amber-200'}`}>
                API {statusLabel}
              </span>
            </div>
            {activeScanId && (
              <div className="hidden items-center gap-2 rounded-xl border border-amber-300/20 bg-gradient-to-r from-amber-400/12 to-sky-400/10 px-3 py-1.5 text-xs font-semibold tracking-wider text-amber-100 md:flex">
                ACTIVE SCAN
                <span className="font-mono text-slate-100">{activeScanId.slice(0, 8)}</span>
              </div>
            )}
            {window.electronAPI?.toggleFullscreen && (
              <button
                type="button"
                onClick={handleToggleFullscreen}
                className="rounded-lg border border-amber-300/20 bg-gradient-to-br from-amber-400/12 to-sky-400/8 p-2 text-slate-100 transition-all hover:border-amber-300/30 hover:bg-amber-400/18 active:scale-95"
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
        <div className="flex-1 overflow-y-auto p-4 md:p-5">
          {activeTab !== 'scanner' && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="hero-surface panel-glow mb-4 rounded-2xl px-5 py-4 md:px-6 md:py-4"
          >
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <span className="section-kicker">{activeTabContent.eyebrow}</span>
                <h2 className="font-display aurora-text mt-2 max-w-3xl text-lg font-semibold tracking-tight md:text-2xl">
                  {activeTabContent.title}
                </h2>
                <p className="mt-2 max-w-2xl text-xs leading-relaxed text-slate-300 md:text-sm">
                  {activeTabContent.description}
                </p>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 lg:min-w-[420px]">
                {heroStats.map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-300/15 bg-slate-950/45 px-4 py-2.5">
                    <p className="hud-label">{item.label}</p>
                    <p className={`mt-1.5 text-sm font-semibold ${item.tone} md:text-base`}>{item.value}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {activeTabContent.chips.map((chip) => (
                <span key={chip} className="status-pill">
                  {chip}
                </span>
              ))}
            </div>
          </motion.div>
          )}
          <AnimatePresence mode="wait">
            {activeTab === 'scanner' && (
              <motion.div key="scanner" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="mx-auto h-full w-full max-w-6xl min-w-0">
                <ScanControl
                  onScanComplete={handleScanComplete}
                  backendStatus={backendStatus}
                />
              </motion.div>
            )}
            {activeTab === 'results' && (
              <motion.div key="results" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full min-w-0">
                <ScanResults scanId={activeScanId} data={scanData} loading={loadingData} />
              </motion.div>
            )}
            {activeTab === 'owasp' && (
              <motion.div key="owasp" variants={pageVariants} initial="initial" animate="animate" exit="exit" className="h-full w-full min-w-0">
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
