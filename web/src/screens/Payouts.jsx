import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPayouts } from '../api.js';

const MOCK_PAYOUTS = [
  { id: 'p1', amount: 300, reason: 'Rain payout', type: 'rain', date: 'Today', time: '11:42 AM', auto: true, status: 'paid' },
  { id: 'p2', amount: 200, reason: 'Low Orders', type: 'lowOrders', date: 'Yesterday', time: '9:05 PM', auto: true, status: 'paid' },
  { id: 'p3', amount: 300, reason: 'Rain payout', type: 'rain', date: 'Mon 14 Jan', time: '2:30 PM', auto: true, status: 'paid' },
  { id: 'p4', amount: 150, reason: 'Low Orders', type: 'lowOrders', date: 'Sun 13 Jan', time: '8:10 PM', auto: true, status: 'paid' },
];

const TYPE_META = {
  rain:      { label: 'Rain',       color: 'var(--blue)',   bg: 'var(--blue-dim)',   icon: RainIcon },
  lowOrders: { label: 'Low Orders', color: 'var(--amber)',  bg: 'var(--amber-dim)',  icon: ScooterIcon },
  curfew:    { label: 'Curfew',     color: 'var(--purple)', bg: 'var(--purple-dim)', icon: CurfewIcon },
  outage:    { label: 'Outage',     color: 'var(--coral)',  bg: 'var(--coral-dim)',  icon: OutageIcon },
};

const FILTERS = ['all', 'rain', 'lowOrders', 'curfew'];
const FILTER_LABELS = { all: 'All', rain: 'Rain', lowOrders: 'Low Orders', curfew: 'Curfew' };

function RainIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color || '#4A8FE8'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 13a4 4 0 01.5-7.9A5 5 0 0115 8h.5a3 3 0 010 6H5z"/>
      <line x1="7" y1="16" x2="7" y2="18"/><line x1="10" y1="16" x2="10" y2="18"/><line x1="13" y1="16" x2="13" y2="18"/>
    </svg>
  );
}

function ScooterIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color || '#E8B84A'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5" cy="15" r="2"/><circle cx="15" cy="15" r="2"/>
      <path d="M3 15H2V11l3-5h5v5H5"/><path d="M10 11h5l2 4h-4"/><path d="M10 6h3"/>
    </svg>
  );
}

function CurfewIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color || '#9B7AE8'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="7"/>
      <line x1="10" y1="3" x2="10" y2="10"/>
      <line x1="10" y1="10" x2="14" y2="10"/>
    </svg>
  );
}

function OutageIcon({ color }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color || '#E8843A'} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M13 3H7L3 10h5l-1 7 10-10h-5l1-4z"/>
    </svg>
  );
}

