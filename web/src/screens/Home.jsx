import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };
const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const shieldColors = { rain: 'var(--blue)', lowOrders: 'var(--green)', pollution: 'var(--amber)', curfew: 'var(--purple)' };
const shieldLabels = { rain: 'Rain', lowOrders: 'Low Orders', pollution: 'Pollution', curfew: 'Curfew' };

const GTS_TIER = {
  high:   { color: 'var(--green)',  label: 'HIGH',   bg: 'rgba(62,201,122,0.10)' },
  medium: { color: 'var(--amber)',  label: 'MED',    bg: 'rgba(232,184,74,0.10)' },
  low:    { color: 'var(--coral)',  label: 'LOW',    bg: 'rgba(232,132,58,0.10)' },
};

export default function Home({ dashboard }) {
  const [count, setCount] = useState(0);
  const [gtsCount, setGtsCount] = useState(0);
  const [dismissedIds, setDismissedIds] = useState([]);

  const d = dashboard || {};
  const target = d.weeklyProtected || 1240;
  const gts = d.gigTrust || { score: 742, tier: 'high', trend: '+12 this week', payoutMode: 'Instant payout unlocked' };

  // Animated counter — weekly protected
  useEffect(() => {
    const duration = 1200;
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);

  // Animated counter — GigTrust score
  useEffect(() => {
    const duration = 1400;
    const start = Date.now();
    const scoreTarget = gts.score || 742;
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      setGtsCount(Math.round(scoreTarget * ease));
      if (progress < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gts.score]);

  const pct = d.weeklyUsagePct || 83;
  const protection = d.protection || {};
  const lastPayout = d.lastPayout || { amount: 300, reason: 'Rain', date: 'Today' };
  const visibleAlerts = (d.alerts || []).filter(a => !dismissedIds.includes(a.id)).slice(0, 3);
  const tier = GTS_TIER[gts.tier] || GTS_TIER.high;

  // Arc gauge values
  const FULL_ARC = Math.PI * 44; // semicircle circumference ≈ 138.2
  const scorePct = ((gts.score || 742) - 300) / 600;
  const arcFill = scorePct * FULL_ARC;

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* Greeting */}
      <motion.div variants={item}>
        <div style={s.eyebrow}>{d.user?.name || 'Rahul Sharma'} · {d.user?.platform || 'Swiggy'}</div>
      </motion.div>

      {/* Hero amount */}
      <motion.div variants={item} style={{ marginTop: 4 }}>
        <div style={s.heroAmount}>
          ₹{count.toLocaleString('en-IN')}
        </div>
        <div style={s.heroSub}>shielded this week</div>
      </motion.div>

      {/* Live badge */}
      <motion.div variants={item} style={s.liveRow}>
        <motion.div
          style={s.liveDot}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        />
        <span style={s.liveTxt}>PROTECTED</span>
      </motion.div>

      {/* Progress bar */}
      <motion.div variants={item} style={s.progWrap}>
        <div style={s.progHeader}>
          <span style={s.progLbl}>WEEKLY USAGE</span>
          <span style={s.progVal}>{pct}%</span>
        </div>
        <div style={s.progTrack}>
          <motion.div
            style={s.progFill}
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
          />
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Alerts */}
      <AnimatePresence>
        {visibleAlerts.map((a) => (
          <motion.div
            key={a.id}
            variants={item}
            style={{ ...s.alertStrip, marginBottom: 8 }}
            whileHover={{ scale: 1.01 }}
            transition={{ type: 'spring', stiffness: 400 }}
            layout
            exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
          >
            <div style={s.alertBar} />
            <div style={{ flex: 1 }}>
              <div style={s.alertTitle}>{a.title}</div>
              <div style={s.alertDesc}>{a.message}</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
              <motion.button
                onClick={(e) => { e.stopPropagation(); setDismissedIds(prev => [...prev, a.id]); }}
                style={s.dismissBtn}
                whileTap={{ scale: 0.85 }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
                  <line x1="1" y1="1" x2="9" y2="9"/><line x1="9" y1="1" x2="1" y2="9"/>
                </svg>
              </motion.button>
              <div style={s.alertBadge}>{a.badge}</div>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {visibleAlerts.length > 0 && <motion.div variants={item} style={s.divider} />}

      {/* Shields */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>ACTIVE SHIELDS</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        {Object.entries(protection).map(([key, status], i) => (
          <motion.div
            key={key}
            style={{ ...s.shieldRow, borderBottom: i < Object.keys(protection).length - 1 ? '1px solid #13131A' : 'none' }}
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 + i * 0.07 }}
          >
            <div style={s.shieldLeft}>
              <motion.div
                style={{ ...s.shieldDot, background: shieldColors[key] }}
                animate={status === 'active' ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
              />
              <span style={s.shieldName}>{shieldLabels[key]}</span>
            </div>
            <span style={{ ...s.shieldStatus, color: status === 'active' ? shieldColors[key] : 'var(--amber)' }}>
              {status === 'active' ? 'ON' : '—'}
            </span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Last payout */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>LAST PAYOUT</div>
      </motion.div>
      <motion.div
        variants={item}
        style={s.payoutCard}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        <div>
          <div style={s.payoutLabel}>last payout</div>
          <motion.div
            style={s.payoutAmt}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: 'spring', stiffness: 300, delay: 0.5 }}
          >
            +₹{lastPayout.amount}
          </motion.div>
          <div style={s.payoutMeta}>{lastPayout.reason} · {lastPayout.date} · Auto</div>
        </div>
        <motion.div
          style={s.checkRing}
          initial={{ scale: 0, rotate: -90 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.6 }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--green)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="3,8 7,12 13,5"/>
          </svg>
        </motion.div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* GigTrust Score mini card */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>GIGTRUST SCORE</div>
      </motion.div>
      <motion.div
        variants={item}
        style={s.gtsCard}
        whileHover={{ scale: 1.02 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Mini arc gauge */}
        <div style={s.gtsLeft}>
          <svg width="88" height="50" viewBox="0 0 100 56" fill="none">
            {/* Background track */}
            <path
              d="M 6 52 A 44 44 0 0 1 94 52"
              stroke="#1C1C24"
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
            />
            {/* Score fill */}
            <motion.path
              d="M 6 52 A 44 44 0 0 1 94 52"
              stroke={tier.color}
              strokeWidth="10"
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDasharray: `0 ${FULL_ARC}` }}
              animate={{ strokeDasharray: `${arcFill} ${FULL_ARC}` }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.4 }}
            />
          </svg>
          <div style={s.gtsScoreWrap}>
            <span style={{ ...s.gtsScore, color: tier.color }}>{gtsCount}</span>
          </div>
        </div>
        <div style={s.gtsRight}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 5 }}>
            <span style={{ ...s.gtsTierBadge, background: tier.bg, color: tier.color }}>{tier.label}</span>
            <span style={s.gtsTrend}>{gts.trend}</span>
          </div>
          <div style={s.gtsMode}>{gts.payoutMode}</div>
          <div style={s.gtsRange}>Score range 300 – 900</div>
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />
      <motion.div variants={item} style={s.note}>
        Money is added automatically.<br/>No application needed.
      </motion.div>
      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  eyebrow: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', letterSpacing: '0.2px' },
  heroAmount: { fontFamily: 'var(--font-sans)', fontSize: 52, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', lineHeight: 1, marginTop: 4 },
  heroSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faint)', marginTop: 4 },
  liveRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  liveTxt: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '1px' },
  progWrap: { marginTop: 16 },
  progHeader: { display: 'flex', justifyContent: 'space-between', marginBottom: 7 },
  progLbl: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px' },
  progVal: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)' },
  progTrack: { height: 3, background: '#1C1C24', borderRadius: 2, overflow: 'hidden' },
  progFill: { height: '100%', background: 'var(--text)', borderRadius: 2 },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  alertStrip: { display: 'flex', gap: 12, alignItems: 'stretch', padding: 14, background: 'rgba(232,132,58,0.06)', border: '1px solid rgba(232,132,58,0.2)', borderRadius: 16, cursor: 'pointer' },
  alertBar: { width: 3, background: 'var(--coral)', borderRadius: 2, flexShrink: 0 },
  alertTitle: { fontSize: 13, fontWeight: 700, color: 'var(--coral)' },
  alertDesc: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  alertBadge: { padding: '4px 10px', background: 'var(--coral)', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 8, color: '#fff', letterSpacing: '0.5px', alignSelf: 'center', whiteSpace: 'nowrap' },
  dismissBtn: { width: 20, height: 20, borderRadius: '50%', border: '1px solid var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', padding: 0, flexShrink: 0 },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 16px' },
  shieldRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' },
  shieldLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  shieldDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  shieldName: { fontSize: 14, fontWeight: 600, color: 'var(--text2)' },
  shieldStatus: { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.5px' },
  payoutCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer' },
  payoutLabel: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--faint)' },
  payoutAmt: { fontSize: 32, fontWeight: 900, color: 'var(--green)', letterSpacing: '-1px', lineHeight: 1.1, marginTop: 2 },
  payoutMeta: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', marginTop: 3 },
  checkRing: { width: 38, height: 38, borderRadius: '50%', border: '2px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // GigTrust card
  gtsCard: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, cursor: 'pointer' },
  gtsLeft: { position: 'relative', flexShrink: 0 },
  gtsScoreWrap: { position: 'absolute', bottom: -2, left: 0, right: 0, display: 'flex', justifyContent: 'center' },
  gtsScore: { fontFamily: 'var(--font-sans)', fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' },
  gtsRight: { flex: 1 },
  gtsTierBadge: { padding: '3px 9px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, letterSpacing: '0.8px' },
  gtsTrend: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)' },
  gtsMode: { fontSize: 13, fontWeight: 700, color: 'var(--text)', marginBottom: 3 },
  gtsRange: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)' },
  note: { padding: 14, background: 'rgba(62,201,122,0.06)', border: '1px solid rgba(62,201,122,0.15)', borderRadius: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' },
};
