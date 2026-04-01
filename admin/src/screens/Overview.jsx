import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchStats, fetchPayouts, fetchAlerts } from '../api.js';

const MOCK_STATS = {
  totalWorkers: 8, activeWorkers: 6, flaggedWorkers: 2,
  totalPayouts: 7, totalDisbursed: 2430, heldPayouts: 2,
  gtsDistribution: { high: 3, medium: 3, low: 2 }, avgGts: 621,
};

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

function AnimCount({ target, prefix = '', duration = 1000 }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / duration, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <>{prefix}{val.toLocaleString('en-IN')}</>;
}

const TYPE_COLORS = { rain: 'var(--blue)', lowOrders: 'var(--amber)', curfew: 'var(--purple)', pollution: 'var(--muted)' };
const TYPE_LABELS = { rain: 'Rain', lowOrders: 'Low Orders', curfew: 'Curfew', pollution: 'Pollution' };

export default function Overview() {
  const [stats, setStats] = useState(MOCK_STATS);
  const [payoutsData, setPayoutsData] = useState({ payouts: [], total: 0 });
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    function load() {
      fetchStats().then(setStats).catch(() => {});
      fetchPayouts().then(setPayoutsData).catch(() => {});
      fetchAlerts().then(setAlerts).catch(() => {});
    }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, []);

  const recent = payoutsData.payouts.slice(0, 5);
  const gts = stats.gtsDistribution || { high: 0, medium: 0, low: 0 };
  const gtsTotal = gts.high + gts.medium + gts.low || 1;
  const activeAlerts = alerts.filter(a => a.active);

  const kpis = [
    { label: 'Total Workers',     val: stats.totalWorkers,   sub: `${stats.flaggedWorkers} flagged`,   color: 'var(--text)',   accent: 'var(--coral)' },
    { label: 'Payouts This Week', val: stats.totalPayouts,   sub: `${stats.heldPayouts} held`,         color: 'var(--green)',  accent: 'var(--green)' },
    { label: 'Amount Disbursed',  val: stats.totalDisbursed, sub: 'this week',                         color: 'var(--blue)',   accent: 'var(--blue)', prefix: '₹' },
    { label: 'Avg GigTrust',      val: stats.avgGts,         sub: 'across all workers',               color: 'var(--purple)', accent: 'var(--purple)' },
  ];

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* KPI cards */}
      <motion.div variants={item} style={s.kpiGrid}>
        {kpis.map((k, i) => (
          <motion.div
            key={k.label}
            style={{ ...s.kpiCard, borderTop: `2px solid ${k.accent}` }}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300 }}
            whileHover={{ y: -2 }}
          >
            <div style={s.kpiLabel}>{k.label}</div>
            <div style={{ ...s.kpiVal, color: k.color }}>
              <AnimCount target={k.val} prefix={k.prefix || ''} />
            </div>
            <div style={s.kpiSub}>{k.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <div style={s.row}>
        {/* GigTrust Distribution */}
        <motion.div variants={item} style={{ ...s.card, flex: 1 }}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>GigTrust Distribution</span>
            <span style={s.cardSub}>{stats.totalWorkers} workers</span>
          </div>
          <div style={s.gtsChart}>
            {[
              { tier: 'HIGH',   key: 'high',   color: 'var(--green)',  count: gts.high },
              { tier: 'MEDIUM', key: 'medium', color: 'var(--amber)',  count: gts.medium },
              { tier: 'LOW',    key: 'low',    color: 'var(--coral)',  count: gts.low },
            ].map(({ tier, key, color, count }, i) => {
              const pct = (count / gtsTotal) * 100;
              return (
                <div key={key} style={s.gtsRow}>
                  <span style={{ ...s.gtsTier, color }}>{tier}</span>
                  <div style={s.gtsBarTrack}>
                    <motion.div
                      style={{ ...s.gtsBarFill, background: color }}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ delay: 0.3 + i * 0.1, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                    />
                  </div>
                  <span style={{ ...s.gtsCount, color }}>{count}</span>
                </div>
              );
            })}
          </div>
          <div style={s.gtsLegend}>
            <span style={s.legendItem}><span style={{ color: 'var(--green)' }}>■</span> 700–900</span>
            <span style={s.legendItem}><span style={{ color: 'var(--amber)' }}>■</span> 500–699</span>
            <span style={s.legendItem}><span style={{ color: 'var(--coral)' }}>■</span> 300–499</span>
          </div>
        </motion.div>

        {/* Active Alerts */}
        <motion.div variants={item} style={{ ...s.card, width: 280, flexShrink: 0 }}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Active Alerts</span>
            <span style={{ ...s.cardSub, color: activeAlerts.length > 0 ? 'var(--amber)' : 'var(--green)' }}>
              {activeAlerts.length} active
            </span>
          </div>
          {activeAlerts.length === 0 && (
            <div style={s.emptyState}>All clear</div>
          )}
          {activeAlerts.map(a => (
            <div key={a.id} style={s.alertRow}>
              <div style={{ ...s.alertDot, background: a.severity === 'high' ? 'var(--coral)' : a.severity === 'medium' ? 'var(--amber)' : 'var(--green)' }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={s.alertZone}>{a.zone}</div>
                <div style={s.alertMsg}>{a.message}</div>
              </div>
            </div>
          ))}
        </motion.div>
      </div>

      {/* Recent Payouts */}
      <motion.div variants={item} style={s.card}>
        <div style={s.cardHeader}>
          <span style={s.cardTitle}>Recent Payouts</span>
          <span style={s.cardSub}>last {recent.length} transactions</span>
        </div>
        <table style={s.table}>
          <thead>
            <tr>
              {['Worker', 'Platform', 'Amount', 'Type', 'Date / Time', 'Method', 'Status'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {recent.map((p, i) => (
              <motion.tr
                key={p.id}
                style={{ ...s.tr, borderBottom: i < recent.length - 1 ? '1px solid var(--border)' : 'none' }}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <td style={s.td}>
                  <div style={s.workerCell}>
                    <div style={s.avatar}>{p.workerName.split(' ').map(n => n[0]).join('')}</div>
                    <span style={s.workerName}>{p.workerName}</span>
                  </div>
                </td>
                <td style={s.td}><span style={s.platformBadge}>{p.platform}</span></td>
                <td style={s.td}><span style={{ ...s.amount, color: p.status === 'held' ? 'var(--amber)' : 'var(--green)' }}>+₹{p.amount}</span></td>
                <td style={s.td}><span style={{ ...s.typeBadge, color: TYPE_COLORS[p.type], background: `${TYPE_COLORS[p.type]}15` }}>{TYPE_LABELS[p.type]}</span></td>
                <td style={s.td}><span style={s.dateCell}>{p.date} · {p.time}</span></td>
                <td style={s.td}><span style={s.methodBadge}>{p.auto ? 'Auto' : 'Verified'}</span></td>
                <td style={s.td}>
                  <span style={{ ...s.statusBadge, background: p.status === 'paid' ? 'var(--green-dim)' : 'var(--amber-dim)', color: p.status === 'paid' ? 'var(--green)' : 'var(--amber)', border: `1px solid ${p.status === 'paid' ? 'rgba(62,201,122,0.25)' : 'rgba(232,184,74,0.25)'}` }}>
                    {p.status === 'paid' ? 'Paid' : 'Held'}
                  </span>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </motion.div>
  );
}

const s = {
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 },
  kpiCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '18px 20px', cursor: 'default' },
  kpiLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', marginBottom: 10 },
  kpiVal: { fontSize: 28, fontWeight: 900, letterSpacing: '-1px', lineHeight: 1 },
  kpiSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', marginTop: 6 },
  row: { display: 'flex', gap: 16, marginBottom: 24, alignItems: 'flex-start' },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px', marginBottom: 24 },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 18 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.2px' },
  cardSub: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
  // GTS
  gtsChart: { display: 'flex', flexDirection: 'column', gap: 14 },
  gtsRow: { display: 'flex', alignItems: 'center', gap: 12 },
  gtsTier: { fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.8px', width: 48, flexShrink: 0 },
  gtsBarTrack: { flex: 1, height: 8, background: 'var(--surface3)', borderRadius: 4, overflow: 'hidden' },
  gtsBarFill: { height: '100%', borderRadius: 4 },
  gtsCount: { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 600, width: 16, textAlign: 'right', flexShrink: 0 },
  gtsLegend: { display: 'flex', gap: 16, marginTop: 16 },
  legendItem: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--muted)', display: 'flex', alignItems: 'center', gap: 5 },
  // Alerts
  alertRow: { display: 'flex', gap: 10, alignItems: 'flex-start', padding: '10px 0', borderBottom: '1px solid var(--border)' },
  alertDot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0, marginTop: 4 },
  alertZone: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text2)', marginBottom: 2 },
  alertMsg: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 },
  emptyState: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faint)', textAlign: 'center', padding: '20px 0' },
  // Table
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', textAlign: 'left', padding: '0 12px 12px 0', borderBottom: '1px solid var(--border)' },
  tr: { cursor: 'default' },
  td: { padding: '13px 12px 13px 0', verticalAlign: 'middle' },
  workerCell: { display: 'flex', alignItems: 'center', gap: 9 },
  avatar: { width: 28, height: 28, borderRadius: '50%', background: 'var(--surface3)', border: '1px solid var(--border2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 700, color: 'var(--text2)', flexShrink: 0 },
  workerName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  platformBadge: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', background: 'var(--surface3)', padding: '3px 8px', borderRadius: 6 },
  amount: { fontSize: 14, fontWeight: 800, letterSpacing: '-0.3px' },
  typeBadge: { fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 8px', borderRadius: 6, letterSpacing: '0.3px' },
  dateCell: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
  methodBadge: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', background: 'var(--surface3)', padding: '3px 8px', borderRadius: 6 },
  statusBadge: { fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.3px' },
};
