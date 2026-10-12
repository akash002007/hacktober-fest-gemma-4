import { useState, useRef } from 'react';
import { useContractStore, API_BASE } from './store/useContractStore';
import { LandingPage } from './components/LandingPage';
import { LeftSidebar } from './components/LeftSidebar';
import { AiScratchpad } from './components/AiScratchpad';
import { UploadZone } from './components/UploadZone';
import { ContractViewer } from './components/ContractViewer';
import { CounterArgumentsPanel } from './components/CounterArgumentsPanel';
import { RedlinedExportModal } from './components/RedlinedExportModal';
import { SettingsModal } from './components/SettingsModal';
import { Toast } from './components/Toast';
import { 
  Send, 
  Paperclip, 
  RefreshCw, 
  Layers, 
  FileText,
  Zap,
  ArrowUpRight,
  Download,
  Sparkles,
  LogOut
} from 'lucide-react';

const PROMPT_SUGGESTIONS = [
  "Analyze Master Services Agreement for uncapped indemnification and liability gaps",
  "Check termination for convenience notice periods and pre-paid refund obligations",
  "Benchmark Governing Law clause against Delaware commercial litigation precedent",
  "Verify trade secret definition and 3-year confidentiality survival terms"
];

export function App() {
  const { 
    clauses, 
    isAnalyzing, 
    file, 
    resetWorkspace,
    isDemoData,
    loadMockDocument,
    triggerToast,
    setExportModalOpen,
    isAuthenticated,
    setAuthenticated
  } = useContractStore();

  const [prompt, setPrompt] = useState('');
  const [isRightCollapsed, setIsRightCollapsed] = useState(false);
  const hiddenFileInputRef = useRef<HTMLInputElement>(null);

  if (!isAuthenticated) {
    return (
      <>
        <LandingPage />
        <Toast />
      </>
    );
  }

  const handlePromptSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!prompt.trim()) return;
    if (!file && clauses.length === 0) {
      triggerToast("Please upload a contract document before submitting a legal prompt.");
      return;
    }
    triggerToast(`Prompt applied: "${prompt.slice(0, 40)}..."`);
    setPrompt('');
  };

  const handleAttachFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (hiddenFileInputRef.current) hiddenFileInputRef.current.value = '';

      const { setFile, setAnalyzing, setClauses, setSelectedClauseId, setIsDemoData, setGeneralResponse, setScratchpadSummary } = useContractStore.getState();
      setFile(selectedFile);
      setAnalyzing(true);

      try {
        const formData = new FormData();
        formData.append('pdf', selectedFile);
        if (prompt.trim()) formData.append('prompt', prompt.trim());

        const targetUrl = `${API_BASE}/api/analyze`;
        const res = await fetch(targetUrl, {
          method: 'POST',
          body: formData,
        });

        if (!res.ok) {
          let errData: any = {};
          try {
            errData = await res.json();
          } catch {
            // Non-JSON response
          }
          let serverMsg = errData.error || errData.message;
          if (!serverMsg) {
            if (res.status === 502 || res.status === 503) {
              serverMsg = 'Backend server is unavailable or offline (HTTP 502/503). Ensure backend is running on port 5000.';
            } else {
              serverMsg = `Server returned HTTP ${res.status}`;
            }
          }
          throw new Error(serverMsg);
        }

        const json = await res.json();
        const contract = json.contract;
        const analysisData = json.data || {};
        const rawFindings = contract?.risks || analysisData.findings || [];

        setIsDemoData(false);
        setClauses(rawFindings);
        setSelectedClauseId(rawFindings[0]?.id || null);
        if (setGeneralResponse) setGeneralResponse(analysisData.general_response || contract?.generalResponse);
        if (setScratchpadSummary) setScratchpadSummary(analysisData.scratchpad_summary || contract?.scratchpadSummary);

        if (contract?.id) {
          useContractStore.setState({
            currentContractId: contract.id,
            currentContract: contract,
            fileUrl: `${API_BASE}/api/contracts/${contract.id}/file`,
            financialExposure: contract.financialExposure || 'Not assessed',
            activeStep: contract.activeStep || 6,
            executionEvents: contract.executionEvents || [],
          });
          useContractStore.getState().loadContracts();
        }

        triggerToast(`Analysis completed! Indexed ${rawFindings.length} clauses.`);
      } catch (err: any) {
        let errMsg = err.message || 'Unknown processing error';
        if (err instanceof TypeError && err.message.toLowerCase().includes('failed to fetch')) {
          errMsg = 'Cannot reach backend server. Please verify the Express backend is running on http://localhost:5000.';
        }
        triggerToast(`Analysis Failed: ${errMsg}`);
        setFile(null);
        setClauses([]);
      } finally {
        setAnalyzing(false);
        setPrompt('');
      }
    }
  };

  const handleQuickDemo = () => {
    loadMockDocument('Vendor_MSA_Acme_2026.pdf');
    triggerToast("Sample Demo Preset loaded. Displaying pre-analyzed demo data.");
  };

  const isDocumentLoaded = (file !== null || clauses.length > 0) && !isAnalyzing;

  return (
    <div className="h-screen w-screen overflow-hidden bg-black bg-[radial-gradient(#222222_1px,transparent_1px)] [background-size:16px_16px] text-neutral-100 flex font-sans selection:bg-neutral-800 selection:text-white">
      
      {/* 1. Left Collapsible Sidebar */}
      <LeftSidebar />

      {/* 2. Center Area (Main Focus & Workbench) */}
      <div className="flex-1 h-full flex flex-col min-w-0 overflow-hidden relative bg-black/40">
        
        {/* Top Header Bar for Workspace */}
        <header className="h-14 border-b border-white/10 bg-black/60 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-8 h-8 rounded-sm bg-zinc-900 border border-zinc-700 flex items-center justify-center shrink-0 overflow-hidden p-1">
              <img src="/logo.png" alt="ContractLens Logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex items-center gap-2">
              <h1 className="text-sm font-bold tracking-wide text-white uppercase truncate font-display flex items-center gap-1.5">
                ContractLens<span className="text-red-600">.</span>
              </h1>
              {isDocumentLoaded && file && (
                <>
                  <span className="text-zinc-700 font-light">/</span>
                  <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 truncate bg-zinc-900 px-2.5 py-1 rounded-sm border border-zinc-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-zinc-400" />
                    {file.name}
                  </span>
                  {isDemoData && (
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-sm bg-amber-950/80 text-amber-300 border border-amber-800 uppercase font-bold tracking-wider">
                      Demo Mode
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isDocumentLoaded ? (
              <button
                onClick={handleQuickDemo}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-zinc-900 text-zinc-300 border border-zinc-700 hover:border-white font-display font-semibold uppercase tracking-wider text-xs rounded-sm transition-all duration-150 active:scale-95"
                title="Instant Demo Mode for Presentations"
              >
                <Zap className="w-3.5 h-3.5 text-zinc-300 fill-current" />
                <span>Quick Demo Mode</span>
              </button>
            ) : (
              <>
                <button
                  onClick={() => setExportModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-white hover:bg-zinc-200 text-black font-display font-semibold uppercase tracking-wider text-xs transition-all duration-150 active:scale-95"
                  title="Open executive summary and redline export modal"
                >
                  <Download className="w-3.5 h-3.5 text-black" />
                  <span>Export Summary & Redline</span>
                </button>

                <button
                  onClick={async () => {
                    if (window.confirm("Are you sure you want to reset the active workspace?")) {
                      await resetWorkspace();
                      triggerToast("Active workspace reset.");
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 hover:text-white font-display font-semibold uppercase tracking-wider text-xs transition-all active:scale-95"
                  title="Reset active workbench"
                >
                  <RefreshCw className="w-3.5 h-3.5 text-zinc-400" />
                  <span className="hidden sm:inline">Reset Workspace</span>
                </button>
              </>
            )}

            <button
              onClick={() => {
                setAuthenticated(false);
                triggerToast("Logged out of Enterprise Workbench");
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm bg-zinc-950 hover:bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white font-display font-semibold uppercase tracking-wider text-xs transition-all"
              title="Sign Out"
            >
              <LogOut className="w-3.5 h-3.5 text-zinc-500" />
              <span className="hidden md:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dynamic Canvas Area */}
        <main className="flex-1 h-[calc(100vh-64px)] overflow-hidden relative flex flex-col bg-black">
          
          {/* STATE A: EMPTY / PRE-UPLOAD STATE (Spacious Linear/Vercel Shell) */}
          {!isDocumentLoaded && (
            <div className="flex-1 h-full overflow-y-auto scrollbar-none [scrollbar-width:none] [&::-webkit-scrollbar]:hidden p-6 sm:p-8 flex flex-col justify-between items-center max-w-4xl mx-auto w-full gap-8">
              
              <div className="w-full mt-4 sm:mt-8 text-center space-y-4">
                <div className="flex justify-center mb-1">
                  <div className="w-44 h-44 rounded-full bg-white flex items-center justify-center border-2 border-zinc-200 shadow-2xl p-6 overflow-hidden">
                    <img src="/logo.png" alt="ContractLens Main Logo" className="w-full h-full object-contain" />
                  </div>
                </div>

                <div className="flex items-center justify-center gap-2.5 flex-wrap mb-2">
                  <button
                    onClick={handleQuickDemo}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 font-display font-semibold uppercase tracking-wider text-xs transition-all"
                    title="Load sample contract package instantly"
                  >
                    <Zap className="w-3.5 h-3.5 text-neutral-300 fill-current" />
                    <span>Instant Demo Preset (Click to Demo)</span>
                  </button>
                </div>

                <h2 className="text-2xl sm:text-4xl font-display font-bold uppercase tracking-wide text-white leading-tight max-w-2xl mx-auto">
                  Contract Analysis & Risk Intelligence
                </h2>
                <p className="font-mono text-xs sm:text-sm leading-relaxed text-zinc-300 max-w-xl mx-auto">
                  Upload any vendor agreement, MSA, or NDA. ContractLens indexes covenants, highlights non-standard liabilities, and drafts defensive resolutions.
                </p>
              </div>

              {/* Centered Minimal UploadZone */}
              <div className="w-full max-w-2xl mx-auto my-auto">
                <UploadZone />
              </div>

              {/* Suggestion Chips */}
              <div className="w-full max-w-2xl space-y-2.5 mb-2">
                <div className="flex items-center justify-between px-1 font-hud tracking-widest text-xs uppercase text-zinc-300">
                  <span className="flex items-center gap-2">
                    RECOMMENDED AUDITS
                    <span className="text-[10px] font-mono text-zinc-600">[ BENCHMARKS_READY ]</span>
                  </span>
                  <span>Select to auto-run sample contract</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {PROMPT_SUGGESTIONS.map((sug, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setPrompt(sug);
                        loadMockDocument('Vendor_MSA_Acme_2026.pdf');
                        triggerToast(`Analyzing contract for: "${sug.slice(0, 30)}..."`);
                      }}
                      className="bg-black/60 backdrop-blur-md border border-white/10 border-t-white/20 hover:border-zinc-500/80 hover:bg-zinc-900/40 transition-all duration-200 rounded-sm p-3.5 cursor-pointer text-left flex items-center justify-between group shadow-xl"
                    >
                      <span className="font-mono text-xs leading-relaxed text-zinc-300 group-hover:text-white line-clamp-2 pr-2 font-normal">{sug}</span>
                      <ArrowUpRight className="w-4 h-4 text-zinc-600 group-hover:text-white transition-colors shrink-0" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Bottom Prompt Input Box */}
              <div className="w-full max-w-2xl sticky bottom-0 pb-6 pt-2 bg-gradient-to-t from-black via-black/95 to-transparent z-10">
                <form onSubmit={handlePromptSubmit} className="relative flex flex-col gap-2 bg-[#121212] border border-zinc-700/80 rounded-md shadow-2xl focus-within:border-white focus-within:ring-1 focus-within:ring-white/20 transition-all p-2.5">
                  
                  <textarea
                    rows={2}
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handlePromptSubmit();
                      }
                    }}
                    placeholder="Specify negotiation risk appetite or custom extraction instructions..."
                    className="w-full placeholder:text-zinc-400 font-mono text-xs text-zinc-100 bg-transparent focus:outline-none resize-none border-0 p-1 leading-relaxed"
                  />

                  <input
                    ref={hiddenFileInputRef}
                    type="file"
                    accept=".pdf,.docx,.txt"
                    onChange={handleAttachFile}
                    className="hidden"
                  />

                  <div className="flex items-center justify-between pt-1 border-t border-zinc-800/60">
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => hiddenFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-600 font-mono font-semibold text-xs rounded-sm px-3 py-1.5 transition-colors"
                        title="Attach contract document (.pdf)"
                      >
                        <Paperclip className="w-3.5 h-3.5 text-white shrink-0" />
                        <span>ATTACH CONTRACT</span>
                      </button>
                      <span className="text-zinc-400 font-mono text-[11px] uppercase hidden sm:inline">PDF UP TO 10MB</span>
                    </div>

                    <button
                      type="submit"
                      disabled={!prompt.trim() && !file}
                      className="inline-flex items-center justify-center bg-white text-black hover:bg-zinc-200 rounded-sm p-2 transition-colors disabled:opacity-40"
                      title="Send instructions"
                    >
                      <Send className="w-4 h-4 text-black shrink-0" />
                    </button>
                  </div>
                </form>
              </div>

            </div>
          )}

          {/* STATE B: DOCUMENT LOADED / HORIZONTAL SPLIT SCREEN MODE (50% / 50% Workbench) */}
          {isDocumentLoaded && (
            <div className="flex-1 p-3 grid grid-cols-1 lg:grid-cols-12 gap-3 overflow-hidden animate-in fade-in duration-200 h-full bg-black">
              
              {/* Left Half (6 cols on Desktop): Document Viewer with Indexed Risk Highlights */}
              <div className="lg:col-span-6 h-full flex flex-col min-w-0 overflow-hidden">
                <div className="flex items-center justify-between pb-1.5 px-1 font-hud tracking-widest uppercase text-xs text-zinc-300">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-neutral-500" />
                      Document Canvas (50%)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">[ CROSSHAIR_ACTIVE ]</span>
                  </span>
                  <span className="text-[10px] text-neutral-300 bg-neutral-900 px-2 py-0.5 rounded-sm border border-neutral-800 font-mono">
                    Indexed Overlays Active
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <ContractViewer />
                </div>
              </div>

              {/* Right Half (6 cols on Desktop): AI Resolution & Counter-Arguments Panel */}
              <div className="lg:col-span-6 h-full flex flex-col min-w-0 overflow-hidden">
                <div className="flex items-center justify-between pb-1.5 px-1 font-hud tracking-widest uppercase text-xs text-zinc-300">
                  <span className="flex items-center gap-2">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-neutral-500" />
                      Counter-Arguments & Resolutions (50%)
                    </span>
                    <span className="text-[10px] font-mono text-zinc-600">[ RESOLVER.ON ]</span>
                  </span>
                  <span className="text-[10px] text-emerald-400 bg-emerald-950/40 px-2 py-0.5 rounded-sm border border-emerald-500/30 font-mono">
                    Symmetrical Terms Drafted
                  </span>
                </div>
                <div className="flex-1 min-h-0 overflow-hidden">
                  <CounterArgumentsPanel />
                </div>
              </div>

            </div>
          )}

        </main>

      </div>

      {/* 3. Right Sidebar (AI Live Processing Scratchpad) - Only shown when document is loaded or analysis running */}
      {(isDocumentLoaded || isAnalyzing) && (
        <AiScratchpad isCollapsed={isRightCollapsed} onToggle={() => setIsRightCollapsed(!isRightCollapsed)} />
      )}

      {/* Redlined Document Export & Summary Modal */}
      <RedlinedExportModal />

      {/* Workspace & User Settings Modal */}
      <SettingsModal />

      {/* Global Toast Banner */}
      <Toast />
    </div>
  );
}

export default App;
