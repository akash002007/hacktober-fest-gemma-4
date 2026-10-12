import { useContractStore } from '../store/useContractStore';
import { 
  Plus, 
  PanelLeftClose, 
  PanelLeft, 
  FileText, 
  History, 
  Settings, 
  ChevronRight
} from 'lucide-react';

const RECENT_HISTORY = [
  { id: 'h-1', name: 'Master_Services_Agreement_2026.pdf', date: 'Just now', risk: '2 Critical', dotColor: 'bg-red-600 shadow-[0_0_6px_rgba(255,0,0,0.8)]' },
  { id: 'h-2', name: 'SaaS_Vendor_Subscription_v3.pdf', date: '2 hours ago', risk: '1 Moderate', dotColor: 'bg-zinc-600' },
  { id: 'h-3', name: 'Enterprise_NDA_AcmeCorp.docx', date: 'Yesterday', risk: 'Low Exposure', dotColor: 'bg-zinc-600' },
  { id: 'h-4', name: 'Executive_Employment_TermSheet.pdf', date: 'Jul 26', risk: '3 Critical', dotColor: 'bg-red-600 shadow-[0_0_6px_rgba(255,0,0,0.8)]' },
  { id: 'h-5', name: 'Cloud_Hosting_SLA_Agreement.pdf', date: 'Jul 22', risk: 'Compliant', dotColor: 'bg-zinc-600' },
];

export function LeftSidebar() {
  const { isSidebarOpen, toggleSidebar, reset, loadMockDocument, file, triggerToast, user, setSettingsModalOpen } = useContractStore();

  const handleNewAnalysis = () => {
    reset();
    triggerToast("Started new contract analysis workspace");
  };

  const handleSelectHistory = (docName: string) => {
    loadMockDocument(docName);
    triggerToast(`Switched to contract view: ${docName}`);
  };

  return (
    <aside
      className={`h-full bg-black/60 backdrop-blur-xl border-r border-white/10 border-t-white/20 shadow-2xl flex flex-col transition-all duration-300 ease-in-out shrink-0 relative z-30 select-none ${
        isSidebarOpen ? 'w-64' : 'w-14'
      }`}
    >
      {/* Top Section: Toggle & New Analysis Action */}
      <div className="p-3 border-b border-zinc-800 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          {isSidebarOpen && (
            <button 
              onClick={() => triggerToast("Workspace: Enterprise Legal Vault active")}
              className="flex items-center gap-2 px-1 text-left hover:opacity-80 transition-opacity cursor-pointer min-w-0"
              title="Workspace Preferences"
            >
              <img src="/logo.png" alt="Logo" className="w-4 h-4 object-contain shrink-0" />
              <span className="text-xs font-semibold tracking-wider text-zinc-400 uppercase font-mono truncate">Workspace</span>
            </button>
          )}
          <button
            onClick={toggleSidebar}
            className={`p-2 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-sm transition-colors cursor-pointer ${
              !isSidebarOpen ? 'mx-auto' : ''
            }`}
            title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
          >
            {isSidebarOpen ? <PanelLeftClose className="w-4 h-4" /> : <PanelLeft className="w-4 h-4" />}
          </button>
        </div>

        <button
          onClick={handleNewAnalysis}
          className={`flex items-center justify-center gap-2 bg-white text-black hover:bg-zinc-200 font-display font-semibold uppercase tracking-wider text-xs rounded-sm py-2 px-3 transition-all duration-150 active:scale-95 ${
            !isSidebarOpen ? 'px-0' : ''
          }`}
          title="Start New Contract Analysis"
        >
          <Plus className="w-4 h-4 text-black shrink-0" />
          {isSidebarOpen && <span>New Analysis</span>}
        </button>
      </div>

      {/* Middle Section: Recent Contracts & History */}
      <div className="flex-1 overflow-y-auto py-3 px-2 flex flex-col gap-1 custom-scrollbar scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-black">
        {isSidebarOpen && (
          <button
            onClick={() => triggerToast("Switched to Contract History view")}
            className="flex items-center gap-1.5 px-2 mb-1.5 text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors uppercase tracking-widest text-left w-full cursor-pointer"
            title="View Contract History"
          >
            <History className="w-3.5 h-3.5 text-zinc-500" />
            <span>Recent Contracts</span>
          </button>
        )}

        {RECENT_HISTORY.map((item) => {
          const isCurrent = file && file.name === item.name;

          if (!isSidebarOpen) {
            return (
              <button
                key={item.id}
                onClick={() => handleSelectHistory(item.name)}
                className={`w-9 h-9 mx-auto rounded-sm flex items-center justify-center transition-all cursor-pointer ${
                  isCurrent
                    ? 'bg-zinc-800 text-white border border-zinc-700'
                    : 'text-zinc-500 hover:bg-zinc-900 hover:text-zinc-300'
                }`}
                title={`${item.name} (${item.risk})`}
              >
                <FileText className="w-4 h-4" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => handleSelectHistory(item.name)}
              className={`w-full text-left px-2.5 py-2 rounded-sm transition-all flex flex-col gap-1 group cursor-pointer ${
                isCurrent
                  ? 'bg-zinc-900/90 border border-zinc-700 text-white font-medium'
                  : 'bg-transparent border border-transparent hover:bg-zinc-900/50 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-zinc-300' : 'text-zinc-500 group-hover:text-zinc-300'}`} />
                  <span className="text-xs font-mono truncate leading-normal">
                    {item.name}
                  </span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-zinc-600 group-hover:text-zinc-400 shrink-0 transition-transform" />
              </div>
              
              <div className="flex items-center justify-between text-[11px] pl-5 text-zinc-500 font-mono">
                <span className="text-[10px] text-zinc-500">{item.date}</span>
                <span className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 font-normal">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dotColor} inline-block`} />
                  {item.risk}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Bottom Section: Compact User Profile Card */}
      <div className="p-2.5 m-2 bg-black border border-zinc-800 rounded-sm flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5 min-w-0">
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="bg-zinc-900 border border-zinc-700 text-white font-hud text-xs font-bold w-8 h-8 rounded-sm flex items-center justify-center shrink-0 cursor-pointer hover:border-white transition-colors"
            title={`${user.name} (Click for Settings)`}
          >
            {user.initials}
          </button>
          {isSidebarOpen && (
            <div className="min-w-0 pr-2">
              <p className="font-display font-semibold text-xs text-white truncate">{user.name}</p>
              <p className="font-mono text-[10px] text-zinc-500 truncate">{user.email}</p>
            </div>
          )}
        </div>

        {isSidebarOpen && (
          <button
            onClick={() => setSettingsModalOpen(true)}
            className="text-zinc-400 hover:text-white bg-zinc-900 p-1.5 rounded-sm transition-colors cursor-pointer shrink-0"
            title="Account & Workspace Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </aside>
  );
}
