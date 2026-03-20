import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { fetchCoverage, patchCoverage } from '../api.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const item = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } };

const SLIDERS = [
  { key: 'rain', label: 'Rain', color: 'var(--blue)' },
  { key: 'lowOrders', label: 'Low Orders', color: 'var(--green)' },
  { key: 'pollution', label: 'Pollution', color: 'var(--amber)' },
  { key: 'curfew', label: 'Curfew', color: 'var(--purple)' },
];

const COVERED = [
  { key: 'rain', label: 'Rain · heavy downpour', color: 'var(--blue)', status: 'Active' },
  { key: 'lowOrders', label: 'Low demand orders', color: 'var(--green)', status: 'Active' },
  { key: 'curfew', label: 'Curfew / city bandh', color: 'var(--purple)', status: 'Active' },
  { key: 'pollution', label: 'Poor air quality', color: 'var(--amber)', status: 'Watching' },
];

export default function Coverage() {
  const [vals, setVals] = useState({ rain: 800, lowOrders: 500, pollution: 200, curfew: 300 });

  useEffect(() => {
    fetchCoverage()
      .then(d => setVals({ rain: d.rain, lowOrders: d.lowOrders, pollution: d.pollution, curfew: d.curfew }))
      .catch(() => {});
  }, []);

  const total = Object.values(vals).reduce((a, b) => a + b, 0);

  const handleChange = useCallback((key, val) => {
    setVals(prev => ({ ...prev, [key]: val }));
    patchCoverage({ [key]: val }).catch(() => {});
  }, []);

  return (
    <motion.div variants={container} initial="hidden" animate="show">
      <motion.div variants={item}>
        <div style={s.eyebrow}>your plan</div>
        <div style={s.hero}>₹40</div>
        <div style={s.sub}>per week · up to ₹1,500 support</div>
      </motion.div>

      <motion.div variants={item} style={{ display: 'flex', gap: 8, marginTop: 12 }}>
        <span style={s.pillDark}>Chennai · Velachery</span>
        <span style={s.pillCoral}>Active</span>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      <motion.div variants={item}>
        <div style={s.sectionLabel}>COVERAGE CONTROLS</div>
      </motion.div>

      <motion.div variants={item} style={s.card}>
        {SLIDERS.map(({ key, label, color }) => {
          const val = vals[key];
          const pct = (val / 1500) * 100;
          return (
            <div key={key} style={s.sliderRow}>
              <div style={s.sliderHeader}>
                <span style={s.sliderName}>{label}</span>
                <motion.span
                  key={val}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ ...s.sliderAmt, color }}
                >
                  ₹{val}
                </motion.span>
              </div>
              <div style={s.sliderWrap}>
                <div style={s.sliderTrackBg} />
                <motion.div
                  style={{ ...s.sliderFill, width: `${pct}%`, background: color }}
                  layout
                  transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
                <input
                  type="range" min={0} max={1500} step={50} value={val}
                  onChange={e => handleChange(key, +e.target.value)}
                  style={{ ...s.sliderInput, '--thumb-color': color }}
                  className={`slider-${key}`}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Dynamic slider thumb colors */}
      <style>{SLIDERS.map(({ key, color }) =>
        `.slider-${key}::-webkit-slider-thumb { border-color: ${color} !important; }
         .slider-${key}::-moz-range-thumb { border-color: ${color} !important; }`
      ).join('\n')}</style>

      {/* Total */}
      <motion.div variants={item} style={s.totalRow}>
        <span style={s.totalLbl}>total coverage</span>
        <motion.span
          key={total}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 400 }}
          style={s.totalVal}
        >
          ₹{total.toLocaleString('en-IN')}
        </motion.span>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      <motion.div variants={item}>
        <div style={s.sectionLabel}>WHAT'S COVERED</div>
      </motion.div>

      <motion.div variants={item} style={s.card}>
        {COVERED.map(({ key, label, color, status }, i) => (
          <motion.div
            key={key}
            style={{ ...s.covRow, borderBottom: i < COVERED.length - 1 ? '1px solid #13131A' : 'none' }}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 + i * 0.06 }}
          >
            <div style={s.covLeft}>
              <div style={{ ...s.dot, background: color }} />
              <span style={s.covName}>{label}</span>
            </div>
            <span style={{ ...s.covStatus, color }}>{status}</span>
          </motion.div>
        ))}
      </motion.div>

      <motion.div variants={item} style={{ ...s.note, marginTop: 14 }}>
        Plan adapts to your area risk automatically
      </motion.div>
      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  eyebrow: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)' },
  hero: { fontSize: 52, fontWeight: 900, color: 'var(--text)', letterSpacing: '-2px', lineHeight: 1, marginTop: 2 },
  sub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--faint)', marginTop: 4 },
  pillDark: { padding: '5px 12px', borderRadius: 20, background: 'var(--surface)', border: '1px solid var(--border2)', fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text2)' },
  pillCoral: { padding: '5px 12px', borderRadius: 20, background: 'var(--coral)', fontFamily: 'var(--font-mono)', fontSize: 9, color: '#fff', fontWeight: 500 },
  divider: { height: 1, background: 'var(--border)', margin: '16px 0' },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 20, padding: '12px 16px' },
  sliderRow: { marginBottom: 16 },
  sliderHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8 },
  sliderName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  sliderAmt: { fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 500 },
  sliderWrap: { position: 'relative', height: 18, display: 'flex', alignItems: 'center' },
  sliderTrackBg: { position: 'absolute', left: 0, right: 0, height: 4, background: '#1C1C24', borderRadius: 2 },
  sliderFill: { position: 'absolute', left: 0, height: 4, borderRadius: 2, pointerEvents: 'none' },
  sliderInput: { position: 'absolute', left: 0, right: 0, width: '100%', height: 18, zIndex: 2, background: 'transparent', outline: 'none', cursor: 'pointer' },
  totalRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', padding: '14px 4px 4px' },
  totalLbl: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)' },
  totalVal: { fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.5px' },
  covRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0' },
  covLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  dot: { width: 7, height: 7, borderRadius: '50%', flexShrink: 0 },
  covName: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  covStatus: { fontFamily: 'var(--font-mono)', fontSize: 10, letterSpacing: '0.3px' },
  note: { padding: 12, background: 'rgba(155,122,232,0.06)', border: '1px solid rgba(155,122,232,0.15)', borderRadius: 14, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', textAlign: 'center' },
};
