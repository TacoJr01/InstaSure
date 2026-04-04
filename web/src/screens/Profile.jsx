import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchUser, fetchGigTrust, fetchPayouts, fetchSettings, patchSettings, postLogout } from '../api.js';
import { useTheme } from '../App.jsx';

const MOCK_USER = { name: 'Rahul Sharma', initials: 'RS', platform: 'Swiggy', location: 'Chennai', zone: 'Velachery', upi: 'rahul@upi', workHours: '10 AM – 10 PM', memberSince: 'Jan 2024', premium: 40 };
const MOCK_GTS = {
  score: 742, tier: 'high', trend: '+12 this week', payoutMode: 'Instant payout unlocked',
  components: [
    { key: 'consistency', label: 'Work Consistency', score: 88 },
    { key: 'gps', label: 'GPS Integrity', score: 95 },
    { key: 'behavior', label: 'Behavioral Pattern', score: 82 },
    { key: 'claims', label: 'Claim History', score: 90 },
    { key: 'peer', label: 'Peer Comparison', score: 76 },
  ],
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const GTS_TIER = {
  high:   { color: 'var(--green)',  label: 'HIGH',   bg: 'rgba(62,201,122,0.10)',  desc: 'Instant payouts' },
  medium: { color: 'var(--amber)',  label: 'MEDIUM', bg: 'rgba(232,184,74,0.10)',  desc: 'Partial / delayed' },
  low:    { color: 'var(--coral)',  label: 'LOW',    bg: 'rgba(232,132,58,0.10)',  desc: 'Under review' },
};

function Toggle({ on, onChange }) {
  return (
    <motion.div
      onClick={() => onChange(!on)}
      style={{ ...ts.track, background: on ? 'var(--green)' : 'var(--surface2)', cursor: 'pointer' }}
      animate={{ background: on ? '#3EC97A' : '#1C1C22' }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        style={ts.thumb}
        animate={{ x: on ? 20 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.div>
  );
}

const ts = {
  track: { width: 46, height: 26, borderRadius: 13, padding: 3, flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center' },
  thumb: { width: 20, height: 20, borderRadius: '50%', background: '#fff', flexShrink: 0 },
};

export default function Profile({ dashboard, onLogout }) {
  const [user, setUser] = useState(MOCK_USER);
  const [gts, setGts] = useState(MOCK_GTS);
  const [payoutsData, setPayoutsData] = useState({ total: 950, count: 4 });
  const [settings, setSettings] = useState({ autoRenew: true, notifications: true, smartCoverage: true });
  const [gtsScore, setGtsScore] = useState(0);
  const { theme, toggle: toggleTheme } = useTheme();

  useEffect(() => {
    fetchUser().then(setUser).catch(() => {});
    fetchGigTrust().then(setGts).catch(() => {});
    fetchPayouts().then(d => setPayoutsData({ total: d.total, count: d.count })).catch(() => {});
    fetchSettings().then(setSettings).catch(() => {});
  }, []);

  // Animated GTS score counter
  useEffect(() => {
    const target = gts.score || 742;
    const duration = 1400;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setGtsScore(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    const raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [gts.score]);

  async function handleLogout() {
    try { await postLogout(); } catch {}
    if (onLogout) onLogout();
  }

  function handleToggle(key) {
    const updated = { ...settings, [key]: !settings[key] };
    setSettings(updated);
    patchSettings({ [key]: updated[key] }).catch(() => {});
  }

  const tier = GTS_TIER[gts.tier] || GTS_TIER.high;
  const suspended = dashboard?.suspended;
  const premium = user.premium || 40;
  const weeklyTotal = payoutsData.total || 950;
  const roi = premium > 0 ? (weeklyTotal / premium).toFixed(1) : '—';

  // Arc gauge math
  const FULL_ARC = Math.PI * 72; // semicircle, radius 72, ≈ 226.2
  const scorePct = ((gts.score || 742) - 300) / 600;
  const arcFill = Math.max(0, Math.min(scorePct, 1)) * FULL_ARC;

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
            <span>Your account is <strong style={{ color: 'var(--red)' }}>suspended</strong>. Contact support to reactivate.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Avatar + name */}
      <motion.div variants={item} style={s.avatarRow}>
        <motion.div
          style={s.avatar}
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, delay: 0.1 }}
          whileHover={{ scale: 1.08, rotate: 5 }}
        >
          <span style={s.avatarTxt}>{user.initials || 'RS'}</span>
        </motion.div>
        <div>
          <div style={s.userName}>{user.name}</div>
          <div style={s.userSub}>{user.platform} Partner · {user.location}</div>
          <div style={s.liveRow}>
            <motion.div
              style={{ ...s.liveDot, background: suspended ? 'var(--red)' : 'var(--green)' }}
              animate={suspended ? {} : { scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ ...s.liveTxt, color: suspended ? 'var(--red)' : 'var(--green)' }}>
              {suspended ? 'SUSPENDED' : 'ACTIVE PLAN'}
            </span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* GigTrust Score */}
      <motion.div variants={item}><div style={s.sectionLabel}>GIGTRUST SCORE</div></motion.div>
      <motion.div variants={item} style={s.gtsCard}>
        {/* Arc gauge */}
        <div style={s.gaugeWrap}>
          <svg width="160" height="90" viewBox="0 0 160 90" fill="none">
            {/* Background track */}
            <path d="M 8 88 A 72 72 0 0 1 152 88" stroke="#1C1C24" strokeWidth="12" strokeLinecap="round" fill="none"/>
            {/* Score fill */}
            <motion.path
              d="M 8 88 A 72 72 0 0 1 152 88"
              stroke={tier.color}
              strokeWidth="12"
              strokeLinecap="round"
              fill="none"
              initial={{ strokeDasharray: `0 ${FULL_ARC}` }}
              animate={{ strokeDasharray: `${arcFill} ${FULL_ARC}` }}
              transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
            />
            {/* Score labels */}
            <text x="4" y="88" fill="var(--faint)" fontSize="9" fontFamily="monospace">300</text>
            <text x="130" y="88" fill="var(--faint)" fontSize="9" fontFamily="monospace">900</text>
          </svg>
          <div style={s.gaugeCenter}>
            <motion.div style={{ ...s.gaugeScore, color: tier.color }}>{gtsScore}</motion.div>
            <div style={{ ...s.gaugeTier, background: tier.bg, color: tier.color }}>{tier.label}</div>
          </div>
        </div>

        {/* Payout mode + trend */}
        <div style={s.gtsInfo}>
          <div style={s.gtsModeRow}>
            <span style={s.gtsModeLabel}>{gts.payoutMode}</span>
            <span style={s.gtsTrend}>{gts.trend}</span>
          </div>
          <div style={{ ...s.gtsDesc, color: tier.color }}>{tier.desc}</div>
        </div>

        {/* Component breakdown */}
        <div style={s.components}>
          {gts.components.map((c, i) => (
            <motion.div
              key={c.key}
              style={s.compRow}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4 + i * 0.07 }}
            >
              <span style={s.compLabel}>{c.label}</span>
              <div style={s.compTrack}>
                <motion.div
                  style={{ ...s.compFill, background: c.score >= 85 ? 'var(--green)' : c.score >= 70 ? 'var(--amber)' : 'var(--coral)' }}
                  initial={{ width: 0 }}
                  animate={{ width: `${c.score}%` }}
                  transition={{ delay: 0.5 + i * 0.07, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                />
              </div>
              <span style={s.compScore}>{c.score}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Details */}
      <motion.div variants={item}><div style={s.sectionLabel}>YOUR DETAILS</div></motion.div>
      <motion.div variants={item} style={s.card}>
        {[
          { key: 'PLATFORM', val: user.platform },
          { key: 'LOCATION', val: `${user.zone}, ${user.location}` },
          { key: 'WORK HOURS', val: user.workHours },
          { key: 'UPI ID', val: user.upi },
          { key: 'MEMBER SINCE', val: user.memberSince },
        ].map(({ key, val }, i, arr) => (
          <motion.div
            key={key}
            style={{ ...s.row, borderBottom: i < arr.length - 1 ? '1px solid #13131A' : 'none' }}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <span style={s.rowKey}>{key}</span>
            <span style={s.rowVal}>{val}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Settings */}
      <motion.div variants={item}><div style={s.sectionLabel}>SETTINGS</div></motion.div>
      <motion.div variants={item} style={s.card}>
        {[
          { key: 'autoRenew', label: 'Auto renew', sub: 'Renews every Monday' },
          { key: 'notifications', label: 'Notifications', sub: 'Rain alerts, payouts' },
          { key: 'smartCoverage', label: 'Smart coverage', sub: 'Adjusts to your zone risk' },
        ].map(({ key, label, sub }, i, arr) => (
          <div key={key} style={{ ...s.row, alignItems: 'flex-start', borderBottom: i < arr.length - 1 ? '1px solid #13131A' : 'none' }}>
            <div style={{ flex: 1 }}>
              <div style={s.rowVal}>{label}</div>
              <div style={s.rowSub}>{sub}</div>
            </div>
            <Toggle on={settings[key]} onChange={() => handleToggle(key)} />
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Stats */}
      <motion.div variants={item}><div style={s.sectionLabel}>THIS WEEK</div></motion.div>
      <motion.div variants={item} style={s.statGrid}>
        {[
          { label: 'PREMIUM', val: `₹${premium}`, sub: 'paid this week', color: 'var(--text)' },
          { label: 'RECEIVED', val: `₹${weeklyTotal.toLocaleString('en-IN')}`, sub: `in ${payoutsData.count} payouts`, color: 'var(--green)' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            style={s.statCard}
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
            whileHover={{ scale: 1.04 }}
          >
            <div style={s.statLbl}>{stat.label}</div>
            <div style={{ ...s.statVal, color: stat.color }}>{stat.val}</div>
            <div style={s.statSub}>{stat.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.note}>
        You earned ₹{roi} for every ₹1 paid this week.
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Actions */}
      <motion.div variants={item} style={s.actionRow}>
        <motion.button
          onClick={toggleTheme}
          style={s.actionBtn}
          whileTap={{ scale: 0.95 }}
        >
          {theme === 'dark' ? (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="8" cy="8" r="3"/><path d="M8 1v1M8 14v1M1 8h1M14 8h1M3.05 3.05l.7.7M12.25 12.25l.7.7M3.05 12.95l.7-.7M12.25 3.75l.7-.7"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z"/>
            </svg>
          )}
          <span style={s.actionLabel}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
        </motion.button>

        <motion.button
          onClick={handleLogout}
          style={{ ...s.actionBtn, ...s.logoutBtn }}
          whileTap={{ scale: 0.95 }}
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--red)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/><path d="M11 11l3-3-3-3"/><path d="M14 8H6"/>
          </svg>
          <span style={{ ...s.actionLabel, color: 'var(--red)' }}>Sign out</span>
        </motion.button>
      </motion.div>

      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  suspendedBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.25)', borderRadius: 12, marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.4 },
  avatarRow: { display: 'flex', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottom: '1px solid var(--border)' },
  avatar: { width: 64, height: 64, borderRadius: '50%', background: 'var(--coral-dim)', border: '2px solid var(--coral)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, cursor: 'pointer' },
  avatarTxt: { fontSize: 22, fontWeight: 800, color: 'var(--coral)' },
  userName: { fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' },
  userSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', marginTop: 3 },
  liveRow: { display: 'flex', alignItems: 'center', gap: 6, marginTop: 6 },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  liveTxt: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)', letterSpacing: '0.8px' },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  // GigTrust card
  gtsCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '16px 16px 12px', overflow: 'hidden' },
  gaugeWrap: { position: 'relative', display: 'flex', justifyContent: 'center', marginBottom: 4 },
  gaugeCenter: { position: 'absolute', bottom: 4, left: 0, right: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  gaugeScore: { fontFamily: 'var(--font-sans)', fontSize: 28, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 },
  gaugeTier: { padding: '3px 10px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 700, letterSpacing: '0.8px' },
  gtsInfo: { marginTop: 8, marginBottom: 12 },
  gtsModeRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  gtsModeLabel: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  gtsTrend: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)' },
  gtsDesc: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, marginTop: 3 },
  components: { borderTop: '1px solid #13131A', paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 },
  compRow: { display: 'flex', alignItems: 'center', gap: 10 },
  compLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', width: 110, flexShrink: 0, letterSpacing: '0.2px' },
  compTrack: { flex: 1, height: 5, background: '#1C1C24', borderRadius: 3, overflow: 'hidden' },
  compFill: { height: '100%', borderRadius: 3 },
  compScore: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text2)', width: 24, textAlign: 'right', flexShrink: 0 },
  // Shared
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '4px 16px' },
  row: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 0' },
  rowKey: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)', letterSpacing: '0.5px' },
  rowVal: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  rowSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)', marginTop: 2 },
  statGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 },
  statCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: 14, cursor: 'default' },
  statLbl: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', marginBottom: 6 },
  statVal: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' },
  statSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--muted)', marginTop: 3 },
  note: { padding: 14, background: 'rgba(62,201,122,0.06)', border: '1px solid rgba(62,201,122,0.15)', borderRadius: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' },
  actionRow: { display: 'flex', gap: 10 },
  actionBtn: { flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '12px', borderRadius: 14, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' },
  logoutBtn: { border: '1px solid var(--red-dim)', background: 'var(--red-dim)' },
  actionLabel: { fontSize: 12, fontWeight: 600, color: 'var(--muted)', fontFamily: 'var(--font-mono)', letterSpacing: '0.2px' },
};
