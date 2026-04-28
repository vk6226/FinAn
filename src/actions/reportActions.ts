'use server'

import db from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getSession } from '@/lib/auth'

/**
 * SHARED COMPREHENSIVE CALCULATION ENGINE
 */
function calculateFullModelData(formData: FormData) {
  const num = (key: string) => parseFloat(formData.get(key) as string) || 0;
  const str = (key: string) => (formData.get(key) as string) || '';

  // 1. Company A Inputs
  const companyA_name     = str('companyA_name');
  const companyA_price    = num('companyA_price');
  const companyA_shares   = num('companyA_shares');
  const companyA_revenue  = num('companyA_revenue');
  const companyA_ebitda   = num('companyA_ebitda');
  const companyA_netIncome = num('companyA_netIncome');
  const companyA_netDebt  = num('companyA_netDebt');
  const companyA_capex    = num('companyA_capex');
  const companyA_da       = num('companyA_da');
  const companyA_nwc      = num('companyA_nwcChange');

  // 2. Company B Inputs
  const companyB_name     = str('companyB_name');
  const companyB_price    = num('companyB_price');
  const companyB_shares   = num('companyB_shares');
  const companyB_revenue  = num('companyB_revenue');
  const companyB_ebitda   = num('companyB_ebitda');
  const companyB_netIncome = num('companyB_netIncome');
  const companyB_netDebt  = num('companyB_netDebt');

  // 3. DCF Parameters
  const wacc            = num('wacc') / 100;
  const tgr             = num('tgr') / 100;
  const projYears       = num('projectionYears') || 5;
  const revGrowth       = num('revenueGrowth') / 100;
  const ebitdaMargin    = num('ebitdaMargin') / 100;
  const taxRate         = num('taxRate') / 100;

  // 4. M&A Parameters
  const premium         = num('premium') / 100;
  const cashPct         = num('cashPct') / 100;
  const costSyn         = num('costSynergies');
  const revSyn          = num('revenueSynergies');
  const intCosts        = num('integrationCosts');
  const debtRate        = num('debtFinancingRate') / 100;

  // --- DCF MATH ---
  const projectedFCFs: number[] = [];
  let runnerRev = companyA_revenue;
  for (let y = 1; y <= projYears; y++) {
    runnerRev *= (1 + revGrowth);
    const ebitda = runnerRev * ebitdaMargin;
    const fcf = (ebitda * (1 - taxRate)) + (runnerRev * (companyA_da / companyA_revenue)) - (runnerRev * (companyA_capex / companyA_revenue));
    projectedFCFs.push(fcf);
  }
  const pvOfFCFs = projectedFCFs.reduce((acc, fcf, i) => acc + fcf / Math.pow(1 + wacc, i + 1), 0);
  const terminalVal = (projectedFCFs[projYears - 1] * (1 + tgr)) / (wacc - tgr);
  const pvTerminal = terminalVal / Math.pow(1 + wacc, projYears);
  const enterpriseVal = pvOfFCFs + pvTerminal;
  const equityVal = enterpriseVal - companyA_netDebt;
  const impliedPrice = equityVal / companyA_shares;

  // --- M&A MATH ---
  const offerPrice = companyB_price * (1 + premium);
  const targetEqVal = offerPrice * companyB_shares;
  const totalDealVal = targetEqVal + companyB_netDebt;
  const cashComp = totalDealVal * cashPct;
  const sharesIssued = (totalDealVal * (1 - cashPct)) / companyA_price;
  const combinedNetInc = companyA_netIncome + companyB_netIncome + costSyn + revSyn - intCosts - (cashComp * debtRate);
  const companyA_eps = companyA_netIncome / companyA_shares;
  const proFormaEPS = combinedNetInc / (companyA_shares + sharesIssued);

  const dcfData = {
    pvOfFCFs, terminalValue: terminalVal, pvTerminal, enterpriseValue: enterpriseVal, equityValue: equityVal, impliedSharePrice: impliedPrice,
    upside: ((impliedPrice / companyA_price) - 1) * 100,
    // Store Inputs
    wacc: wacc * 100, tgr: tgr * 100, projectionYears: projYears, revenueGrowth: revGrowth * 100, ebitdaMargin: ebitdaMargin * 100, taxRate: taxRate * 100,
    companyA_eps, companyA_pe: companyA_price / companyA_eps,
    priceA: companyA_price, sharesA: companyA_shares, revA: companyA_revenue, ebitdaA: companyA_ebitda, netIncomeA: companyA_netIncome, netDebtA: companyA_netDebt, capexA: companyA_capex, daA: companyA_da, nwcA: companyA_nwc
  };

  const maData = {
    offerPrice, targetEquityValue: targetEqVal, totalDealValue: totalDealVal, cashComponent: cashComp, stockComponent: totalDealVal * (1 - cashPct),
    newSharesIssued: sharesIssued, proFormaEPS, accretionDilution: ((proFormaEPS / companyA_eps) - 1) * 100,
    combinedRevenue: companyA_revenue + companyB_revenue + revSyn, combinedEbitda: companyA_ebitda + companyB_ebitda + costSyn + revSyn,
    // Store Inputs
    priceB: companyB_price, sharesB: companyB_shares, revB: companyB_revenue, ebitdaB: companyB_ebitda, netIncomeB: companyB_netIncome, netDebtB: companyB_netDebt,
    premium: premium * 100, cashPct: cashPct * 100, costSynergies: costSyn, revenueSynergies: revSyn, integrationCosts: intCosts, debtRate: debtRate * 100
  };

  return { title: `${companyA_name} & ${companyB_name} M&A`, companyA: companyA_name, companyB: companyB_name, dcfData, maData };
}

export async function submitReport(formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'ANALYST') return { error: 'Unauthorized' };
  const data = calculateFullModelData(formData);
  try {
    await db.report.create({ data: { ...data, analystId: session.user.id, dcfData: JSON.stringify(data.dcfData), maData: JSON.stringify(data.maData) } });
    revalidatePath('/analyst'); revalidatePath('/analyst/history'); return { success: true };
  } catch { return { error: 'Submit failed' }; }
}

export async function updateReport(reportId: string, formData: FormData) {
  const session = await getSession();
  if (!session || session.user.role !== 'ANALYST') return { error: 'Unauthorized' };
  const existing = await db.report.findUnique({ where: { id: reportId } });
  if (!existing || existing.analystId !== session.user.id || existing.status !== 'PENDING') return { error: 'Denied' };
  const data = calculateFullModelData(formData);
  try {
    await db.report.update({ where: { id: reportId }, data: { ...data, dcfData: JSON.stringify(data.dcfData), maData: JSON.stringify(data.maData) } });
    revalidatePath('/analyst/history'); return { success: true };
  } catch { return { error: 'Update failed' }; }
}

export async function processReport(reportId: string, status: 'APPROVED' | 'DECLINED', comments: string) {
  const session = await getSession();
  if (!session || session.user.role !== 'BANKER') return { error: 'Unauthorized' };
  try {
    await db.report.update({ where: { id: reportId }, data: { status, comments } });
    revalidatePath('/banker'); revalidatePath('/analyst/history'); return { success: true };
  } catch { return { error: 'Action failed' }; }
}
