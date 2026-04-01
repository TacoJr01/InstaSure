import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchPayouts, patchPayout } from '../api.js';

const MOCK = [
  { id: 'ap1', workerId: 'u1', workerName: 'Rahul Sharma',   platform: 'Swiggy', amount: 300, type: 'rain',      reason: 'Rain',       date: 'Today',      time: '11:42 AM', auto: true,  status: 'paid'   },
  { id: 'ap2', workerId: 'u4', workerName: 'Deepa Krishnan', platform: 'Swiggy', amount: 250, type: 'rain',      reason: 'Rain',       date: 'Today',      time: '11:40 AM', auto: true,  status: 'paid'   },
  { id: 'ap3', workerId: 'u7', workerName: 'Karan Singh',    platform: 'Swiggy', amount: 250, type: 'rain',      reason: 'Rain',       date: 'Today',      time: '11:38 AM', auto: true,  status: 'paid'   },
  { id: 'ap4', workerId: 'u1', workerName: 'Rahul Sharma',   platform: 'Swiggy', amount: 200, type: 'lowOrders', reason: 'Low Orders', date: 'Yesterday',  time: '9:05 PM',  auto: false, status: 'paid'   },
  { id: 'ap5', workerId: 'u2', workerName: 'Priya Nair',     platform: 'Zomato', amount: 200, type: 'lowOrders', reason: 'Low Orders', date: 'Yesterday',  time: '8:30 PM',  auto: false, status: 'paid'   },
  { id: 'ap6', workerId: 'u8', workerName: 'Meera Iyer',     platform: 'Zepto',  amount: 180, type: 'lowOrders', reason: 'Low Orders', date: 'Yesterday',  time: '7:55 PM',  auto: false, status: 'paid'   },
  { id: 'ap7', workerId: 'u5', workerName: 'Ravi Teja',      platform: 'Amazon', amount: 150, type: 'lowOrders', reason: 'Low Orders', date: 'Mon 14 Jan', time: '6:20 PM',  auto: true,  status: 'paid'   },
  { id: 'ap8', workerId: 'u3', workerName: 'Arjun Mehta',    platform: 'Zepto',  amount: 300, type: 'rain',      reason: 'Rain',       date: 'Mon 14 Jan', time: '2:10 PM',  auto: false, status: 'held'   },
  { id: 'ap9', workerId: 'u6', workerName: 'Sneha Patel',    platform: 'Zomato', amount: 200, type: 'lowOrders', reason: 'Low Orders', date: 'Sun 13 Jan', time: '5:45 PM',  auto: false, status: 'held'   },
];

const TYPE_COLORS  = { rain: 'var(--blue)', lowOrders: 'var(--amber)', curfew: 'var(--purple)' };
const TYPE_LABELS  = { rain: 'Rain', lowOrders: 'Low Orders', curfew: 'Curfew' };
const PLAT_COLORS  = { Swiggy: '#FC8019', Zomato: '#E23744', Zepto: '#7B2EF7', Amazon: '#FF9900' };
const FILTERS      = [
  { id: 'all', label: 'All' }, { id: 'held', label: 'Held' },
  { id: 'rain', label: 'Rain' }, { id: 'lowOrders', label: 'Low Orders' },
  { id: 'rejected', label: 'Rejected' },
];

