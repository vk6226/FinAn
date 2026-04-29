'use client'

import { useState, useEffect, Suspense } from "react";
import { completePasswordReset } from "@/actions/authActions";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<{ error?: string; success?: boolean } | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const e = searchParams.get('email');
    if (e) setEmail(decodeURIComponent(e));
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setStatus(null);
    try {
      const formData = new FormData(e.currentTarget);
      const res = await completePasswordReset(formData);
      setStatus(res);
    } catch (err) {
      setStatus({ error: "Failed to update password. Please try again." });
    }
    setLoading(false);
  }

  return (
    <>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <h1 className="login-brand text-gradient-blue">New Password</h1>
        <p className="login-tagline">Set a secure password to regain access.</p>
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
              ✓ Password Updated
            </p>
            <p style={{ color: 'var(--text-secondary)', fontSize: '13px', marginTop: '8px' }}>
              Your new password is now active. You can sign in with your new credentials.
            </p>
          </div>
          <Link href="/" className="btn btn-accent" style={{ width: '100%', display: 'inline-block', padding: '14px', textDecoration: 'none' }}>
            Sign In Now →
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
            }}>
              {status.error}
            </div>
          )}
          
          <input type="hidden" name="email" value={email} />

          <div className="input-group">
            <label className="input-label">New Password</label>
            <input name="password" type="password" className="input-field" placeholder="••••••••" required />
          </div>

          <div className="input-group">
            <label className="input-label">Confirm Password</label>
            <input name="confirm" type="password" className="input-field" placeholder="••••••••" required />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Updating...' : 'Change Password →'}
          </button>
        </form>
      )}
    </>
  );
}

export default function ResetPasswordPage() {
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
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  );
}
