export interface Clause {
  id: string;
  clause_name: string;
  text: string;
  risk_level: 'high' | 'medium' | 'low';
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
  is_accepted?: boolean;
}

export interface FindingItem {
  index: number;
  severity_color: 'red' | 'orange' | 'yellow';
  exact_quote: string;
  ai_response: string;
}

export interface DocumentAnalysisResponse {
  scratchpad_summary: string;
  general_response: string;
  findings: FindingItem[];
}

