'use client'

import { useState } from "react";
import { loginAction } from "@/actions/authActions";
import Link from 'next/link';

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
    <div className="login-wrapper">
      <div className="glass-panel login-card animate-scale-in" style={{ paddingBottom: '32px' }}>
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
            <input name="email" type="email" className="input-field" placeholder="admin@finan.com" required />
          </div>
          <div className="input-group">
            <label className="input-label">Password</label>
            <input name="password" type="password" className="input-field" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%', marginTop: '8px', padding: '14px' }} disabled={loading}>
            {loading ? 'Authenticating...' : 'Sign In →'}
          </button>
        </form>

        <div style={{ textAlign: 'center', marginTop: '32px' }}>
           <Link href="/recovery" style={{ color: 'var(--accent-primary)', fontSize: '13px', textDecoration: 'none', fontWeight: 600 }}>
             Forgot password? Reset Account
           </Link>
        </div>
      </div>
    </div>
  );
}
