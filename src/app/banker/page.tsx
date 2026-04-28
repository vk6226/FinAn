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
  
  // Fetch chat messages for selected report
  const chatMessages = selectedReport 
    ? await getCollaborationMessages(selectedReport.id)
    : [];

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

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div>
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
                  <span className={`badge ${
                    selectedReport.status === 'PENDING' ? 'badge-pending' :
                    selectedReport.status === 'APPROVED' ? 'badge-approved' : 'badge-declined'
                  }`}>{selectedReport.status}</span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '28px' }}>
                  <div className="stat-card">
                    <div className="stat-label">Implied Share Price</div>
                    <div className="stat-value text-gradient-blue">₹{dcfData.impliedSharePrice?.toFixed(2)}</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Enterprise Value</div>
                    <div className="stat-value">₹{(dcfData.enterpriseValue / 1000)?.toFixed(1)}B</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Deal Value</div>
                    <div className="stat-value">₹{(maData.totalDealValue / 1000)?.toFixed(1)}B</div>
                  </div>
                  <div className="stat-card">
                    <div className="stat-label">Accretion/Dilution</div>
                    <div className="stat-value" style={{ color: (maData.accretionDilution || 0) > 0 ? 'var(--accent-success)' : 'var(--accent-danger)' }}>
                      {(maData.accretionDilution || 0) > 0 ? '+' : ''}{maData.accretionDilution?.toFixed(2)}%
                    </div>
                  </div>
                </div>

                {/* Detailed Data */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
                  <div>
                    <div className="section-title">DCF Valuation</div>
                    <div className="data-row"><span className="data-row-label">Equity Value</span><span className="data-row-value">₹{dcfData.equityValue?.toLocaleString()}M</span></div>
                    <div className="data-row"><span className="data-row-label">WACC</span><span className="data-row-value">{dcfData.wacc?.toFixed(1)}%</span></div>
                  </div>
                  <div>
                    <div className="section-title">M&amp;A Deal Analysis</div>
                    <div className="data-row"><span className="data-row-label">Offer Price / Share</span><span className="data-row-value">₹{maData.offerPrice?.toFixed(2)}</span></div>
                    <div className="data-row"><span className="data-row-label">Cost Synergies</span><span className="data-row-value">₹{maData.costSynergies?.toLocaleString()}M</span></div>
                  </div>
                </div>

                {/* Decision Form */}
                {selectedReport.status === 'PENDING' && (
                  <form action={async (formData) => {
                    'use server'
                    const actionType = formData.get('actionType') as string
                    await processReport(selectedReport.id, actionType as 'APPROVED'|'DECLINED', formData.get('comments') as string)
                  }} style={{ marginTop: '28px', borderTop: '1px solid var(--border-color)', paddingTop: '24px' }}>
                    <textarea name="comments" className="input-field" rows={3} placeholder="Add decision comments..." required></textarea>
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
                      <button type="submit" name="actionType" value="DECLINED" className="btn btn-danger">Decline</button>
                      <button type="submit" name="actionType" value="APPROVED" className="btn btn-success">Approve Model →</button>
                    </div>
                  </form>
                )}
              </div>
            )}
          </div>

          {/* ── Collaboration Sidebar (RIGHT) ── */}
          <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
            {selectedReport && session && (
              <CollaborationChat 
                reportId={selectedReport.id}
                userId={session.user.id}
                role={session.user.role}
                userName={session.user.name}
                initialMessages={chatMessages}
              />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
