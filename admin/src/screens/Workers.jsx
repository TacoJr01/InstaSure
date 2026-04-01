import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchWorkers, fetchFraud, resolveFraudFlag, patchWorker } from '../api.js';

const MOCK_WORKERS = [
  { id: 'u1', name: 'Rahul Sharma',   initials: 'RS', platform: 'Swiggy',  location: 'Chennai',   zone: 'Velachery',       gtsScore: 742, gtsTier: 'high',   status: 'active',  weeklyEarnings: 950,  premium: 40, lastActive: '2 min ago' },
  { id: 'u2', name: 'Priya Nair',     initials: 'PN', platform: 'Zomato',  location: 'Mumbai',    zone: 'Andheri West',    gtsScore: 612, gtsTier: 'medium', status: 'active',  weeklyEarnings: 650,  premium: 35, lastActive: '15 min ago' },
  { id: 'u3', name: 'Arjun Mehta',    initials: 'AM', platform: 'Zepto',   location: 'Bangalore', zone: 'Koramangala',     gtsScore: 481, gtsTier: 'low',    status: 'flagged', weeklyEarnings: 0,    premium: 25, lastActive: '1 hr ago' },
  { id: 'u4', name: 'Deepa Krishnan', initials: 'DK', platform: 'Swiggy',  location: 'Chennai',   zone: 'Anna Nagar',      gtsScore: 815, gtsTier: 'high',   status: 'active',  weeklyEarnings: 1100, premium: 45, lastActive: '5 min ago' },
  { id: 'u5', name: 'Ravi Teja',      initials: 'RT', platform: 'Amazon',  location: 'Hyderabad', zone: 'Gachibowli',      gtsScore: 558, gtsTier: 'medium', status: 'active',  weeklyEarnings: 580,  premium: 30, lastActive: '30 min ago' },
  { id: 'u6', name: 'Sneha Patel',    initials: 'SP', platform: 'Zomato',  location: 'Pune',      zone: 'Koregaon Park',   gtsScore: 378, gtsTier: 'low',    status: 'flagged', weeklyEarnings: 0,    premium: 20, lastActive: '3 hr ago' },
  { id: 'u7', name: 'Karan Singh',    initials: 'KS', platform: 'Swiggy',  location: 'Delhi',     zone: 'Connaught Place', gtsScore: 724, gtsTier: 'high',   status: 'active',  weeklyEarnings: 820,  premium: 40, lastActive: '8 min ago' },
  { id: 'u8', name: 'Meera Iyer',     initials: 'MI', platform: 'Zepto',   location: 'Bangalore', zone: 'Indiranagar',     gtsScore: 639, gtsTier: 'medium', status: 'active',  weeklyEarnings: 710,  premium: 35, lastActive: '22 min ago' },
];

const GTS_TIER = {
  high:   { color: 'var(--green)', bg: 'var(--green-dim)', label: 'HIGH' },
  medium: { color: 'var(--amber)', bg: 'var(--amber-dim)', label: 'MED'  },
  low:    { color: 'var(--coral)', bg: 'var(--coral-dim)', label: 'LOW'  },
};
const PLAT_COLORS = { Swiggy: '#FC8019', Zomato: '#E23744', Zepto: '#7B2EF7', Amazon: '#FF9900' };

