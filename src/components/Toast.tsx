import { useContractStore } from '../store/useContractStore';
import { CheckCircle2, X } from 'lucide-react';

export function Toast() {
  const { toastMessage, clearToast } = useContractStore();

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 bg-black border border-zinc-700 text-white font-mono text-xs px-4 py-2.5 rounded-sm shadow-2xl flex items-center gap-2 animate-in slide-in-from-bottom-5 fade-in duration-200 max-w-sm">
      <CheckCircle2 className="w-4 h-4 text-white shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-zinc-200 font-mono leading-relaxed">
          {toastMessage}
        </p>
      </div>
      <button
        onClick={clearToast}
        className="text-zinc-400 hover:text-zinc-200 p-1 rounded-sm hover:bg-zinc-800 transition-colors shrink-0"
        title="Dismiss notification"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
