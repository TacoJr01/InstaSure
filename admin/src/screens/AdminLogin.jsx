import React, { useState } from 'react';
import { motion } from 'framer-motion';

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]   = useState(false);
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const BASE = (import.meta.env.VITE_API_URL || '') + '/api/admin';
      const r = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await r.json();
      if (data.token) {
        localStorage.setItem('ais_admin_token', data.token);
        onLogin(data.token);
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch {
      setError('Connection error — is the backend running?');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={s.root}>
      <motion.div
        initial={{ opacity: 0, y: 28, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        style={s.card}
      >
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="22" height="22" viewBox="0 0 18 18" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 1.5l6.5 2.5V9c0 4-3 6.5-6.5 7.5C2.5 15.5 2.5 13 2.5 9V4L9 1.5z"/>
              <polyline points="6,9 8,11 12,7"/>
            </svg>
          </div>
          <div>
            <div style={s.brandName}>InstaSure</div>
            <div style={s.brandSub}>Admin Console</div>
          </div>
        </div>

        <div style={s.divider} />

        <div style={s.title}>Sign in</div>
        <div style={s.sub}>Restricted access — authorised personnel only</div>

        <form onSubmit={handleSubmit} style={s.form}>
          <div style={s.field}>
            <label style={s.label}>Email</label>
            <input
              style={s.input}
              type="email"
              value={email}
              onChange={e => { setEmail(e.target.value); setError(''); }}
              placeholder="admin@instasure.com"
              autoFocus
              autoComplete="email"
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <div style={s.pwWrap}>
              <input
                style={{ ...s.input, paddingRight: 44 }}
                type={showPw ? 'text' : 'password'}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(''); }}
                placeholder="••••••••"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPw(v => !v)}
                style={s.pwToggle}
              >
                {showPw ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                    <line x1="2" y1="2" x2="14" y2="14"/>
                  </svg>
                ) : (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M1 8s2.5-5 7-5 7 5 7 5-2.5 5-7 5-7-5-7-5z"/><circle cx="8" cy="8" r="2"/>
                  </svg>
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              style={s.error}
            >
              {error}
            </motion.div>
          )}

          <motion.button
            type="submit"
            disabled={loading || !email || !password}
            style={{ ...s.cta, opacity: loading || !email || !password ? 0.5 : 1 }}
            whileTap={!loading && email && password ? { scale: 0.97 } : {}}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </motion.button>
        </form>

        <div style={s.hint}>
          <span style={s.hintLabel}>Default credentials</span>
          <span style={s.hintVal}>admin@instasure.com · Admin@123</span>
        </div>
      </motion.div>
    </div>
  );
}

const s = {
  root:      { height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' },
  card:      { width: 400, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 24, padding: '32px 32px 24px', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' },
  brand:     { display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 },
  brandIcon: { width: 48, height: 48, borderRadius: 14, background: 'var(--coral-dim)', border: '1px solid rgba(232,132,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName: { fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px' },
  brandSub:  { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', marginTop: 3 },
  divider:   { height: 1, background: 'var(--border)', marginBottom: 24 },
  title:     { fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px', marginBottom: 6 },
  sub:       { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)', marginBottom: 28, lineHeight: 1.5 },
  form:      { display: 'flex', flexDirection: 'column', gap: 16 },
  field:     { display: 'flex', flexDirection: 'column', gap: 6 },
  label:     { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', textTransform: 'uppercase' },
  input:     { background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 12, padding: '12px 14px', fontSize: 14, color: 'var(--text)', fontFamily: 'var(--font-sans)', outline: 'none', width: '100%' },
  pwWrap:    { position: 'relative' },
  pwToggle:  { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
  error:     { padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.2)', borderRadius: 10, fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)' },
  cta:       { padding: '13px', borderRadius: 12, border: 'none', background: 'var(--coral)', color: '#fff', fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', marginTop: 4 },
  hint:      { marginTop: 20, padding: '12px 14px', background: 'var(--surface2)', borderRadius: 10, display: 'flex', flexDirection: 'column', gap: 4 },
  hintLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', textTransform: 'uppercase' },
  hintVal:   { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)' },
};
