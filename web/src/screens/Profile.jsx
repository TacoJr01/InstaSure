import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchUser } from '../api.js';

const MOCK_USER = { name: 'Rahul Sharma', initials: 'RS', platform: 'Swiggy', location: 'Chennai', zone: 'Velachery', upi: 'rahul@upi', workHours: '10 AM – 10 PM', memberSince: 'Jan 2024' };

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

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

export default function Profile() {
  const [user, setUser] = useState(MOCK_USER);
  const [settings, setSettings] = useState({ autoRenew: true, notifications: true, smartCoverage: true });

  useEffect(() => {
    fetchUser().then(setUser).catch(() => {});
  }, []);

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  return (
    <motion.div variants={container} initial="hidden" animate="show">

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
            <motion.div style={s.liveDot} animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }} transition={{ duration: 2, repeat: Infinity }} />
            <span style={s.liveTxt}>ACTIVE PLAN</span>
          </div>
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
            <Toggle on={settings[key]} onChange={() => toggle(key)} />
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Stats */}
      <motion.div variants={item}><div style={s.sectionLabel}>THIS WEEK</div></motion.div>
      <motion.div variants={item} style={s.statGrid}>
        {[
          { label: 'PREMIUM', val: '₹40', sub: 'paid this week', color: 'var(--text)' },
          { label: 'RECEIVED', val: '₹500', sub: 'in payouts', color: 'var(--green)' },
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
        You earned ₹12.5 for every ₹1 paid this week.
      </motion.div>
      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
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
};
