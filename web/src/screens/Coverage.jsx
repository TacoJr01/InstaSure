import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchCoverage, patchCoverage, fetchPremiumStatus, postPayment } from '../api.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const SLIDERS = [
  { key: 'rain',      label: 'Rain',       color: 'var(--blue)'   },
  { key: 'lowOrders', label: 'Low Orders', color: 'var(--green)'  },
  { key: 'pollution', label: 'Pollution',  color: 'var(--amber)'  },
  { key: 'curfew',    label: 'Curfew',     color: 'var(--purple)' },
];

const COVERED = [
  { key: 'rain',      label: 'Rain · heavy downpour',  color: 'var(--blue)',   status: 'Active'   },
  { key: 'lowOrders', label: 'Low demand orders',       color: 'var(--green)',  status: 'Active'   },
  { key: 'curfew',    label: 'Curfew / city bandh',     color: 'var(--purple)', status: 'Active'   },
  { key: 'pollution', label: 'Poor air quality',        color: 'var(--amber)',  status: 'Watching' },
];

function calcPremium(vals) {
  const total = Object.values(vals).reduce((s, v) => s + v, 0);
  return Math.max(25, Math.min(80, Math.round((total / 1800) * 80)));
}

export default function Coverage({ dashboard }) {
  const [vals, setVals]       = useState({ rain: 800, lowOrders: 500, pollution: 200, curfew: 300 });
  const [premium, setPremium] = useState(40);
  const [saved, setSaved]     = useState(false);
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [paySheet, setPaySheet] = useState(false);
  const [pin, setPin]           = useState('');
  const [paying, setPaying]     = useState(false);
  const [payResult, setPayResult] = useState(null);
  const [payError, setPayError]   = useState('');

  useEffect(() => {
    fetchCoverage()
      .then(d => {
        setVals({ rain: d.rain, lowOrders: d.lowOrders, pollution: d.pollution, curfew: d.curfew });
        if (d.premium) setPremium(d.premium);
      })
      .catch(() => {});
    fetchPremiumStatus().then(setPremiumStatus).catch(() => {});
  }, []);

  // Sync premium from dashboard prop too
  useEffect(() => {
    if (dashboard?.premium) setPremium(dashboard.premium);
  }, [dashboard?.premium]);

  const total = Object.values(vals).reduce((a, b) => a + b, 0);

  const handleChange = useCallback((key, val) => {
    setVals(prev => {
      const next = { ...prev, [key]: val };
      setPremium(calcPremium(next));
      return next;
    });
    setSaved(false);
  }, []);

  async function handlePay() {
    if (pin.length < 4) return;
    setPaying(true);
    setPayError('');
    try {
      const res = await postPayment(pin);
      if (res.error) { setPayError(res.error); setPaying(false); return; }
      setPayResult(res);
      setPremiumStatus(prev => ({ ...prev, paid: true, lastPaidDate: res.paidDate, expiresDate: res.expiresDate, txId: res.txId }));
    } catch {
      setPayError('Payment failed. Please try again.');
    }
    setPaying(false);
  }

  function openPaySheet() { setPaySheet(true); setPin(''); setPayResult(null); setPayError(''); }
  function closePaySheet() { setPaySheet(false); setPin(''); setPayResult(null); setPayError(''); }

  async function handleSave() {
    try {
      const res = await patchCoverage(vals);
      if (res.premium) setPremium(res.premium);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
  }

  const suspended = dashboard?.suspended;

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* Suspended banner */}
      <AnimatePresence>
        {suspended && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={s.suspendedBanner}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5.5"/><line x1="7" y1="4.5" x2="7" y2="7.5"/><circle cx="7" cy="9.5" r="0.6" fill="var(--red)"/>
            </svg>
            <span>Your account is <strong style={{ color: 'var(--red)' }}>suspended</strong>. Coverage is paused. Contact support.</span>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div variants={item}>
        <div style={s.eyebrow}>your plan</div>
        <motion.div
          key={premium}
          style={s.hero}
          initial={{ opacity: 0, y: -6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: 'spring', stiffness: 400 }}
        >
          ₹{premium}
        </motion.div>
        <div style={s.sub}>per week · up to ₹{total.toLocaleString('en-IN')} support</div>
      </motion.div>

      <motion.div variants={item} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <span style={s.pillDark}>{dashboard?.user?.zone || 'Velachery'}, {dashboard?.user?.location || 'Chennai'}</span>
        <span style={{ ...s.pillStatus, background: suspended ? 'var(--red)' : 'var(--coral)' }}>
          {suspended ? 'Suspended' : 'Active'}
        </span>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      <motion.div variants={item}>
        <div style={s.sectionLabel}>COVERAGE CONTROLS</div>
      </motion.div>

      <motion.div variants={item} style={s.card}>
        {SLIDERS.map(({ key, label, color }) => {
          const val = vals[key];
          const pct = (val / 1500) * 100;
          return (
            <div key={key} style={s.sliderRow}>
              <div style={s.sliderHeader}>
                <span style={s.sliderName}>{label}</span>
                <motion.span key={val} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  style={{ ...s.sliderAmt, color }}>
                  ₹{val}
                </motion.span>
              </div>
              <div style={s.sliderWrap}>
                <div style={s.sliderTrackBg} />
                <motion.div style={{ ...s.sliderFill, width: `${pct}%`, background: color }} layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                <input type="range" min={0} max={1500} step={50} value={val}
                  onChange={e => handleChange(key, +e.target.value)}
                  style={{ ...s.sliderInput, '--thumb-color': color }}
                  className={`slider-${key}`}
                  disabled={!!suspended}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      <style>{SLIDERS.map(({ key, color }) =>
        `.slider-${key}::-webkit-slider-thumb { border-color: ${color} !important; }
         .slider-${key}::-moz-range-thumb { border-color: ${color} !important; }`
      ).join('\n')}</style>

      {/* Total + premium row */}
      <motion.div variants={item} style={s.totalRow}>
        <div>
          <span style={s.totalLbl}>total coverage</span>
          <motion.div key={total} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400 }} style={s.totalVal}>
            ₹{total.toLocaleString('en-IN')}
          </motion.div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={s.totalLbl}>weekly premium</span>
          <motion.div key={premium} initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400 }} style={{ ...s.totalVal, color: 'var(--coral)' }}>
            ₹{premium}
          </motion.div>
        </div>
      </motion.div>

      {/* Save button */}
      {!suspended && (
        <motion.div variants={item} style={{ marginTop: 4 }}>
          <motion.button
            style={{ ...s.saveBtn, background: saved ? 'var(--green)' : 'var(--coral)' }}
            onClick={handleSave}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {saved ? '✓ Saved' : 'Save Coverage'}
          </motion.button>
        </motion.div>
      )}

      <motion.div variants={item} style={s.divider} />

      {/* Premium payment status */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>WEEKLY PREMIUM</div>
      </motion.div>
      <motion.div variants={item} style={s.premCard}>
        <div style={s.premLeft}>
          <div style={s.premAmt}>₹{premium}</div>
          <div style={s.premSub}>due this week</div>
        </div>
        <div style={s.premRight}>
          {premiumStatus?.paid ? (
            <div style={s.premPaid}>
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--green)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6.5 5,9.5 11,4"/></svg>
              <div>
                <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)', letterSpacing: '0.5px' }}>PAID</div>
                <div style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 9, color: 'var(--faint)', marginTop: 1 }}>
                  Expires {premiumStatus.expiresDate}
                </div>
              </div>
            </div>
          ) : (
            <motion.button
              style={s.payBtn}
              onClick={openPaySheet}
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              disabled={!!suspended}
            >
              Pay via UPI
            </motion.button>
          )}
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      <motion.div variants={item}>
        <div style={s.sectionLabel}>WHAT'S COVERED</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        {COVERED.map(({ key, label, color, status }, i) => (
          <motion.div key={key}
            style={{ ...s.covRow, borderBottom: i < COVERED.length - 1 ? '1px solid #13131A' : 'none' }}
            initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
            <div style={s.covLeft}>
              <div style={{ ...s.dot, background: color }} />
              <span style={s.covName}>{label}</span>
            </div>
            <span style={{ ...s.covStatus, color }}>{status}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={{ ...s.note, marginTop: 14 }}>
        Premium adjusts automatically as you change coverage limits
      </motion.div>
      <div style={{ height: 16 }} />

      {/* UPI Payment Sheet */}
      <AnimatePresence>
        {paySheet && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={s.backdrop}
              onClick={!paying && !payResult ? closePaySheet : undefined}
            />
            {/* Sheet */}
            <motion.div
              initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
              transition={{ type: 'spring', stiffness: 380, damping: 38 }}
              style={s.sheet}
            >
              {payResult ? (
                /* Success state */
                <div style={{ textAlign: 'center', padding: '8px 0 16px' }}>
                  <motion.div
                    style={s.successRing}
                    initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', stiffness: 260, delay: 0.05 }}
                  >
                    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="5,14 11,20 23,8"/></svg>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                    <div style={s.successAmt}>₹{payResult.amount}</div>
                    <div style={s.successLabel}>Payment successful</div>
                    <div style={s.successMeta}>Coverage active until {payResult.expiresDate}</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', marginTop: 8 }}>{payResult.txId}</div>
                  </motion.div>
                  <motion.button
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
                    style={s.sheetCta}
                    onClick={closePaySheet}
                    whileTap={{ scale: 0.97 }}
                  >
                    Done
                  </motion.button>
                </div>
              ) : (
                /* Payment form */
                <>
                  <div style={s.sheetHandle} />
                  <div style={s.sheetHeader}>
                    <span style={s.sheetTitle}>Pay Premium</span>
                    <motion.button style={s.sheetClose} onClick={closePaySheet} whileTap={{ scale: 0.9 }}>
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round"><line x1="1" y1="1" x2="11" y2="11"/><line x1="11" y1="1" x2="1" y2="11"/></svg>
                    </motion.button>
                  </div>

                  {/* UPI details */}
                  <div style={s.upiRow}>
                    <div style={s.upiIcon}>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--purple)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="5" width="16" height="12" rx="2"/>
                        <path d="M2 9h16"/><circle cx="5.5" cy="13" r="0.8" fill="var(--purple)"/>
                        <path d="M8.5 13h5"/>
                      </svg>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={s.upiId}>{premiumStatus?.upi || 'rahul@upi'}</div>
                      <div style={s.upiSub}>InstaSure · Weekly premium</div>
                    </div>
                    <div style={s.upiAmt}>₹{premium}</div>
                  </div>

                  {/* PIN dots */}
                  <div style={s.pinLabel}>Enter UPI PIN</div>
                  <div style={s.pinDots}>
                    {[0,1,2,3,4,5].map(i => (
                      <div key={i} style={{ ...s.pinDot, background: i < pin.length ? 'var(--purple)' : 'var(--border2)', transform: i < pin.length ? 'scale(1.2)' : 'scale(1)', transition: 'all 0.15s' }} />
                    ))}
                  </div>

                  {/* Numpad */}
                  <div style={s.numpad}>
                    {['1','2','3','4','5','6','7','8','9','','0','⌫'].map((k, i) => (
                      <motion.button
                        key={i}
                        style={{ ...s.numKey, opacity: k === '' ? 0 : 1 }}
                        onClick={() => {
                          if (k === '') return;
                          if (k === '⌫') { setPin(p => p.slice(0,-1)); return; }
                          if (pin.length < 6) setPin(p => p + k);
                        }}
                        whileTap={k !== '' ? { scale: 0.88, background: 'var(--surface2)' } : {}}
                        disabled={paying}
                      >
                        {k}
                      </motion.button>
                    ))}
                  </div>

                  {payError && (
                    <div style={s.payError}>{payError}</div>
                  )}

                  <motion.button
                    style={{ ...s.sheetCta, background: pin.length >= 4 ? 'var(--purple)' : 'var(--surface2)', color: pin.length >= 4 ? '#fff' : 'var(--faint)' }}
                    onClick={handlePay}
                    disabled={pin.length < 4 || paying}
                    whileTap={pin.length >= 4 ? { scale: 0.97 } : {}}
                  >
                    {paying ? (
                      <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                        <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }} style={{ display: 'inline-block' }}>
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M7 1.5A5.5 5.5 0 1112.5 7"/></svg>
                        </motion.span>
                        Processing…
                      </span>
                    ) : `Pay ₹${premium}`}
                  </motion.button>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

