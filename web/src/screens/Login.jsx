import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postLogin } from '../api.js';

const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

export default function Login({ onLogin, onRegister }) {
  const [step, setStep]   = useState('phone'); // phone | pin
  const [phone, setPhone] = useState('');
  const [pin, setPin]     = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function handlePhoneKey(k) {
    if (k === '⌫') return setPhone(p => p.slice(0, -1));
    if (phone.length < 10) setPhone(p => p + k);
  }

  function handlePinKey(k) {
    if (k === '⌫') { setPin(p => p.slice(0,-1)); setError(''); return; }
    if (pin.length >= 4) return;
    const next = pin + k;
    setPin(next);
    setError('');
    if (next.length === 4) submit(next);
  }

  async function submit(enteredPin) {
    setLoading(true);
    setError('');
    try {
      const res = await postLogin(phone, enteredPin);
      if (res.token) {
        localStorage.setItem('ais_token', res.token);
        onLogin(res.worker);
      } else {
        setError(res.error || 'Incorrect PIN');
        setPin('');
      }
    } catch {
      setError('Connection error');
      setPin('');
    } finally {
      setLoading(false);
    }
  }

  const phoneValid = phone.length === 10;

  return (
    <div style={s.root}>
      {/* Brand */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22,1,0.36,1] }}
        style={s.brand}
      >
        <div style={s.brandIcon}>
          <svg width="20" height="20" viewBox="0 0 18 18" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 1.5l6.5 2.5V9c0 4-3 6.5-6.5 7.5C2.5 15.5 2.5 13 2.5 9V4L9 1.5z"/>
            <polyline points="6,9 8,11 12,7"/>
          </svg>
        </div>
        <div>
          <div style={s.brandName}>InstaSure</div>
          <div style={s.brandSub}>Adaptive Income Shield</div>
        </div>
      </motion.div>

      <AnimatePresence mode="wait">
        {step === 'phone' ? (
          <motion.div
            key="phone"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.32,0.72,0,1] }}
            style={s.card}
          >
            <div style={s.cardTitle}>Welcome back</div>
            <div style={s.cardSub}>Enter your mobile number to continue</div>

            {/* Phone display */}
            <div style={s.phoneDisplay}>
              <span style={s.phonePrefix}>+91</span>
              <span style={{ ...s.phoneNum, color: phone.length ? 'var(--text)' : 'var(--faint)' }}>
                {phone.length ? phone.replace(/(\d{5})(\d{0,5})/, '$1 $2') : '· · · · · · · · · ·'}
              </span>
            </div>

            {/* Numpad */}
            <div style={s.numpad}>
              {NUMPAD.map((k, i) => (
                <motion.button
                  key={i}
                  onClick={() => k && handlePhoneKey(k)}
                  style={{
                    ...s.key,
                    opacity: k ? 1 : 0,
                    pointerEvents: k ? 'auto' : 'none',
                    background: k === '⌫' ? 'transparent' : 'var(--surface2)',
                    color: k === '⌫' ? 'var(--muted)' : 'var(--text)',
                    fontSize: k === '⌫' ? 18 : 20,
                  }}
                  whileTap={k ? { scale: 0.88, background: 'var(--coral-dim)' } : {}}
                  transition={{ duration: 0.1 }}
                >
                  {k}
                </motion.button>
              ))}
            </div>

            <motion.button
              onClick={() => { setError(''); setPin(''); setStep('pin'); }}
              disabled={!phoneValid}
              style={{ ...s.cta, opacity: phoneValid ? 1 : 0.4 }}
              whileTap={phoneValid ? { scale: 0.97 } : {}}
            >
              Continue →
            </motion.button>
          </motion.div>
        ) : (
          <motion.div
            key="pin"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.3, ease: [0.32,0.72,0,1] }}
            style={s.card}
          >
            <motion.button
              onClick={() => { setStep('phone'); setPin(''); setError(''); }}
              style={s.back}
              whileTap={{ scale: 0.95 }}
            >
              ← {phone.replace(/(\d{5})(\d{0,5})/, '+91 $1 $2')}
            </motion.button>

            <div style={s.cardTitle}>Enter your PIN</div>
            <div style={s.cardSub}>4-digit PIN to secure your account</div>

            {/* PIN dots */}
            <div style={s.dots}>
              {[0,1,2,3].map(i => (
                <motion.div
                  key={i}
                  style={{
                    ...s.dot,
                    background: i < pin.length ? 'var(--coral)' : 'var(--surface2)',
                    border: `2px solid ${i < pin.length ? 'var(--coral)' : 'var(--border2)'}`,
                  }}
                  animate={{ scale: i === pin.length - 1 && pin.length > 0 ? [1, 1.3, 1] : 1 }}
                  transition={{ duration: 0.2 }}
                />
              ))}
            </div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  style={s.errMsg}
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Numpad */}
            <div style={s.numpad}>
              {NUMPAD.map((k, i) => (
                <motion.button
                  key={i}
                  onClick={() => k && handlePinKey(k)}
                  disabled={loading}
                  style={{
                    ...s.key,
                    opacity: k ? 1 : 0,
                    pointerEvents: k ? 'auto' : 'none',
                    background: k === '⌫' ? 'transparent' : 'var(--surface2)',
                    color: k === '⌫' ? 'var(--muted)' : 'var(--text)',
                    fontSize: k === '⌫' ? 18 : 20,
                  }}
                  whileTap={k ? { scale: 0.88, background: 'var(--coral-dim)' } : {}}
                  transition={{ duration: 0.1 }}
                >
                  {loading && k !== '⌫' ? '' : k}
                </motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.button
        onClick={onRegister}
        style={s.registerLink}
        whileTap={{ scale: 0.97 }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        New here? <span style={{ color: 'var(--coral)' }}>Create account</span>
      </motion.button>
    </div>
  );
}

const s = {
  root:        { display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', padding: '0 0 16px' },
  brand:       { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 28, paddingTop: 8 },
  brandIcon:   { width: 44, height: 44, borderRadius: 14, background: 'var(--coral-dim)', border: '1px solid rgba(232,132,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  brandName:   { fontSize: 18, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px' },
  brandSub:    { fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--faint)', letterSpacing: '0.8px', marginTop: 2 },
  card:        { width: '100%', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  cardTitle:   { fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6, alignSelf: 'flex-start' },
  cardSub:     { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)', marginBottom: 24, alignSelf: 'flex-start' },
  phoneDisplay: { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  phonePrefix: { fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--muted)', fontWeight: 600 },
  phoneNum:    { fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, letterSpacing: '2px', flex: 1 },
  numpad:      { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 16 },
  key:         { height: 58, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cta:         { width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: 'var(--coral)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px' },
  back:        { alignSelf: 'flex-start', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--muted)', marginBottom: 20, padding: 0 },
  dots:        { display: 'flex', gap: 14, marginBottom: 20 },
  dot:         { width: 18, height: 18, borderRadius: '50%' },
  errMsg:      { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', marginBottom: 10 },
  registerLink:{ marginTop: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: 'var(--muted)', paddingTop: 8 },
};
