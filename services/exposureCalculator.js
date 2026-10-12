/**
 * Defensibly extracts and calculates contractual financial exposure from actual contract text and findings.
 * Adheres strictly to legal audit standards:
 * - Differentiates between contractual penalties, liability caps, base contract value, and uncapped liabilities.
 * - Supports multi-currency recognition (USD, INR, EUR, GBP) without summing incompatible currencies.
 * - Never invents or fabricates static arbitrary numbers ($250,000+).
 * - Reports "Not quantified" or "Insufficient data" when information is missing or unquantifiable.
 */

// Currency patterns
const CURRENCY_CONFIG = [
  {
    code: 'USD',
    symbol: '$',
    regex: /(?:\$|USD\s*)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]+(?:\.[0-9]{2})?\b)(?:\s*(?:USD|dollars?))?/gi,
  },
  {
    code: 'INR',
    symbol: '₹',
    regex: /(?:₹|Rs\.?|INR\s*)\s*([0-9]{1,3}(?:,[0-9]{2,3})*(?:\.[0-9]{2})?|\b[0-9]+(?:\.[0-9]{2})?\b)(?:\s*(?:INR|rupees?))?/gi,
  },
  {
    code: 'EUR',
    symbol: '€',
    regex: /(?:€|EUR\s*)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]+(?:\.[0-9]{2})?\b)(?:\s*(?:EUR|euros?))?/gi,
  },
  {
    code: 'GBP',
    symbol: '£',
    regex: /(?:£|GBP\s*)\s*([0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]{2})?|\b[0-9]+(?:\.[0-9]{2})?\b)(?:\s*(?:GBP|pounds?))?/gi,
  },
];

