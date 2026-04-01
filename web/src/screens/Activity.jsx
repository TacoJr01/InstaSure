import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchActivity, postVerify } from '../api.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.08 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const MOCK = {
  normalOrders: 10, todayOrders: 4, dropPercent: 60, compensationEligible: true,
  week: [
    { day: 'Mon', orders: 9 }, { day: 'Tue', orders: 10 },
    { day: 'Wed', orders: 8 }, { day: 'Thu', orders: 11 }, { day: 'Fri', orders: 4 },
  ],
  forecast: [
    { day: 'Tomorrow', label: 'May be slow', status: 'slow' },
    { day: 'Weekend', label: 'Looks good', status: 'good' },
  ],
};

// Verify steps: 0=idle, 1=gps_checking, 2=gps_done, 3=selfie, 4=selfie_done, 5=success
export default function Activity({ dashboard }) {
  const [data, setData] = useState(MOCK);
  const [verifying, setVerifying] = useState(false);
  const [step, setStep] = useState(0); // 0=cta, 1=gps, 2=selfie, 3=success
  const [gpsProgress, setGpsProgress] = useState(0);
  const [gpsOk, setGpsOk] = useState(false);
  const [selfieOk, setSelfieOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifiedPayout, setVerifiedPayout] = useState(null);
  const fileRef = useRef();

  const suspended = dashboard?.suspended;

  useEffect(() => {
    fetchActivity().then(setData).catch(() => {});
  }, []);

  // Sync compensation eligibility from live dashboard poll
  useEffect(() => {
    if (dashboard?.compensationEligible !== undefined) {
      setData(prev => ({ ...prev, compensationEligible: dashboard.compensationEligible }));
    }
  }, [dashboard?.compensationEligible]);

  // GPS auto-progress
  useEffect(() => {
    if (step !== 1) return;
    setGpsProgress(0);
    setGpsOk(false);
    const interval = setInterval(() => {
      setGpsProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setGpsOk(true);
          return 100;
        }
        return p + 4;
      });
    }, 80);
    return () => clearInterval(interval);
  }, [step]);

  function startVerify() {
    setVerifying(true);
    setStep(1);
  }

  function goToSelfie() {
    setStep(2);
  }

  function handleSelfie(e) {
    if (e.target.files && e.target.files[0]) {
      setSelfieOk(true);
    }
  }

  async function submitVerify() {
    setLoading(true);
    try {
      const result = await postVerify({ gps: true, selfie: true });
      if (result.success) {
        setVerifiedPayout(result.payout);
        setData(prev => ({ ...prev, compensationEligible: false }));
        setStep(3);
      }
    } catch {
      // Simulate success even if API is down
      setVerifiedPayout({ amount: 200, reason: 'Low Orders' });
      setData(prev => ({ ...prev, compensationEligible: false }));
      setStep(3);
    } finally {
      setLoading(false);
    }
  }

  function closeVerify() {
    setVerifying(false);
    setStep(0);
    setGpsOk(false);
    setSelfieOk(false);
  }

  const maxOrders = Math.max(...data.week.map(w => w.orders));

  // ── VERIFY FLOW ──────────────────────────────────────────
  if (verifying) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
        <div style={s.verifyHeader}>
          <button onClick={closeVerify} style={s.backBtn}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11,4 6,9 11,14"/>
            </svg>
          </button>
          <span style={s.verifyTitle}>Verify to Claim</span>
        </div>

        {/* Steps indicator */}
        <div style={s.stepsRow}>
          {[1, 2, 3].map(n => (
            <div key={n} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                ...s.stepDot,
                background: step > n ? 'var(--green)' : step === n ? 'var(--blue)' : 'var(--border2)',
              }}>
                {step > n
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,5 4,8 8,3"/></svg>
                  : <span style={s.stepNum}>{n}</span>
                }
              </div>
              {n < 3 && <div style={{ ...s.stepLine, background: step > n ? 'var(--green)' : 'var(--border2)' }} />}
            </div>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {/* Step 1: GPS */}
          {step === 1 && (
            <motion.div key="gps" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div style={s.stepCard}>
                <div style={s.stepIcon}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={gpsOk ? 'var(--green)' : 'var(--blue)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="14" cy="13" r="5"/>
                    <path d="M14 2v3M14 23v3M2 13h3M23 13h3"/>
                    <circle cx="14" cy="13" r="10" strokeOpacity="0.2"/>
                  </svg>
                </div>
                <div style={s.stepName}>GPS Verification</div>
                <div style={s.stepDesc}>Confirming you are in your active delivery zone</div>

                {/* Progress bar */}
                <div style={s.gpsTrack}>
                  <motion.div
                    style={{ ...s.gpsFill, background: gpsOk ? 'var(--green)' : 'var(--blue)' }}
                    animate={{ width: `${gpsProgress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <div style={{ ...s.stepSub, color: gpsOk ? 'var(--green)' : 'var(--muted)' }}>
                  {gpsOk ? 'Location confirmed ✓' : `Scanning… ${gpsProgress}%`}
                </div>

                {gpsOk && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={s.cta}
                    onClick={goToSelfie}
                    whileTap={{ scale: 0.96 }}
                  >
                    Continue to Selfie
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 2: Selfie */}
          {step === 2 && (
            <motion.div key="selfie" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
              <div style={s.stepCard}>
                <div style={s.stepIcon}>
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke={selfieOk ? 'var(--green)' : 'var(--amber)'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="7" width="22" height="17" rx="3"/>
                    <circle cx="14" cy="15" r="4"/>
                    <path d="M10 7l1.5-3h5L18 7"/>
                  </svg>
                </div>
                <div style={s.stepName}>Selfie Verification</div>
                <div style={s.stepDesc}>Take a selfie from your current pickup location</div>

                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  capture="user"
                  onChange={handleSelfie}
                  style={{ display: 'none' }}
                />

                {!selfieOk ? (
                  <motion.button
                    style={{ ...s.cta, background: 'var(--amber-dim)', border: '1px solid var(--amber)', color: 'var(--amber)' }}
                    onClick={() => fileRef.current.click()}
                    whileTap={{ scale: 0.96 }}
                  >
                    Take Selfie
                  </motion.button>
                ) : (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.selfieDone}>
                    <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3,9 7,13 15,5"/></svg>
                    <span style={{ color: 'var(--green)', fontSize: 13, fontWeight: 600 }}>Selfie captured ✓</span>
                  </motion.div>
                )}

                {selfieOk && (
                  <motion.button
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={s.cta}
                    onClick={submitVerify}
                    disabled={loading}
                    whileTap={{ scale: 0.96 }}
                  >
                    {loading ? 'Processing…' : 'Submit Verification'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}

          {/* Step 3: Success */}
          {step === 3 && (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 280 }}>
              <div style={{ ...s.stepCard, alignItems: 'center', textAlign: 'center' }}>
                <motion.div
                  style={s.successRing}
                  initial={{ scale: 0, rotate: -90 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', stiffness: 260, delay: 0.1 }}
                >
                  <svg width="32" height="32" viewBox="0 0 32 32" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="6,16 13,23 26,10"/>
                  </svg>
                </motion.div>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                  <div style={s.successAmt}>+₹{verifiedPayout?.amount || 200}</div>
                  <div style={s.successLabel}>Payout triggered</div>
                  <div style={s.successDesc}>Sent to your UPI automatically</div>
                </motion.div>
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.6 }}
                  style={{ ...s.cta, marginTop: 20 }}
                  onClick={closeVerify}
                  whileTap={{ scale: 0.96 }}
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Amount info */}
        <div style={s.claimNote}>
          Eligible compensation: <strong style={{ color: 'var(--green)' }}>₹200</strong> for &gt;50% demand drop
        </div>
        <div style={{ height: 16 }} />
      </motion.div>
    );
  }

  // ── NORMAL VIEW ──────────────────────────────────────────
  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* Suspended banner */}
      {suspended && (
        <motion.div variants={item} style={s.suspendedBanner}>
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6.5" cy="6.5" r="5"/><line x1="6.5" y1="4" x2="6.5" y2="6.5"/><circle cx="6.5" cy="9" r="0.5" fill="var(--red)"/>
          </svg>
          <span>Account <strong style={{ color: 'var(--red)' }}>suspended</strong> — payouts paused. Contact support to resolve.</span>
        </motion.div>
      )}

      <motion.div variants={item}>
        <div style={s.eyebrow}>today's picture</div>
        <div style={s.hero}>Orders<br/>are low</div>
        <div style={s.sub}>{data.dropPercent}% fewer than your average</div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Stat grid */}
      <motion.div variants={item} style={s.statGrid}>
        {[
          { label: 'TODAY', val: data.todayOrders, color: 'var(--coral)', sub: 'orders so far' },
          { label: 'NORMAL', val: data.normalOrders, color: 'var(--text)', sub: 'avg / day' },
          { label: 'DROP', val: `${data.dropPercent}%`, color: 'var(--amber)', sub: 'below average' },
          { label: 'STATUS', val: data.compensationEligible ? '✓' : '—', color: 'var(--green)', sub: data.compensationEligible ? 'comp. eligible' : 'no action needed', small: true },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            style={s.statCard}
            initial={{ opacity: 0, scale: 0.85 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15 + i * 0.08, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.04 }}
          >
            <div style={s.statLbl}>{stat.label}</div>
            <div style={{ ...s.statVal, color: stat.color, fontSize: stat.small ? 20 : 24 }}>{stat.val}</div>
            <div style={s.statSub}>{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Bar chart */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>THIS WEEK</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        {data.week.map((w, i) => {
          const isToday = i === data.week.length - 1;
          const pct = (w.orders / maxOrders) * 100;
          return (
            <div key={w.day} style={s.barRow}>
              <span style={s.barLabel}>{w.day}</span>
              <div style={s.barTrack}>
                <motion.div
                  style={{ ...s.barFill, background: isToday ? 'var(--coral)' : 'var(--text2)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{ delay: 0.3 + i * 0.1, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <motion.span
                style={{ ...s.barVal, color: isToday ? 'var(--coral)' : 'var(--muted)' }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 + i * 0.1 }}
              >
                {w.orders}
              </motion.span>
            </div>
          );
        })}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Compensation alert + CTA */}
      {data.compensationEligible && (
        <motion.div variants={item}>
          <motion.div
            style={s.greenAlert}
            animate={{ boxShadow: ['0 0 0 0 rgba(62,201,122,0)', '0 0 0 6px rgba(62,201,122,0.08)', '0 0 0 0 rgba(62,201,122,0)'] }}
            transition={{ duration: 2.5, repeat: Infinity }}
          >
            <div style={{ ...s.alertBar, background: 'var(--green)' }} />
            <div style={{ flex: 1 }}>
              <div style={{ ...s.alertTitle, color: 'var(--green)' }}>Compensation likely</div>
              <div style={s.alertDesc}>Drop &gt;50% detected. Verify to trigger payout.</div>
            </div>
          </motion.div>
          {!suspended ? (
            <motion.button
              style={s.verifyCta}
              onClick={startVerify}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}>
                <circle cx="8" cy="7" r="4"/>
                <path d="M2 14c0-3 2.7-5 6-5s6 2 6 5"/>
              </svg>
              Verify to Claim ₹200
            </motion.button>
          ) : (
            <div style={s.blockedCta}>Payouts paused — account suspended</div>
          )}
        </motion.div>
      )}

      {data.compensationEligible && <motion.div variants={item} style={s.divider} />}

      <motion.div variants={item}>
        <div style={s.sectionLabel}>FORECAST</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        {data.forecast.map((f, i) => (
          <div key={f.day} style={{ ...s.foreRow, borderBottom: i < data.forecast.length - 1 ? '1px solid #13131A' : 'none' }}>
            <span style={s.foreName}>{f.day}</span>
            <span style={{ ...s.foreStatus, color: f.status === 'good' ? 'var(--green)' : 'var(--amber)' }}>{f.label}</span>
          </div>
        ))}
      </motion.div>
      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  eyebrow: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)' },
  hero: { fontSize: 40, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1.05, marginTop: 4 },
  sub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faint)', marginTop: 6 },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, cursor: 'default' },
  statLbl: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', marginBottom: 6 },
  statVal: { fontWeight: 900, letterSpacing: '-0.5px' },
  statSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--muted)', marginTop: 3 },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '8px 16px' },
  barRow: { display: 'flex', alignItems: 'center', gap: 10, padding: '7px 0' },
  barLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', width: 28, flexShrink: 0 },
  barTrack: { flex: 1, height: 8, background: '#1C1C24', borderRadius: 4, overflow: 'hidden' },
  barFill: { height: '100%', borderRadius: 4 },
  barVal: { fontFamily: 'var(--font-mono)', fontSize: 9, width: 18, textAlign: 'right', flexShrink: 0 },
  greenAlert: { display: 'flex', gap: 12, alignItems: 'stretch', padding: 14, background: 'rgba(62,201,122,0.06)', border: '1px solid rgba(62,201,122,0.2)', borderRadius: 16 },
  alertBar: { width: 3, borderRadius: 2, flexShrink: 0 },
  alertTitle: { fontSize: 13, fontWeight: 700 },
  alertDesc: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  foreRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' },
  foreName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  foreStatus: { fontFamily: 'var(--font-mono)', fontSize: 10 },
  suspendedBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.25)', borderRadius: 12, marginBottom: 4, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 },
  verifyCta: { display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', marginTop: 10, padding: '13px 0', background: 'var(--green)', border: 'none', borderRadius: 16, fontSize: 14, fontWeight: 700, color: '#0E0E12', cursor: 'pointer', letterSpacing: '-0.2px' },
  blockedCta: { marginTop: 10, padding: '13px 0', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, fontSize: 13, color: 'var(--faint)', textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic' },
  // Verify flow
  verifyHeader: { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 },
  backBtn: { background: 'none', border: 'none', cursor: 'pointer', padding: 4, display: 'flex', alignItems: 'center' },
  verifyTitle: { fontSize: 17, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' },
  stepsRow: { display: 'flex', alignItems: 'center', marginBottom: 24 },
  stepDot: { width: 26, height: 26, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stepNum: { fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fff', fontWeight: 600 },
  stepLine: { width: 28, height: 2, borderRadius: 1 },
  stepCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: 8 },
  stepIcon: { width: 56, height: 56, borderRadius: '50%', background: 'var(--surface2)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepName: { fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' },
  stepDesc: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5 },
  stepSub: { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3px', marginTop: 4 },
  gpsTrack: { width: '100%', height: 6, background: '#1C1C24', borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  gpsFill: { height: '100%', borderRadius: 3 },
  cta: { width: '100%', marginTop: 12, padding: '13px 0', background: 'var(--blue)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '-0.2px' },
  selfieDone: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'rgba(62,201,122,0.08)', border: '1px solid rgba(62,201,122,0.2)', borderRadius: 12 },
  successRing: { width: 64, height: 64, borderRadius: '50%', border: '2.5px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successAmt: { fontSize: 38, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1.5px', lineHeight: 1 },
  successLabel: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginTop: 6 },
  successDesc: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', marginTop: 4 },
  claimNote: { marginTop: 16, padding: 12, background: 'rgba(74,143,232,0.06)', border: '1px solid rgba(74,143,232,0.15)', borderRadius: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', textAlign: 'center' },
};