const s = {
  suspendedBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.25)', borderRadius: 12, marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 },
  eyebrow: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)' },
  hero: { fontSize: 52, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', lineHeight: 1, marginTop: 2 },
  sub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faint)', marginTop: 4 },
  pillDark: { padding: '5px 12px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border2)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)' },
  pillStatus: { padding: '5px 12px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 9, color: '#fff', fontWeight: 500 },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '12px 16px' },
  sliderRow: { marginBottom: 16 },
  sliderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  sliderName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  sliderAmt: { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 },
  sliderWrap: { position: 'relative', height: 18, display: 'flex', alignItems: 'center' },
  sliderTrackBg: { position: 'absolute', left: 0, right: 0, height: 4, background: '#1C1C24', borderRadius: 2 },
  sliderFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, pointerEvents: 'none' },
  sliderInput: { position: 'absolute', left: 0, right: 0, width: '100%', height: 18, zIndex: 2, background: 'transparent', outline: 'none', cursor: 'pointer' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '14px 4px 4px' },
  totalLbl: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', display: 'block', marginBottom: 3 },
  totalVal: { fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' },
  saveBtn: { width: '100%', padding: '13px 0', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', marginTop: 8, letterSpacing: '-0.2px', transition: 'background 0.3s' },
  covRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' },
  covLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  covName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  covStatus: { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3px' },
  note: { padding: 12, background: 'rgba(155,122,232,0.06)', border: '1px solid rgba(155,122,232,0.15)', borderRadius: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', textAlign: 'center' },
  // Premium card
  premCard: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20 },
  premLeft: {},
  premAmt: { fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.8px' },
  premSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)', marginTop: 2 },
  premRight: { display: 'flex', alignItems: 'center' },
  premPaid: { display: 'flex', alignItems: 'center', gap: 7 },
  payBtn: { padding: '9px 18px', background: 'var(--purple)', border: 'none', borderRadius: 14, fontFamily: 'var(--font-sans)', fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '-0.2px' },
  // Payment sheet
  backdrop: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', zIndex: 200 },
  sheet: { position: 'fixed', left: 0, right: 0, bottom: 0, background: 'var(--surface)', borderRadius: '24px 24px 0 0', border: '1px solid var(--border2)', padding: '12px 24px 32px', zIndex: 201, maxWidth: 390, margin: '0 auto' },
  sheetHandle: { width: 36, height: 4, background: 'var(--border2)', borderRadius: 2, margin: '0 auto 18px' },
  sheetHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle: { fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' },
  sheetClose: { width: 28, height: 28, borderRadius: '50%', border: '1px solid var(--border2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0 },
  upiRow: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 14, marginBottom: 20 },
  upiIcon: { width: 38, height: 38, borderRadius: 12, background: 'rgba(155,122,232,0.1)', border: '1px solid rgba(155,122,232,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  upiId: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  upiSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)', marginTop: 2 },
  upiAmt: { fontSize: 20, fontWeight: 900, color: 'var(--purple)', letterSpacing: '-0.5px' },
  pinLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', textAlign: 'center', marginBottom: 12 },
  pinDots: { display: 'flex', justifyContent: 'center', gap: 14, marginBottom: 20 },
  pinDot: { width: 12, height: 12, borderRadius: '50%' },
  numpad: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginBottom: 16 },
  numKey: { padding: '14px 0', background: 'var(--surface2)', border: '1px solid var(--border)', borderRadius: 12, fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 600, color: 'var(--text)', cursor: 'pointer', textAlign: 'center' },
  payError: { textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--red)', marginBottom: 10 },
  sheetCta: { width: '100%', padding: '13px 0', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', transition: 'background 0.2s' },
  // Success
  successRing: { width: 60, height: 60, borderRadius: '50%', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' },
  successAmt: { fontSize: 36, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1.5px', lineHeight: 1 },
  successLabel: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 8 },
  successMeta: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', marginTop: 4 },
};