export default function Payouts() {
  const [data, setData]     = useState({ payouts: MOCK, total: 0 });
  const [filter, setFilter] = useState('all');
  const [acting, setActing] = useState(null); // payoutId being actioned

  useEffect(() => { fetchPayouts().then(setData).catch(() => {}); }, []);

  async function handleAction(payoutId, action) {
    setActing(payoutId);
    try {
      const updated = await patchPayout(payoutId, action);
      setData(prev => ({
        ...prev,
        payouts: prev.payouts.map(p => p.id === payoutId ? { ...p, status: updated.status } : p),
      }));
    } catch {}
    setActing(null);
  }

  const list = data.payouts.filter(p => {
    if (filter === 'all')      return true;
    if (filter === 'held')     return p.status === 'held';
    if (filter === 'rejected') return p.status === 'rejected';
    return p.type === filter;
  });

  const paid     = data.payouts.filter(p => p.status === 'paid');
  const held     = data.payouts.filter(p => p.status === 'held');
  const rejected = data.payouts.filter(p => p.status === 'rejected');

  return (
    <div>
      {/* Held banner */}
      <AnimatePresence>
        {held.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={s.heldBanner}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--amber)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="2" width="10" height="10" rx="2"/>
              <line x1="7" y1="5" x2="7" y2="7.5"/><circle cx="7" cy="9.5" r="0.6" fill="var(--amber)"/>
            </svg>
            <span>
              <strong style={{ color: 'var(--amber)' }}>{held.length} payout{held.length > 1 ? 's' : ''} held</strong>
              {' '}pending admin review — resolve fraud flags to release or reject
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Summary */}
      <div style={s.summaryRow}>
        {[
          { label: 'DISBURSED',  val: `₹${paid.reduce((s,p)=>s+p.amount,0).toLocaleString('en-IN')}`, color: 'var(--green)' },
          { label: 'PAID',       val: paid.length,     color: 'var(--text)'  },
          { label: 'HELD',       val: held.length,     color: 'var(--amber)' },
          { label: 'REJECTED',   val: rejected.length, color: 'var(--coral)' },
        ].map((s2, i) => (
          <motion.div key={s2.label} style={s.summaryCard}
            initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.06 }}>
            <div style={s.summaryLabel}>{s2.label}</div>
            <div style={{ ...s.summaryVal, color: s2.color }}>{s2.val}</div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div style={s.filterRow}>
        {FILTERS.map(f => {
          const count = f.id === 'all' ? data.payouts.length
            : f.id === 'held' ? held.length
            : f.id === 'rejected' ? rejected.length
            : data.payouts.filter(p => p.type === f.id).length;
          const active = filter === f.id;
          return (
            <button key={f.id} style={{ ...s.filterBtn, background: active ? 'var(--surface3)' : 'transparent', color: active ? 'var(--text)' : 'var(--muted)', borderColor: active ? 'var(--border2)' : 'transparent' }}
              onClick={() => setFilter(f.id)}>
              {f.label} <span style={s.filterCount}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Worker', 'Platform', 'Amount', 'Type', 'Date / Time', 'Method', 'Status', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {list.map((p, i) => (
                <motion.tr key={p.id}
                  style={{ ...s.tr, borderBottom: i < list.length - 1 ? '1px solid var(--border)' : 'none' }}
                  initial={{ opacity: 0, x: -10 }} animate={{ opacity: p.status === 'rejected' ? 0.45 : 1, x: 0 }}
                  exit={{ opacity: 0 }} transition={{ delay: i * 0.04 }}>
                  <td style={s.td}>
                    <div style={s.workerCell}>
                      <div style={{ ...s.avatar, color: PLAT_COLORS[p.platform], background: `${PLAT_COLORS[p.platform]}18`, border: `1px solid ${PLAT_COLORS[p.platform]}35` }}>
                        {p.workerName.split(' ').map(n => n[0]).join('')}
                      </div>
                      <span style={s.workerName}>{p.workerName}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={{ ...s.platformBadge, color: PLAT_COLORS[p.platform], background: `${PLAT_COLORS[p.platform]}15` }}>{p.platform}</span></td>
                  <td style={s.td}><span style={{ ...s.amount, color: p.status === 'held' ? 'var(--amber)' : p.status === 'rejected' ? 'var(--faint)' : 'var(--green)' }}>+₹{p.amount}</span></td>
                  <td style={s.td}>
                    <div style={s.typeCell}>
                      <div style={{ ...s.typeDot, background: TYPE_COLORS[p.type] }} />
                      <span style={{ ...s.typeLabel, color: TYPE_COLORS[p.type] }}>{TYPE_LABELS[p.type]}</span>
                    </div>
                  </td>
                  <td style={s.td}><span style={s.dateCell}>{p.date} · {p.time}</span></td>
                  <td style={s.td}>
                    <span style={{ ...s.methodBadge, background: p.auto ? 'var(--blue-dim)' : 'var(--purple-dim)', color: p.auto ? 'var(--blue)' : 'var(--purple)', border: `1px solid ${p.auto ? 'rgba(74,143,232,0.2)' : 'rgba(155,122,232,0.2)'}` }}>
                      {p.auto ? 'Auto' : 'Verified'}
                    </span>
                  </td>
                  <td style={s.td}>
                    <span style={{
                      ...s.statusBadge,
                      background: p.status === 'paid' ? 'var(--green-dim)' : p.status === 'held' ? 'var(--amber-dim)' : 'var(--red-dim)',
                      color: p.status === 'paid' ? 'var(--green)' : p.status === 'held' ? 'var(--amber)' : 'var(--red)',
                      border: `1px solid ${p.status === 'paid' ? 'rgba(62,201,122,0.2)' : p.status === 'held' ? 'rgba(232,184,74,0.2)' : 'rgba(232,90,74,0.2)'}`,
                    }}>
                      {p.status === 'paid' ? '✓ Paid' : p.status === 'held' ? '⏸ Held' : '✕ Rejected'}
                    </span>
                  </td>
                  <td style={s.td}>
                    {p.status === 'held' ? (
                      <div style={s.actionBtns}>
                        <motion.button
                          style={{ ...s.actionBtn, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(62,201,122,0.25)', opacity: acting === p.id ? 0.6 : 1 }}
                          onClick={() => handleAction(p.id, 'approve')}
                          disabled={!!acting}
                          whileTap={{ scale: 0.94 }}
                        >
                          {acting === p.id ? '…' : 'Approve'}
                        </motion.button>
                        <motion.button
                          style={{ ...s.actionBtn, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(232,90,74,0.25)', opacity: acting === p.id ? 0.6 : 1 }}
                          onClick={() => handleAction(p.id, 'reject')}
                          disabled={!!acting}
                          whileTap={{ scale: 0.94 }}
                        >
                          {acting === p.id ? '…' : 'Reject'}
                        </motion.button>
                      </div>
                    ) : (
                      <span style={s.noAction}>—</span>
                    )}
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
        {list.length === 0 && (
          <div style={s.emptyState}>No payouts in this category</div>
        )}
      </div>
    </div>
  );
}

const s = {
  heldBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--amber-dim)', border: '1px solid rgba(232,184,74,0.25)', borderRadius: 12, marginBottom: 20, fontSize: 13, color: 'var(--text2)' },
  summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 14, marginBottom: 22 },
  summaryCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 12, padding: '14px 18px' },
  summaryLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', marginBottom: 8 },
  summaryVal: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.8px' },
  filterRow: { display: 'flex', alignItems: 'center', gap: 4, marginBottom: 16 },
  filterBtn: { display: 'flex', alignItems: 'center', gap: 7, padding: '7px 13px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' },
  filterCount: { fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.7 },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', textAlign: 'left', padding: '13px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' },
  tr: {},
  td: { padding: '11px 14px', verticalAlign: 'middle' },
  workerCell: { display: 'flex', alignItems: 'center', gap: 9 },
  avatar: { width: 30, height: 30, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, flexShrink: 0 },
  workerName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  platformBadge: { fontFamily: 'var(--font-mono)', fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 500 },
  amount: { fontSize: 15, fontWeight: 900, letterSpacing: '-0.5px' },
  typeCell: { display: 'flex', alignItems: 'center', gap: 7 },
  typeDot: { width: 6, height: 6, borderRadius: '50%', flexShrink: 0 },
  typeLabel: { fontFamily: 'var(--font-mono)', fontSize: 10, fontWeight: 500 },
  dateCell: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
  methodBadge: { fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 6, letterSpacing: '0.3px' },
  statusBadge: { fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.3px' },
  actionBtns: { display: 'flex', gap: 6 },
  actionBtn: { padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  noAction: { color: 'var(--faint)', fontFamily: 'var(--font-mono)', fontSize: 12 },
  emptyState: { padding: '40px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faint)' },
};
