import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchPayouts } from '../api.js';

const MOCK_PAYOUTS = [
  { id: 'p1', amount: 300, reason: 'Rain payout', type: 'rain', date: 'Today', time: '11:42 AM', auto: true },
  { id: 'p2', amount: 200, reason: 'Low Orders', type: 'lowOrders', date: 'Yesterday', time: '9:05 PM', auto: true },
  { id: 'p3', amount: 300, reason: 'Rain payout', type: 'rain', date: 'Mon 14 Jan', time: '2:30 PM', auto: true },
  { id: 'p4', amount: 150, reason: 'Low Orders', type: 'lowOrders', date: 'Sun 13 Jan', time: '8:10 PM', auto: true },
];

const RainIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#4A8FE8" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <path d="M5 13a4 4 0 01.5-7.9A5 5 0 0115 8h.5a3 3 0 010 6H5z"/>
    <line x1="7" y1="16" x2="7" y2="18"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="13" y1="16" x2="13" y2="18"/>
  </svg>
);

const ScooterIcon = () => (
  <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#E8B84A" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="15" r="2"/><circle cx="15" cy="15" r="2"/>
    <path d="M3 15H2V11l3-5h5v5H5"/><path d="M10 11h5l2 4h-4"/><path d="M10 6h3"/>
  </svg>
);

export default function Payouts() {
  const [data, setData] = useState({ payouts: MOCK_PAYOUTS, total: 950, count: 4 });

  useEffect(() => {
    fetchPayouts().then(setData).catch(() => {});
  }, []);

  const [heroCount, setHeroCount] = useState(0);
  useEffect(() => {
    const target = data.total;
    const dur = 1000;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setHeroCount(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [data.total]);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <div style={s.eyebrow}>your earnings</div>
        <div style={s.hero}>₹{heroCount.toLocaleString('en-IN')}</div>
        <div style={s.sub}>received this week · {data.count} payouts</div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }}
        style={s.liveRow}
      >
        <motion.div
          style={s.liveDot}
          animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <span style={s.liveTxt}>AUTO-PROCESSED</span>
      </motion.div>

      <div style={s.divider} />

      <div style={s.sectionLabel}>PAYOUT HISTORY</div>

      {data.payouts.map((p, i) => (
        <motion.div
          key={p.id}
          style={{ ...s.payoutItem, opacity: i > 1 ? 0.45 : 1, borderBottom: i < data.payouts.length - 1 ? '1px solid var(--border)' : 'none' }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: i > 1 ? 0.45 : 1, x: 0 }}
          transition={{ delay: 0.1 + i * 0.09, type: 'spring', stiffness: 280 }}
          whileHover={{ x: 4, opacity: 1 }}
        >
          <motion.div
            style={{ ...s.iconWrap, background: p.type === 'rain' ? 'var(--blue-dim)' : 'var(--amber-dim)' }}
            whileHover={{ scale: 1.1, rotate: 5 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            {p.type === 'rain' ? <RainIcon /> : <ScooterIcon />}
          </motion.div>
          <div style={s.payoutInfo}>
            <div style={s.payoutReason}>{p.reason}</div>
            <div style={s.payoutDate}>{p.date} · {p.time} · Automatic</div>
          </div>
          <motion.div
            style={s.payoutAmt}
            initial={{ scale: 0.7 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.15 + i * 0.09, type: 'spring', stiffness: 400 }}
          >
            +₹{p.amount}
          </motion.div>
        </motion.div>
      ))}

      <div style={s.divider} />
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
        style={s.note}
      >
        No need to apply.<br/>Money is added to your UPI automatically.
      </motion.div>
      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  eyebrow: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)' },
  hero: { fontSize: 48, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', lineHeight: 1, marginTop: 4 },
  sub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faint)', marginTop: 4 },
  liveRow: { display: 'flex', alignItems: 'center', gap: 8, marginTop: 10 },
  liveDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  liveTxt: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '1px' },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  payoutItem: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: 'pointer' },
  iconWrap: { width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  payoutInfo: { flex: 1 },
  payoutReason: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  payoutDate: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 2 },
  payoutAmt: { fontSize: 18, fontWeight: 900, color: 'var(--green)', letterSpacing: '-0.5px' },
  note: { padding: 14, background: 'rgba(62,201,122,0.06)', border: '1px solid rgba(62,201,122,0.15)', borderRadius: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center' },
};
