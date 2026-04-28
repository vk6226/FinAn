import Link from "next/link";
import db from "@/lib/db";
import { processReport } from "@/actions/reportActions";
import { logoutAction } from "@/actions/authActions";
import { getSession } from "@/lib/auth";
import CollaborationChat from "@/components/CollaborationChat";
import { getCollaborationMessages } from "@/actions/collaborationActions";

export const dynamic = 'force-dynamic';

export default async function BankerDashboard({ searchParams }: { searchParams: { id?: string } }) {
  const queryParams = await searchParams;
  const session = await getSession();

  const reports = await db.report.findMany({
    include: { analyst: true },
    orderBy: { createdAt: 'desc' },
  });

  const selectedReport = queryParams?.id
    ? reports.find(r => r.id === queryParams.id)
    : reports[0];

  const dcfData = selectedReport ? JSON.parse(selectedReport.dcfData) : null;
  const maData = selectedReport ? JSON.parse(selectedReport.maData) : null;
  
  const chatMessages = selectedReport 
    ? await getCollaborationMessages(selectedReport.id)
    : [];

  const pendingCount = reports.filter(r => r.status === 'PENDING').length;
  const approvedCount = reports.filter(r => r.status === 'APPROVED').length;

  return (
    <div className="dashboard-layout">
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
          <form action={logoutAction}><button className="btn btn-secondary" style={{ width: '100%' }}>Sign Out</button></form>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header animate-fade-in">
          <h1 className="text-gradient">Analyst Review Queue</h1>
          <p>High-fidelity financial model verification and approval portal.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Reports</div>
            <div className="stat-value">{reports.length}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Pending Review</div>
            <div className="stat-value" style={{ color: 'var(--accent-warning)' }}>{pendingCount}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Approved</div>
            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{approvedCount}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* Table */}
            <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr><th>Report Title</th><th>Analyst</th><th>Date</th><th>Status</th><th style={{ textAlign: 'right' }}>Action</th></tr>
                  </thead>
                  <tbody>
                    {reports.map((r) => (
                      <tr key={r.id} style={{ background: selectedReport?.id === r.id ? 'rgba(41, 151, 255, 0.04)' : 'transparent' }}>
                        <td>{r.title}</td>
                        <td>{r.analyst.name}</td>
                        <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                        <td><span className={`badge badge-${r.status.toLowerCase()}`}>{r.status}</span></td>
                        <td style={{ textAlign: 'right' }}><Link href={`/banker?id=${r.id}`} className="btn btn-secondary" style={{ padding: '4px 12px' }}>View</Link></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed View */}
            {selectedReport && dcfData && maData && (
              <div className="glass-panel animate-fade-in" style={{ padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '20px' }}>
                  <div>
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>{selectedReport.title}</h2>
                    <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Analyst: {selectedReport.analyst.name}</p>
                  </div>
                  <span className={`badge badge-${selectedReport.status.toLowerCase()}`} style={{ height: 'fit-content' }}>{selectedReport.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '32px' }}>
                   <div className="stat-card"><div className="stat-label">Implied Price</div><div className="stat-value text-gradient">₹{dcfData.impliedSharePrice?.toFixed(2)}</div></div>
                   <div className="stat-card"><div className="stat-label">M&A Accretion</div><div className="stat-value" style={{ color: maData.accretionDilution > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{maData.accretionDilution?.toFixed(2)}%</div></div>
                   <div className="stat-card"><div className="stat-label">Equity Value</div><div className="stat-value">₹{(dcfData.equityValue / 1000).toFixed(1)}B</div></div>
                   <div className="stat-card"><div className="stat-label">Premium Paid</div><div className="stat-value">{maData.dealPremium?.toFixed(0)}%</div></div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '40px' }}>
                  {/* DCF Detail */}
                  <div>
                    <h4 className="section-title">DCF MODEL OUTPUTS</h4>
                    <div className="data-row"><span>PV of FCFs</span><strong>₹{dcfData.pvOfFCFs?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>PV of Terminal Value</span><strong>₹{dcfData.pvTerminal?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>Enterprise Value</span><strong>₹{dcfData.enterpriseValue?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>Implied Share Price</span><strong>₹{dcfData.impliedSharePrice?.toFixed(2)}</strong></div>
                    <div className="data-row"><span>Analyst Upside</span><strong style={{ color: dcfData.upside > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>{dcfData.upside?.toFixed(1)}%</strong></div>
                    
                    <h4 className="section-title" style={{ marginTop: '24px' }}>DCF ASSUMPTIONS</h4>
                    <div className="data-row"><span>WACC</span><strong>{dcfData.wacc}%</strong></div>
                    <div className="data-row"><span>Terminal Growth</span><strong>{dcfData.tgr}%</strong></div>
                    <div className="data-row"><span>Revenue Growth</span><strong>{dcfData.revenueGrowth}%</strong></div>
                    <div className="data-row"><span>EBITDA Margin</span><strong>{dcfData.ebitdaMargin}%</strong></div>
                    <div className="data-row"><span>Tax Rate</span><strong>{dcfData.taxRate}%</strong></div>
                  </div>

                  {/* M&A Detail */}
                  <div>
                    <h4 className="section-title">M&A DEAL STRUCTURE</h4>
                    <div className="data-row"><span>Offer Price / Share</span><strong>₹{maData.offerPrice?.toFixed(2)}</strong></div>
                    <div className="data-row"><span>Target Equity Value</span><strong>₹{maData.targetEquityValue?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>Cash Component</span><strong>₹{maData.cashComponent?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>Stock Component</span><strong>₹{maData.stockComponent?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>New Shares Issued</span><strong>{maData.newSharesIssued?.toFixed(1)}M</strong></div>
                    
                    <h4 className="section-title" style={{ marginTop: '24px' }}>PRO-FORMA COMBINED</h4>
                    <div className="data-row"><span>Pro-Forma EPS</span><strong>₹{maData.proFormaEPS?.toFixed(2)}</strong></div>
                    <div className="data-row"><span>Cost Synergies</span><strong>₹{maData.costSynergies?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>Rev Synergies</span><strong>₹{maData.revenueSynergies?.toLocaleString()}M</strong></div>
                    <div className="data-row"><span>Interest Rate (Debt)</span><strong>{maData.debtRate}%</strong></div>
                    <div className="data-row"><span>Combined Revenue</span><strong>₹{maData.combinedRevenue?.toLocaleString()}M</strong></div>
                  </div>
                </div>

                <div style={{ marginTop: '32px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                  <h4 className="section-title">MODEL INPUTS (RAW DATA)</h4>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', fontSize: '13px' }}>
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-primary)' }}>{selectedReport.companyA} (Acquirer)</p>
                      <div className="data-row"><span>Price</span><span>₹{dcfData.priceA}</span></div>
                      <div className="data-row"><span>Shares</span><span>{dcfData.sharesA}M</span></div>
                      <div className="data-row"><span>Revenue</span><span>₹{dcfData.revA}M</span></div>
                      <div className="data-row"><span>Net Debt</span><span>₹{dcfData.netDebtA}M</span></div>
                      <div className="data-row"><span>CapEx</span><span>₹{dcfData.capexA}M</span></div>
                    </div>
                    <div className="glass-panel" style={{ padding: '16px' }}>
                      <p style={{ fontWeight: 600, marginBottom: '8px', color: 'var(--accent-orange)' }}>{selectedReport.companyB} (Target)</p>
                      <div className="data-row"><span>Price</span><span>₹{maData.priceB}</span></div>
                      <div className="data-row"><span>Shares</span><span>{maData.sharesB}M</span></div>
                      <div className="data-row"><span>Revenue</span><span>₹{maData.revB}M</span></div>
                      <div className="data-row"><span>Net Debt</span><span>₹{maData.netDebtB}M</span></div>
                      <div className="data-row"><span>Net Income</span><span>₹{maData.netIncomeB}M</span></div>
                    </div>
                  </div>
                </div>

                {selectedReport.status === 'PENDING' && (
                  <form action={async (f) => { 'use server'; await processReport(selectedReport.id, f.get('a') as any, f.get('c') as string); }} style={{ marginTop: '32px' }}>
                    <label className="input-label">Banker Review Comments</label>
                    <textarea name="c" className="input-field" rows={3} placeholder="Add feedback for the analyst..."></textarea>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                      <button name="a" value="DECLINED" className="btn btn-danger">Decline Request</button>
                      <button name="a" value="APPROVED" className="btn btn-success">Final Approval →</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          <aside style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
            {selectedReport && session && (
              <CollaborationChat 
                reportId={selectedReport.id} userId={session.user.id} 
                role={session.user.role} userName={session.user.name} 
                initialMessages={chatMessages} 
              />
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}
