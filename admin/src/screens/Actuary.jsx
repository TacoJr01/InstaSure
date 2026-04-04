import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { fetchActuary } from '../api.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const MOCK = {
  bcr: 0.64, lossRatio: 64.0, totalClaims: 1530, totalPremiums: 2720,
  bcrTarget: { min: 0.55, max: 0.70 }, bcrStatus: 'healthy',
  cityPools: [
    { city: 'Chennai',   pool: 'Chennai Rain Pool',     enrolled: 2, eligible: 2, avgPremium: 43, riskScore: 72, status: 'balanced' },
    { city: 'Mumbai',    pool: 'Mumbai Monsoon Pool',   enrolled: 1, eligible: 1, avgPremium: 35, riskScore: 78, status: 'elevated' },
    { city: 'Bangalore', pool: 'Bangalore Mixed Pool',  enrolled: 2, eligible: 2, avgPremium: 30, riskScore: 68, status: 'balanced' },
    { city: 'Delhi',     pool: 'Delhi NCR AQI Pool',    enrolled: 1, eligible: 1, avgPremium: 40, riskScore: 82, status: 'elevated' },
    { city: 'Hyderabad', pool: 'Hyderabad Demand Pool', enrolled: 1, eligible: 1, avgPremium: 30, riskScore: 62, status: 'balanced' },
    { city: 'Pune',      pool: 'Pune Rain Pool',        enrolled: 1, eligible: 0, avgPremium: 20, riskScore: 58, status: 'balanced' },
  ],
  enrollment: { total: 8, eligible: 6, ineligible: 2, flagged: 2, suspended: 0 },
  stressScenario: { label: '14-Day Monsoon', affectedCities: ['Mumbai', 'Chennai'], affectedWorkers: 3, extraClaims: 1800, projectedBcr: 1.39, projectedLossRatio: 139.0, capitalAlert: true },
};

function BcrGauge({ bcr, min, max, status }) {
  const pct = Math.min(bcr / 1.5, 1); // scale: 1.5 = max shown
  const minPct = min / 1.5;
  const maxPct = max / 1.5;
  const FULL = Math.PI * 72;
  const arcFill = pct * FULL;
  const color = status === 'healthy' ? 'var(--green)' : status === 'under' ? 'var(--amber)' : 'var(--red)';
  const label = status === 'healthy' ? 'Healthy' : status === 'under' ? 'Under Target' : 'Over Limit';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width="160" height="90" viewBox="0 0 160 90" fill="none">
        {/* Background track */}
        <path d="M 8 88 A 72 72 0 0 1 152 88" stroke="#1C1C24" strokeWidth="10" strokeLinecap="round" fill="none"/>
        {/* Target zone (green band) */}
        <path d="M 8 88 A 72 72 0 0 1 152 88"
          stroke="rgba(62,201,122,0.15)" strokeWidth="10" strokeLinecap="round" fill="none"
          strokeDasharray={`${(maxPct - minPct) * FULL} ${FULL}`}
          strokeDashoffset={-minPct * FULL}
        />
        {/* BCR fill */}
        <motion.path
          d="M 8 88 A 72 72 0 0 1 152 88"
          stroke={color} strokeWidth="10" strokeLinecap="round" fill="none"
          initial={{ strokeDasharray: `0 ${FULL}` }}
          animate={{ strokeDasharray: `${arcFill} ${FULL}` }}
          transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
        />
        {/* Labels */}
        <text x="4"   y="88" fill="var(--faint)" fontSize="8" fontFamily="monospace">0</text>
        <text x="126" y="88" fill="var(--faint)" fontSize="8" fontFamily="monospace">1.5</text>
        <text x="60"  y="88" fill="rgba(62,201,122,0.6)" fontSize="7" fontFamily="monospace">{min}–{max}</text>
      </svg>
      <div style={{ marginTop: -18, textAlign: 'center' }}>
        <div style={{ fontSize: 28, fontWeight: 900, color, letterSpacing: '-1px', lineHeight: 1 }}>{bcr}</div>
        <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color, letterSpacing: '0.8px', marginTop: 3 }}>{label}</div>
      </div>
    </div>
  );
}

const STATUS_META = {
  balanced: { color: 'var(--green)', bg: 'var(--green-dim)', border: 'rgba(62,201,122,0.2)',  label: 'Balanced' },
  elevated: { color: 'var(--amber)', bg: 'var(--amber-dim)', border: 'rgba(232,184,74,0.2)',  label: 'Elevated' },
  high:     { color: 'var(--red)',   bg: 'var(--red-dim)',   border: 'rgba(232,90,74,0.2)',   label: 'High Risk' },
};

