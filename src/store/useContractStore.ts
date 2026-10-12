import { create } from 'zustand';
import type { Clause, ContractItem, ContractDetail, ExecutionEvent } from '../types/contract';

const API_BASE = 'http://localhost:5000';

export const mockClauses: Clause[] = [
  {
    id: 'demo-clause-1',
    index_tag: '#1',
    clause_name: 'Limitation of Liability & Indemnification',
    text: 'Client agrees to indemnify, defend, and hold harmless Service Provider from any and all liabilities, losses, damages, claims, costs, and expenses (including attorneys fees) arising out of or related to Service Provider performance under this Agreement, without any capped monetary ceiling.',
    risk_level: 'high',
    explanation: 'Uncapped, one-sided indemnification exposing the client to unlimited financial risk for all losses regardless of fault.',
    who_it_favors: 'Service Provider (One-Sided)',
    page_number: 1,
    position: { x: 8, y: 45, width: 84, height: 16 },
    counter_clause: 'Each party shall indemnify, defend, and hold harmless the other party from third-party claims arising solely from willful misconduct or gross negligence. In no event shall either party’s aggregate liability exceed the total fees paid by Client in the preceding twelve (12) months.',
    strategy: 'Cap total indemnity and damage exposure to a 12-month fee lookback, and make indemnification strictly mutual for third-party torts.',
    financial_exposure: '$250,000+ (Demo Preset)',
    resolution_status: 'pending',
    is_accepted: false,
  },
  {
    id: 'demo-clause-2',
    index_tag: '#2',
    clause_name: 'Termination for Convenience',
    text: 'Service Provider may terminate this Agreement immediately at any time for any reason or no reason upon 2 business days written notice to Client, with no obligation to refund prepaid unearned fees.',
    risk_level: 'medium',
    explanation: 'Short 2-day notice period creates operational disruption vulnerability, and retention of prepaid unearned fees without a pro-rata refund is unfavorable.',
    who_it_favors: 'Service Provider',
    page_number: 1,
    position: { x: 8, y: 20, width: 84, height: 14 },
    counter_clause: 'Either party may terminate this Agreement for convenience upon ninety (90) days prior written notice. Upon such termination, Service Provider shall promptly refund any prepaid, unearned fees on a pro-rata basis within thirty (30) days.',
    strategy: 'Extend termination notice to a symmetrical 90-day operational buffer and explicitly enforce pro-rata refund obligations for unused retainer fees.',
    financial_exposure: '$45,000 (Demo Preset)',
    resolution_status: 'pending',
    is_accepted: false,
  },
];

export interface UserProfile {
  name: string;
  email: string;
  initials: string;
  role: string;
  riskPosture: 'defensive' | 'balanced' | 'aggressive';
  autoRedline: boolean;
  enterpriseEncryption: boolean;
}

interface ContractState {
  // Active Contract & File State
  currentContractId: string | null;
  currentContract: ContractDetail | null;
  file: File | null;
  fileUrl: string | null;
  setFile: (file: File | null) => void;
  setFileUrl: (url: string | null) => void;

  // Contracts List (Recent history)
  contracts: ContractItem[];
  loadContracts: () => Promise<void>;
  selectContract: (id: string) => Promise<void>;
  deleteContract: (id: string) => Promise<void>;

  // Analysis State
  isAnalyzing: boolean;
  setAnalyzing: (status: boolean) => void;
  activeStep: number;
  setActiveStep: (step: number) => void;
  executionEvents: ExecutionEvent[];
  setExecutionEvents: (events: ExecutionEvent[]) => void;
  financialExposure: string;
  setFinancialExposure: (exposure: string) => void;

  // Risks / Clauses State
  clauses: Clause[];
  setClauses: (clauses: Clause[]) => void;
  selectedClauseId: string | null;
  setSelectedClauseId: (id: string | null) => void;
  updateRiskStatus: (riskId: string, status: 'pending' | 'accepted' | 'resolved' | 'dismissed') => Promise<void>;
  acceptFix: (id: string) => Promise<void>;
  dismissRisk: (id: string) => Promise<void>;
  updateCounterClause: (id: string, newText: string, newStrategy?: string) => void;

