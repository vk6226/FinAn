import Link from "next/link";
import db from "@/lib/db";
import { createUser, deleteUser } from "@/actions/adminActions";
import { logoutAction } from "@/actions/authActions";
import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
  const session = await getSession();
  if (!session || session.user.role !== 'ADMIN') {
    redirect('/');
  }

  const users = await db.user.findMany({
    orderBy: { createdAt: 'desc' }
  });

  const totalUsers = users.length;
  const analysts = users.filter(u => u.role === 'ANALYST').length;
  const bankers = users.filter(u => u.role === 'BANKER').length;

  return (
    <div className="dashboard-layout">
      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <h2><span className="text-gradient-blue">FinAn</span></h2>
          <p>Admin Portal</p>
        </div>
        <nav className="sidebar-nav">
          <Link href="/admin" className="sidebar-link active">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            User Management
          </Link>
          <Link href="/admin/logs" className="sidebar-link">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
            System Logs
          </Link>
        </nav>
        <div className="sidebar-footer">
          <form action={async () => { 'use server'; await logoutAction(); }}>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }}>Sign Out</button>
          </form>
        </div>
      </aside>

      <main className="main-content">
        <div className="page-header animate-fade-in">
          <h1 className="text-gradient">Manage Users</h1>
          <p>Provision Analyst and Banker accounts for the team.</p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="stat-card">
            <div className="stat-label">Total Users</div>
            <div className="stat-value text-gradient-blue">{totalUsers}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Analysts</div>
            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{analysts}</div>
          </div>
          <div className="stat-card">
            <div className="stat-label">Bankers</div>
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{bankers}</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>
          <div className="glass-panel" style={{ padding: '0', overflow: 'hidden' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Role</th><th style={{ textAlign: 'right' }}>Actions</th></tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 500 }}>{user.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td><span className="badge">{user.role}</span></td>
                      <td style={{ textAlign: 'right' }}>
                        <form action={async () => { 'use server'; await deleteUser(user.id); }}>
                          <button className="btn btn-secondary" style={{ color: 'var(--accent-danger)' }}>Remove</button>
                        </form>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="glass-panel" style={{ padding: '32px' }}>
            <h3 className="section-title" style={{ fontSize: '13px' }}>+ Create New User</h3>
            {/* WRAPPED ACTION TO FIX TYPESCRIPT BUILD ERROR */}
            <form action={async (fd) => { 'use server'; await createUser(fd); }} style={{ display: 'flex', flexDirection: 'column' }}>
              <div className="input-group">
                <label className="input-label">Full Name</label>
                <input name="name" type="text" className="input-field" placeholder="Jane Doe" required />
              </div>
              <div className="input-group">
                <label className="input-label">Email Address</label>
                <input name="email" type="email" className="input-field" placeholder="jane@finan.com" required />
              </div>
              <div className="input-group">
                <label className="input-label">Role</label>
                <select name="role" className="input-field" required>
                  <option value="ANALYST">Financial Analyst</option>
                  <option value="BANKER">Investment Banker</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Temporary Password</label>
                <input name="password" type="password" className="input-field" placeholder="••••••••" required />
              </div>
              <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '4px' }}>Create User →</button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