const STATUS_META = {
  active:    { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(62,201,122,0.2)',  label: 'Active'    },
  flagged:   { color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(232,184,74,0.2)',  label: 'Flagged'   },
  suspended: { color: 'var(--red)',   bg: 'var(--red-dim)',   border: 'rgba(232,90,74,0.2)',   label: 'Suspended' },
};

export default function Workers() {
  const [workers, setWorkers]     = useState(MOCK_WORKERS);
  const [fraudFlags, setFraudFlags] = useState([]);
  const [search, setSearch]       = useState('');
  const [filter, setFilter]       = useState('all');
  const [expanded, setExpanded]   = useState(null);
  const [acting, setActing]       = useState(null);

  useEffect(() => {
    fetchWorkers().then(setWorkers).catch(() => {});
    fetchFraud().then(setFraudFlags).catch(() => {});
  }, []);

  async function handleFraud(flagId, status) {
    setActing(flagId);
    try {
      const res = await resolveFraudFlag(flagId, status);
      setFraudFlags(prev => prev.map(f => f.id === flagId ? { ...f, status } : f));
      if (res.worker) {
        setWorkers(prev => prev.map(w => w.id === res.worker.id ? { ...w, ...res.worker } : w));
      }
    } catch {}
    setActing(null);
  }

  async function handleWorkerStatus(workerId, status) {
    setActing(workerId);
    try {
      const updated = await patchWorker(workerId, { status });
      setWorkers(prev => prev.map(w => w.id === workerId ? { ...w, ...updated } : w));
    } catch {}
    setActing(null);
  }

  const filtered = workers.filter(w => {
    const matchSearch = w.name.toLowerCase().includes(search.toLowerCase()) ||
      w.platform.toLowerCase().includes(search.toLowerCase()) ||
      w.location.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'all' || w.status === filter;
    return matchSearch && matchFilter;
  });

  const getFlagForWorker = (id) => fraudFlags.find(f => f.workerId === id && f.status === 'open');

  return (
    <div>
      {/* Fraud banner */}
      <AnimatePresence>
        {fraudFlags.filter(f => f.status === 'open').length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={s.fraudBanner}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 1.5L13 11.5H1L7 1.5z"/><line x1="7" y1="5.5" x2="7" y2="8.5"/><circle cx="7" cy="10" r="0.5" fill="var(--red)"/>
            </svg>
            <span style={{ fontSize: 13, color: 'var(--text2)' }}>
              <strong style={{ color: 'var(--red)' }}>{fraudFlags.filter(f => f.status === 'open').length} open fraud flags</strong> — expand worker row to review and take action
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Controls */}
      <div style={s.controls}>
        <div style={s.searchWrap}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--muted)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="4"/><line x1="9.5" y1="9.5" x2="13" y2="13"/>
          </svg>
          <input style={s.search} placeholder="Search by name, platform, city…"
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div style={s.filters}>
          {['all', 'active', 'flagged', 'suspended'].map(f => (
            <button key={f} style={{ ...s.filterBtn, background: filter === f ? 'var(--surface3)' : 'transparent', color: filter === f ? 'var(--text)' : 'var(--muted)', borderColor: filter === f ? 'var(--border2)' : 'transparent' }}
              onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
              <span style={s.filterCount}>{f === 'all' ? workers.length : workers.filter(w => w.status === f).length}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div style={s.tableWrap}>
        <table style={s.table}>
          <thead>
            <tr>
              {['Worker', 'Platform', 'Location', 'GigTrust', 'Weekly Earned', 'Status', 'Last Active', 'Actions'].map(h => (
                <th key={h} style={s.th}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map((w, i) => {
              const tier = GTS_TIER[w.gtsTier] || GTS_TIER.medium;
              const statusMeta = STATUS_META[w.status] || STATUS_META.active;
              const flag = getFlagForWorker(w.id);
              const isExpanded = expanded === w.id;
              return (
                <React.Fragment key={w.id}>
                  <motion.tr
                    style={{ ...s.tr, background: isExpanded ? 'var(--surface2)' : 'transparent', borderBottom: isExpanded ? 'none' : '1px solid var(--border)', opacity: w.status === 'suspended' ? 0.6 : 1 }}
                    initial={{ opacity: 0 }} animate={{ opacity: w.status === 'suspended' ? 0.6 : 1 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <td style={s.td}>
                      <div style={s.workerCell}>
                        <div style={{ ...s.avatar, background: `${PLAT_COLORS[w.platform]}18`, border: `1px solid ${PLAT_COLORS[w.platform]}40`, color: PLAT_COLORS[w.platform] }}>
                          {w.initials}
                        </div>
                        <div>
                          <div style={s.workerName}>{w.name}</div>
                          {flag && <div style={s.flagTag}>⚑ fraud flag open</div>}
                        </div>
                      </div>
                    </td>
                    <td style={s.td}><span style={{ ...s.platformBadge, color: PLAT_COLORS[w.platform], background: `${PLAT_COLORS[w.platform]}15` }}>{w.platform}</span></td>
                    <td style={s.td}>
                      <div style={s.locationMain}>{w.zone}</div>
                      <div style={s.locationSub}>{w.location}</div>
                    </td>
                    <td style={s.td}>
                      <div style={s.gtsCell}>
                        <span style={{ ...s.gtsBadge, color: tier.color, background: tier.bg }}>{tier.label}</span>
                        <div style={s.gtsBarMini}>
                          <motion.div style={{ ...s.gtsBarMiniFill, background: tier.color }}
                            initial={{ width: 0 }} animate={{ width: `${((w.gtsScore - 300) / 600) * 100}%` }}
                            transition={{ delay: 0.3 + i * 0.04, duration: 0.7 }} />
                        </div>
                        <span style={{ ...s.gtsNum, color: tier.color }}>{w.gtsScore}</span>
                      </div>
                    </td>
                    <td style={s.td}><span style={{ ...s.earned, color: w.weeklyEarnings > 0 ? 'var(--green)' : 'var(--faint)' }}>{w.weeklyEarnings > 0 ? `₹${w.weeklyEarnings.toLocaleString('en-IN')}` : '—'}</span></td>
                    <td style={s.td}><span style={{ ...s.statusBadge, background: statusMeta.bg, color: statusMeta.color, border: `1px solid ${statusMeta.border}` }}>{statusMeta.label}</span></td>
                    <td style={s.td}><span style={s.lastActive}>{w.lastActive}</span></td>
                    <td style={s.td}>
                      <div style={s.actionBtns}>
                        <button style={s.detailsBtn} onClick={() => setExpanded(isExpanded ? null : w.id)}>
                          {isExpanded ? 'Close' : 'Details'}
                        </button>
                        {w.status !== 'suspended' ? (
                          <motion.button
                            style={{ ...s.statusBtn, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(232,90,74,0.25)', opacity: acting === w.id ? 0.5 : 1 }}
                            onClick={() => handleWorkerStatus(w.id, 'suspended')}
                            disabled={!!acting} whileTap={{ scale: 0.94 }}>
                            {acting === w.id ? '…' : 'Suspend'}
                          </motion.button>
                        ) : (
                          <motion.button
                            style={{ ...s.statusBtn, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(62,201,122,0.25)', opacity: acting === w.id ? 0.5 : 1 }}
                            onClick={() => handleWorkerStatus(w.id, 'active')}
                            disabled={!!acting} whileTap={{ scale: 0.94 }}>
                            {acting === w.id ? '…' : 'Reactivate'}
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </motion.tr>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.tr
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        style={{ background: 'var(--surface2)', borderBottom: '1px solid var(--border)' }}
                      >
                        <td colSpan={8} style={{ padding: '0 14px 14px 60px' }}>
                          {flag ? (
                            <div style={s.flagCard}>
                              <div style={s.flagHeader}>
                                <div style={s.flagDot} />
                                <span style={s.flagReason}>{flag.reason}</span>
                                <span style={s.flagConf}>Confidence: <strong style={{ color: 'var(--red)' }}>{flag.confidence}%</strong></span>
                                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)' }}>{flag.date}</span>
                              </div>
                              <div style={s.flagDetail}>{flag.detail}</div>
                              <div style={s.flagActions}>
                                <motion.button
                                  style={{ ...s.actionBtn, background: 'var(--red-dim)', color: 'var(--red)', border: '1px solid rgba(232,90,74,0.25)', opacity: acting === flag.id ? 0.5 : 1 }}
                                  onClick={() => handleFraud(flag.id, 'confirmed')} disabled={!!acting} whileTap={{ scale: 0.94 }}>
                                  {acting === flag.id ? '…' : 'Confirm Fraud — Suspend & reject payouts'}
                                </motion.button>
                                <motion.button
                                  style={{ ...s.actionBtn, background: 'var(--green-dim)', color: 'var(--green)', border: '1px solid rgba(62,201,122,0.25)', opacity: acting === flag.id ? 0.5 : 1 }}
                                  onClick={() => handleFraud(flag.id, 'cleared')} disabled={!!acting} whileTap={{ scale: 0.94 }}>
                                  {acting === flag.id ? '…' : 'Clear Worker — Approve held payouts'}
                                </motion.button>
                              </div>
                            </div>
                          ) : (
                            <div style={s.cleanRow}>
                              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6.5 5,9.5 11,4"/></svg>
                              <span style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)' }}>
                                No open fraud flags · GigTrust {w.gtsScore} · Premium ₹{w.premium}/week · Earnings ₹{w.weeklyEarnings > 0 ? w.weeklyEarnings.toLocaleString('en-IN') : '0'} this week
                              </span>
                            </div>
                          )}
                        </td>
                      </motion.tr>
                    )}
                  </AnimatePresence>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
        {filtered.length === 0 && <div style={s.emptyState}>No workers match your search</div>}
      </div>
    </div>
  );
}

const s = {
  fraudBanner: { display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.2)', borderRadius: 12, marginBottom: 20 },
  controls: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 16 },
  searchWrap: { display: 'flex', alignItems: 'center', gap: 10, background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 10, padding: '8px 14px', flex: 1, maxWidth: 360 },
  search: { background: 'none', border: 'none', outline: 'none', fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-sans)', width: '100%' },
  filters: { display: 'flex', gap: 4 },
  filterBtn: { display: 'flex', alignItems: 'center', gap: 6, padding: '7px 12px', borderRadius: 8, border: '1px solid', cursor: 'pointer', fontSize: 12, fontWeight: 500, fontFamily: 'var(--font-sans)' },
  filterCount: { fontFamily: 'var(--font-mono)', fontSize: 9, opacity: 0.7 },
  tableWrap: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, overflow: 'hidden' },
  table: { width: '100%', borderCollapse: 'collapse' },
  th: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', textAlign: 'left', padding: '14px 14px', borderBottom: '1px solid var(--border)', background: 'var(--surface2)' },
  tr: { transition: 'background 0.15s' },
  td: { padding: '12px 14px', verticalAlign: 'middle' },
  workerCell: { display: 'flex', alignItems: 'center', gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, flexShrink: 0 },
  workerName: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  flagTag: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--red)', marginTop: 2 },
  platformBadge: { fontFamily: 'var(--font-mono)', fontSize: 10, padding: '3px 8px', borderRadius: 6, fontWeight: 500 },
  locationMain: { fontSize: 12, fontWeight: 600, color: 'var(--text2)' },
  locationSub: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)', marginTop: 1 },
  gtsCell: { display: 'flex', alignItems: 'center', gap: 7 },
  gtsBadge: { fontFamily: 'var(--font-mono)', fontSize: 8, fontWeight: 700, padding: '2px 7px', borderRadius: 4, letterSpacing: '0.5px', flexShrink: 0 },
  gtsBarMini: { width: 48, height: 4, background: 'var(--surface3)', borderRadius: 2, overflow: 'hidden' },
  gtsBarMiniFill: { height: '100%', borderRadius: 2 },
  gtsNum: { fontFamily: 'var(--font-mono)', fontSize: 11, fontWeight: 600 },
  earned: { fontSize: 13, fontWeight: 700, letterSpacing: '-0.3px' },
  statusBadge: { fontFamily: 'var(--font-mono)', fontSize: 9, padding: '3px 9px', borderRadius: 20, letterSpacing: '0.3px' },
  lastActive: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)' },
  actionBtns: { display: 'flex', gap: 6 },
  detailsBtn: { padding: '5px 12px', background: 'var(--surface3)', border: '1px solid var(--border2)', borderRadius: 7, fontSize: 11, color: 'var(--muted)', cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  statusBtn: { padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  flagCard: { background: 'var(--surface3)', border: '1px solid rgba(232,90,74,0.2)', borderRadius: 10, padding: '12px 16px', maxWidth: 560 },
  flagHeader: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 },
  flagDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--red)', flexShrink: 0 },
  flagReason: { fontSize: 13, fontWeight: 700, color: 'var(--red)', flex: 1 },
  flagConf: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
  flagDetail: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', lineHeight: 1.5, marginBottom: 12 },
  flagActions: { display: 'flex', gap: 8 },
  actionBtn: { padding: '7px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-sans)' },
  cleanRow: { display: 'flex', alignItems: 'center', gap: 8 },
  emptyState: { padding: '40px', textAlign: 'center', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--faint)' },
};
