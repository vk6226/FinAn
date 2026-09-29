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
    const res = await loginAction(formData) as { error?: string; success?: boolean };
    if (res?.error) {
      setError(res.error);
    }
    setLoading(false);
  }

  return (
    <div className="login-wrapper">
      <div className="glass-panel login-card animate-scale-in" style={{ paddingBottom: '32px', position: 'relative', zIndex: 50 }}>
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

        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ textAlign: 'center', fontSize: '12px', color: 'var(--text-muted)', marginBottom: '4px' }}>
            OR TRY A DEMO ACCOUNT
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button onClick={() => { (document.querySelector('input[name="email"]') as HTMLInputElement).value = 'admin@finan.com'; (document.querySelector('input[name="password"]') as HTMLInputElement).value = 'demo123'; (document.querySelector('input[name="email"]') as HTMLInputElement).closest('form')?.requestSubmit(); }} type="button" className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Admin</button>
            <button onClick={() => { (document.querySelector('input[name="email"]') as HTMLInputElement).value = 'analyst@finan.com'; (document.querySelector('input[name="password"]') as HTMLInputElement).value = 'demo123'; (document.querySelector('input[name="email"]') as HTMLInputElement).closest('form')?.requestSubmit(); }} type="button" className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Analyst</button>
            <button onClick={() => { (document.querySelector('input[name="email"]') as HTMLInputElement).value = 'banker@finan.com'; (document.querySelector('input[name="password"]') as HTMLInputElement).value = 'demo123'; (document.querySelector('input[name="email"]') as HTMLInputElement).closest('form')?.requestSubmit(); }} type="button" className="btn" style={{ flex: 1, padding: '8px', fontSize: '13px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>Banker</button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: '32px', position: 'relative', zIndex: 100 }}>
          <Link href="/recovery" style={{
            display: 'inline-block',
            background: 'rgba(41, 151, 255, 0.1)',
            border: '1px solid #2997ff',
            color: '#2997ff',
            fontSize: '15px',
            fontWeight: 'bold',
            padding: '12px 24px',
            borderRadius: '8px',
            cursor: 'pointer',
            textDecoration: 'none'
          }}>
            FORGOT PASSWORD? CLICK HERE
          </Link>
        </div>

      </div>
    </div>
  );
}
