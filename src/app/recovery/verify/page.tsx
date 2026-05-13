'use client'

import { useState, useEffect, Suspense } from "react";
import { completePasswordReset } from "@/actions/authActions";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function VerifyRecoveryForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = searchParams.get('email');
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (e) setEmail(decodeURIComponent(e));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    const formData = new FormData(e.currentTarget);
    const res = await completePasswordReset(formData);
    setStatus(res);
    setLoading(false);
  }

  if (status?.success) {
    return (
      <div className="animate-fade-in" style={{ textAlign: 'center' }}>
        <div style={{ background: 'rgba(48, 209, 88, 0.08)', padding: '24px', borderRadius: '8px', border: '1px solid rgba(48, 209, 88, 0.1)' }}>
          <p style={{ color: 'var(--accent-success)', fontSize: '15px', fontWeight: 600 }}>✓ Access Restored</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '12px', marginTop: '8px' }}>Your new password is now active. You may return to the portal.</p>
        </div>
        <Link href="/" className="btn btn-accent" style={{ width: '100%', marginTop: '24px', display: 'inline-block', textDecoration: 'none' }}>
          Finalize Sign In →
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      <div style={{ textAlign: 'center', marginBottom: '8px' }}>
        <p className="login-tagline" style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Security Verification</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Enter the token from Admin Logs for <strong>{email}</strong></p>
      </div>

      {status?.error && (
        <div style={{ color: 'var(--accent-danger)', background: 'rgba(255, 69, 58, 0.08)', padding: '12px', borderRadius: '4px', fontSize: '12px', textAlign: 'center' }}>
          {status.error}
        </div>
      )}

      <div className="input-group">
        <label className="input-label">User Email</label>
        <input name="email" type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      <div className="input-group">
        <label className="input-label">6-Digit Security Token</label>
        <input name="token" type="text" className="input-field" placeholder="000000" maxLength={6} required style={{ textAlign: 'center', letterSpacing: '4px', fontSize: '1.2rem' }} />
      </div>

      <div className="input-group">
        <label className="input-label">New Password</label>
        <input name="password" type="password" className="input-field" placeholder="••••••••" required />
      </div>

      <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '14px' }} disabled={loading}>
        {loading ? 'Validating Token...' : 'Unlock Account →'}
      </button>

      <div style={{ textAlign: 'center' }}>
        <Link href="/recovery" style={{ color: 'var(--text-muted)', fontSize: '12px', textDecoration: 'none' }}>Back</Link>
      </div>
    </form>
  );
}

export default function VerifyRecoveryPage() {
  return (
    <div className="login-wrapper">
      <div className="glass-panel login-card animate-scale-in" style={{ maxWidth: '440px' }}>
        <h1 className="login-brand text-gradient-blue" style={{ textAlign: 'center' }}>Verify Token</h1>
        <Suspense fallback={<div style={{ textAlign: 'center' }}>Initializing Secure Flow...</div>}>
          <VerifyRecoveryForm />
        </Suspense>
      </div>
    </div>
  );
}
