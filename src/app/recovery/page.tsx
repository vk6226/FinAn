'use client'

import { useState } from "react";
import { requestPasswordReset } from "@/actions/authActions";
import { useRouter } from "next/navigation";

export default function RecoveryPage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const formData = new FormData(e.currentTarget);
    const res = await requestPasswordReset(formData);
    
    if (res?.error) {
      setError(res.error);
      setLoading(false);
    } else if (res?.success && res.redirectPath) {
      // Navigating to the verification screen via browser router
      router.push(res.redirectPath);
    } else {
      setLoading(false);
    }
  }

  return (
    <div className="login-wrapper">
      <div className="glass-panel login-card animate-scale-in" style={{ maxWidth: '440px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="login-brand text-gradient-blue">Recovery</h1>
          <p className="login-tagline">Identify your account to generate a security token.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column' }}>
          {error && (
            <div style={{ color: 'var(--accent-danger)', background: 'rgba(255, 69, 58, 0.1)', padding: '12px', borderRadius: '4px', marginBottom: '16px', fontSize: '13px', textAlign: 'center' }}>
              {error}
            </div>
          )}
          
          <div className="input-group">
            <label className="input-label">User Email</label>
            <input name="email" type="email" className="input-field" placeholder="your-email@company.com" required />
          </div>

          <button type="submit" className="btn btn-accent" style={{ width: '100%', padding: '14px' }} disabled={loading}>
            {loading ? 'Consulting security logs...' : 'Request Token →'}
          </button>
          
          <div style={{ textAlign: 'center', marginTop: '24px' }}>
             <a href="/" style={{ color: 'var(--text-muted)', fontSize: '13px', textDecoration: 'none' }}>Back to Sign In</a>
          </div>
        </form>
      </div>
    </div>
  );
}
