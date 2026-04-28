'use client'

import { useState } from "react";
import { updateReport } from "@/actions/reportActions";

export default function ReportEditForm({ report }: { report: any }) {
  const [loading, setLoading] = useState(false);
  const dcf = JSON.parse(report.dcfData);
  const ma = JSON.parse(report.maData);

  async function handleUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await updateReport(report.id, formData);
    if (res.success) {
      alert("Report updated and resubmitted!");
      window.location.reload();
    } else {
      alert("Error: " + res.error);
    }
    setLoading(false);
  }

  return (
    <form onSubmit={handleUpdate} className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* ── COMPANY DATA COLUMNS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* Acquirer Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--accent-primary)', fontWeight: 700 }}>ACQUIRER: {report.companyA}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group"><label className="input-label">Share Price (₹)</label><input name="companyA_price" type="number" step="0.01" defaultValue={dcf.priceA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Shares Out. (M)</label><input name="companyA_shares" type="number" step="0.1" defaultValue={dcf.sharesA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Revenue (₹M)</label><input name="companyA_revenue" type="number" defaultValue={dcf.revA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">EBITDA (₹M)</label><input name="companyA_ebitda" type="number" defaultValue={dcf.ebitdaA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Net Income (₹M)</label><input name="companyA_netIncome" type="number" defaultValue={dcf.netIncomeA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Net Debt (₹M)</label><input name="companyA_netDebt" type="number" defaultValue={dcf.netDebtA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">CapEx (₹M)</label><input name="companyA_capex" type="number" defaultValue={dcf.capexA} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">D&A (₹M)</label><input name="companyA_da" type="number" defaultValue={dcf.daA} className="input-field" required /></div>
          </div>
          <div className="input-group" style={{ marginTop: '12px' }}><label className="input-label">Change in NWC (₹M)</label><input name="companyA_nwcChange" type="number" defaultValue={dcf.nwcA} className="input-field" required /></div>
          <input type="hidden" name="companyA_name" defaultValue={report.companyA} />
        </div>

        {/* Target Section */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '20px', color: 'var(--accent-orange)', fontWeight: 700 }}>TARGET: {report.companyB}</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group"><label className="input-label">Share Price (₹)</label><input name="companyB_price" type="number" step="0.01" defaultValue={ma.priceB} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Shares Out. (M)</label><input name="companyB_shares" type="number" defaultValue={ma.sharesB} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Revenue (₹M)</label><input name="companyB_revenue" type="number" defaultValue={ma.revB} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">EBITDA (₹M)</label><input name="companyB_ebitda" type="number" defaultValue={ma.ebitdaB} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Net Income (₹M)</label><input name="companyB_netIncome" type="number" defaultValue={ma.netIncomeB} className="input-field" required /></div>
            <div className="input-group" style={{ gridColumn: 'span 2' }}><label className="input-label">Net Debt (₹M)</label><input name="companyB_netDebt" type="number" defaultValue={ma.netDebtB} className="input-field" required /></div>
          </div>
          <input type="hidden" name="companyB_name" defaultValue={report.companyB} />
        </div>
      </div>

      {/* ── MODELING PARAMETERS ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* DCF Assumptions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '20px', fontWeight: 600 }}>DCF ASSUMPTIONS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group"><label className="input-label">WACC (%)</label><input name="wacc" type="number" step="0.1" defaultValue={dcf.wacc} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Terminal Growth (%)</label><input name="tgr" type="number" step="0.1" defaultValue={dcf.tgr} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Revenue Growth (%)</label><input name="revenueGrowth" type="number" step="0.1" defaultValue={dcf.revenueGrowth} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">EBITDA Margin (%)</label><input name="ebitdaMargin" type="number" step="0.1" defaultValue={dcf.ebitdaMargin} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Tax Rate (%)</label><input name="taxRate" type="number" step="0.1" defaultValue={dcf.taxRate} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Projection Years</label><input name="projectionYears" type="number" defaultValue={dcf.projectionYears} className="input-field" required /></div>
          </div>
        </div>

        {/* M&A Assumptions */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          <h4 style={{ fontSize: '14px', marginBottom: '20px', fontWeight: 600 }}>M&A DEAL TERMS</h4>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="input-group"><label className="input-label">Offer Premium (%)</label><input name="premium" type="number" step="0.1" defaultValue={ma.premium} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Cash Mix (%)</label><input name="cashPct" type="number" step="1" defaultValue={ma.cashPct} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Cost Synergies (₹M)</label><input name="costSynergies" type="number" defaultValue={ma.costSynergies} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Revenue Synergies (₹M)</label><input name="revenueSynergies" type="number" defaultValue={ma.revenueSynergies} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Integration Costs (₹M)</label><input name="integrationCosts" type="number" defaultValue={ma.integrationCosts} className="input-field" required /></div>
            <div className="input-group"><label className="input-label">Debt Financing Rate (%)</label><input name="debtFinancingRate" type="number" step="0.1" defaultValue={ma.debtRate} className="input-field" required /></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '20px 0' }}>
          <button type="submit" className="btn btn-accent" style={{ padding: '14px 40px', fontSize: '15px' }} disabled={loading}>
            {loading ? 'Processing Model...' : 'Update & Re-Submit Model for Review →'}
          </button>
      </div>
    </form>
  );
}
