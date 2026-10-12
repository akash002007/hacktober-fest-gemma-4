import React, { useState } from 'react';
import { useContractStore } from '../store/useContractStore';
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  CheckCircle,
  Check,
  Copy,
  Edit2,
  Save,
  Split,
  Eye,
  Sparkles,
  TrendingDown,
  X,
  Send,
  Loader2
} from 'lucide-react';
import type { Clause } from '../types/contract';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

interface ClauseDiffCardProps {
  clause: Clause;
  index: number;
  isSelected: boolean;
  onSelect: () => void;
  cardRef: (el: HTMLDivElement | null) => void;
}

export function ClauseDiffCard({
  clause,
  index,
  isSelected,
  onSelect,
  cardRef
}: ClauseDiffCardProps) {
  const { acceptFix, updateCounterClause, triggerToast } = useContractStore();

  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState(clause.counter_clause || clause.text);
  const [isDiffView, setIsDiffView] = useState(false);
  const [copied, setCopied] = useState(false);

  // AI Refinement Thread State
  const [chatInput, setChatInput] = useState('');
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    clause.id === 'clause-1'
      ? [
          {
            id: 'm1',
            sender: 'ai',
            text: 'I recommend proposing a mutual liability cap at 12 months of paid fees to balance risk exposure.',
            timestamp: 'Just now',
          },
        ]
      : []
  );

  const isAccepted = Boolean(clause.is_accepted);

  const handleCopyText = (e: React.MouseEvent) => {
    e.stopPropagation();
    const textToCopy = clause.counter_clause || clause.text;
    navigator.clipboard.writeText(textToCopy).then(() => {
      setCopied(true);
      triggerToast("Copied replacement legal text to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const handleSaveEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateCounterClause(clause.id, editText);
    setIsEditing(false);
    triggerToast(`Updated replacement language for ${clause.clause_name}`);
  };

  const handleCancelEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditText(clause.counter_clause || clause.text);
    setIsEditing(false);
  };

  const handleToggleAccept = (e: React.MouseEvent) => {
    e.stopPropagation();
    acceptFix(clause.id);
    if (!isAccepted) {
      triggerToast(`Accepted fix for "${clause.clause_name}". Total Risks Pending decreased!`);
    }
  };

  const handleSendMessage = (currentText: string) => {
    if (!chatInput.trim() || isAiThinking) return;

    const userText = chatInput.trim();
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: userText,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setChatInput('');
    setIsAiThinking(true);

    setTimeout(() => {
      let aiResponseText = '';
      let updatedCounterProposal = '';

      const lower = userText.toLowerCase();
      if (lower.includes('strict') || lower.includes('aggressive')) {
        aiResponseText = "Updated to a stricter posture: Unconditional liability limitation with zero indemnification for third-party indirect negligence.";
        updatedCounterProposal = "Neither party shall incur liability or indemnification obligations for consequential, indirect, or third-party damages under any circumstances.";
      } else if (lower.includes('softer') || lower.includes('mutual') || lower.includes('friendly')) {
        aiResponseText = "Drafted mutual resolution: Balanced cap at 2x annual agreement valuation with bilateral indemnification protections.";
        updatedCounterProposal = "Both parties mutually agree to indemnify and hold harmless against third-party intellectual property claims, with cumulative liability capped at two times (2x) fees paid in the trailing 12 months.";
      } else {
        aiResponseText = `Incorporated your directive ("${userText}") into the legal covenant while maintaining Delaware commercial enforcement enforceability.`;
        updatedCounterProposal = `${currentText.replace(/\. ?$/, '')}; provided further that ${userText}, subject to mutual agreement and written notification within thirty (30) days.`;
      }

      updateCounterClause(clause.id, updatedCounterProposal);
      setEditText(updatedCounterProposal);

      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: aiResponseText,
        timestamp: 'Just now',
      };

      setMessages((prev) => [...prev, aiMsg]);
      setIsAiThinking(false);
      triggerToast("AI re-drafted replacement clause language!");
    }, 1200);
  };

  const getRiskBadge = (level: Clause['risk_level'], tag?: string) => {
    switch (level) {
      case 'high':
        return (
          <span className="bg-red-600 text-white font-hud tracking-widest uppercase text-xs font-bold px-2 py-0.5 rounded-sm inline-flex items-center gap-1.5 shadow-[0_0_6px_rgba(255,0,0,0.8)] relative before:absolute before:inset-0 before:rounded-sm before:bg-red-600/40 before:animate-[pulse_0.8s_ease-in-out_3]">
            <ShieldAlert className="w-3.5 h-3.5 text-white shrink-0 relative z-10" />
            <span className="relative z-10">{tag || '#1 High Risk'}</span>
          </span>
        );
      case 'medium':
        return (
          <span className="bg-zinc-800 text-zinc-300 font-hud tracking-widest uppercase text-xs px-2 py-0.5 rounded-sm inline-flex items-center gap-1.5 border border-zinc-700">
            <AlertTriangle className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{tag || '#2 Medium Risk'}</span>
          </span>
        );
      case 'low':
        return (
          <span className="bg-zinc-800 text-zinc-300 font-hud tracking-widest uppercase text-xs px-2 py-0.5 rounded-sm inline-flex items-center gap-1.5 border border-zinc-700">
            <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400 shrink-0" />
            <span>{tag || '#3 Low Risk'}</span>
          </span>
        );
    }
  };

  return (
    <div
      ref={cardRef}
      onClick={onSelect}
      className={`bg-black/60 backdrop-blur-xl border border-white/10 border-t-white/20 hover:border-zinc-500/80 hover:bg-zinc-900/40 rounded-sm p-4 transition-all duration-200 mb-3 relative text-left cursor-pointer flex flex-col gap-4 shadow-xl ${
        isSelected
          ? "!bg-zinc-900/90 !border-zinc-400 shadow-md ring-1 ring-zinc-500 before:content-['+'] before:absolute before:-top-2 before:-left-2 before:text-red-500 before:font-mono before:text-xs after:content-['+'] after:absolute after:-top-2 after:-right-2 after:text-red-500 after:font-mono after:text-xs"
          : ''
      } ${isAccepted ? 'opacity-90 !border-zinc-700 !bg-zinc-950/80' : ''}`}
    >
      {isSelected && (
        <>
          <span className="absolute -bottom-2 -left-2 text-red-500 font-mono text-xs pointer-events-none">+</span>
          <span className="absolute -bottom-2 -right-2 text-red-500 font-mono text-xs pointer-events-none">+</span>
        </>
      )}
      {/* Header: Clause Name, Risk Badge & Page */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-800 pb-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-xs font-mono font-bold text-zinc-500 select-none shrink-0">
            0{index + 1}.
          </span>
          <h3 className="text-sm font-bold text-white truncate font-mono tracking-tight">
            {clause.clause_name}
          </h3>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {getRiskBadge(
            clause.risk_level, 
            `${clause.index_tag || `#${index + 1}`} ${
              clause.risk_level === 'high' ? 'High Risk' : clause.risk_level === 'medium' ? 'Medium Risk' : 'Low Risk'
            }`
          )}
          <span className="font-hud tracking-widest text-xs uppercase text-zinc-300 bg-black border border-zinc-800 px-2 py-0.5 rounded-sm">
            Pg {clause.page_number}
          </span>
        </div>
      </div>

      {/* Exposure Rationale Banner */}
      <div className="space-y-1 bg-black border border-zinc-800 rounded-sm p-3">
        <div className="flex items-center justify-between text-[11px] font-hud uppercase tracking-wider mb-1">
          <span className="text-red-500 font-semibold flex items-center gap-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" /> Exposure Assessment
          </span>
          <span className="text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-sm border border-zinc-800 text-[10px]">
            Favors: <strong className="text-white">{clause.who_it_favors}</strong>
          </span>
        </div>
        <p className="font-mono text-xs leading-relaxed text-zinc-300">
          {clause.explanation}
        </p>
      </div>

      {/* Content Section: Switch between Clean View and Visual Diff */}
      {!isDiffView ? (
        <div className="space-y-3.5">
          
          {/* Original Clause Snippet */}
          <div className="space-y-1">
            <span className="font-hud tracking-widest text-[10px] uppercase text-zinc-500 font-bold block">
              ORIGINAL CLAUSE SNIPPET
            </span>
            <p className="bg-black border border-zinc-800 font-mono text-xs leading-relaxed text-zinc-300 p-3 rounded-sm select-all">
              "{clause.text}"
            </p>
          </div>

          {/* AI Proposed Counter-Clause (Read / Edit Mode) */}
          <div className="space-y-2 bg-zinc-950 rounded-sm border border-zinc-800 p-3.5 transition-all">
            
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <div className="flex items-center gap-1.5 text-zinc-200 font-mono font-semibold text-xs">
                <Sparkles className="w-3.5 h-3.5 text-zinc-300" />
                <span>AI Proposed Counter-Clause</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsDiffView(true);
                  }}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-mono font-medium transition-colors"
                  title="View side-by-side strikethrough visual diff"
                >
                  <Split className="w-3 h-3 text-zinc-400" />
                  <span>Visual Diff</span>
                </button>
              </div>
            </div>

            {/* Read vs Edit Mode Toggle Display */}
            {isEditing ? (
              <div className="space-y-2.5 pt-1 animate-in fade-in duration-150" onClick={(e) => e.stopPropagation()}>
                <textarea
                  rows={4}
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  className="w-full bg-black border border-zinc-700 text-zinc-100 font-mono text-xs rounded-sm p-2.5 focus:border-white focus:outline-none resize-y leading-relaxed"
                  placeholder="Modify defensive replacement language..."
                />
                <div className="flex items-center justify-end gap-2 font-mono">
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm text-xs font-medium border border-zinc-700 hover:border-white text-zinc-300 hover:text-white transition-all"
                  >
                    <X className="w-3 h-3" />
                    <span>Cancel</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveEdit}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-sm text-xs font-semibold bg-white hover:bg-zinc-200 text-black transition-all active:scale-95"
                  >
                    <Save className="w-3.5 h-3.5 text-black" />
                    <span>Save Changes</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-black border border-zinc-800 font-mono text-xs leading-relaxed text-zinc-300 p-3 rounded-sm select-all">
                {clause.counter_clause || clause.text}
              </div>
            )}

          </div>
        </div>
      ) : (
        /* Visual Diff Mode */
        <div className="space-y-3 bg-zinc-950 rounded-sm border border-zinc-800 p-4 animate-in fade-in duration-200">
          
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <span className="text-xs font-semibold text-white font-hud uppercase tracking-wider flex items-center gap-2">
              <Split className="w-3.5 h-3.5 text-zinc-400" />
              Interactive Visual Diff Comparison
            </span>
            
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setIsDiffView(false);
              }}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-[11px] font-display uppercase tracking-wider transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-zinc-400" />
              <span>Clean View</span>
            </button>
          </div>

          <div className="space-y-3 font-mono text-xs leading-relaxed text-zinc-300">
            
            {/* Strikethrough Red Text for removed risky terms */}
            <div className="space-y-1">
              <span className="font-hud tracking-widest text-[10px] uppercase text-red-500 font-bold block">
                ❌ Removed Risky Terms (Original)
              </span>
              <p className="line-through text-red-400 bg-red-950/40 px-1 py-0.5 rounded-sm mr-1 block border border-red-500/20 font-mono text-xs leading-relaxed select-all">
                {clause.text}
              </p>
            </div>

            {/* Highlighted Green Text for inserted protective terms */}
            <div className="space-y-1">
              <span className="font-hud tracking-widest text-[10px] uppercase text-zinc-300 font-bold block">
                ✅ Inserted Protective Terms (Counter-Proposal)
              </span>
              <p className="text-zinc-100 bg-zinc-800 px-1 py-0.5 rounded-sm font-medium block border border-zinc-700 font-mono text-xs leading-relaxed select-all">
                {clause.counter_clause || clause.text}
              </p>
            </div>

          </div>

          <p className="text-[11px] text-zinc-500 italic font-mono pt-1 border-t border-zinc-800">
            * Red strikethrough denotes uncapped liabilities; zinc highlighted text enforces defensive protections under Delaware commercial precedent.
          </p>
        </div>
      )}

      {/* Interactive Refinement Thread when card is selected */}
      {isSelected && (
        <div className="pt-3 border-t border-zinc-800 space-y-2.5 animate-in fade-in duration-200" onClick={(e) => e.stopPropagation()}>
          <span className="text-[10px] font-mono uppercase font-semibold text-zinc-400 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-zinc-400" /> Adjust Legal Posture (AI Prompt)
          </span>

          {messages.length > 0 && (
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex items-start gap-2 text-xs p-2.5 rounded-sm font-sans ${
                    msg.sender === 'user'
                      ? 'bg-zinc-900 border border-zinc-700 text-zinc-200 ml-6'
                      : 'bg-black border border-zinc-800 text-zinc-300 mr-6'
                  }`}
                >
                  <span className="shrink-0 font-mono font-bold text-[10px] uppercase text-zinc-500 mt-0.5">
                    {msg.sender === 'user' ? 'YOU' : 'AI'}
                  </span>
                  <p className="flex-1 leading-normal font-sans">{msg.text}</p>
                </div>
              ))}
              {isAiThinking && (
                <div className="flex items-center gap-2 text-xs p-2 rounded-sm bg-black border border-zinc-800 text-zinc-400 w-fit">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-zinc-300" />
                  <span className="font-mono text-[11px]">Re-drafting covenant language...</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (clause.counter_clause || clause.text) {
                    handleSendMessage(clause.counter_clause || clause.text);
                  }
                }
              }}
              placeholder="Type refinement (e.g. 'Make liability mutual', 'Cap at $50k')..."
              className="flex-1 bg-black border border-zinc-800 focus:border-zinc-500 rounded-sm px-3 py-1.5 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none transition-all font-mono"
            />
            <button
              type="button"
              onClick={() => {
                if (clause.counter_clause || clause.text) {
                  handleSendMessage(clause.counter_clause || clause.text);
                }
              }}
              disabled={!chatInput.trim() || isAiThinking}
              className="p-1.5 rounded-sm bg-white hover:bg-zinc-200 disabled:bg-zinc-800 text-black disabled:text-zinc-600 transition-all active:scale-95 disabled:pointer-events-none shrink-0 font-semibold"
              title="Submit instruction"
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Footer Actions: Status Badge & Buttons (Edit, Copy Text, Accept Fix) */}
      <div className="pt-3 border-t border-zinc-800 flex flex-wrap items-center justify-between gap-3 font-mono">
        
        {/* Status Badge Update */}
        <div className="flex items-center gap-2">
          {isAccepted ? (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm bg-zinc-900 text-zinc-300 border border-zinc-700 text-xs font-bold font-mono shadow-sm">
              <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
              <span>Accepted & Resolved</span>
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[11px] bg-zinc-900 text-zinc-400 border border-zinc-800 font-mono">
              <AlertTriangle className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
              <span>Pending Resolution</span>
            </span>
          )}
        </div>

        {/* Action Buttons: Edit, Copy Text, Accept Fix - Minimalist Outline Style */}
        <div className="flex items-center gap-2 flex-wrap ml-auto">
          
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setEditText(clause.counter_clause || clause.text);
              setIsEditing(!isEditing);
              if (isDiffView) setIsDiffView(false);
            }}
            className={`bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-200 hover:text-white font-display font-semibold uppercase tracking-wider text-xs rounded-sm px-3 py-1.5 transition-colors inline-flex items-center gap-1.5 ${
              isEditing ? '!bg-zinc-800 !border-white !text-white' : ''
            }`}
            title="Edit replacement wording directly"
          >
            <Edit2 className="w-3.5 h-3.5 text-zinc-400" />
            <span>{isEditing ? 'Close Edit' : 'Edit'}</span>
          </button>

          <button
            type="button"
            onClick={handleCopyText}
            className="bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-200 hover:text-white font-display font-semibold uppercase tracking-wider text-xs rounded-sm px-3 py-1.5 transition-colors inline-flex items-center gap-1.5"
            title="Copy counter-clause to clipboard"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span className="text-white">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5 text-zinc-400" />
                <span>Copy Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleToggleAccept}
            className="bg-zinc-900 border border-zinc-700 hover:border-white text-zinc-200 hover:text-white font-display font-semibold uppercase tracking-wider text-xs rounded-sm px-3 py-1.5 transition-colors inline-flex items-center gap-1.5 duration-150 active:scale-95"
          >
            {isAccepted ? (
              <>
                <Check className="w-3.5 h-3.5 text-white" />
                <span>Resolved</span>
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-zinc-400" />
                <span>Accept Fix</span>
              </>
            )}
          </button>
          
        </div>

      </div>

    </div>
  );
}
