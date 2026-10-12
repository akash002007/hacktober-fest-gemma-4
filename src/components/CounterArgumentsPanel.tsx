import { useState, useRef, useEffect } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  CheckCircle,
  CheckCircle2,
  Info,
  Filter,
  Download,
  AlertTriangle
} from 'lucide-react';
import { ClauseDiffCard } from './ClauseDiffCard';

export function CounterArgumentsPanel() {
  const { 
    clauses, 
    selectedClauseId, 
    setSelectedClauseId,
    setExportModalOpen
  } = useContractStore();

  const [activeTab, setActiveTab] = useState<'all' | 'high' | 'medium' | 'low'>('all');
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    if (selectedClauseId && cardRefs.current[selectedClauseId]) {
      cardRefs.current[selectedClauseId]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [selectedClauseId]);

  const filteredClauses = clauses.filter((c) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'high') return c.risk_level === 'high' || c.risk_level === 'critical';
    return c.risk_level === activeTab;
  });

  const pendingRisksCount = clauses.filter((c) => c.resolution_status === 'pending' || (!c.resolution_status && !c.is_accepted)).length;
  const resolvedRisksCount = clauses.filter((c) => Boolean(c.is_accepted) || c.resolution_status === 'resolved' || c.resolution_status === 'accepted').length;
  const dismissedRisksCount = clauses.filter((c) => c.resolution_status === 'dismissed').length;

  return (
    <div className="flex flex-col h-full w-full bg-black/60 backdrop-blur-xl border-l border-white/10 border-t-white/20 shadow-2xl rounded-md overflow-hidden relative">
      {/* HUD Corner Brackets */}
      <div className="absolute top-1 left-1 w-3 h-3 border-t-2 border-l-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute top-1 right-1 w-3 h-3 border-t-2 border-r-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute bottom-1 left-1 w-3 h-3 border-b-2 border-l-2 border-zinc-500 pointer-events-none z-50" />
      <div className="absolute bottom-1 right-1 w-3 h-3 border-b-2 border-r-2 border-zinc-500 pointer-events-none z-50" />

      {/* Section Header */}
      <div className="p-3 border-b border-zinc-800 bg-black flex items-center justify-between shrink-0 font-mono">
        <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-zinc-400" />
          COUNTER-ARGUMENTS & RESOLUTIONS
        </span>
        <span className="text-[10px] font-mono text-zinc-600 flex items-center gap-2">
          <span>[ SYS.SYS_OK ]</span>
          <span>[ LATENCY: 24ms ]</span>
        </span>
      </div>

      {/* Real-Time Global Metrics Bar */}
      <div className="bg-black border-b border-zinc-800 px-4 py-2.5 flex items-center justify-between gap-3 shrink-0 flex-wrap">
        <div className="flex items-center gap-2 flex-wrap w-full">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900 border border-zinc-800 text-xs font-mono">
            <AlertTriangle className={`w-3.5 h-3.5 ${pendingRisksCount > 0 ? 'text-red-500 animate-pulse' : 'text-zinc-500'}`} />
            <span className="text-zinc-300">
              Total Risks Pending: <strong className={`font-mono font-extrabold text-sm ${pendingRisksCount > 0 ? 'text-white' : 'text-zinc-400'}`}>{pendingRisksCount}</strong>
            </span>
          </div>

          {resolvedRisksCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900 border border-zinc-700 text-xs font-mono text-zinc-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
              <span>Resolved: <strong className="font-mono font-bold text-sm text-white">{resolvedRisksCount}</strong></span>
            </div>
          )}

          {dismissedRisksCount > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900 border border-zinc-800 text-xs font-mono text-zinc-400">
              <span>Dismissed: <strong className="font-mono text-zinc-300">{dismissedRisksCount}</strong></span>
            </div>
          )}
        </div>
      </div>

      {/* Scrollable Risk Cards List with Filter Toggles Bar */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black bg-[#080808]">
        
        {/* Filter Toggles Bar */}
        <div className="flex items-center gap-1.5 p-1 bg-black border border-zinc-800 rounded-sm mb-4 max-w-full overflow-x-auto">
          <Filter className="w-3.5 h-3.5 text-zinc-500 hidden md:inline ml-1" />
          {(['all', 'high', 'medium', 'low'] as const).map((tab) => {
            const count = tab === 'all' 
              ? clauses.length 
              : tab === 'high'
              ? clauses.filter((c) => c.risk_level === 'high' || c.risk_level === 'critical').length
              : clauses.filter((c) => c.risk_level === tab).length;

            const labelMap = {
              all: 'All',
              high: 'High',
              medium: 'Medium',
              low: 'Low',
            };

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={
                  activeTab === tab
                    ? 'bg-white text-black font-mono font-bold text-xs px-2.5 py-1 rounded-sm flex items-center gap-1.5'
                    : 'bg-[#0d0d0d] text-zinc-400 border border-zinc-800 hover:text-white font-mono text-xs px-2.5 py-1 rounded-sm transition-colors flex items-center gap-1.5'
                }
              >
                <span>{labelMap[tab]}</span>
                <span className={`text-[10px] font-mono px-1 rounded-sm ${activeTab === tab ? 'bg-zinc-200 text-black font-bold' : 'bg-zinc-800 text-zinc-400'}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
        
        <div className="space-y-1">
          {filteredClauses.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-zinc-500 space-y-3 font-mono">
              <CheckCircle className="w-8 h-8 text-zinc-600" />
              <p className="text-xs font-medium text-zinc-400">No clauses match the selected risk filter.</p>
            </div>
          ) : (
            filteredClauses.map((clause, index) => (
              <ClauseDiffCard
                key={clause.id}
                clause={clause}
                index={index}
                isSelected={selectedClauseId === clause.id}
                onSelect={() => setSelectedClauseId(clause.id)}
                cardRef={(el) => {
                  cardRefs.current[clause.id] = el;
                }}
              />
            ))
          )}
        </div>
        
      </div>

      {/* Bottom Footer & Action */}
      <div className="bg-black border-t border-zinc-800 px-4 py-3 flex items-center justify-between shrink-0 font-mono">
        <div className="flex items-center gap-2 text-xs text-zinc-400">
          <Info className="w-4 h-4 text-zinc-500 shrink-0" />
          <span>Select any card to sync document canvas and review visual diffs.</span>
        </div>

        <button
          onClick={() => setExportModalOpen(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-white hover:bg-zinc-200 text-black font-semibold text-xs transition-all active:scale-95 shrink-0 font-mono"
        >
          <Download className="w-3.5 h-3.5 text-black" />
          <span>Export Summary & Redline</span>
        </button>
      </div>

    </div>
  );
}
