'use client'

import { useState } from "react";
import { loginAction } from "@/actions/authActions";

export default function Home() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await loginAction(formData) as any;
    if (res?.error) {
      setError(res.error);
    }
    setLoading(false);
  }

  return (
    <div className="login-wrapper" suppressHydrationWarning>
      {/* Background decorative orbs */}
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(41,151,255,0.08), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />
      <div style={{
        position: 'absolute', bottom: '20%', right: '15%',
        width: '250px', height: '250px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(191,90,242,0.06), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="glass-panel login-card animate-scale-in">
        <div style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 className="login-brand text-gradient-blue">FinAn</h1>
          <p className="login-tagline">Enterprise Financial Intelligence</p>
        </div>

        {error && (
          <div className="animate-fade-in" style={{
            color: 'var(--accent-danger)',
            background: 'rgba(255, 69, 58, 0.08)',
            border: '1px solid rgba(255, 69, 58, 0.15)',
            padding: '12px 16px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px',
            fontSize: '14px',
            textAlign: 'center',
          }}>{error}</div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input name="email" type="email" className="input-field" placeholder="admin@finan.com" required suppressHydrationWarning />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input name="password" type="password" className="input-field" placeholder="••••••••" required suppressHydrationWarning />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '8px', padding: '14px' }} disabled={loading} suppressHydrationWarning>
            {loading ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{
                  width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)',
                  borderTopColor: '#fff', borderRadius: '50%',
                  animation: 'spin 0.6s linear infinite', display: 'inline-block',
                }} />
                Authenticating...
              </span>
            ) : 'Sign In →'}
          </button>
        </form>

        <div className="login-footer" style={{ textAlign: 'center' }}>
          <p>Bootstrap: <strong style={{ color: 'var(--text-secondary)' }}>admin@finan.com</strong> / <strong style={{ color: 'var(--text-secondary)' }}>admin</strong></p>
        </div>
      </div>

      {/* Spinning loader keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
