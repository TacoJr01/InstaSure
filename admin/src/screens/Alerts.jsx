import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAlerts, dismissAlert, postSimulate } from '../api.js';

const MOCK_ALERTS = [
  { id: 'aa1', type: 'rain',      zone: 'Velachery, Chennai',    severity: 'high',   message: 'Heavy rainfall — 14 workers affected, auto-payouts triggered', time: '11:40 AM',   active: true  },
  { id: 'aa2', type: 'lowOrders', zone: 'Andheri West, Mumbai',  severity: 'medium', message: 'Demand drop >50% detected — 3 workers pending verification',   time: '9:00 PM',    active: true  },
  { id: 'aa3', type: 'curfew',    zone: 'Koramangala, Bangalore',severity: 'low',    message: 'Zone restriction lifted — coverage resumed normally',           time: 'Mon 14 Jan', active: false },
];

const TYPE_META = {
  rain:      { label: 'Rain',       color: 'var(--blue)',   icon: (c) => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 11a3.5 3.5 0 01.4-7A4.5 4.5 0 0114 7h.5a2.5 2.5 0 010 5H4z"/><line x1="6" y1="14" x2="6" y2="16"/><line x1="9" y1="14" x2="9" y2="16"/><line x1="12" y1="14" x2="12" y2="16"/></svg>) },
  lowOrders: { label: 'Low Orders', color: 'var(--amber)',  icon: (c) => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="10" width="3" height="5" rx="1"/><rect x="7.5" y="6" width="3" height="9" rx="1"/><rect x="12" y="3" width="3" height="12" rx="1"/><line x1="2" y1="16" x2="16" y2="16"/></svg>) },
  curfew:    { label: 'Curfew',     color: 'var(--purple)', icon: (c) => (<svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke={c} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="9" r="7"/><line x1="9" y1="5" x2="9" y2="9"/><line x1="9" y1="9" x2="12" y2="11"/></svg>) },
};

