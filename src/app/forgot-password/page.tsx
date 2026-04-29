'use client'

import { useState, Suspense } from "react";
import { requestPasswordReset } from "@/actions/authActions";
import Link from "next/link";

function ForgotPasswordForm() {
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await requestPasswordReset(formData);
      setStatus(res);
    } catch (err) {
      setStatus({ error: "Something went wrong. Please try again." });
    }
    setLoading(false);
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="login-brand text-gradient-blue">Reset Password</h1>
        <p className="login-tagline">Enter your email to receive recovery instructions.</p>
      </div>

      {status?.success ? (
        <div className="animate-fade-in" style={{ textAlign: 'center' }}>
          <div style={{ 
            background: 'rgba(48, 209, 88, 0.08)', 
            border: '1px solid rgba(48, 209, 88, 0.15)',
            padding: '24px',
            borderRadius: 'var(--radius-sm)',
            marginBottom: '24px'
          }}>
            <p style={{ color: 'var(--accent-success)', fontSize: '15px', fontWeight: 500 }}>
              ✓ Recovery Request Logged
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
              Check your system terminal or admin logs for the mock reset link.
            </p>
          </div>
          <Link href="/" className="btn btn-secondary" style={{ width: '100%', display: 'inline-block', padding: '12px', textDecoration: 'none' }}>
            Return to Login
          </Link>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {status?.error && (
            <div style={{ 
              color: 'var(--accent-danger)', 
              background: 'rgba(255, 69, 58, 0.08)',
              padding: '12px',
              borderRadius: '4px',
              marginBottom: '16px',
              fontSize: '13px',
              textAlign: 'center'
            }}>{status.error}</div>
          )}
          
          <div className="input-group">
            <label className="input-label">Email Address</label>
            <input name="email" type="email" className="input-field" placeholder="your-email@company.com" required />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Processing...' : 'Send Reset Link →'}
          </button>

          <div style={{ textAlign: 'center', marginTop: '24px' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>
              Wait, I remember my password!
            </Link>
          </div>
        </form>
      )}
    </>
  );
}

export default function ForgotPasswordPage() {
  return (
    <div className="login-wrapper">
      <div style={{
        position: 'absolute', top: '15%', left: '10%',
        width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(41,151,255,0.08), transparent 70%)',
        filter: 'blur(60px)', pointerEvents: 'none',
      }} />

      <div className="glass-panel login-card animate-scale-in" style={{ maxWidth: '440px' }}>
        <Suspense fallback={<div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</div>}>
          <ForgotPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
