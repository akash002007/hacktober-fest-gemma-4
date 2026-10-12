import { create } from 'zustand';
import type { Clause } from '../types/contract';

export const mockClauses: Clause[] = [
  {
    id: 'clause-1',
    index_tag: '#1',
    clause_name: 'Limitation of Liability & Indemnification',
    text: 'Client agrees to indemnify, defend, and hold harmless Service Provider from any and all liabilities, losses, damages, claims, costs, and expenses (including attorneys fees) arising out of or related to Service Provider performance under this Agreement, without any capped monetary ceiling.',
    risk_level: 'high',
    explanation: 'Uncapped, one-sided indemnification exposing the client to unlimited financial risk for all losses regardless of fault.',
    who_it_favors: 'Service Provider (One-Sided)',
    page_number: 3,
    position: {
      x: 8,
      y: 45,
      width: 84,
      height: 16,
    },
    counter_clause: 'Each party shall indemnify, defend, and hold harmless the other party from third-party claims arising solely from willful misconduct or gross negligence. In no event shall either party’s aggregate liability exceed the total fees paid by Client in the preceding twelve (12) months.',
    strategy: 'Cap total indemnity and damage exposure to a 12-month fee lookback, and make indemnification strictly mutual for third-party torts.',
    financial_exposure: '$250,000+ (Uncapped Indemnity)',
    is_accepted: false,
  },
  {
    id: 'clause-2',
    index_tag: '#2',
    clause_name: 'Termination for Convenience',
    text: 'Service Provider may terminate this Agreement immediately at any time for any reason or no reason upon 2 business days written notice to Client, with no obligation to refund prepaid unearned fees.',
    risk_level: 'medium',
    explanation: 'Short 2-day notice period creates operational disruption vulnerability, and retention of prepaid unearned fees without a pro-rata refund is unfavorable.',
    who_it_favors: 'Service Provider',
    page_number: 5,
    position: {
      x: 8,
      y: 20,
      width: 84,
      height: 14,
    },
    counter_clause: 'Either party may terminate this Agreement for convenience upon ninety (90) days prior written notice. Upon such termination, Service Provider shall promptly refund any prepaid, unearned fees on a pro-rata basis within thirty (30) days.',
    strategy: 'Extend termination notice to a symmetrical 90-day operational buffer and explicitly enforce pro-rata refund obligations for unused retainer fees.',
    financial_exposure: '$45,000 (Prepaid Retainers)',
    is_accepted: false,
  },
  {
    id: 'clause-3',
    index_tag: '#3',
    clause_name: 'Governing Law and Jurisdiction',
    text: 'This Agreement shall be governed by, construed, and enforced in accordance with the laws of the State of Delaware, without giving effect to any principles of conflicts of law.',
    risk_level: 'low',
    explanation: 'Standard neutral commercial governing law provision with well-established legal precedent in Delaware courts.',
    who_it_favors: 'Neutral / Mutual',
    page_number: 8,
    position: {
      x: 8,
      y: 70,
      width: 84,
      height: 10,
    },
    counter_clause: 'This Agreement shall be governed by the laws of the State of Delaware. Any disputes shall first be submitted to mandatory confidential mediation before commencing binding arbitration under AAA commercial rules.',
    strategy: 'Maintain Delaware legal jurisdiction while introducing mandatory pre-litigation confidential mediation to save potential litigation costs.',
    financial_exposure: 'Low / Procedural Only',
    is_accepted: false,
  },
  {
    id: 'clause-4',
    index_tag: '#4',
    clause_name: 'Confidentiality & Non-Disclosure',
    text: 'Each party agrees to maintain in confidence all non-public technical, business, or financial information disclosed by the other party for a period of three (3) years following termination.',
    risk_level: 'low',
    explanation: 'Standard 3-year mutual confidentiality protections typical for enterprise software and consulting service agreements.',
    who_it_favors: 'Mutual Protection',
    page_number: 2,
    position: {
      x: 8,
      y: 30,
      width: 84,
      height: 14,
    },
    counter_clause: 'Each party shall maintain in confidence all proprietary information for five (5) years post-termination; provided, however, that obligations regarding trade secrets shall remain in effect indefinitely so long as they qualify under applicable law.',
    strategy: 'Extend general confidentiality protection from 3 to 5 years and insert an indefinite survival exception for core trade secrets.',
    financial_exposure: 'Negligible (Standard Term)',
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
  file: File | null;
  setFile: (file: File | null) => void;
  isAnalyzing: boolean;
  setAnalyzing: (status: boolean) => void;
  clauses: Clause[];
  setClauses: (clauses: Clause[]) => void;
  selectedClauseId: string | null;
  setSelectedClauseId: (id: string | null) => void;
  mockData: Clause[];
  acceptFix: (id: string) => void;
  updateCounterClause: (id: string, newText: string, newStrategy?: string) => void;
  loadMockDocument: (docName: string) => void;
  reset: () => void;
  // Toast notification state
  toastMessage: string | null;
  triggerToast: (msg: string) => void;
  clearToast: () => void;
  // Redlined Export Modal State
  isExportModalOpen: boolean;
  setExportModalOpen: (open: boolean) => void;
  // Sidebar open/collapse state
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  setIsSidebarOpen: (open: boolean) => void;
  // Auth state
  isAuthenticated: boolean;
  setAuthenticated: (auth: boolean) => void;
  // User & Settings state
  user: UserProfile;
  updateUser: (updates: Partial<UserProfile>) => void;
  isSettingsModalOpen: boolean;
  setSettingsModalOpen: (open: boolean) => void;
  // Analysis Output State
  generalResponse: string | null;
  setGeneralResponse: (response: string | null) => void;
  scratchpadSummary: string | null;
  setScratchpadSummary: (summary: string | null) => void;
}

export const useContractStore = create<ContractState>((set, get) => ({
  generalResponse: null,
  setGeneralResponse: (response) => set({ generalResponse: response }),
  scratchpadSummary: null,
  setScratchpadSummary: (summary) => set({ scratchpadSummary: summary }),

  file: null,
  setFile: (file) => set({ file }),
  isAnalyzing: false,
  setAnalyzing: (status) => set({ isAnalyzing: status }),
  clauses: [],
  setClauses: (clauses) => set({ clauses }),
  selectedClauseId: null,
  setSelectedClauseId: (id) => set({ selectedClauseId: id }),
  mockData: mockClauses,
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  setIsSidebarOpen: (open) => set({ isSidebarOpen: open }),
  isAuthenticated: false,
  setAuthenticated: (auth) => set({ isAuthenticated: auth }),
  user: {
    name: 'Alex Rivera',
    email: 'alex.rivera@contractlens.ai',
    initials: 'AR',
    role: 'Enterprise Legal Lead',
    riskPosture: 'defensive',
    autoRedline: true,
    enterpriseEncryption: true,
  },
  updateUser: (updates) =>
    set((state) => {
      const newName = updates.name !== undefined ? updates.name : state.user.name;
      const computedInitials = updates.initials || newName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'AR';
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
  acceptFix: (id) =>
    set((state) => ({
      clauses: state.clauses.map((c) =>
        c.id === id ? { ...c, is_accepted: true } : c
      ),
    })),
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
  loadMockDocument: (docName) => {
    const mockFile = new File(['Simulated Contract Buffer Content'], docName, {
      type: 'application/pdf',
      lastModified: Date.now(),
    });
    set({
      file: mockFile,
      isAnalyzing: false,
      clauses: mockClauses.map((c) => ({ ...c, is_accepted: false })),
      selectedClauseId: mockClauses[0]?.id || null,
      isExportModalOpen: false,
      scratchpadSummary: 'Simulated contract risk scan for Master Services Agreement complete.',
      generalResponse: 'Identified 4 key contractual exposures including uncapped indemnification and unilateral termination notice.',
    });
  },
  reset: () =>
    set({
      file: null,
      isAnalyzing: false,
      clauses: [],
      selectedClauseId: null,
      toastMessage: null,
      isExportModalOpen: false,
      generalResponse: null,
      scratchpadSummary: null,
    }),
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
}));
