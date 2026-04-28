'use client'

import Link from "next/link";
import { useState } from "react";
import { submitReport } from "@/actions/reportActions";
import { logoutAction } from "@/actions/authActions";
import jsPDF from "jspdf";

export default function AnalystDashboard() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const res = await submitReport(formData) as any;
    if (res?.success) {
      setSubmitted(true);
      setTimeout(() => setSubmitted(false), 5000);
      (e.target as HTMLFormElement).reset();
    } else {
      alert("Error: " + res?.error);
    }
    setLoading(false);
  }

  const generateDynamicPdf = () => {
    const form = document.getElementById('analyst-form') as HTMLFormElement;
    if (!form) return;
    const fd = new FormData(form);
    const g = (k: string) => fd.get(k) as string || '—';

    const companyA = g('companyA_name');
    const companyB = g('companyB_name');
    const doc = new jsPDF();

    if (!companyA || companyA === '—' || !companyB || companyB === '—') {
      doc.setFontSize(14);
      doc.text("Please fill out all fields before generating the PDF.", 20, 30);
      doc.save("analysis_report.pdf");
      return;
    }

    // ── Header Bar ──
    doc.setFillColor(10, 10, 10);
    doc.rect(0, 0, 210, 32, 'F');
    doc.setFontSize(20); doc.setTextColor(255, 255, 255);
    doc.text("FinAn", 15, 20);
    doc.setFontSize(8); doc.setTextColor(134, 134, 139);
    doc.text("CONFIDENTIAL — FINANCIAL MODEL EXPORT", 50, 20);
    doc.text(`Date: ${new Date().toLocaleDateString()}`, 170, 20);

    let y = 42;
    doc.setTextColor(30, 30, 30);

    // ── Title ──
    doc.setFontSize(16);
    doc.text(`M&A Analysis: ${companyA} + ${companyB}`, 15, y); y += 4;
    doc.setDrawColor(200, 200, 200); doc.line(15, y, 195, y); y += 10;

    // ── Section: Company A ──
    doc.setFontSize(11); doc.setTextColor(41, 151, 255);
    doc.text(`ACQUIRER — ${companyA.toUpperCase()}`, 15, y); y += 8;
    doc.setTextColor(60, 60, 60); doc.setFontSize(9);
    const aFields = [
      ['Share Price', `$${g('companyA_price')}`], ['Shares Outstanding', `${g('companyA_shares')}M`],
      ['Revenue', `$${g('companyA_revenue')}M`], ['EBITDA', `$${g('companyA_ebitda')}M`],
      ['Net Income', `$${g('companyA_netIncome')}M`], ['Net Debt', `$${g('companyA_netDebt')}M`],
      ['CapEx', `$${g('companyA_capex')}M`], ['D&A', `$${g('companyA_da')}M`],
    ];
    aFields.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, y); doc.text(value, 80, y); y += 6;
    });
    y += 4;

    // ── Section: Company B ──
    doc.setFontSize(11); doc.setTextColor(255, 159, 10);
    doc.text(`TARGET — ${companyB.toUpperCase()}`, 15, y); y += 8;
    doc.setTextColor(60, 60, 60); doc.setFontSize(9);
    const bFields = [
      ['Share Price', `$${g('companyB_price')}`], ['Shares Outstanding', `${g('companyB_shares')}M`],
      ['Revenue', `$${g('companyB_revenue')}M`], ['EBITDA', `$${g('companyB_ebitda')}M`],
      ['Net Income', `$${g('companyB_netIncome')}M`], ['Net Debt', `$${g('companyB_netDebt')}M`],
    ];
    bFields.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, y); doc.text(value, 80, y); y += 6;
    });
    y += 4;

    // ── Section: DCF Parameters ──
    doc.setDrawColor(200, 200, 200); doc.line(15, y, 195, y); y += 8;
    doc.setFontSize(11); doc.setTextColor(100, 100, 100);
    doc.text("DCF MODEL PARAMETERS", 15, y); y += 8;
    doc.setTextColor(60, 60, 60); doc.setFontSize(9);
    const dcfFields = [
      ['WACC', `${g('wacc')}%`], ['Terminal Growth Rate', `${g('tgr')}%`],
      ['Revenue Growth Rate', `${g('revenueGrowth')}%`], ['EBITDA Margin', `${g('ebitdaMargin')}%`],
      ['Tax Rate', `${g('taxRate')}%`], ['Projection Period', `${g('projectionYears')} years`],
    ];
    dcfFields.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, y); doc.text(value, 80, y); y += 6;
    });
    y += 4;

    // ── Section: M&A Deal Terms ──
    doc.setDrawColor(200, 200, 200); doc.line(15, y, 195, y); y += 8;
    doc.setFontSize(11); doc.setTextColor(100, 100, 100);
    doc.text("M&A DEAL TERMS", 15, y); y += 8;
    doc.setTextColor(60, 60, 60); doc.setFontSize(9);
    const maFields = [
      ['Offer Premium', `${g('premium')}%`], ['Cash Component', `${g('cashPct')}%`],
      ['Cost Synergies', `$${g('costSynergies')}M`], ['Revenue Synergies', `$${g('revenueSynergies')}M`],
      ['Integration Costs', `$${g('integrationCosts')}M`], ['Debt Financing Rate', `${g('debtFinancingRate')}%`],
    ];
    maFields.forEach(([label, value]) => {
      doc.text(`${label}:`, 20, y); doc.text(value, 80, y); y += 6;
    });

    // ── Footer ──
    doc.setFillColor(245, 245, 247);
    doc.rect(0, 275, 210, 22, 'F');
    doc.setFontSize(7); doc.setTextColor(134, 134, 139);
    doc.text("CONFIDENTIAL — Generated by FinAn Enterprise Platform", 15, 283);
    doc.text("For internal use only. Not for distribution.", 15, 288);

    doc.save(`${companyA}_${companyB}_Analysis.pdf`);
  }

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2><span className="text-gradient-blue">FinAn</span></h2>
          <p>Analyst Workspace</p>
        </div>
        <nav className="sidebar-nav">
          <Link href="/analyst" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            New Analysis
          </Link>
          <Link href="/analyst/chat" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
            AI Financial Assistant
          </Link>
        </nav>
        <div className="sidebar-footer">
          <form action={logoutAction}>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }}>Sign Out</button>
          </form>
        </div>
      </aside>

      {/* ── Main Content ── */}
      <main className="main-content">
        <div className="page-header animate-fade-in">
          <h1 className="text-gradient">Financial Modeling</h1>
          <p>Build comprehensive M&amp;A and DCF valuation models for strategic mergers and acquisitions.</p>
        </div>

        {/* ── Success Toast ── */}
        {submitted && (
          <div className="animate-fade-in" style={{
            background: 'rgba(48, 209, 88, 0.08)', border: '1px solid rgba(48, 209, 88, 0.2)',
            color: 'var(--accent-success)', padding: '14px 20px', borderRadius: 'var(--radius-sm)',
            marginBottom: '24px', fontSize: '14px', fontWeight: 500,
          }}>
            ✓ Report submitted successfully and is now in the Banker review queue.
          </div>
        )}

        <form id="analyst-form" onSubmit={handleSubmit}>

          {/* ═══════════════════════════════════════════
              SECTION 1: Company Financials (Side-by-Side)
              ═══════════════════════════════════════════ */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

            {/* ── Company A (Acquirer) ── */}
            <div className="glass-panel animate-fade-in" style={{ padding: '28px', animationDelay: '0.1s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 12px rgba(41,151,255,0.4)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em' }}>Company A · Acquirer</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Company Name</label>
                <input name="companyA_name" type="text" className="input-field" placeholder="e.g. AlphaTech Industries" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Share Price ($)</label>
                  <input name="companyA_price" type="number" step="0.01" className="input-field" placeholder="150.00" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Shares Out. (M)</label>
                  <input name="companyA_shares" type="number" step="0.1" className="input-field" placeholder="2000" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Revenue ($M)</label>
                  <input name="companyA_revenue" type="number" step="0.1" className="input-field" placeholder="45000" required />
                </div>
                <div className="input-group">
                  <label className="input-label">EBITDA ($M)</label>
                  <input name="companyA_ebitda" type="number" step="0.1" className="input-field" placeholder="12000" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Net Income ($M)</label>
                  <input name="companyA_netIncome" type="number" step="0.1" className="input-field" placeholder="8500" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Net Debt ($M)</label>
                  <input name="companyA_netDebt" type="number" step="0.1" className="input-field" placeholder="5000" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">CapEx ($M)</label>
                  <input name="companyA_capex" type="number" step="0.1" className="input-field" placeholder="3000" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">D&amp;A ($M)</label>
                  <input name="companyA_da" type="number" step="0.1" className="input-field" placeholder="2000" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">ΔNWC ($M)</label>
                  <input name="companyA_nwcChange" type="number" step="0.1" className="input-field" placeholder="500" required />
                </div>
              </div>
            </div>

            {/* ── Company B (Target) ── */}
            <div className="glass-panel animate-fade-in" style={{ padding: '28px', animationDelay: '0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-orange)', boxShadow: '0 0 12px rgba(255,159,10,0.4)' }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em' }}>Company B · Target</h3>
              </div>

              <div className="input-group">
                <label className="input-label">Company Name</label>
                <input name="companyB_name" type="text" className="input-field" placeholder="e.g. Beta Innovations" required />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Share Price ($)</label>
                  <input name="companyB_price" type="number" step="0.01" className="input-field" placeholder="40.00" required />
                </div>
                <div className="input-group">
                  <label className="input-label">Shares Out. (M)</label>
                  <input name="companyB_shares" type="number" step="0.1" className="input-field" placeholder="150" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Revenue ($M)</label>
                  <input name="companyB_revenue" type="number" step="0.1" className="input-field" placeholder="3200" required />
                </div>
                <div className="input-group">
                  <label className="input-label">EBITDA ($M)</label>
                  <input name="companyB_ebitda" type="number" step="0.1" className="input-field" placeholder="800" required />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="input-group">
                  <label className="input-label">Net Income ($M)</label>
                  <input name="companyB_netIncome" type="number" step="0.1" className="input-field" placeholder="400" required />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label className="input-label">Net Debt ($M)</label>
                  <input name="companyB_netDebt" type="number" step="0.1" className="input-field" placeholder="1200" required />
                </div>
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              SECTION 2: DCF Model Parameters
              ═══════════════════════════════════════════ */}
          <div className="glass-panel animate-fade-in" style={{ padding: '28px', marginTop: '20px', animationDelay: '0.2s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-success)', boxShadow: '0 0 12px rgba(48,209,88,0.4)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em' }}>DCF Valuation Parameters</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">WACC (%)</label>
                <input name="wacc" type="number" step="0.1" className="input-field" placeholder="8.5" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">TGR (%)</label>
                <input name="tgr" type="number" step="0.1" className="input-field" placeholder="2.5" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Rev. Growth (%)</label>
                <input name="revenueGrowth" type="number" step="0.1" className="input-field" placeholder="5.0" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">EBITDA Margin (%)</label>
                <input name="ebitdaMargin" type="number" step="0.1" className="input-field" placeholder="26.0" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Tax Rate (%)</label>
                <input name="taxRate" type="number" step="0.1" className="input-field" placeholder="25.0" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Proj. Years</label>
                <input name="projectionYears" type="number" step="1" min="1" max="10" className="input-field" placeholder="5" required />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              SECTION 3: M&A Deal Terms
              ═══════════════════════════════════════════ */}
          <div className="glass-panel animate-fade-in" style={{ padding: '28px', marginTop: '20px', animationDelay: '0.25s' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-purple)', boxShadow: '0 0 12px rgba(191,90,242,0.4)' }} />
              <h3 style={{ fontSize: '15px', fontWeight: 600, letterSpacing: '-0.02em' }}>M&amp;A Deal Structure</h3>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: '12px' }}>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Offer Premium (%)</label>
                <input name="premium" type="number" step="0.1" className="input-field" placeholder="25.0" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Cash Mix (%)</label>
                <input name="cashPct" type="number" step="1" min="0" max="100" className="input-field" placeholder="40" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Cost Synergy ($M)</label>
                <input name="costSynergies" type="number" step="0.1" className="input-field" placeholder="300" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Rev. Synergy ($M)</label>
                <input name="revenueSynergies" type="number" step="0.1" className="input-field" placeholder="150" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Integ. Costs ($M)</label>
                <input name="integrationCosts" type="number" step="0.1" className="input-field" placeholder="200" required />
              </div>
              <div className="input-group" style={{ marginBottom: 0 }}>
                <label className="input-label">Debt Rate (%)</label>
                <input name="debtFinancingRate" type="number" step="0.1" className="input-field" placeholder="4.5" required />
              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              ACTION BUTTONS
              ═══════════════════════════════════════════ */}
          <div className="animate-fade-in" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', animationDelay: '0.3s' }}>
            <button type="button" onClick={generateDynamicPdf} className="btn btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
              Export PDF
            </button>
            <button type="submit" className="btn btn-accent" style={{ paddingLeft: '32px', paddingRight: '32px' }} disabled={loading}>
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{
                    width: '14px', height: '14px', border: '2px solid rgba(255,255,255,0.3)',
                    borderTopColor: '#fff', borderRadius: '50%',
                    animation: 'spin 0.6s linear infinite', display: 'inline-block',
                  }} />
                  Processing Model...
                </span>
              ) : 'Run Analysis & Submit to Banker →'}
            </button>
          </div>
        </form>

        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </main>
    </div>
  );
}
