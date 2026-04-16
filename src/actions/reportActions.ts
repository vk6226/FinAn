'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

export async function submitReport(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'ANALYST') return { error: 'Unauthorized' }

  // ── Helper ──
  const num = (key: string) => parseFloat(formData.get(key) as string) || 0;
  const str = (key: string) => (formData.get(key) as string) || '';

  // ═══════════════════════════════
  //  Extract all form inputs
  // ═══════════════════════════════

  // Company A (Acquirer)
  const companyA_name     = str('companyA_name');
  const companyA_price    = num('companyA_price');
  const companyA_shares   = num('companyA_shares');
  const companyA_revenue  = num('companyA_revenue');
  const companyA_ebitda   = num('companyA_ebitda');
  const companyA_netIncome = num('companyA_netIncome');
  const companyA_netDebt  = num('companyA_netDebt');
  const companyA_capex    = num('companyA_capex');
  const companyA_da       = num('companyA_da');
  const companyA_nwcChange = num('companyA_nwcChange');

  // Company B (Target)
  const companyB_name     = str('companyB_name');
  const companyB_price    = num('companyB_price');
  const companyB_shares   = num('companyB_shares');
  const companyB_revenue  = num('companyB_revenue');
  const companyB_ebitda   = num('companyB_ebitda');
  const companyB_netIncome = num('companyB_netIncome');
  const companyB_netDebt  = num('companyB_netDebt');

  // DCF Parameters
  const wacc              = num('wacc') / 100;
  const tgr               = num('tgr') / 100;
  const projectionYears   = num('projectionYears') || 5;
  const revenueGrowth     = num('revenueGrowth') / 100;
  const ebitdaMargin      = num('ebitdaMargin') / 100;
  const taxRate           = num('taxRate') / 100;

  // M&A Deal Terms
  const premium           = num('premium') / 100;
  const cashPct           = num('cashPct') / 100;
  const stockPct          = 1 - cashPct;
  const costSynergies     = num('costSynergies');
  const revenueSynergies  = num('revenueSynergies');
  const integrationCosts  = num('integrationCosts');
  const debtFinancingRate = num('debtFinancingRate') / 100;

  if (!companyA_name || !companyB_name || isNaN(wacc)) return { error: 'Invalid parameters' }

  // ═══════════════════════════════
  //  DCF MODEL (Multi-Year)
  // ═══════════════════════════════

  // Calculate Free Cash Flows for each projection year
  const projectedFCFs: number[] = [];
  let currentRevenue = companyA_revenue;
  const effectiveEbitdaMargin = ebitdaMargin > 0 ? ebitdaMargin : (companyA_ebitda / companyA_revenue);
  const effectiveTaxRate = taxRate > 0 ? taxRate : 0.25;
  const capexRatio = companyA_capex / companyA_revenue;
  const daRatio = companyA_da / companyA_revenue;
  const nwcRatio = Math.abs(companyA_nwcChange) / companyA_revenue;

  for (let y = 1; y <= projectionYears; y++) {
    currentRevenue = currentRevenue * (1 + revenueGrowth);
    const ebitda = currentRevenue * effectiveEbitdaMargin;
    const da = currentRevenue * daRatio;
    const ebit = ebitda - da;
    const nopat = ebit * (1 - effectiveTaxRate);
    const capex = currentRevenue * capexRatio;
    const nwc = currentRevenue * nwcRatio;
    const fcf = nopat + da - capex - nwc;
    projectedFCFs.push(fcf);
  }

  // Present Value of projected FCFs
  let pvOfFCFs = 0;
  projectedFCFs.forEach((fcf, i) => {
    pvOfFCFs += fcf / Math.pow(1 + wacc, i + 1);
  });

  // Terminal Value (Gordon Growth Model)
  const finalYearFCF = projectedFCFs[projectedFCFs.length - 1];
  const terminalValue = (finalYearFCF * (1 + tgr)) / (wacc - tgr);
  const pvTerminal = terminalValue / Math.pow(1 + wacc, projectionYears);

  // Enterprise & Equity Value
  const enterpriseValue = pvOfFCFs + pvTerminal;
  const equityValue = enterpriseValue - companyA_netDebt;
  const impliedSharePrice = equityValue / companyA_shares;
  const upside = ((impliedSharePrice / companyA_price) - 1) * 100;

  // EPS
  const companyA_eps = companyA_netIncome / companyA_shares;
  const companyA_pe = companyA_price / companyA_eps;

  const dcfData = {
    projectedFCFs,
    pvOfFCFs: Math.round(pvOfFCFs * 100) / 100,
    terminalValue: Math.round(terminalValue * 100) / 100,
    pvTerminal: Math.round(pvTerminal * 100) / 100,
    enterpriseValue: Math.round(enterpriseValue * 100) / 100,
    equityValue: Math.round(equityValue * 100) / 100,
    impliedSharePrice: Math.round(impliedSharePrice * 100) / 100,
    upside: Math.round(upside * 100) / 100,
    wacc: wacc * 100,
    tgr: tgr * 100,
    projectionYears,
    revenueGrowth: revenueGrowth * 100,
    ebitdaMargin: effectiveEbitdaMargin * 100,
    taxRate: effectiveTaxRate * 100,
    companyA_eps: Math.round(companyA_eps * 100) / 100,
    companyA_pe: Math.round(companyA_pe * 100) / 100,
    // Original Inputs
    acquirerPrice: companyA_price,
    acquirerShares: companyA_shares,
    acquirerRevenue: companyA_revenue,
    acquirerEbitda: companyA_ebitda,
    acquirerNetIncome: companyA_netIncome,
    acquirerNetDebt: companyA_netDebt,
  };

  // ═══════════════════════════════
  //  M&A MODEL (Accretion/Dilution)
  // ═══════════════════════════════

  // Deal Value
  const offerPrice = companyB_price * (1 + premium);
  const targetEquityValue = offerPrice * companyB_shares;
  const totalDealValue = targetEquityValue + companyB_netDebt; // Enterprise value of target

  // Financing Mix
  const cashComponent = totalDealValue * cashPct;
  const stockComponent = totalDealValue * stockPct;
  const newSharesIssued = stockComponent / companyA_price;

  // Pro-Forma Combined
  const combinedShares = companyA_shares + newSharesIssued;
  const combinedRevenue = companyA_revenue + companyB_revenue + revenueSynergies;
  const combinedEbitda = companyA_ebitda + companyB_ebitda + costSynergies + revenueSynergies;
  const combinedNetIncome = companyA_netIncome + companyB_netIncome
    + costSynergies + revenueSynergies
    - integrationCosts
    - (cashComponent * debtFinancingRate); // Interest on debt used for cash portion

  const proFormaEPS = combinedNetIncome / combinedShares;
  const accretionDilution = ((proFormaEPS / companyA_eps) - 1) * 100;

  // Multiples
  const companyB_evEbitda = (companyB_price * companyB_shares + companyB_netDebt) / companyB_ebitda;
  const companyB_pe = companyB_price / (companyB_netIncome / companyB_shares);
  const dealPremium = premium * 100;

  const maData = {
    offerPrice: Math.round(offerPrice * 100) / 100,
    targetEquityValue: Math.round(targetEquityValue * 100) / 100,
    totalDealValue: Math.round(totalDealValue * 100) / 100,
    cashComponent: Math.round(cashComponent * 100) / 100,
    stockComponent: Math.round(stockComponent * 100) / 100,
    newSharesIssued: Math.round(newSharesIssued * 100) / 100,
    combinedShares: Math.round(combinedShares * 100) / 100,
    combinedRevenue: Math.round(combinedRevenue * 100) / 100,
    combinedEbitda: Math.round(combinedEbitda * 100) / 100,
    combinedNetIncome: Math.round(combinedNetIncome * 100) / 100,
    proFormaEPS: Math.round(proFormaEPS * 100) / 100,
    accretionDilution: Math.round(accretionDilution * 100) / 100,
    synergies: costSynergies + revenueSynergies,
    costSynergies,
    revenueSynergies,
    integrationCosts,
    dealPremium,
    companyB_evEbitda: Math.round(companyB_evEbitda * 100) / 100,
    companyB_pe: Math.round(companyB_pe * 100) / 100,
    // Original Inputs
    targetPrice: companyB_price,
    targetShares: companyB_shares,
    targetRevenue: companyB_revenue,
    targetEbitda: companyB_ebitda,
    targetNetIncome: companyB_netIncome,
    targetNetDebt: companyB_netDebt,
    cashPct: cashPct * 100,
    debtFinancingRate: debtFinancingRate * 100,
  };

  try {
    await db.report.create({
      data: {
        title: `${companyA_name} & ${companyB_name} M&A`,
        analystId: session.user.id,
        companyA: companyA_name,
        companyB: companyB_name,
        dcfData: JSON.stringify(dcfData),
        maData: JSON.stringify(maData),
        status: 'PENDING'
      }
    });
    revalidatePath('/analyst');
    return { success: true };
  } catch (error) {
    return { error: 'Failed to submit report' };
  }
}

export async function processReport(reportId: string, status: 'APPROVED' | 'DECLINED', comments: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'BANKER') return { error: 'Unauthorized' }

  try {
    await db.report.update({
      where: { id: reportId },
      data: { status, comments }
    });
    revalidatePath('/banker');
    return { success: true };
  } catch {
    return { error: 'Failed' };
  }
}
