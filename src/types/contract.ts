export interface Clause {
  id: string;
  clause_name: string;
  text: string;
  risk_level: 'critical' | 'high' | 'medium' | 'low';
  explanation: string;
  who_it_favors: string;
  page_number: number;
  position: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  // AI Counter-Negotiation Workbench Extensions
  index_tag: string; // e.g. "#1", "#2"
  counter_clause?: string;
  strategy?: string;
  financial_exposure?: string;
  resolution_status?: 'pending' | 'accepted' | 'resolved' | 'dismissed';
  is_accepted?: boolean;
  updatedAt?: string;
}

export interface FindingItem {
  index: number;
  severity_color: 'red' | 'orange' | 'yellow';
  exact_quote: string;
  ai_response: string;
}

export interface RiskSummary {
  totalIdentified: number;
  critical: number;
  high: number;
  medium: number;
  low: number;
  pending: number;
  resolved: number;
  dismissed: number;
}

export interface FinancialExposureDetail {
  status: 'quantified' | 'partially_quantified' | 'uncapped' | 'not_quantified';
  displayAmount: string;
  amount: string;
  currency: string | null;
  quantifiedAmount: number | null;
  method: string;
  reason: string;
  breakdown: Array<{
    currency: string;
    symbol: string;
    amount: number;
    raw: string;
    type: string;
    isPerIncident: boolean;
    snippet: string;
  }>;
  unquantifiedRisks: number;
}

export interface DocumentAnalysisResponse {
  scratchpad_summary: string;
  general_response: string;
  financial_exposure?: string;
  findings: FindingItem[];
}

export interface ExecutionEvent {
  id: string;
  timestamp: string;
  stage: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
}

export interface ContractItem {
  id: string;
  name: string;
  date: string;
  createdAt: string;
  status: string;
  fileSize: number;
  mimeType: string;
  totalRisks: number;
  criticalRisks?: number;
  highRisks: number;
  mediumRisks?: number;
  lowRisks?: number;
  resolvedRisks: number;
  pendingRisks: number;
  dismissedRisks?: number;
  financialExposure: string;
  riskSummary?: RiskSummary;
}

export interface ContractDetail {
  id: string;
  filename: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
  updatedAt: string;
  status: string;
  error?: string | null;
  activeStep: number;
  executionEvents: ExecutionEvent[];
  generalResponse: string | null;
  scratchpadSummary: string | null;
  financialExposure: string;
  financialExposureDetail?: FinancialExposureDetail;
  riskSummary?: RiskSummary;
  risks: Clause[];
}
