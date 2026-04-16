/**
 * Generates a professional executive summary paragraph based on
 * the calculated DCF and M&A results.
 */
export function generateExecutiveSummary(
  dcfData: any,
  maData: any,
  report: { companyA: string; companyB: string }
): string {
  const isAccretive = (maData.accretionDilution || 0) > 0;
  const isUndervalued = (dcfData.upside || 0) > 0;

  const dcfParagraph = `Based on our discounted cash flow analysis using a ${dcfData.wacc?.toFixed(1)}% weighted average cost of capital (WACC) and a ${dcfData.tgr?.toFixed(1)}% terminal growth rate over a ${dcfData.projectionYears}-year projection period, ${report.companyA} has an implied enterprise value of $${(dcfData.enterpriseValue / 1000)?.toFixed(1)}B and an equity value of $${(dcfData.equityValue / 1000)?.toFixed(1)}B. This translates to an implied share price of $${dcfData.impliedSharePrice?.toFixed(2)}, representing a ${Math.abs(dcfData.upside || 0)?.toFixed(1)}% ${isUndervalued ? 'upside' : 'downside'} relative to the current trading price. The model projects revenue growth of ${dcfData.revenueGrowth?.toFixed(1)}% annually with a ${dcfData.ebitdaMargin?.toFixed(1)}% EBITDA margin and a ${dcfData.taxRate?.toFixed(1)}% effective tax rate.`;

  const maParagraph = `The proposed acquisition of ${report.companyB} at a ${maData.dealPremium?.toFixed(0)}% premium to the current share price implies an offer price of $${maData.offerPrice?.toFixed(2)} per share and a total deal value of $${(maData.totalDealValue / 1000)?.toFixed(1)}B (including assumed debt). The transaction would be financed with $${maData.cashComponent?.toLocaleString()}M in cash and $${maData.stockComponent?.toLocaleString()}M in stock, requiring the issuance of ${maData.newSharesIssued?.toFixed(1)}M new shares. After accounting for $${maData.costSynergies?.toLocaleString()}M in cost synergies, $${maData.revenueSynergies?.toLocaleString()}M in revenue synergies, and $${maData.integrationCosts?.toLocaleString()}M in one-time integration costs, the combined entity would generate pro-forma net income of $${maData.combinedNetIncome?.toLocaleString()}M, yielding a pro-forma EPS of $${maData.proFormaEPS?.toFixed(2)}.`;

  const verdictStr = isAccretive
    ? `This represents a ${maData.accretionDilution?.toFixed(1)}% accretion to standalone EPS, indicating that the transaction would be value-enhancing for ${report.companyA} shareholders.`
    : `This represents a ${Math.abs(maData.accretionDilution || 0)?.toFixed(1)}% dilution to standalone EPS. While synergies partially offset the dilutive impact, the transaction requires careful evaluation of long-term strategic benefits.`;

  const recommendation = isAccretive && isUndervalued
    ? `RECOMMENDATION: Based on the combined DCF upside and accretive nature of the transaction, we recommend proceeding with the acquisition of ${report.companyB}. The strategic rationale, combined synergy potential, and favorable valuation metrics support this transaction.`
    : isAccretive
      ? `RECOMMENDATION: While the transaction is accretive to EPS, the DCF analysis suggests limited upside in the acquirer's standalone valuation. We recommend proceeding with caution and negotiating a lower premium if possible.`
      : `RECOMMENDATION: The transaction appears dilutive to EPS in the near term. We advise the Investment Banking team to either renegotiate deal terms, increase synergy targets, or consider alternative strategic options before proceeding.`;

  return `${dcfParagraph}\n\n${maParagraph}\n\n${verdictStr}\n\n${recommendation}`;
}
