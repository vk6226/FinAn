import Link from "next/link";
import db from "@/lib/db";
import { getSession } from "@/lib/auth";
import { logoutAction } from "@/actions/authActions";
import CollaborationChat from "@/components/CollaborationChat";
import ReportEditForm from "@/components/ReportEditForm";
import { getCollaborationMessages } from "@/actions/collaborationActions";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AnalystHistoryPage({ searchParams }: { searchParams: { id?: string } }) {
  const queryParams = await searchParams;
  const session = await getSession();
  
  if (!session || session.user.role !== 'ANALYST') {
    redirect('/');
  }

  const reports = await db.report.findMany({
    where: { analystId: session.user.id },
    orderBy: { createdAt: 'desc' },
  });

  const selectedReport = queryParams?.id
    ? reports.find(r => r.id === queryParams.id)
    : reports[0];

  const chatMessages = selectedReport 
    ? await getCollaborationMessages(selectedReport.id)
    : [];

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2><span className="text-gradient-blue">FinAn</span></h2>
          <p>Analyst Workspace</p>
        </div>
        <nav className="sidebar-nav">
          <Link href="/analyst" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
            New Analysis
          </Link>
          <Link href="/analyst/history" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
            My Reports
          </Link>
          <Link href="/analyst/chat" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>
            Intelligent Analysis Engine
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
          <h1 className="text-gradient">My Reports</h1>
          <p>Track your submissions. You can edit models while they are still <strong>PENDING</strong>.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px' }}>
          <div>
            <div className="glass-panel animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
              <div className="table-container" style={{ border: 'none' }}>
                <table>
                  <thead>
                    <tr>
                      <th>Report Title</th>
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
                        <td style={{ fontWeight: 600 }}>{report.title}</td>
                        <td style={{ color: 'var(--text-secondary)' }}>{new Date(report.createdAt).toLocaleDateString()}</td>
                        <td>
                          <span className={`badge ${
                            report.status === 'PENDING' ? 'badge-pending' :
                            report.status === 'APPROVED' ? 'badge-approved' : 'badge-declined'
                          }`}>{report.status}</span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <Link href={`/analyst/history?id=${report.id}`} className="btn btn-secondary" style={{ padding: '6px 16px', fontSize: '12px' }}>
                            View & Edit
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            
            {selectedReport && (
              <div style={{ marginTop: '24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                   <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {selectedReport.status === 'PENDING' ? 'Edit Financial Model' : 'Model Details (View Only)'}
                   </h3>
                   {selectedReport.status !== 'PENDING' && (
                     <span className="badge badge-approved" style={{ opacity: 0.7 }}>🔒 Locked (Processed)</span>
                   )}
                </div>

                {selectedReport.status === 'PENDING' ? (
                  <ReportEditForm report={selectedReport} />
                ) : (
                  <div className="glass-panel animate-fade-in" style={{ padding: '24px' }}>
                     <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        <div className="stat-card">
                           <div className="stat-label">Acquirer</div>
                           <div className="stat-value" style={{ fontSize: '18px' }}>{selectedReport.companyA}</div>
                        </div>
                        <div className="stat-card">
                           <div className="stat-label">Target</div>
                           <div className="stat-value" style={{ fontSize: '18px' }}>{selectedReport.companyB}</div>
                        </div>
                     </div>
                     <p style={{ marginTop: '16px', color: 'var(--text-secondary)', fontSize: '13px' }}>
                       This report has been **{selectedReport.status}** by the banker and cannot be edited. If you need changes, please submit a new analysis.
                     </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div style={{ position: 'sticky', top: '24px', height: 'fit-content' }}>
            {selectedReport && (
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