export function calculateFinancialExposure(documentText = '', findings = []) {
  if (!documentText || documentText.trim().length === 0) {
    return {
      status: 'not_quantified',
      displayAmount: 'Not assessed',
      amount: 'Not assessed',
      currency: null,
      quantifiedAmount: null,
      method: 'insufficient_text',
      reason: 'No document text available for financial assessment.',
      breakdown: [],
      unquantifiedRisks: findings.length,
    };
  }

  const items = [];

  // Helper to extract matches for a text block
  function extractMonetaryAmounts(text, sourceClause = '') {
    for (const cur of CURRENCY_CONFIG) {
      const regex = new RegExp(cur.regex.source, 'gi');
      let match;
      while ((match = regex.exec(text)) !== null) {
        const rawNumStr = match[1];
        if (!rawNumStr) continue;
        const numVal = parseFloat(rawNumStr.replace(/,/g, ''));
        if (isNaN(numVal) || numVal <= 0) continue;

        // Context around match (50 chars before and after)
        const start = Math.max(0, match.index - 50);
        const end = Math.min(text.length, match.index + match[0].length + 50);
        const snippet = text.slice(start, end).toLowerCase();

        // Categorize the monetary item
        let type = 'general';
        let isPerIncident = false;

        if (/per\s+bug|per\s+incident|per\s+violation|per\s+day|per\s+milestone|penalty|liquidated\s+damages|fine|breach|late\s+(?:payment\s+)?fee|delay/i.test(snippet)) {
          type = 'penalty';
          if (/per\s+bug|per\s+incident|per\s+violation|per\s+day|per\s+milestone/i.test(snippet)) {
            isPerIncident = true;
          }
        } else if (/liability\s+shall\s+not\s+exceed|capped\s+at|maximum\s+liability|aggregate\s+liability|liability\s+cap/i.test(snippet)) {
          type = 'liability_cap';
        } else if (/flat\s+rate|compensation|contract\s+price|contract\s+value|retainer|(?:base\s+)?fee\s+of/i.test(snippet)) {
          type = 'contract_value';
        }

        items.push({
          currency: cur.code,
          symbol: cur.symbol,
          amount: numVal,
          raw: `${cur.symbol}${numVal.toLocaleString()}`,
          type,
          isPerIncident,
          snippet: text.slice(start, end).trim(),
          sourceClause: sourceClause || text.slice(start, end).trim(),
        });
      }
    }
  }

  // 1. Inspect findings quotes & explanations
  for (const f of findings) {
    const combined = `${f.exact_quote || ''} ${f.ai_response || ''}`;
    extractMonetaryAmounts(combined, f.exact_quote);
  }

  // 2. If findings didn't yield items, inspect the full document text
  if (items.length === 0) {
    extractMonetaryAmounts(documentText);
  }

  // Deduplicate items with identical amount and type
  const uniqueItems = [];
  const seen = new Set();
  for (const it of items) {
    const key = `${it.currency}-${it.amount}-${it.type}`;
    if (!seen.has(key)) {
      seen.add(key);
      uniqueItems.push(it);
    }
  }

  // 3. Check for uncapped liability wording
  const hasUncappedLiability =
    /uncapped|unlimited\s+liability|indemnify.*without.*limit|hold\s+harmless.*all\s+liabilities|without\s+any\s+capped\s+monetary\s+ceiling/i.test(
      documentText
    );

  // Multi-currency check across all quantified items
  const distinctCurrencies = Array.from(new Set(uniqueItems.map((i) => i.currency)));
  if (distinctCurrencies.length > 1) {
    const summaryParts = distinctCurrencies.map((cur) => {
      const curItems = uniqueItems.filter((p) => p.currency === cur);
      const maxVal = Math.max(...curItems.map((p) => p.amount));
      const sym = curItems[0].symbol;
      return `${sym}${maxVal.toLocaleString()}`;
    });
    const display = `${summaryParts.join(' / ')} (Multi-currency)`;
    return {
      status: 'partially_quantified',
      displayAmount: display,
      amount: display,
      currency: 'MULTI',
      quantifiedAmount: null,
      method: 'multi_currency_penalties',
      reason: 'Multiple currencies present in contract; amounts displayed separately without conversion.',
      breakdown: uniqueItems,
      unquantifiedRisks: Math.max(0, findings.length - uniqueItems.length),
    };
  }

  // Separate penalties, liability caps, and contract values
  const penalties = uniqueItems.filter((i) => i.type === 'penalty');
  const caps = uniqueItems.filter((i) => i.type === 'liability_cap');
  const contractValues = uniqueItems.filter((i) => i.type === 'contract_value');

  // SCENARIO 1: Explicit contractual penalty found
  if (penalties.length > 0) {
    const cur = penalties[0].currency;
    const curPenalties = penalties.filter((p) => p.currency === cur);
    const highest = curPenalties.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), curPenalties[0]);

    const suffix = highest.isPerIncident ? '/incident' : '+';
    const display = `${highest.raw}${suffix} (Penalty)`;

    return {
      status: 'quantified',
      displayAmount: display,
      amount: display,
      currency: cur,
      quantifiedAmount: highest.amount,
      method: 'liquidated_damages_clause',
      reason: `Contract specifies explicit penalty or damages formula: ${highest.snippet}`,
      breakdown: uniqueItems,
      unquantifiedRisks: Math.max(0, findings.length - 1),
    };
  }

  // SCENARIO 2: Uncapped liability provision identified (and no penalties)
  if (hasUncappedLiability) {
    const display = 'Uncapped Liability';
    return {
      status: 'uncapped',
      displayAmount: display,
      amount: display,
      currency: null,
      quantifiedAmount: null,
      method: 'uncapped_indemnity_clause',
      reason: 'Indemnification or liability covenant contains no monetary ceiling; exposure is legally uncapped.',
      breakdown: uniqueItems,
      unquantifiedRisks: findings.length,
    };
  }

  // SCENARIO 3: Stated liability cap (and no penalties or uncapped clauses)
  if (caps.length > 0) {
    const highestCap = caps.reduce((prev, curr) => (curr.amount > prev.amount ? curr : prev), caps[0]);
    const display = `${highestCap.raw} (Stated Cap)`;
    return {
      status: 'partially_quantified',
      displayAmount: display,
      amount: display,
      currency: highestCap.currency,
      quantifiedAmount: highestCap.amount,
      method: 'stated_liability_cap',
      reason: `Contract defines an aggregate liability ceiling of ${highestCap.raw}, subject to clause scope and statutory exceptions.`,
      breakdown: uniqueItems,
      unquantifiedRisks: Math.max(0, findings.length - 1),
    };
  }

  // SCENARIO 4: Base contract fee only (not an additional loss)
  if (contractValues.length > 0) {
    const val = contractValues[0];
    const display = `${val.raw} (Contract Value)`;
    return {
      status: 'not_quantified',
      displayAmount: display,
      amount: display,
      currency: val.currency,
      quantifiedAmount: val.amount,
      method: 'base_compensation_only',
      reason: `Base contract consideration of ${val.raw} identified; no additional liquidated damages or penalty formulas specified.`,
      breakdown: uniqueItems,
      unquantifiedRisks: findings.length,
    };
  }

  // SCENARIO 5: No financial terms identified
  return {
    status: 'not_quantified',
    displayAmount: 'Not quantified',
    amount: 'Not quantified',
    currency: null,
    quantifiedAmount: null,
    method: 'insufficient_financial_terms',
    reason: 'Contract contains no explicit liquidated damages, liability ceilings, or monetary penalty formulas.',
    breakdown: [],
    unquantifiedRisks: findings.length,
  };
}
