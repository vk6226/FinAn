import Link from "next/link";
import db from "@/lib/db";
import { processReport } from "@/actions/reportActions";
import { logoutAction } from "@/actions/authActions";

export const dynamic = 'force-dynamic';

export default async function BankerDashboard({ searchParams }: { searchParams: { id?: string } }) {
  const queryParams = await searchParams;

  const reports = await db.report.findMany({
    include: { analyst: true },
    orderBy: { createdAt: 'desc' },
  });

  const selectedReport = queryParams?.id
    ? reports.find(r => r.id === queryParams.id)
    : reports[0];

  const dcfData = selectedReport ? JSON.parse(selectedReport.dcfData) : null;
  const maData = selectedReport ? JSON.parse(selectedReport.maData) : null;

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const approvedCount = reports.filter(r => r.status === 'APPROVED').length;

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2><span className="text-gradient-blue">FinAn</span></h2>
          <p>Investment Banking</p>
        </div>
        <nav className="sidebar-nav">
          <Link href="/banker" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
            Review Queue
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
          <h1 className="text-gradient">Review Queue</h1>
          <p>Approve or decline financial models and analysis reports.</p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-label">Total Reports</div>
            <div className="stat-value">{reports.length}</div>
            <div className="stat-meta">Submitted models</div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{pendingCount}</div>
            <div className="stat-meta">Awaiting decision</div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{approvedCount}</div>
            <div className="stat-meta">Cleared for execution</div>
          </div>
        </div>

        {/* ── Reports Table ── */}
        <div className="glass-panel animate-fade-in" style={{ padding: '0', overflow: 'hidden', animationDelay: '0.25s' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr>
                  <th>Report Title</th>
                  <th>Analyst</th>
                  <th>Submitted</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {reports.map((report) => (
                  <tr key={report.id} style={{
                    background: selectedReport?.id === report.id ? 'rgba(41, 151, 255, 0.04)' : 'transparent',
                    borderLeft: selectedReport?.id === report.id ? '2px solid var(--accent-primary)' : '2px solid transparent',
                  }}>
                    <td style={{ fontWeight: 500 }}>{report.title}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{report.analyst.name}</td>
                    <td style={{ color: 'var(--text-secondary)' }}>{new Date(report.createdAt).toLocaleDateString()}</td>
                    <td>
                      <span className={`badge ${
                        report.status === 'PENDING' ? 'badge-pending' :
                        report.status === 'APPROVED' ? 'badge-approved' : 'badge-declined'
                      }`}>{report.status}</span>
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <Link href={`/banker?id=${report.id}`} className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
                {reports.length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '48px', color: 'var(--text-muted)' }}>No reports submitted yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── Selected Report Detail ── */}
        {selectedReport && dcfData && maData && (
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', marginTop: '24px', animationDelay: '0.3s' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', paddingBottom: '20px', borderBottom: '1px solid var(--border-color)' }}>
              <div>
                <h3 style={{ fontSize: '1.3rem', marginBottom: '6px', fontWeight: 700, letterSpacing: '-0.03em' }}>{selectedReport.title}</h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
                  Generated by <strong style={{ color: 'var(--text-primary)' }}>{selectedReport.analyst.name}</strong> · {new Date(selectedReport.createdAt).toLocaleDateString()}
                </p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>

                <span className={`badge ${
                  selectedReport.status === 'PENDING' ? 'badge-pending' :
                  selectedReport.status === 'APPROVED' ? 'badge-approved' : 'badge-declined'
                }`}>{selectedReport.status}</span>
              </div>
            </div>

            {/* ── Key Metrics (Stat Cards) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
              <div className="stat-card">
                <div className="stat-label">Implied Share Price</div>
                <div className="stat-value text-gradient-blue">₹{dcfData.impliedSharePrice?.toFixed(2)}</div>
                <div className="stat-meta" style={{ color: (dcfData.upside || 0) > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {(dcfData.upside || 0) > 0 ? '▲' : '▼'} {dcfData.upside?.toFixed(1)}% upside
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Enterprise Value</div>
                <div className="stat-value">₹{(dcfData.enterpriseValue / 1000)?.toFixed(1)}B</div>
                <div className="stat-meta">DCF-derived</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Deal Value</div>
                <div className="stat-value">₹{(maData.totalDealValue / 1000)?.toFixed(1)}B</div>
                <div className="stat-meta">{maData.dealPremium?.toFixed(0)}% premium</div>
              </div>
              <div className="stat-card">
                <div className="stat-label">Accretion/Dilution</div>
                <div className="stat-value" style={{ color: (maData.accretionDilution || 0) > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                  {(maData.accretionDilution || 0) > 0 ? '+' : ''}{maData.accretionDilution?.toFixed(2)}%
                </div>
                <div className="stat-meta">{(maData.accretionDilution || 0) > 0 ? 'Accretive' : 'Dilutive'} to EPS</div>
              </div>
            </div>

            {/* ── Detailed Data (Two Columns) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
              {/* DCF Section */}
              <div>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-primary)', boxShadow: '0 0 8px rgba(41,151,255,0.4)' }} />
                  DCF Valuation
                </div>
                <div className="data-row">
                  <span className="data-row-label">PV of Projected FCFs</span>
                  <span className="data-row-value">₹{dcfData.pvOfFCFs?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Terminal Value</span>
                  <span className="data-row-value">₹{dcfData.terminalValue?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">PV of Terminal Value</span>
                  <span className="data-row-value">₹{dcfData.pvTerminal?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Equity Value</span>
                  <span className="data-row-value">₹{dcfData.equityValue?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">WACC</span>
                  <span className="data-row-value">{dcfData.wacc?.toFixed(1)}%</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Terminal Growth</span>
                  <span className="data-row-value">{dcfData.tgr?.toFixed(1)}%</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Revenue Growth</span>
                  <span className="data-row-value">{dcfData.revenueGrowth?.toFixed(1)}%</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">EBITDA Margin</span>
                  <span className="data-row-value">{dcfData.ebitdaMargin?.toFixed(1)}%</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Acquirer EPS</span>
                  <span className="data-row-value">₹{dcfData.companyA_eps?.toFixed(2)}</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Acquirer P/E</span>
                  <span className="data-row-value">{dcfData.companyA_pe?.toFixed(1)}x</span>
                </div>
              </div>

              {/* M&A Section */}
              <div>
                <div className="section-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-orange)', boxShadow: '0 0 8px rgba(255,159,10,0.4)' }} />
                  M&amp;A Deal Analysis
                </div>
                <div className="data-row">
                  <span className="data-row-label">Offer Price / Share</span>
                  <span className="data-row-value">₹{maData.offerPrice?.toFixed(2)}</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Target Equity Value</span>
                  <span className="data-row-value">₹{maData.targetEquityValue?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Cash Component</span>
                  <span className="data-row-value">₹{maData.cashComponent?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Stock Component</span>
                  <span className="data-row-value">₹{maData.stockComponent?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">New Shares Issued</span>
                  <span className="data-row-value">{maData.newSharesIssued?.toFixed(1)}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Combined Revenue</span>
                  <span className="data-row-value">₹{maData.combinedRevenue?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Combined EBITDA</span>
                  <span className="data-row-value">₹{maData.combinedEbitda?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Pro-Forma EPS</span>
                  <span className="data-row-value">₹{maData.proFormaEPS?.toFixed(2)}</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Cost Synergies</span>
                  <span className="data-row-value">₹{maData.costSynergies?.toLocaleString()}M</span>
                </div>
                <div className="data-row">
                  <span className="data-row-label">Target EV/EBITDA</span>
                  <span className="data-row-value">{maData.companyB_evEbitda?.toFixed(1)}x</span>
                </div>
              </div>
            </div>

            {/* ── Decision Form ── */}
            {selectedReport.status === 'PENDING' && (
              <form action={async (formData) => {
                'use server'
                const actionType = formData.get('actionType') as string
                const comments = formData.get('comments') as string
                await processReport(selectedReport.id, actionType as 'APPROVED'|'DECLINED', comments)
              }} style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Decision Comments</label>
                <textarea name="comments" className="input-field" rows={3} placeholder="Add your reasoning for approval or decline..." style={{ resize: 'none', width: '100%' }} required></textarea>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                  <button type="submit" name="actionType" value="DECLINED" className="btn btn-danger" style={{ padding: '10px 24px' }}>
                    Decline Report
                  </button>
                  <button type="submit" name="actionType" value="APPROVED" className="btn btn-success" style={{ padding: '10px 24px' }}>
                    Approve M&amp;A Model →
                  </button>
                </div>
              </form>
            )}

            {/* ── Final Comments ── */}
            {selectedReport.status !== 'PENDING' && selectedReport.comments && (
              <div style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                <label className="input-label" style={{ marginBottom: '8px', display: 'block' }}>Banker Final Comments</label>
                <div style={{
                  background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)',
                  padding: '16px 20px', borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-secondary)', fontSize: '14px', lineHeight: 1.6,
                }}>
                  {selectedReport.comments}
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
