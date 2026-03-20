import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchActivity } from '../api.js';

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

export default function Activity() {
  const [data, setData] = useState(MOCK);

  useEffect(() => {
    fetchActivity().then(setData).catch(() => {});
  }, []);

  const maxOrders = Math.max(...data.week.map(w => w.orders));

  return (
    <motion.div variants={container} initial="hidden" animate="show">

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
          { label: 'STATUS', val: data.compensationEligible ? '✓' : '—', color: 'var(--green)', sub: 'comp. eligible', small: true },
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

      {/* Compensation alert */}
      {data.compensationEligible && (
        <motion.div
          variants={item}
          style={s.greenAlert}
          animate={{ boxShadow: ['0 0 0 0 rgba(62,201,122,0)', '0 0 0 6px rgba(62,201,122,0.08)', '0 0 0 0 rgba(62,201,122,0)'] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div style={{ ...s.alertBar, background: 'var(--green)' }} />
          <div>
            <div style={{ ...s.alertTitle, color: 'var(--green)' }}>Compensation likely</div>
            <div style={s.alertDesc}>Drop &gt;50% detected. Payout processing.</div>
          </div>
        </motion.div>
      )}

      <motion.div variants={item} style={s.divider} />

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
};