export default function Payouts({ dashboard }) {
  const [data, setData] = useState({ payouts: MOCK_PAYOUTS, total: 950, count: 4 });
  const [filter, setFilter] = useState('all');
  const [expanded, setExpanded] = useState(null);
  const [heroCount, setHeroCount] = useState(0);

  useEffect(() => {
    fetchPayouts().then(setData).catch(() => {});
  }, []);

  useEffect(() => {
    const target = data.total;
    const dur = 900;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setHeroCount(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [data.total]);

  const payouts = data.payouts || [];
  const filtered = filter === 'all' ? payouts : payouts.filter(p => p.type === filter);
  const suspended = dashboard?.suspended;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>

      {/* Hero */}
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
        <span style={s.liveTxt}>AUTO-PROCESSED · UPI</span>
      </motion.div>

      <div style={s.divider} />

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        style={s.filterRow}
      >
        {FILTERS.map(f => {
          const active = filter === f;
          const color = f === 'all' ? 'var(--green)' : TYPE_META[f]?.color;
          return (
            <motion.button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                ...s.filterBtn,
                background: active ? `${color}18` : 'transparent',
                border: `1px solid ${active ? `${color}40` : 'var(--border)'}`,
                color: active ? color : 'var(--muted)',
                fontWeight: active ? 600 : 400,
              }}
              whileTap={{ scale: 0.94 }}
            >
              {FILTER_LABELS[f]}
            </motion.button>
          );
        })}
      </motion.div>

      <div style={s.sectionLabel}>PAYOUT HISTORY</div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={s.empty}
          >
            No {FILTER_LABELS[filter].toLowerCase()} payouts yet
          </motion.div>
        )}

        {filtered.map((p, i) => {
          const meta = TYPE_META[p.type] || TYPE_META.rain;
          const Icon = meta.icon;
          const isExpanded = expanded === p.id;
          const isRejected = p.status === 'rejected';

          return (
            <motion.div
              key={p.id}
              layout
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: isRejected ? 0.4 : 1, x: 0 }}
              exit={{ opacity: 0, x: 20, height: 0 }}
              transition={{ delay: i * 0.06, type: 'spring', stiffness: 280 }}
              style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none' }}
            >
              {/* Row */}
              <motion.div
                style={s.payoutItem}
                onClick={() => setExpanded(isExpanded ? null : p.id)}
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.98 }}
              >
                <motion.div
                  style={{ ...s.iconWrap, background: meta.bg }}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: 'spring', stiffness: 400 }}
                >
                  <Icon color={meta.color} />
                </motion.div>
                <div style={s.payoutInfo}>
                  <div style={s.payoutReason}>{p.reason}</div>
                  <div style={s.payoutDate}>{p.date} · {p.time}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
                  <motion.div
                    style={{ ...s.payoutAmt, color: isRejected ? 'var(--muted)' : 'var(--green)', textDecoration: isRejected ? 'line-through' : 'none' }}
                    initial={{ scale: 0.7 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.1 + i * 0.06, type: 'spring', stiffness: 400 }}
                  >
                    +₹{p.amount}
                  </motion.div>
                  <div style={{ ...s.statusPill, background: isRejected ? 'var(--red-dim)' : 'var(--green-dim)', color: isRejected ? 'var(--red)' : 'var(--green)', border: `1px solid ${isRejected ? 'rgba(232,90,74,0.2)' : 'rgba(62,201,122,0.2)'}` }}>
                    {isRejected ? 'Rejected' : 'Paid'}
                  </div>
                </div>
              </motion.div>

              {/* Expanded detail */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                    style={{ overflow: 'hidden' }}
                  >
                    <div style={s.detail}>
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Trigger</span>
                        <span style={{ ...s.detailVal, color: meta.color }}>{meta.label}</span>
                      </div>
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Method</span>
                        <span style={s.detailVal}>{p.auto ? 'Automatic' : 'Verified'}</span>
                      </div>
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Amount</span>
                        <span style={s.detailVal}>₹{p.amount}</span>
                      </div>
                      <div style={s.detailRow}>
                        <span style={s.detailKey}>Status</span>
                        <span style={{ ...s.detailVal, color: isRejected ? 'var(--red)' : 'var(--green)' }}>
                          {isRejected ? 'Rejected by admin' : 'Credited to UPI'}
                        </span>
                      </div>
                      {p.txId && (
                        <div style={s.detailRow}>
                          <span style={s.detailKey}>Txn ID</span>
                          <span style={{ ...s.detailVal, fontFamily: 'var(--font-mono)', fontSize: 10 }}>{p.txId}</span>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </AnimatePresence>

      <div style={s.divider} />
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
        style={s.note}
      >
        No need to apply.{'\n'}Money is added to your UPI automatically.
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
  filterRow: { display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' },
  filterBtn: { padding: '5px 12px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 9, letterSpacing: '0.3px', cursor: 'pointer', transition: 'all 0.15s' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  payoutItem: { display: 'flex', alignItems: 'center', gap: 14, padding: '14px 0', cursor: 'pointer' },
  iconWrap: { width: 40, height: 40, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  payoutInfo: { flex: 1 },
  payoutReason: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  payoutDate: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', marginTop: 2 },
  payoutAmt: { fontSize: 18, fontWeight: 900, letterSpacing: '-0.5px' },
  statusPill: { fontFamily: 'var(--font-mono)', fontSize: 8, letterSpacing: '0.3px', padding: '2px 7px', borderRadius: 10 },
  detail: { background: 'var(--surface)', borderRadius: 12, padding: '10px 14px', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  detailRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  detailKey: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.5px' },
  detailVal: { fontSize: 11, fontWeight: 600, color: 'var(--text2)' },
  empty: { textAlign: 'center', padding: '32px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)' },
  note: { padding: 14, background: 'rgba(62,201,122,0.06)', border: '1px solid rgba(62,201,122,0.15)', borderRadius: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.6, textAlign: 'center', whiteSpace: 'pre-line' },
};