  // Global Workspace & Demo
  isDemoData: boolean;
  setIsDemoData: (isDemo: boolean) => void;
  mockData: Clause[];
  loadMockDocument: (docName: string) => void;
  reset: () => void;
  resetWorkspace: () => Promise<void>;

  // Modals & UI
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  clearToast: () => void;
  isExportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;

  // Summaries
  generalResponse: string | null;
  setGeneralResponse: (response: string | null) => void;
  scratchpadSummary: string | null;
  setScratchpadSummary: (summary: string | null) => void;
}

export const useContractStore = create<ContractState>((set, get) => ({
  currentContractId: null,
  currentContract: null,
  file: null,
  fileUrl: null,
  setFile: (file) => set({ file }),
  setFileUrl: (url) => set({ fileUrl: url }),

  contracts: [],
  loadContracts: async () => {
    try {
      const res = await fetch(`${API_BASE}/api/contracts`);
      if (res.ok) {
        const json = await res.json();
        set({ contracts: json.contracts || [] });
      }
    } catch (err) {
      console.warn('Could not load contracts list:', err);
    }
  },

  selectContract: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/contracts/${id}`);
      if (!res.ok) throw new Error('Contract not found on server.');
      const json = await res.json();
      const contract: ContractDetail = json.contract;

      const mockFile = new File([''], contract.filename, {
        type: contract.mimeType || 'application/pdf',
      });

      set({
        currentContractId: id,
        currentContract: contract,
        file: mockFile,
        fileUrl: `${API_BASE}/api/contracts/${id}/file`,
        clauses: contract.risks || [],
        selectedClauseId: contract.risks?.[0]?.id || null,
        financialExposure: contract.financialExposure || 'Not assessed',
        activeStep: contract.activeStep || 6,
        executionEvents: contract.executionEvents || [],
        generalResponse: contract.generalResponse || null,
        scratchpadSummary: contract.scratchpadSummary || null,
        isDemoData: false,
      });
      get().triggerToast(`Loaded contract: ${contract.filename}`);
    } catch (err: any) {
      get().triggerToast(`Failed to load contract: ${err.message}`);
    }
  },

  deleteContract: async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/contracts/${id}`, { method: 'DELETE' });
      if (res.ok) {
        if (get().currentContractId === id) {
          get().reset();
        }
        await get().loadContracts();
        get().triggerToast('Contract deleted successfully.');
      }
    } catch (err) {
      get().triggerToast('Failed to delete contract.');
    }
  },

  isAnalyzing: false,
  setAnalyzing: (status) => set({ isAnalyzing: status }),
  activeStep: 0,
  setActiveStep: (step) => set({ activeStep: step }),
  executionEvents: [],
  setExecutionEvents: (events) => set({ executionEvents: events }),
  financialExposure: 'Not assessed',
  setFinancialExposure: (exposure) => set({ financialExposure: exposure }),

  clauses: [],
  setClauses: (clauses) => set({ clauses }),
  selectedClauseId: null,
  setSelectedClauseId: (id) => set({ selectedClauseId: id }),

  updateRiskStatus: async (riskId: string, status) => {
    const { currentContractId, clauses, contracts } = get();

    // Optimistically update local clauses
    const updatedClauses = clauses.map((c) =>
      c.id === riskId
        ? {
            ...c,
            resolution_status: status,
            is_accepted: status === 'accepted' || status === 'resolved',
            updatedAt: new Date().toISOString(),
          }
        : c
    );
    set({ clauses: updatedClauses });

    if (currentContractId && !get().isDemoData) {
      try {
        const res = await fetch(`${API_BASE}/api/contracts/${currentContractId}/risks/${riskId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status }),
        });
        if (res.ok) {
          // Update contracts overview counts
          const resolvedCount = updatedClauses.filter((c) => c.is_accepted).length;
          const pendingCount = updatedClauses.length - resolvedCount;
          set({
            contracts: contracts.map((c) =>
              c.id === currentContractId
                ? { ...c, resolvedRisks: resolvedCount, pendingRisks: pendingCount }
                : c
            ),
          });
        }
      } catch (err) {
        console.error('Failed to persist risk status:', err);
      }
    }
  },

  acceptFix: async (id: string) => {
    await get().updateRiskStatus(id, 'accepted');
    get().triggerToast('Counter-clause accepted and resolved.');
  },

  dismissRisk: async (id: string) => {
    await get().updateRiskStatus(id, 'dismissed');
    get().triggerToast('Risk dismissed.');
  },

  updateCounterClause: (id, newText, newStrategy) =>
    set((state) => ({
      clauses: state.clauses.map((c) =>
        c.id === id
          ? {
              ...c,
              counter_clause: newText,
              strategy: newStrategy || c.strategy,
            }
          : c
      ),
    })),

  isDemoData: false,
  setIsDemoData: (isDemo) => set({ isDemoData: isDemo }),
  mockData: mockClauses,

  loadMockDocument: (docName) => {
    const mockFile = new File(['Simulated Contract Buffer Content'], docName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
    set({
      currentContractId: 'demo-sample',
      file: mockFile,
      fileUrl: null,
      isAnalyzing: false,
      activeStep: 6,
      clauses: mockClauses.map((c) => ({ ...c, is_accepted: false, resolution_status: 'pending' })),
      selectedClauseId: mockClauses[0]?.id || null,
      financialExposure: '$250,000+ (Demo Preset)',
      isExportModalOpen: false,
      scratchpadSummary: 'Demo inspection mode loaded for sample contract walkthrough.',
      generalResponse: 'Demo contract data loaded. Highlights 2 potential exposures in Master Services Agreement.',
      executionEvents: [
        {
          id: 'demo-1',
          timestamp: 'Just now',
          stage: 'Demo loaded',
          message: 'Loaded sample demonstration agreement.',
          type: 'info',
        },
        {
          id: 'demo-2',
          timestamp: 'Just now',
          stage: 'Demo analysis',
          message: 'Displaying preset demonstration risk matrix.',
          type: 'success',
        },
      ],
      isDemoData: true,
    });
  },

  reset: () =>
    set({
      currentContractId: null,
      currentContract: null,
      file: null,
      fileUrl: null,
      isAnalyzing: false,
      activeStep: 0,
      executionEvents: [],
      financialExposure: 'Not assessed',
      clauses: [],
      selectedClauseId: null,
      toastMessage: null,
      isExportModalOpen: false,
      generalResponse: null,
      scratchpadSummary: null,
      isDemoData: false,
    }),

  resetWorkspace: async () => {
    try {
      await fetch(`${API_BASE}/api/workspace/reset`, { method: 'POST' });
      get().reset();
      set({ contracts: [] });
      get().triggerToast('Workspace and contract history reset.');
    } catch {
      get().reset();
    }
  },

  toastMessage: null,
  triggerToast: (msg) => {
    set({ toastMessage: msg });
    setTimeout(() => {
      if (get().toastMessage === msg) {
        set({ toastMessage: null });
      }
    }, 3500);
  },
  clearToast: () => set({ toastMessage: null }),

  isExportModalOpen: false,
  setExportModalOpen: (open) => set({ isExportModalOpen: open }),
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isAuthenticated: false,
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),

  user: {
    name: 'Enterprise Counsel',
    email: 'counsel@contractlens.ai',
    initials: 'EC',
    role: 'Enterprise Legal Lead',
    riskPosture: 'defensive',
    autoRedline: true,
    enterpriseEncryption: true,
  },
  updateUser: (updates) =>
    set((state) => {
      const newName = updates.name !== undefined ? updates.name : state.user.name;
      const computedInitials =
        updates.initials ||
        newName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase()
          .slice(0, 2) ||
        'EC';
      return {
        user: {
          ...state.user,
          ...updates,
          initials: computedInitials,
        },
      };
    }),
  isSettingsModalOpen: false,
  setSettingsModalOpen: (open) => set({ isSettingsModalOpen: open }),

  generalResponse: null,
  setGeneralResponse: (response) => set({ generalResponse: response }),
  scratchpadSummary: null,
  setScratchpadSummary: (summary) => set({ scratchpadSummary: summary }),
}));
