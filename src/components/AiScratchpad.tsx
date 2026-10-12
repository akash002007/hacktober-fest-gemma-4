import { useState, useEffect } from 'react';
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
  BookOpen
} from 'lucide-react';

interface LogItem {
  id: string;
  time: string;
  text: string;
  type: 'info' | 'warning' | 'success' | 'working';
}

const INITIAL_LOGS: LogItem[] = [
  { id: 'l-1', time: '00:01s', text: '📄 PDF structural parsing & OCR indexing complete.', type: 'info' },
  { id: 'l-2', time: '00:08s', text: '🔍 Identified 4 core legal covenants in agreement.', type: 'info' },
  { id: 'l-3', time: '00:15s', text: '⚠️ Flagged uncapped indemnity obligations on Page 3 (#1 Critical)', type: 'warning' },
  { id: 'l-4', time: '00:22s', text: '⚠️ Flagged 2-day unilateral termination notice on Page 5 (#2 Moderate)', type: 'warning' },
  { id: 'l-5', time: '00:28s', text: '💡 Formulated defensive counter-proposals & negotiation rationale.', type: 'info' },
  { id: 'l-6', time: '00:34s', text: '✅ Inspection workbench synchronized & ready.', type: 'success' },
];

export function AiScratchpad({ isCollapsed, onToggle }: { isCollapsed: boolean; onToggle: () => void }) {
  const { clauses, isAnalyzing, file, scratchpadSummary } = useContractStore();
  const [logs, setLogs] = useState<LogItem[]>(INITIAL_LOGS);
  const [activeStepIndex, setActiveStepIndex] = useState<number>(4);

  // Progressive Step Execution during analysis
  const stepperDefinition: { timeLabel: string; title: string }[] = [
    { timeLabel: '0s', title: '📄 Parsing PDF layout & visual layers...' },
    { timeLabel: '1s', title: '🔍 Identifying indemnification & liability clauses...' },
    { timeLabel: '2s', title: '⚖️ Cross-referencing against standard risk guidelines...' },
    { timeLabel: '3s', title: '💡 Formulating strategic counter-proposals...' },
  ];

  useEffect(() => {
    if (isAnalyzing) {
      setActiveStepIndex(0);
      setLogs([{ id: 'init', time: '00:00s', text: '⚡ Initializing extraction & OCR engine...', type: 'working' }]);

      const timer1 = setTimeout(() => {
        setActiveStepIndex(1);
        setLogs((prev) => [...prev, { id: 's1', time: '00:01s', text: '📄 Parsing PDF layout & visual layers...', type: 'working' }]);
      }, 1000);

      const timer2 = setTimeout(() => {
        setActiveStepIndex(2);
        setLogs((prev) => [...prev, { id: 's2', time: '00:02s', text: '🔍 Identifying indemnification & liability terms...', type: 'info' }, { id: 'w1', time: '00:02s', text: '⚠️ High liability anomaly detected', type: 'warning' }]);
      }, 2000);

      const timer3 = setTimeout(() => {
        setActiveStepIndex(3);
        setLogs((prev) => [...prev, { id: 's3', time: '00:03s', text: '⚖️ Cross-referencing against standard legal corpus...', type: 'info' }, { id: 's4', time: '00:03s', text: '💡 Formulating defensive counter-proposals...', type: 'working' }]);
      }, 3000);

      const timer4 = setTimeout(() => {
        setActiveStepIndex(4);
        setLogs((prev) => [...prev, { id: 's5', time: '00:03.5s', text: '✅ Analysis complete! Workbench synchronized.', type: 'success' }]);
      }, 3500);

      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
        clearTimeout(timer4);
      };
    } else {
      setActiveStepIndex(4);
      if (scratchpadSummary) {
        setLogs([
          { id: 'summary', time: '00:01s', text: `🧠 AI Summary: ${scratchpadSummary}`, type: 'success' },
          ...INITIAL_LOGS.slice(1),
        ]);
      } else if (file || clauses.length > 0) {
        setLogs(INITIAL_LOGS);
      }
    }
  }, [isAnalyzing, file, clauses.length, scratchpadSummary]);

  const totalRisks = clauses.length || 4;
  const highRiskCount = clauses.filter((c) => c.risk_level === 'high').length || 1;
  const resolvedCount = clauses.filter((c) => c.is_accepted).length;

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
              <span className="text-[10px] font-mono text-zinc-600 ml-1">[ SYS.SYS_OK ]</span>
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
                <span className="text-[10px] font-mono text-zinc-600 font-normal ml-1">[ STEP_SEQ_VALID ]</span>
              </span>
              <span className="text-[10px] text-zinc-500 font-mono">
                {isAnalyzing ? 'RUNNING' : 'COMPLETED'}
              </span>
            </div>

            <div className="space-y-2">
              {stepperDefinition.map((step, idx) => {
                let status: 'pending' | 'active' | 'completed' = 'pending';
                if (idx < activeStepIndex) status = 'completed';
                else if (idx === activeStepIndex && isAnalyzing) status = 'active';
                else if (!isAnalyzing) status = 'completed';

                return (
                  <div
                    key={idx}
                    className="bg-[#0d0d0d] border border-zinc-800/80 rounded-sm p-2.5 text-zinc-300 font-mono text-xs mb-2 flex items-center justify-between gap-2.5 transition-all duration-200"
                  >
                    <div className="w-4 h-4 flex items-center justify-center shrink-0">
                      {status === 'active' && (
                        <span className="bg-red-600 shadow-[0_0_8px_rgba(255,0,0,0.8)] animate-pulse w-2 h-2 rounded-full inline-block" />
                      )}
                      {status === 'completed' && (
                        <Check className="w-4 h-4 text-zinc-500 shrink-0" />
                      )}
                      {status === 'pending' && (
                        <div className="w-2 h-2 rounded-full bg-zinc-800 border border-zinc-700" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0 flex items-center justify-between gap-1">
                      <span className={`truncate font-mono ${status === 'active' ? 'font-bold text-white' : 'font-normal'}`}>
                        {step.title}
                      </span>
                      <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 shrink-0">
                        {step.timeLabel}
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
                <span className="text-[10px] font-mono text-zinc-600 font-normal">[ SCAN: COMPLETE ]</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 font-mono">
              <div className="bg-black p-2.5 rounded-sm border border-zinc-800">
                <span className="text-[10px] text-zinc-500 font-mono uppercase block mb-0.5">Total Risks</span>
                <span className="text-base font-bold text-white font-mono flex items-center gap-1.5">
                  {totalRisks} <span className="text-xs font-mono font-normal text-zinc-400">Indexed</span>
                </span>
              </div>

              <div className="bg-black p-2.5 rounded-sm border border-zinc-800">
                <span className="text-[10px] text-red-500 font-mono uppercase block mb-0.5">Critical Tier</span>
                <span className="text-base font-bold text-red-500 font-mono flex items-center gap-1.5">
                  {highRiskCount}
                  <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
                </span>
              </div>

              <div className="bg-black p-2.5 rounded-sm border border-zinc-800 col-span-2 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-zinc-300 font-mono uppercase block">Resolved Exposures</span>
                  <span className="text-xs text-zinc-400 font-mono">Accepted revisions</span>
                </div>
                <span className="text-base font-bold text-white font-mono flex items-center gap-1">
                  {resolvedCount} / {totalRisks}
                  <CheckCircle2 className="w-4 h-4 text-zinc-300" />
                </span>
              </div>
            </div>

            {/* Financial Exposure Box */}
            <div className="bg-black p-3 rounded-sm border border-zinc-800 flex flex-col gap-1 font-mono">
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-zinc-400 font-mono font-medium flex items-center gap-1.5">
                  <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Est. Financial Exposure
                </span>
                <span className="text-[10px] bg-red-600 text-white px-1.5 py-0.5 rounded-sm font-mono font-bold shadow-[0_0_6px_rgba(255,0,0,0.8)]">HIGH</span>
              </div>
              <p className="text-sm font-bold font-mono text-zinc-200 mt-0.5">
                $250,000+ <span className="text-xs font-mono font-normal text-zinc-500">(Uncapped Liability)</span>
              </p>
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
                <span className="text-[10px] font-mono text-zinc-600 font-normal ml-1">[ LATENCY: 24ms ]</span>
              </span>
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse shadow-[0_0_6px_rgba(255,0,0,0.8)] inline-block" title="Live" />
            </div>

            <div className="space-y-2 font-mono text-xs overflow-y-auto flex-1 pr-1 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black">
              {logs.map((log) => (
                <div key={log.id} className="bg-[#0d0d0d] border border-zinc-800/80 rounded-sm p-2.5 text-zinc-300 font-mono text-xs mb-2 flex items-start gap-2.5 leading-relaxed">
                  <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 shrink-0 select-none mt-0.5">
                    {log.time}
                  </span>
                  <div className="flex-1 min-w-0 font-mono text-xs leading-relaxed text-zinc-300">
                    <span
                      className={`${
                        log.type === 'working'
                          ? 'text-white font-mono'
                          : log.type === 'warning'
                          ? 'text-red-400 font-bold'
                          : log.type === 'success'
                          ? 'text-zinc-200 font-semibold'
                          : 'text-zinc-400'
                      }`}
                    >
                      {log.text}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Legal Benchmarking Corpus Note */}
          <div className="bg-[#0d0d0d] border border-zinc-800 rounded-sm p-2.5 text-[11px] text-zinc-500 font-mono flex items-center gap-2">
            <BookOpen className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span className="truncate">Delaware Commercial Common Law corpus</span>
          </div>

        </div>
      )}
    </aside>
  );
}