export default function Actuary() {
  const [data, setData] = useState(MOCK);

  useEffect(() => {
    fetchActuary().then(setData).catch(() => {});
    const interval = setInterval(() => fetchActuary().then(setData).catch(() => {}), 15000);
    return () => clearInterval(interval);
  }, []);

  const { bcr, lossRatio, totalClaims, totalPremiums, bcrTarget, bcrStatus, cityPools, enrollment, stressScenario } = data;

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* KPI row */}
      <motion.div variants={item} style={s.kpiGrid}>
        {[
          { label: 'BCR',               val: bcr,                                        sub: `target ${bcrTarget.min}–${bcrTarget.max}`, color: bcrStatus === 'healthy' ? 'var(--green)' : 'var(--red)', mono: true },
          { label: 'LOSS RATIO',        val: `${lossRatio}%`,                            sub: 'claims ÷ premiums',                         color: lossRatio <= 70 ? 'var(--green)' : 'var(--amber)'       },
          { label: 'PREMIUMS',          val: `₹${totalPremiums.toLocaleString('en-IN')}`, sub: 'collected this period',                    color: 'var(--text)'                                            },
          { label: 'CLAIMS PAID',       val: `₹${totalClaims.toLocaleString('en-IN')}`,  sub: 'from all payouts',                          color: 'var(--coral)'                                           },
        ].map((k, i) => (
          <motion.div key={k.label} style={s.kpiCard}
            initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.07, type: 'spring', stiffness: 300 }}>
            <div style={s.kpiLabel}>{k.label}</div>
            <div style={{ ...s.kpiVal, color: k.color, fontFamily: k.mono ? 'var(--font-mono)' : undefined }}>{k.val}</div>
            <div style={s.kpiSub}>{k.sub}</div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* BCR Gauge + enrollment side by side */}
      <motion.div variants={item} style={s.row}>
        {/* Gauge */}
        <div style={{ ...s.card, flex: 1 }}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Burning Cost Rate</span>
            <span style={s.cardSub}>BCR = total claims ÷ total premiums</span>
          </div>
          <BcrGauge bcr={bcr} min={bcrTarget.min} max={bcrTarget.max} status={bcrStatus} />
          <div style={s.bcrNote}>
            Target: {bcrTarget.min}–{bcrTarget.max} · 65 paise per ₹1 goes to payouts
          </div>
        </div>

        {/* Enrollment */}
        <div style={{ ...s.card, flex: 1 }}>
          <div style={s.cardHeader}>
            <span style={s.cardTitle}>Enrollment</span>
            <span style={s.cardSub}>Need 7+ active delivery days</span>
          </div>
          <div style={s.enrollGrid}>
            {[
              { label: 'Total Workers',  val: enrollment.total,      color: 'var(--text)'  },
              { label: 'Eligible',       val: enrollment.eligible,   color: 'var(--green)' },
              { label: 'Not Eligible',   val: enrollment.ineligible, color: 'var(--amber)' },
              { label: 'Flagged',        val: enrollment.flagged,    color: 'var(--red)'   },
            ].map(e => (
              <div key={e.label} style={s.enrollItem}>
                <div style={{ ...s.enrollVal, color: e.color }}>{e.val}</div>
                <div style={s.enrollLabel}>{e.label}</div>
              </div>
            ))}
          </div>
          {/* Stacked bar */}
          <div style={s.enrollBar}>
            <motion.div
              style={{ height: '100%', background: 'var(--green)', borderRadius: '4px 0 0 4px' }}
              initial={{ width: 0 }}
              animate={{ width: `${(enrollment.eligible / enrollment.total) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.5 }}
            />
            <motion.div
              style={{ height: '100%', background: 'var(--amber)' }}
              initial={{ width: 0 }}
              animate={{ width: `${(enrollment.ineligible / enrollment.total) * 100}%` }}
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.6 }}
            />
          </div>
          <div style={s.enrollBarLegend}>
            <span style={{ color: 'var(--green)' }}>● Eligible</span>
            <span style={{ color: 'var(--amber)' }}>● Not eligible</span>
          </div>
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* City Pools table */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>CITY RISK POOLS</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        <div style={s.tableHead}>
          <span style={{ flex: 1.4 }}>Pool</span>
          <span style={{ width: 60, textAlign: 'center' }}>Workers</span>
          <span style={{ width: 60, textAlign: 'center' }}>Eligible</span>
          <span style={{ width: 64, textAlign: 'right' }}>Avg Premium</span>
          <span style={{ width: 60, textAlign: 'center' }}>Risk</span>
          <span style={{ width: 72, textAlign: 'right' }}>Status</span>
        </div>
        {cityPools.map((p, i) => {
          const meta = STATUS_META[p.status] || STATUS_META.balanced;
          return (
            <motion.div key={p.city}
              style={{ ...s.tableRow, borderBottom: i < cityPools.length - 1 ? '1px solid #13131A' : 'none' }}
              initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 + i * 0.05 }}>
              <div style={{ flex: 1.4 }}>
                <div style={s.poolName}>{p.city}</div>
                <div style={s.poolSub}>{p.pool}</div>
              </div>
              <span style={{ ...s.tableCell, width: 60 }}>{p.enrolled}</span>
              <span style={{ ...s.tableCell, width: 60 }}>{p.eligible}</span>
              <span style={{ ...s.tableCell, width: 64, textAlign: 'right' }}>₹{p.avgPremium}</span>
              {/* Risk bar */}
              <div style={{ width: 60, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: 40, height: 5, background: '#1C1C24', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div
                    style={{ height: '100%', background: meta.color, borderRadius: 3 }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, p.riskScore)}%` }}
                    transition={{ delay: 0.3 + i * 0.05, duration: 0.7 }}
                  />
                </div>
              </div>
              <div style={{ width: 72, display: 'flex', justifyContent: 'flex-end' }}>
                <span style={{ ...s.statusBadge, background: meta.bg, color: meta.color, border: `1px solid ${meta.border}` }}>{meta.label}</span>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Stress Scenario */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>STRESS SCENARIO</div>
      </motion.div>
      <motion.div variants={item} style={{ ...s.card, border: stressScenario.capitalAlert ? '1px solid rgba(232,90,74,0.3)' : '1px solid var(--border)' }}>
        <div style={s.stressHeader}>
          <div>
            <div style={s.stressTitle}>{stressScenario.label}</div>
            <div style={s.stressSub}>Simulated across {stressScenario.affectedCities.join(' + ')} · {stressScenario.affectedWorkers} workers affected</div>
          </div>
          <div style={{ ...s.stressAlert, background: stressScenario.capitalAlert ? 'var(--red-dim)' : 'var(--green-dim)', color: stressScenario.capitalAlert ? 'var(--red)' : 'var(--green)', border: `1px solid ${stressScenario.capitalAlert ? 'rgba(232,90,74,0.25)' : 'rgba(62,201,122,0.25)'}` }}>
            {stressScenario.capitalAlert ? 'Reserve Alert' : 'Within Limits'}
          </div>
        </div>
        <div style={s.stressGrid}>
          {[
            { label: 'Extra Claims',       val: `₹${stressScenario.extraClaims.toLocaleString('en-IN')}`, color: 'var(--red)'   },
            { label: 'Projected BCR',      val: stressScenario.projectedBcr,                              color: stressScenario.capitalAlert ? 'var(--red)' : 'var(--amber)' },
            { label: 'Projected Loss Ratio', val: `${stressScenario.projectedLossRatio}%`,                color: stressScenario.capitalAlert ? 'var(--red)' : 'var(--amber)' },
          ].map(s2 => (
            <div key={s2.label} style={s.stressStat}>
              <div style={{ ...s.stressStatVal, color: s2.color }}>{s2.val}</div>
              <div style={s.stressStatLabel}>{s2.label}</div>
            </div>
          ))}
        </div>
        <div style={s.stressNote}>
          {stressScenario.capitalAlert
            ? 'Capital reserves insufficient for sustained monsoon. Recommend reinsurance buffer or reduced max coverage in these zones.'
            : 'Within acceptable capital reserve threshold. Platform remains solvent under this scenario.'}
        </div>
      </motion.div>

      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  kpiGrid: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 4 },
  kpiCard: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 14, padding: '14px 16px' },
  kpiLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.8px', marginBottom: 6 },
  kpiVal: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' },
  kpiSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--muted)', marginTop: 3 },
  divider: { height: 1, background: 'var(--border)', margin: '20px 0' },
  row: { display: 'flex', gap: 16 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '16px' },
  cardHeader: { marginBottom: 16 },
  cardTitle: { fontSize: 13, fontWeight: 700, color: 'var(--text)', display: 'block', marginBottom: 3 },
  cardSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--muted)' },
  bcrNote: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)', textAlign: 'center', marginTop: 10 },
  enrollGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 },
  enrollItem: { textAlign: 'center' },
  enrollVal: { fontSize: 24, fontWeight: 900, letterSpacing: '-0.5px' },
  enrollLabel: { fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--faint)', letterSpacing: '0.5px', marginTop: 2 },
  enrollBar: { height: 7, background: '#1C1C24', borderRadius: 4, overflow: 'hidden', display: 'flex', marginBottom: 8 },
  enrollBarLegend: { display: 'flex', justifyContent: 'center', gap: 16, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--faint)' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  tableHead: { display: 'flex', alignItems: 'center', padding: '0 0 10px', borderBottom: '1px solid #13131A', marginBottom: 2, fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--faint)', letterSpacing: '0.5px' },
  tableRow: { display: 'flex', alignItems: 'center', padding: '11px 0' },
  tableCell: { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text2)', textAlign: 'center' },
  poolName: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  poolSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 9, color: 'var(--faint)', marginTop: 2 },
  statusBadge: { fontFamily: 'var(--font-mono)', fontSize: 8, padding: '2px 8px', borderRadius: 20, letterSpacing: '0.3px' },
  stressHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 },
  stressTitle: { fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 4 },
  stressSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--muted)' },
  stressAlert: { padding: '4px 12px', borderRadius: 20, fontFamily: 'var(--font-mono)', fontSize: 9, fontWeight: 600, letterSpacing: '0.3px', flexShrink: 0 },
  stressGrid: { display: 'flex', gap: 20, marginBottom: 14 },
  stressStat: {},
  stressStatVal: { fontSize: 22, fontWeight: 900, letterSpacing: '-0.5px' },
  stressStatLabel: { fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--faint)', letterSpacing: '0.5px', marginTop: 2 },
  stressNote: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', padding: '10px 12px', background: 'var(--surface2)', borderRadius: 10, lineHeight: 1.5 },
};
