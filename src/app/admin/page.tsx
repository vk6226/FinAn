import Link from "next/link";
import db from "@/lib/db";
import { createUser, deleteUser } from "@/actions/adminActions";
import { logoutAction } from "@/actions/authActions";

export default function AdminDashboard() {
  return <AdminView />;
}

async function AdminView() {
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
        </nav>
        <div className="sidebar-footer">
          <form action={logoutAction}>
            <button className="btn btn-secondary" style={{ width: '100%', fontSize: '13px' }}>Sign Out</button>
          </form>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="main-content">
        <div className="page-header animate-fade-in">
          <h1 className="text-gradient">Manage Users</h1>
          <p>Add, remove, or modify roles for your firm&apos;s employees.</p>
        </div>

        {/* ── Stat Cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.1s' }}>
            <div className="stat-label">Total Users</div>
            <div className="stat-value text-gradient-blue">{totalUsers}</div>
            <div className="stat-meta">Registered accounts</div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.15s' }}>
            <div className="stat-label">Analysts</div>
            <div className="stat-value" style={{ color: 'var(--accent-success)' }}>{analysts}</div>
            <div className="stat-meta">Financial modeling</div>
          </div>
          <div className="stat-card animate-fade-in" style={{ animationDelay: '0.2s' }}>
            <div className="stat-label">Bankers</div>
            <div className="stat-value" style={{ color: 'var(--accent-purple)' }}>{bankers}</div>
            <div className="stat-meta">Report reviewers</div>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '24px', alignItems: 'start' }}>

          {/* ── User Table ── */}
          <div className="glass-panel animate-fade-in" style={{ padding: '0', overflow: 'hidden', animationDelay: '0.25s' }}>
            <div className="table-container" style={{ border: 'none' }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 500 }}>{user.name}</td>
                      <td style={{ color: 'var(--text-secondary)' }}>{user.email}</td>
                      <td>
                        <span className={`badge badge-role`} style={{
                          background: user.role === 'ADMIN'
                            ? 'rgba(255, 69, 58, 0.1)'
                            : user.role === 'BANKER'
                              ? 'rgba(191, 90, 242, 0.1)'
                              : 'rgba(48, 209, 88, 0.1)',
                          color: user.role === 'ADMIN'
                            ? 'var(--accent-danger)'
                            : user.role === 'BANKER'
                              ? 'var(--accent-purple)'
                              : 'var(--accent-success)',
                          border: `1px solid ${user.role === 'ADMIN'
                            ? 'rgba(255,69,58,0.2)'
                            : user.role === 'BANKER'
                              ? 'rgba(191,90,242,0.2)'
                              : 'rgba(48,209,88,0.2)'}`,
                        }}>
                          {user.role}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <form action={async () => {
                          'use server'
                          await deleteUser(user.id)
                        }} style={{ display: 'inline-block' }}>
                          <button className="btn btn-secondary" style={{
                            padding: '6px 14px', fontSize: '12px',
                            color: 'var(--accent-danger)',
                            borderColor: 'rgba(255,69,58,0.15)',
                          }}>
                            Remove
                          </button>
                        </form>
                      </td>
                    </tr>
                  ))}
                  {users.length === 0 && (
                    <tr>
                      <td colSpan={4} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>No users found.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ── Add User Form ── */}
          <div className="glass-panel animate-fade-in" style={{ padding: '32px', animationDelay: '0.3s' }}>
            <h3 className="section-title" style={{ fontSize: '13px' }}>
              + Create New User
            </h3>
            <form action={createUser} style={{ display: 'flex', flexDirection: 'column' }}>
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
              <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '4px' }}>
                Create User →
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
