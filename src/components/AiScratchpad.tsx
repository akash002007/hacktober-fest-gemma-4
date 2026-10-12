import { useContractStore } from '../store/useContractStore';
import { 
  PanelRightClose, 
  PanelRight, 
  Activity, 
  ShieldAlert, 
  TrendingDown, 
  Terminal, 
  Cpu,
  CheckCircle2,
  Check,
  Zap,
  BookOpen,
  AlertCircle
} from 'lucide-react';

export function AiScratchpad({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const { 
    clauses, 
    isAnalyzing, 
    currentContract, 
    activeStep, 
    executionEvents, 
    financialExposure,
  } = useContractStore();

  // Dynamic risk counts derived strictly from current contract's persisted analysis
  const totalRisks = clauses.length;
  const criticalCount = clauses.filter((c) => c.risk_level === 'critical').length;
  const highRiskCount = clauses.filter((c) => c.risk_level === 'high').length;
  const mediumRiskCount = clauses.filter((c) => c.risk_level === 'medium').length;
  const lowRiskCount = clauses.filter((c) => c.risk_level === 'low').length;
  const resolvedCount = clauses.filter((c) => c.is_accepted || c.resolution_status === 'resolved' || c.resolution_status === 'accepted').length;
  const pendingCount = clauses.filter((c) => c.resolution_status === 'pending' || (!c.resolution_status && !c.is_accepted)).length;

  // Real execution stepper definition
  const stepperStages = [
    { stepNum: 1, title: '📄 Document uploaded & validated' },
    { stepNum: 2, title: '🔍 Text extraction & OCR layer' },
    { stepNum: 3, title: '📑 Clause identification & index' },
    { stepNum: 4, title: '⚖️ Gemma 4 risk analysis' },
    { stepNum: 5, title: '💡 Strategic recommendation synthesis' },
    { stepNum: 6, title: '✅ Analysis completed' },
  ];

  return (
    <aside
      className={`h-full bg-black/60 backdrop-blur-xl border-l border-white/10 border-t-white/20 shadow-2xl flex flex-col transition-all duration-200 ease-in-out shrink-0 relative z-30 select-none ${
        isCollapsed ? 'w-14' : 'w-80'
      }`}
    >
      {/* Top Header & Collapse Toggle */}
      <div className="p-3 border-b border-zinc-800 flex items-center justify-between shrink-0 font-mono">
        {!isCollapsed && (
          <div className="flex items-center gap-2 px-1">
            <Cpu className="w-4 h-4 text-zinc-400" />
            <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-2">
              PROCESSES
              {isAnalyzing && <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_6px_rgba(255,0,0,0.8)] inline-block" />}
              <span className="text-[10px] font-mono text-zinc-600 ml-1">
                {currentContract?.status === 'failed' ? '[ SYS.ERR ]' : '[ SYS.SYS_OK ]'}
              </span>
            </span>
          </div>
        )}
        <button
          onClick={onToggle}
          className={`p-1.5 rounded-sm hover:bg-zinc-900 text-zinc-400 hover:text-zinc-200 transition-all ${
            isCollapsed ? 'mx-auto' : ''
          }`}
          title={isCollapsed ? "Expand Processes" : "Collapse Processes"}
        >
          {isCollapsed ? <PanelRight className="w-4 h-4" /> : <PanelRightClose className="w-4 h-4" />}
        </button>
      </div>

      {/* When Collapsed, show sleek minimal vertical indicator */}
      {isCollapsed ? (
        <div className="flex-1 flex flex-col items-center py-6 gap-6 justify-between font-mono">
          <div className="flex flex-col items-center gap-4">
            <span className={`w-2 h-2 rounded-full ${isAnalyzing ? 'bg-red-600 animate-pulse shadow-[0_0_6px_rgba(255,0,0,0.8)]' : 'bg-zinc-500'}`} />
            <div className="font-hud tracking-widest text-xs uppercase text-zinc-300 -rotate-90 whitespace-nowrap origin-center mt-12">
              PROCESSES
            </div>
          </div>
          <button
            onClick={onToggle}
            className="w-7 h-7 rounded-sm bg-zinc-900 text-zinc-300 border border-zinc-800 flex items-center justify-center text-xs font-mono font-medium"
            title={`${totalRisks} Risks Detected`}
          >
            {totalRisks}
          </button>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-3 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black bg-[#080808] min-h-0">
          
          {/* Execution Stepper */}
          <div className="relative bg-[#0d0d0d] border border-zinc-800 rounded-sm p-3.5">
            <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-zinc-600 pointer-events-none" />
            <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-zinc-600 pointer-events-none" />
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-zinc-600 pointer-events-none" />
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-zinc-600 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
              <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-1.5 font-bold">
                <Zap className="w-3.5 h-3.5 text-zinc-400" />
                Execution Stepper
                <span className="text-[10px] font-mono text-zinc-600 font-normal ml-1">
                  [ STEP {activeStep}/6 ]
                </span>
              </span>
              <span className={`text-[10px] font-mono font-bold ${
                isAnalyzing ? 'text-red-400 animate-pulse' : currentContract?.status === 'failed' ? 'text-red-500' : 'text-zinc-500'
              }`}>
                {isAnalyzing ? 'RUNNING' : currentContract?.status === 'failed' ? 'FAILED' : totalRisks > 0 || activeStep === 6 ? 'COMPLETED' : 'IDLE'}
              </span>
            </div>

            <div className="space-y-1.5">
              {stepperStages.map((step) => {
                let status: 'pending' | 'active' | 'completed' | 'error' = 'pending';

                if (currentContract?.status === 'failed' && step.stepNum === activeStep) {
                  status = 'error';
                } else if (activeStep > step.stepNum || (!isAnalyzing && totalRisks > 0 && activeStep >= 6)) {
                  status = 'completed';
                } else if (step.stepNum === activeStep && isAnalyzing) {
                  status = 'active';
                } else {
                  status = 'pending';
                }

                return (
                  <div
                    key={step.stepNum}
                    className="bg-[#0d0d0d] border border-zinc-800/80 rounded-sm p-2 text-zinc-300 font-mono text-xs flex items-center justify-between gap-2.5 transition-all duration-200"
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {status === 'active' && (
                        <span className="bg-red-600 shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse w-2 h-2 rounded-full inline-block" />
                      )}
                      {status === 'completed' && (
                        <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      )}
                      {status === 'error' && (
                        <AlertCircle className="w-3.5 h-3.5 text-red-500 shrink-0" />
                      )}
                      {status === 'pending' && (
                        <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                      <span className={`truncate font-mono text-[11px] ${
                        status === 'active' ? 'font-bold text-white' : status === 'completed' ? 'text-zinc-300' : status === 'error' ? 'text-red-400 font-bold' : 'text-zinc-600'
                      }`}>
                        {step.title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Risk Exposure Profile */}
          <div className="relative bg-[#0d0d0d] border border-zinc-800 rounded-sm p-3.5 flex flex-col gap-3">
            <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-zinc-600 pointer-events-none" />
            <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-zinc-600 pointer-events-none" />
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-zinc-600 pointer-events-none" />
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-zinc-600 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
              <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-zinc-400" />
                RISK PROFILE
                <span className="text-[10px] font-mono text-zinc-600 font-normal">
                  {totalRisks > 0 ? '[ SCAN: COMPLETE ]' : isAnalyzing ? '[ SCANNING... ]' : '[ AWAITING INPUT ]'}
                </span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-black p-2.5 rounded-sm border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5">Total Risks</span>
                <span className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  {totalRisks} <span className="text-xs font-mono font-normal text-zinc-400">Indexed</span>
                </span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                  Pending: {pendingCount}
                </span>
              </div>

              <div className="bg-black p-2.5 rounded-sm border border-zinc-800">
                <span className="text-[10px] text-red-500 font-mono uppercase block mb-0.5">Critical Tier</span>
                <span className="text-base font-bold text-red-500 font-mono flex items-center gap-1.5">
                  {criticalCount + highRiskCount}
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                </span>
                <span className="text-[10px] text-zinc-500 font-mono mt-0.5 block">
                  {criticalCount > 0 ? `Crit: ${criticalCount} | ` : ''}High: {highRiskCount} | Med: {mediumRiskCount} | Low: {lowRiskCount}
                </span>
              </div>

              <div className="bg-black p-2.5 rounded-sm border border-zinc-800 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-300 font-mono uppercase block">Resolved Exposures</span>
                  <span className="text-xs text-zinc-400 font-mono">Accepted revisions</span>
                </div>
                <span className="text-base font-bold text-white font-mono flex items-center gap-1">
                  {resolvedCount} / {totalRisks}
                  <CheckCircle2 className={`w-4 h-4 ${resolvedCount > 0 ? 'text-emerald-500' : 'text-zinc-600'}`} />
                </span>
              </div>
            </div>

            {/* Financial Exposure Box */}
            <div className="bg-black p-3 rounded-sm border border-zinc-800 flex flex-col gap-1 font-mono">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-mono font-medium flex items-center gap-1.5">
                  <TrendingDown className={`w-3.5 h-3.5 ${financialExposure && !financialExposure.includes('Not') ? 'text-red-500' : 'text-zinc-500'}`} /> Est. Financial Exposure
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-sm font-mono font-bold ${
                  financialExposure && (financialExposure.includes('Uncapped') || financialExposure.includes('Penalty') || highRiskCount > 0)
                    ? 'bg-red-600 text-white shadow-[0_0_6px_rgba(255,0,0,0.8)]'
                    : 'bg-zinc-800 text-zinc-300'
                }`}>
                  {financialExposure.includes('Uncapped') ? 'UNCAPPED' : financialExposure.includes('Penalty') ? 'QUANTIFIED' : 'ASSESSED'}
                </span>
              </div>
              <p className="text-sm font-bold font-mono text-zinc-200 mt-0.5">
                {financialExposure || 'Not assessed'}
              </p>
              {currentContract?.financialExposureDetail?.reason && (
                <span className="text-[10px] text-zinc-500 font-mono block truncate" title={currentContract.financialExposureDetail.reason}>
                  {currentContract.financialExposureDetail.reason}
                </span>
              )}
            </div>

          </div>

          {/* Live Execution Log Feed */}
          <div className="relative flex-1 flex flex-col bg-[#0d0d0d] border border-zinc-800 rounded-sm p-3.5 min-h-[200px]">
            <div className="absolute top-0.5 left-0.5 w-2 h-2 border-t border-l border-zinc-600 pointer-events-none" />
            <div className="absolute top-0.5 right-0.5 w-2 h-2 border-t border-r border-zinc-600 pointer-events-none" />
            <div className="absolute bottom-0.5 left-0.5 w-2 h-2 border-b border-l border-zinc-600 pointer-events-none" />
            <div className="absolute bottom-0.5 right-0.5 w-2 h-2 border-b border-r border-zinc-600 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
              <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-1.5 font-bold">
                <Terminal className="w-3.5 h-3.5 text-zinc-400" />
                Execution Feed
                <span className="text-[10px] font-mono text-zinc-600 font-normal ml-1">
                  [{executionEvents.length} EVENTS]
                </span>
              </span>
              <span className={`w-2 h-2 rounded-full inline-block ${
                isAnalyzing ? 'bg-red-600 animate-pulse shadow-[0_0_6px_rgba(255,0,0,0.8)]' : 'bg-emerald-500'
              }`} title={isAnalyzing ? 'Analyzing' : 'Ready'} />
            </div>

            <div className="space-y-2 font-mono text-xs overflow-y-auto flex-1 pr-1 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black">
              {executionEvents.length === 0 ? (
                <div className="text-zinc-600 font-mono text-[11px] italic py-8 text-center">
                  No execution logs recorded.
                  <span className="block text-[10px] text-zinc-700 mt-1">Upload a PDF or image contract to begin real-time trace.</span>
                </div>
              ) : (
                executionEvents.map((log) => (
                  <div key={log.id} className="bg-[#0d0d0d] border border-zinc-800/80 rounded-sm p-2 text-zinc-300 font-mono text-xs mb-1.5 flex items-start gap-2 leading-relaxed">
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0 select-none mt-0.5">
                      {log.timestamp}
                    </span>
                    <div className="flex-1 min-w-0 font-mono text-[11px] leading-relaxed text-zinc-300">
                      <span className="text-zinc-400 font-semibold block text-[10px] uppercase">
                        [{log.stage}]
                      </span>
                      <span
                        className={`${
                          log.type === 'error'
                            ? 'text-red-400 font-bold'
                            : log.type === 'warning'
                            ? 'text-amber-400'
                            : log.type === 'success'
                            ? 'text-emerald-400'
                            : 'text-zinc-300'
                        }`}
                      >
                        {log.message}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Active Legal Benchmarking Corpus Note */}
          <div className="bg-[#0d0d0d] border border-zinc-800 rounded-sm p-2 text-[11px] text-zinc-500 font-mono flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Commercial Common Law Legal Corpus & Gemma 4</span>
          </div>

        </div>
      )}
    </aside>
  );
}
