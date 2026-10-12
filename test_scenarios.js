import { calculateFinancialExposure } from './services/exposureCalculator.js';

console.log('=== TEST SUITE: DEFENSIBLE EXPOSURE CALCULATION ===');

// 1. Contract with penalty ($10,000 per bug) and flat compensation ($50)
const t1 = calculateFinancialExposure(
  'Freelance Web Development Agreement. Flat rate of $50. If the application crashes, the Developer owes the Client a penalty of $10,000 per bug.',
  [{ exact_quote: 'the Developer owes the Client a penalty of $10,000 per bug' }]
);
console.log('1. Penalty Test:', t1.displayAmount, '| Status:', t1.status, '| Method:', t1.method);

// 2. Contract with uncapped liability (no dollar amount)
const t2 = calculateFinancialExposure(
  'Developer indemnifies Client against all claims without any capped monetary ceiling.',
  [{ exact_quote: 'without any capped monetary ceiling' }]
);
console.log('2. Uncapped Test:', t2.displayAmount, '| Status:', t2.status, '| Method:', t2.method);

// 3. Contract with stated liability cap (INR 500,000)
const t3 = calculateFinancialExposure(
  'Total aggregate liability shall not exceed INR 500,000 under this agreement.',
  [{ exact_quote: 'Total aggregate liability shall not exceed INR 500,000' }]
);
console.log('3. Stated Cap Test (INR):', t3.displayAmount, '| Status:', t3.status, '| Method:', t3.method);

// 4. Contract with base compensation only ($2,000 retainer, no penalties or uncapped terms)
const t4 = calculateFinancialExposure(
  'Client shall pay a monthly retainer of $2,000 for ongoing advisory services.',
  []
);
console.log('4. Base Fee Test:', t4.displayAmount, '| Status:', t4.status, '| Method:', t4.method);

// 5. Contract with no financial terms (Pure NDA)
const t5 = calculateFinancialExposure(
  'Recipient shall protect proprietary information with standard degree of care.',
  []
);
console.log('5. Pure NDA Test:', t5.displayAmount, '| Status:', t5.status, '| Method:', t5.method);

// 6. Multi-currency contract (INR 20,000 penalty and $500/day delay fee)
const t6 = calculateFinancialExposure(
  'Liquidated damages of INR 20,000 for defect, and penalty of $500 per day for delay.',
  [
    { exact_quote: 'Liquidated damages of INR 20,000 for defect' },
    { exact_quote: 'penalty of $500 per day for delay' },
  ]
);
console.log('6. Multi-currency Test:', t6.displayAmount, '| Status:', t6.status, '| Method:', t6.method);
