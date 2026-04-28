import Link from "next/link";
import db from "@/lib/db";
import { logoutAction } from "@/actions/authActions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminLogsPage() {
  const session = await getSession();
  
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const logs = await db.log.findMany({
    include: { user: true },
    orderBy: { createdAt: 'desc' },
    take: 100
  });

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2><span className="text-gradient-blue">FinAn</span></h2>
          <p>Admin Portal</p>
        </div>
        <nav className="sidebar-nav">
          <Link href="/admin" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            User Management
          </Link>
          <Link href="/admin/logs" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            Audit Logs
          </Link>
        </nav>
        <div className="sidebar-footer">
          <form action={async () => { 'use server'; await logoutAction(); }}>
            <button className="btn btn-secondary" style={{ width: '100%' }}>Sign Out</button>
          </form>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header animate-fade-in">
          <h1 className="text-gradient">Audit Logs</h1>
          <p>Comprehensive system activity tracing and security monitoring.</p>
        </div>

        <div className="glass-panel animate-fade-in" style={{ padding: '0', overflow: 'hidden' }}>
          <div className="table-container" style={{ border: 'none' }}>
            <table>
              <thead>
                <tr><th>Timestamp</th><th>User</th><th>Action</th><th>Details</th></tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id}>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{new Date(log.createdAt).toLocaleString()}</td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontWeight: 500 }}>{log.user?.name || 'System'}</span>
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{log.user?.email || 'N/A'}</span>
                      </div>
                    </td>
                    <td><span className="badge">{log.action}</span></td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
