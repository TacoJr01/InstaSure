import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { fetchAdminSettings, patchAdminSettings } from '../api.js';

const container = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const item = { hidden: { opacity: 0, y: 14 }, show: { opacity: 1, y: 0 } };

const TRIGGER_COLORS = {
  rain:      'var(--blue)',
  lowOrders: 'var(--green)',
  curfew:    'var(--purple)',
  outage:    'var(--coral)',
};

function Toggle({ on, onChange, disabled }) {
  return (
    <motion.div
      onClick={() => !disabled && onChange(!on)}
      style={{
        width: 42, height: 24, borderRadius: 12, padding: 2,
        background: on ? (disabled ? '#2A2A36' : 'var(--green)') : 'var(--surface2)',
        cursor: disabled ? 'not-allowed' : 'pointer',
        flexShrink: 0, position: 'relative', display: 'flex', alignItems: 'center',
        opacity: disabled ? 0.5 : 1,
        border: '1px solid var(--border)',
      }}
      animate={{ background: on && !disabled ? '#3EC97A' : '#1C1C22' }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        style={{ width: 18, height: 18, borderRadius: '50%', background: '#fff', flexShrink: 0 }}
        animate={{ x: on ? 18 : 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </motion.div>
  );
}

function NumInput({ value, onChange, min, max, step = 1, prefix, suffix }) {
  return (
    <div style={s.numWrap}>
      {prefix && <span style={s.numAffix}>{prefix}</span>}
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        step={step}
        onChange={e => onChange(Number(e.target.value))}
        style={s.numInput}
      />
      {suffix && <span style={s.numAffix}>{suffix}</span>}
    </div>
  );
}

export default function Settings() {
  const [cfg, setCfg] = useState(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchAdminSettings().then(setCfg).catch(() => {});
  }, []);

  if (!cfg) {
    return (
      <div style={{ padding: '40px 0', textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--faint)' }}>
        Loading settings…
      </div>
    );
  }

  function setTrigger(key, field, val) {
    setCfg(prev => ({
      ...prev,
      triggers: { ...prev.triggers, [key]: { ...prev.triggers[key], [field]: val } },
    }));
    setSaved(false);
  }

  function setGts(field, val) {
    setCfg(prev => ({ ...prev, gigtrust: { ...prev.gigtrust, [field]: val } }));
    setSaved(false);
  }

  function setPremium(field, val) {
    setCfg(prev => ({ ...prev, premium: { ...prev.premium, [field]: val } }));
    setSaved(false);
  }

  function setPlatform(field, val) {
    setCfg(prev => ({ ...prev, platform: { ...prev.platform, [field]: val } }));
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const updated = await patchAdminSettings(cfg);
      setCfg(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch {}
    setSaving(false);
  }

  const platformKill = !cfg.platform.active;

  return (
    <motion.div variants={container} initial="hidden" animate="show">

      {/* Platform kill-switch banner */}
      <AnimatePresence>
        {platformKill && (
          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            style={s.killBanner}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="var(--red)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="7" cy="7" r="5.5"/>
              <line x1="7" y1="4.5" x2="7" y2="7.5"/>
              <circle cx="7" cy="9.5" r="0.6" fill="var(--red)"/>
            </svg>
            <span><strong style={{ color: 'var(--red)' }}>Platform is offline.</strong> All payouts and triggers are paused for all workers.</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Trigger Config */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>TRIGGER CONFIGURATION</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        {Object.entries(cfg.triggers).map(([key, t], i, arr) => {
          const color = TRIGGER_COLORS[key];
          return (
            <div
              key={key}
              style={{ ...s.triggerRow, borderBottom: i < arr.length - 1 ? '1px solid #13131A' : 'none' }}
            >
              {/* Left: dot + label + enabled */}
              <div style={s.triggerLeft}>
                <div style={{ ...s.dot, background: t.enabled ? color : 'var(--faint)' }} />
                <div>
                  <div style={{ ...s.triggerName, color: t.enabled ? 'var(--text)' : 'var(--muted)' }}>{t.label}</div>
                  <div style={s.triggerSub}>{t.autoPay ? 'Auto-pay' : 'Requires verification'}</div>
                </div>
              </div>

              {/* Controls */}
              <div style={s.triggerControls}>
                {/* Payout amount */}
                <div style={s.controlGroup}>
                  <span style={s.controlLabel}>PAYOUT</span>
                  <NumInput
                    value={t.payoutAmount}
                    onChange={v => setTrigger(key, 'payoutAmount', v)}
                    min={50} max={1000} step={25}
                    prefix="₹"
                  />
                </div>

                {/* Auto-pay toggle */}
                <div style={s.controlGroup}>
                  <span style={s.controlLabel}>AUTO</span>
                  <Toggle
                    on={t.autoPay}
                    onChange={v => setTrigger(key, 'autoPay', v)}
                    disabled={!t.enabled}
                  />
                </div>

                {/* Enable/disable */}
                <div style={s.controlGroup}>
                  <span style={s.controlLabel}>ON</span>
                  <Toggle on={t.enabled} onChange={v => setTrigger(key, 'enabled', v)} />
                </div>
              </div>
            </div>
          );
        })}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* GigTrust Thresholds */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>GIGTRUST THRESHOLDS</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        {[
          { field: 'highMin',   label: 'HIGH tier minimum',   color: 'var(--green)',  sub: 'Instant payout unlocked' },
          { field: 'mediumMin', label: 'MEDIUM tier minimum', color: 'var(--amber)',  sub: 'Partial / delayed payouts' },
        ].map(({ field, label, color, sub }, i) => (
          <div key={field} style={{ ...s.threshRow, borderBottom: i === 0 ? '1px solid #13131A' : 'none' }}>
            <div style={s.threshLeft}>
              <div style={{ ...s.dot, background: color }} />
              <div>
                <div style={s.threshLabel}>{label}</div>
                <div style={s.triggerSub}>{sub}</div>
              </div>
            </div>
            <NumInput
              value={cfg.gigtrust[field]}
              onChange={v => setGts(field, v)}
              min={300} max={900} step={10}
            />
          </div>
        ))}
        <div style={s.threshNote}>
          Scores below {cfg.gigtrust.mediumMin} = LOW tier — payouts held for review
        </div>
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Premium Formula */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>PREMIUM FORMULA</div>
      </motion.div>
      <motion.div variants={item} style={s.card}>
        <div style={s.formulaNote}>
          premium = max(minPremium, min(maxPremium, (totalCoverage / divisor) × maxPremium))
        </div>
        {[
          { field: 'minPremium',      label: 'Min premium',       prefix: '₹', min: 10,  max: 100,  step: 5 },
          { field: 'maxPremium',      label: 'Max premium',       prefix: '₹', min: 50,  max: 500,  step: 5 },
          { field: 'coverageDivisor', label: 'Coverage divisor',  prefix: '',  min: 500, max: 5000, step: 100 },
        ].map(({ field, label, prefix, min, max, step }, i, arr) => (
          <div key={field} style={{ ...s.formulaRow, borderBottom: i < arr.length - 1 ? '1px solid #13131A' : 'none' }}>
            <span style={s.formulaLabel}>{label}</span>
            <NumInput
              value={cfg.premium[field]}
              onChange={v => setPremium(field, v)}
              min={min} max={max} step={step}
              prefix={prefix || undefined}
            />
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Platform Controls */}
      <motion.div variants={item}>
        <div style={s.sectionLabel}>PLATFORM CONTROLS</div>
      </motion.div>
      <motion.div variants={item} style={{ ...s.card, border: platformKill ? '1px solid rgba(232,90,74,0.3)' : '1px solid var(--border)' }}>
        {[
          {
            field: 'active',
            label: 'Platform active',
            sub: 'Disabling pauses all payouts and triggers globally',
            danger: true,
          },
          {
            field: 'maintenanceMode',
            label: 'Maintenance mode',
            sub: 'Shows maintenance notice to workers, blocks new claims',
            danger: false,
          },
          {
            field: 'fraudAutoSuspend',
            label: 'Auto-suspend on fraud',
            sub: 'Automatically suspend workers when fraud confidence > 85%',
            danger: false,
          },
        ].map(({ field, label, sub, danger }, i, arr) => (
          <div key={field} style={{ ...s.platformRow, borderBottom: i < arr.length - 1 ? '1px solid #13131A' : 'none' }}>
            <div style={s.platformLeft}>
              <div style={{ fontSize: 13, fontWeight: 600, color: danger && !cfg.platform[field] ? 'var(--red)' : 'var(--text)' }}>
                {label}
              </div>
              <div style={s.triggerSub}>{sub}</div>
            </div>
            <Toggle
              on={cfg.platform[field]}
              onChange={v => setPlatform(field, v)}
            />
          </div>
        ))}
      </motion.div>

      <motion.div variants={item} style={s.divider} />

      {/* Save button */}
      <motion.div variants={item}>
        <motion.button
          style={{
            ...s.saveBtn,
            background: saved ? 'var(--green)' : saving ? 'var(--surface2)' : 'var(--coral)',
          }}
          onClick={handleSave}
          whileHover={{ scale: saving ? 1 : 1.02 }}
          whileTap={{ scale: 0.97 }}
          disabled={saving}
        >
          {saved ? '✓ Settings saved' : saving ? 'Saving…' : 'Save Settings'}
        </motion.button>
      </motion.div>

      <div style={{ height: 16 }} />
    </motion.div>
  );
}

const s = {
  killBanner: { display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.3)', borderRadius: 12, marginBottom: 16, fontSize: 12, color: 'var(--text2)', lineHeight: 1.5 },
  sectionLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.2px', marginBottom: 10 },
  card: { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '0 16px' },
  divider: { height: 1, background: 'var(--border)', margin: '20px 0' },
  dot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 2 },
  // Triggers
  triggerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 0', gap: 12 },
  triggerLeft: { display: 'flex', alignItems: 'flex-start', gap: 10, flex: 1, minWidth: 0 },
  triggerName: { fontSize: 13, fontWeight: 600, letterSpacing: '-0.1px' },
  triggerSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)', marginTop: 2 },
  triggerControls: { display: 'flex', alignItems: 'center', gap: 16, flexShrink: 0 },
  controlGroup: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 },
  controlLabel: { fontFamily: 'var(--font-mono)', fontSize: 8, color: 'var(--faint)', letterSpacing: '0.8px' },
  // Number input
  numWrap: { display: 'flex', alignItems: 'center', gap: 3, background: 'var(--surface2)', border: '1px solid var(--border2)', borderRadius: 8, padding: '3px 7px' },
  numAffix: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)' },
  numInput: { width: 48, background: 'transparent', border: 'none', outline: 'none', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text)', textAlign: 'right' },
  // GigTrust thresholds
  threshRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0' },
  threshLeft: { display: 'flex', alignItems: 'flex-start', gap: 10 },
  threshLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text)' },
  threshNote: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 10, color: 'var(--faint)', padding: '10px 0 12px', borderTop: '1px solid #13131A', marginTop: 2 },
  // Premium formula
  formulaNote: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', padding: '12px 0 10px', borderBottom: '1px solid #13131A', letterSpacing: '0.1px', lineHeight: 1.6 },
  formulaRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0' },
  formulaLabel: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  // Platform
  platformRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '13px 0', gap: 12 },
  platformLeft: { flex: 1 },
  // Save
  saveBtn: { width: '100%', padding: '12px 0', border: 'none', borderRadius: 14, fontSize: 13, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '-0.2px', transition: 'background 0.3s' },
};
