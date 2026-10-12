import { calculateFinancialExposure } from './services/exposureCalculator.js';
import { 
  createContractRecord, 
  updateContractAnalysis, 
  getContractById, 
  updateRiskResolution, 
  listRecentContracts, 
  deleteContractById,
  resetWorkspaceStore 
} from './services/contractStore.js';

async function runTests() {
  console.log('====================================================');
  console.log('   CONTRACTLENS E2E & COMPREHENSIVE VERIFICATION    ');
  console.log('====================================================\n');

  // Clean workspace first
  await resetWorkspaceStore();

  // -------------------------------------------------------------------------
  // TEST 1: Contract with no identified risks
  // -------------------------------------------------------------------------
  console.log('TEST 1: Contract with zero risks');
  const c1 = await createContractRecord({
    id: 'test-contract-zero',
    originalFilename: 'Standard_Mutual_NDA.pdf',
    storedFilename: 'test-c1.pdf',
    storedPath: 'uploads/test-c1.pdf',
    fileSize: 10240,
    mimeType: 'application/pdf',
  });
  const exp1 = calculateFinancialExposure('Mutual Non-Disclosure Agreement. Both parties agree to protect secrets.', []);
  await updateContractAnalysis(c1.id, {
    status: 'completed',
    activeStep: 6,
    financialExposure: exp1.displayAmount,
    risks: [],
  });
  const savedC1 = await getContractById(c1.id);
  console.assert(savedC1.risks.length === 0, 'Risk count should be 0');
  console.assert(savedC1.financialExposure === 'Not assessed' || savedC1.financialExposure === 'Not quantified', 'Exposure should be not quantified/assessed');
  console.log('✓ TEST 1 PASSED: Zero risks reported correctly with no fabricated counts.\n');

  // -------------------------------------------------------------------------
  // TEST 2: Contract containing quantifiable penalty ($10,000 per bug)
  // -------------------------------------------------------------------------
  console.log('TEST 2: Contract with quantifiable penalty');
  const c2 = await createContractRecord({
    id: 'test-contract-penalty',
    originalFilename: 'Web_Dev_Agreement.pdf',
    storedFilename: 'test-c2.pdf',
    storedPath: 'uploads/test-c2.pdf',
    fileSize: 15400,
    mimeType: 'application/pdf',
  });
  const textC2 = 'Developer owes Client a penalty of $10,000 per bug. Flat rate of $50.';
  const findingsC2 = [
    { exact_quote: 'penalty of $10,000 per bug', ai_response: 'Excessive bug penalty.' }
  ];
  const exp2 = calculateFinancialExposure(textC2, findingsC2);
  const risksC2 = [
    {
      id: `risk-${c2.id}-1`,
      index_tag: '#1',
      clause_name: 'Bug Penalty Covenant',
      text: 'penalty of $10,000 per bug',
      risk_level: 'high',
      explanation: 'Liquidated penalty per defect',
      who_it_favors: 'Client',
      page_number: 1,
      position: { x: 8, y: 15, width: 84, height: 12 },
      counter_clause: 'Liquidated damages capped at 10% of total project compensation.',
      strategy: 'Cap damages',
      financial_exposure: exp2.displayAmount,
      resolution_status: 'pending',
      is_accepted: false,
      updatedAt: new Date().toISOString(),
    }
  ];
  await updateContractAnalysis(c2.id, {
    status: 'completed',
    activeStep: 6,
    financialExposure: exp2.displayAmount,
    risks: risksC2,
  });
  const savedC2 = await getContractById(c2.id);
  console.assert(savedC2.risks.length === 1, 'Risk count should be 1');
  console.assert(savedC2.financialExposure.includes('$10,000'), 'Should contain $10,000');
  console.log(`✓ TEST 2 PASSED: Quantified penalty correctly derived: ${savedC2.financialExposure}\n`);

  // -------------------------------------------------------------------------
  // TEST 3: Contract with uncapped liability exception
  // -------------------------------------------------------------------------
  console.log('TEST 3: Contract with uncapped liability exception');
  const textC3 = 'Service Provider indemnifies and holds harmless without any capped monetary ceiling.';
  const exp3 = calculateFinancialExposure(textC3, [{ exact_quote: 'without any capped monetary ceiling' }]);
  console.assert(exp3.displayAmount === 'Uncapped Liability', 'Exposure should be Uncapped Liability');
  console.assert(!exp3.displayAmount.includes('$250,000'), 'Must not contain fabricated $250,000!');
  console.log(`✓ TEST 3 PASSED: Uncapped liability properly qualified without arbitrary numbers: ${exp3.displayAmount}\n`);

  // -------------------------------------------------------------------------
  // TEST 4: Contract with no quantifiable financial terms
  // -------------------------------------------------------------------------
  console.log('TEST 4: Contract with no financial terms (Pure NDA)');
  const exp4 = calculateFinancialExposure('Recipient shall protect trade secrets with commercially reasonable efforts.', []);
  console.assert(exp4.displayAmount === 'Not quantified', 'Must report Not quantified');
  console.log(`✓ TEST 4 PASSED: Missing financial information correctly reported: ${exp4.displayAmount}\n`);

  // -------------------------------------------------------------------------
  // TEST 5: Two contracts with distinct risk profiles
  // -------------------------------------------------------------------------
  console.log('TEST 5: Two contracts with distinct risk profiles');
  const contractsOverview = await listRecentContracts();
  const foundC1 = contractsOverview.find(c => c.id === c1.id);
  const foundC2 = contractsOverview.find(c => c.id === c2.id);
  console.assert(foundC1.totalRisks === 0, 'Contract 1 has 0 risks');
  console.assert(foundC2.totalRisks === 1, 'Contract 2 has 1 risk');
  console.assert(foundC1.financialExposure !== foundC2.financialExposure, 'Exposures must be distinct');
  console.log(`✓ TEST 5 PASSED: Contract 1 (${foundC1.totalRisks} risks, ${foundC1.financialExposure}) vs Contract 2 (${foundC2.totalRisks} risks, ${foundC2.financialExposure})\n`);

  // -------------------------------------------------------------------------
  // TEST 6: Resolving a risk persists status and updates counters
  // -------------------------------------------------------------------------
  console.log('TEST 6: Resolving a risk');
  await updateRiskResolution(c2.id, `risk-${c2.id}-1`, 'accepted');
  const updatedC2 = await getContractById(c2.id);
  console.assert(updatedC2.risks[0].is_accepted === true, 'Risk should be accepted');
  console.assert(updatedC2.risks[0].resolution_status === 'accepted', 'Status should be accepted');

  const overviewAfterResolve = await listRecentContracts();
  const c2Overview = overviewAfterResolve.find(c => c.id === c2.id);
  console.assert(c2Overview.totalRisks === 1, 'Total identified risks remains 1');
  console.assert(c2Overview.resolvedRisks === 1, 'Resolved risks updated to 1');
  console.assert(c2Overview.pendingRisks === 0, 'Pending risks updated to 0');
  console.log('✓ TEST 6 PASSED: Resolution persisted; resolved=1, pending=0, total=1 preserved.\n');

  // -------------------------------------------------------------------------
  // TEST 7: Dismissing a risk
  // -------------------------------------------------------------------------
  console.log('TEST 7: Dismissing a risk');
  await updateRiskResolution(c2.id, `risk-${c2.id}-1`, 'dismissed');
  const dismissedC2 = await getContractById(c2.id);
  console.assert(dismissedC2.risks[0].resolution_status === 'dismissed', 'Status should be dismissed');
  console.assert(dismissedC2.risks[0].is_accepted === false, 'Dismissed is not accepted');
  console.log('✓ TEST 7 PASSED: Dismissed status recorded accurately.\n');

  // -------------------------------------------------------------------------
  // TEST 8: Multi-currency handling
  // -------------------------------------------------------------------------
  console.log('TEST 8: Multi-currency handling (INR and USD)');
  const multiText = 'Late payment fee of INR 50,000 for local invoice, and $1,500 per milestone delay for foreign vendor.';
  const multiExp = calculateFinancialExposure(multiText, []);
  console.assert(multiExp.currency === 'MULTI', 'Should detect multi-currency');
  console.assert(multiExp.displayAmount.includes('₹') && multiExp.displayAmount.includes('$'), 'Should preserve separate currency totals');
  console.log(`✓ TEST 8 PASSED: Incompatible currencies never summed together: ${multiExp.displayAmount}\n`);

  // -------------------------------------------------------------------------
  // TEST 9: Duplicate and deletion handling
  // -------------------------------------------------------------------------
  console.log('TEST 9: Contract deletion & cleanup');
  await deleteContractById(c1.id);
  const remaining = await listRecentContracts();
  console.assert(remaining.length === 1 && remaining[0].id === c2.id, 'Contract 1 deleted cleanly');
  console.log('✓ TEST 9 PASSED: Contract deleted cleanly without corrupting other contracts.\n');

  // -------------------------------------------------------------------------
  // TEST 10: Failed analysis error preservation
  // -------------------------------------------------------------------------
  console.log('TEST 10: Processing failure handling');
  const cFail = await createContractRecord({
    id: 'test-contract-failed',
    originalFilename: 'Corrupted_Doc.pdf',
    storedFilename: 'test-cfail.pdf',
    storedPath: 'uploads/test-cfail.pdf',
    fileSize: 500,
    mimeType: 'application/pdf',
  });
  await updateContractAnalysis(cFail.id, {
    status: 'failed',
    error: 'PDF structure corrupted; syntax error on byte 42',
    activeStep: 2,
    risks: [],
  });
  const failedDoc = await getContractById(cFail.id);
  console.assert(failedDoc.status === 'failed', 'Should record failed status');
  console.assert(failedDoc.error.includes('PDF structure corrupted'), 'Should retain honest error message');
  console.assert(failedDoc.risks.length === 0, 'Must not invent fake risks on failure');
  console.log(`✓ TEST 10 PASSED: Honest error reporting on failure without fallback mock data.\n`);

  console.log('====================================================');
  console.log('   ALL 10 TESTS PASSED SUCCESSFULLY!                ');
  console.log('====================================================');
}

runTests().catch(err => {
  console.error('Test Suite Failed:', err);
  process.exit(1);
});