const SEV_META = {
  high:   { color: 'var(--coral)', bg: 'var(--coral-dim)', border: 'rgba(232,132,58,0.25)',  label: 'HIGH'   },
  medium: { color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(232,184,74,0.25)',  label: 'MEDIUM' },
  low:    { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(62,201,122,0.25)',  label: 'LOW'    },
};

const TRIGGERS = [
  { id: 'rain',      label: 'Heavy Rain',    sub: 'Rainfall threshold crossed — auto-pays workers',  color: 'var(--blue)'   },
  { id: 'lowOrders', label: 'Demand Drop',   sub: '>50% drop — workers must verify to claim',        color: 'var(--amber)'  },
  { id: 'curfew',    label: 'Zone Curfew',   sub: 'Geo-restriction detected — auto-pays workers',    color: 'var(--purple)' },
  { id: 'outage',    label: 'Platform Down', sub: 'No order signal — workers set eligible to verify',color: 'var(--coral)'  },
];

export default function Alerts() {
  const [alerts, setAlerts]     = useState(MOCK_ALERTS);
  const [simulating, setSimulating] = useState(null);
  const [simDone, setSimDone]   = useState(null);
  const [simNote, setSimNote]   = useState('');

  useEffect(() => { fetchAlerts().then(setAlerts).catch(() => {}); }, []);

  async function handleDismiss(id) {
    try { await dismissAlert(id); } catch {}
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, active: false } : a));
  }

  async function simulateTrigger(triggerId) {
    setSimulating(triggerId);
    setSimNote('');
    try {
      const result = await postSimulate(triggerId, 'Demo Zone');
      if (result.error) {
        setSimNote(`Blocked: ${result.error}`);
        setSimulating(null);
        setTimeout(() => setSimNote(''), 4000);
        return;
      }
      if (result.alert) setAlerts(prev => [result.alert, ...prev]);
      setSimNote(result.autoPaid
        ? `Auto-payout ₹${result.payoutAmount} sent · Alert fired in worker app`
        : `Worker app notified · Worker must verify GPS + selfie to claim`
      );
    } catch {
      const meta = TRIGGERS.find(t => t.id === triggerId);
      setAlerts(prev => [{
        id: `sim-${Date.now()}`,
        type: triggerId === 'outage' ? 'lowOrders' : triggerId,
        zone: 'Demo Zone [SIMULATED]',
        severity: triggerId === 'rain' || triggerId === 'curfew' ? 'high' : 'medium',
        message: `[SIMULATED] ${meta.label} — workers evaluated for payout eligibility.`,
        time: 'Just now', active: true,
      }, ...prev]);
      setSimNote('Triggered (offline fallback)');
    }
    setSimulating(null);
    setSimDone(triggerId);
    setTimeout(() => { setSimDone(null); setSimNote(''); }, 4000);
  }

  const active   = alerts.filter(a => a.active);
  const resolved = alerts.filter(a => !a.active);

  return (
    <div style={s.layout}>
      {/* Left: alert feed */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={s.sectionHeader}>
          <span style={s.sectionTitle}>Active Alerts</span>
          <span style={{ ...s.sectionCount, color: active.length > 0 ? 'var(--coral)' : 'var(--green)' }}>
            {active.length} active
          </span>
        </div>

        {active.length === 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={s.emptyState}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="var(--green)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><polyline points="4,11 9,16 18,6"/></svg>
            <span>All clear — no active alerts</span>
          </motion.div>
        )}

        <AnimatePresence>
          {active.map((a, i) => {
            const type = TYPE_META[a.type] || TYPE_META.rain;
            const sev  = SEV_META[a.severity] || SEV_META.medium;
            return (
              <motion.div key={a.id} style={s.alertCard}
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0, padding: 0 }}
                transition={{ delay: i * 0.07 }} layout>
                <div style={{ ...s.accentBar, background: sev.color }} />
                <div style={{ ...s.iconWrap, background: `${type.color}15`, border: `1px solid ${type.color}25` }}>
                  {type.icon(type.color)}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={s.alertTop}>
                    <span style={s.alertZone}>{a.zone}</span>
                    <div style={s.alertBadges}>
                      <span style={{ ...s.sevBadge, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}` }}>{sev.label}</span>
                      <span style={{ ...s.typeBadge, color: type.color }}>{type.label}</span>
                    </div>
                  </div>
                  <div style={s.alertMsg}>{a.message}</div>
                  <div style={s.alertTime}>{a.time}</div>
                </div>
                <motion.button style={s.dismissBtn} onClick={() => handleDismiss(a.id)}
                  whileHover={{ background: 'var(--surface3)' }} whileTap={{ scale: 0.94 }} title="Dismiss">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round">
                    <line x1="2" y1="2" x2="10" y2="10"/><line x1="10" y1="2" x2="2" y2="10"/>
                  </svg>
                </motion.button>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {resolved.length > 0 && (
          <>
            <div style={{ ...s.sectionHeader, marginTop: 28 }}>
              <span style={s.sectionTitle}>Resolved</span>
              <span style={s.sectionCount}>{resolved.length} resolved</span>
            </div>
            {resolved.map((a, i) => {
              const type = TYPE_META[a.type] || TYPE_META.rain;
              return (
                <motion.div key={a.id} style={{ ...s.alertCard, opacity: 0.4 }}
                  initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} transition={{ delay: i * 0.05 }}>
                  <div style={{ ...s.accentBar, background: 'var(--faint)' }} />
                  <div style={{ ...s.iconWrap, background: 'var(--surface3)', border: '1px solid var(--border2)' }}>
                    {type.icon('var(--faint)')}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={s.alertTop}>
                      <span style={s.alertZone}>{a.zone}</span>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)' }}>RESOLVED</span>
                    </div>
                    <div style={{ ...s.alertMsg, color: 'var(--faint)' }}>{a.message}</div>
                    <div style={s.alertTime}>{a.time}</div>
                  </div>
                </motion.div>
              );
            })}
          </>
        )}
      </div>

      {/* Right: Simulate panel */}
      <div style={s.simPanel}>
        <div style={s.simHeader}>
          <span style={s.simTitle}>Simulate Trigger</span>
          <span style={s.simSub}>Fire a parametric event — updates worker app in real time</span>
        </div>

        <div style={s.triggerList}>
          {TRIGGERS.map(t => {
            const isRunning = simulating === t.id;
            const isDone    = simDone === t.id;
            return (
              <motion.button key={t.id}
                style={{ ...s.triggerBtn, borderColor: isRunning ? t.color : isDone ? 'var(--green)' : 'var(--border2)', background: isRunning ? `${t.color}10` : isDone ? 'var(--green-dim)' : 'var(--surface2)', cursor: simulating ? 'not-allowed' : 'pointer', opacity: simulating && !isRunning ? 0.4 : 1 }}
                onClick={() => !simulating && simulateTrigger(t.id)}
                whileTap={!simulating ? { scale: 0.97 } : {}}>
                <div style={{ flex: 1, textAlign: 'left' }}>
                  <div style={{ ...s.triggerLabel, color: isDone ? 'var(--green)' : isRunning ? t.color : 'var(--text2)' }}>
                    {isDone ? '✓ Triggered' : t.label}
                  </div>
                  <div style={s.triggerSub}>{t.sub}</div>
                </div>
                {isRunning ? (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={t.color} strokeWidth="2" strokeLinecap="round"><path d="M7 1.5A5.5 5.5 0 1112.5 7"/></svg>
                  </motion.div>
                ) : (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={isDone ? 'var(--green)' : 'var(--faint)'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="5,3 10,7 5,11"/></svg>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Feedback after simulate */}
        <AnimatePresence>
          {simNote && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={s.simFeedback}
            >
              <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="var(--green)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polyline points="2,6.5 5,9.5 11,4"/></svg>
              <span>{simNote}</span>
            </motion.div>
          )}
        </AnimatePresence>

        <div style={s.simNote}>
          Auto-pay vs verify behaviour is configured per-trigger in <strong style={{ color: 'var(--text2)' }}>Settings</strong>.
        </div>
      </div>
    </div>
  );
}

const s = {
  layout: { display: 'flex', gap: 24, alignItems: 'flex-start' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)' },
  sectionCount: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
  emptyState: { display: 'flex', alignItems: 'center', gap: 10, padding: '20px 0', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)' },
  alertCard: { display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, marginBottom: 12, position: 'relative', overflow: 'hidden' },
  accentBar: { position: 'absolute', left: 0, top: 0, bottom: 0, width: 3 },
  iconWrap: { width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  alertTop: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 },
  alertZone: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text2)', fontWeight: 600 },
  alertBadges: { display: 'flex', gap: 6 },
  sevBadge: { fontFamily: 'var(--font-mono)', fontSize: 8, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.5px' },
  typeBadge: { fontFamily: 'var(--font-mono)', fontSize: 9 },
  alertMsg: { fontSize: 13, color: 'var(--text2)', lineHeight: 1.5, marginBottom: 6 },
  alertTime: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)' },
  dismissBtn: { width: 28, height: 28, borderRadius: 8, border: '1px solid var(--border2)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 },
  simPanel: { width: 268, flexShrink: 0, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px', position: 'sticky', top: 0 },
  simHeader: { marginBottom: 18 },
  simTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 4 },
  simSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)' },
  triggerList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 },
  triggerBtn: { display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', border: '1px solid', borderRadius: 12, width: '100%', fontFamily: 'var(--font-sans)' },
  triggerLabel: { fontSize: 13, fontWeight: 600, marginBottom: 2 },
  triggerSub: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', lineHeight: 1.4 },
  simFeedback: { display: 'flex', alignItems: 'flex-start', gap: 8, padding: '10px 12px', background: 'var(--green-dim)', border: '1px solid rgba(62,201,122,0.2)', borderRadius: 10, marginBottom: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', lineHeight: 1.4 },
  simNote: { padding: '12px', background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 10, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', lineHeight: 1.6 },
};
