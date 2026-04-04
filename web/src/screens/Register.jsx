import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { postRegister } from '../api.js';

const PLATFORMS = ['Swiggy', 'Zomato', 'Dunzo', 'Blinkit', 'Ola', 'Other'];
const CITIES    = ['Delhi', 'Mumbai', 'Bangalore', 'Chennai', 'Hyderabad', 'Pune'];
const CITY_ZONES = {
  Delhi:     ['Connaught Place', 'Dwarka', 'Rohini', 'Lajpat Nagar', 'Noida', 'Gurgaon'],
  Mumbai:    ['Andheri', 'Bandra', 'Kurla', 'Thane', 'Dadar', 'Borivali'],
  Bangalore: ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'BTM Layout', 'Marathahalli'],
  Chennai:   ['Velachery', 'Anna Nagar', 'T Nagar', 'Adyar', 'Porur', 'Perambur'],
  Hyderabad: ['Banjara Hills', 'Madhapur', 'Kukatpally', 'Secunderabad', 'Gachibowli', 'Dilsukhnagar'],
  Pune:      ['Kothrud', 'Hadapsar', 'Viman Nagar', 'Aundh', 'Pimpri', 'Wakad'],
};
const HOURS_PRESETS = [
  { label: 'Morning', value: '6 AM – 2 PM' },
  { label: 'Afternoon', value: '10 AM – 6 PM' },
  { label: 'Evening', value: '2 PM – 10 PM' },
  { label: 'Night', value: '6 PM – 2 AM' },
  { label: 'Full Day', value: '8 AM – 8 PM' },
  { label: 'Flexible', value: 'Flexible' },
];
const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

const STEPS = ['phone','name','platform','location','hours','pin'];

const slideVariants = {
  enter: (d) => ({ opacity: 0, x: d > 0 ? 40 : -40 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.3, ease: [0.32,0.72,0,1] } },
  exit: (d) => ({ opacity: 0, x: d > 0 ? -40 : 40, transition: { duration: 0.22 } }),
};

export default function Register({ onRegister, onBack }) {
  const [step, setStep]       = useState(0);
  const [prevStep, setPrevStep] = useState(0);
  const [phone, setPhone]     = useState('');
  const [name, setName]       = useState('');
  const [platform, setPlatform] = useState('');
  const [city, setCity]       = useState('');
  const [zone, setZone]       = useState('');
  const [hours, setHours]     = useState('');
  const [pin, setPin]         = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep] = useState('set'); // set | confirm
  const [error, setError]     = useState('');
  const [loading, setLoading] = useState(false);

  const dir = step - prevStep;

  function next() {
    setPrevStep(step);
    setStep(s => s + 1);
    setError('');
  }
  function back() {
    if (step === 0) { onBack(); return; }
    setPrevStep(step);
    setStep(s => s - 1);
    setError('');
  }

  function handlePhoneKey(k) {
    if (k === '⌫') return setPhone(p => p.slice(0,-1));
    if (phone.length < 10) setPhone(p => p + k);
  }

  function handlePinKey(k) {
    if (pinStep === 'set') {
      if (k === '⌫') { setPin(p => p.slice(0,-1)); return; }
      if (pin.length >= 4) return;
      const next = pin + k;
      setPin(next);
      if (next.length === 4) setPinStep('confirm');
    } else {
      if (k === '⌫') { setPinConfirm(p => p.slice(0,-1)); setError(''); return; }
      if (pinConfirm.length >= 4) return;
      const next = pinConfirm + k;
      setPinConfirm(next);
      setError('');
      if (next.length === 4) handleSubmit(next);
    }
  }

  async function handleSubmit(confirmPin) {
    if (confirmPin !== pin) {
      setError('PINs do not match');
      setPinConfirm('');
      setPinStep('set');
      setPin('');
      return;
    }
    setLoading(true);
    try {
      const res = await postRegister({ name, phone, pin, platform, location: city, zone, workHours: hours });
      if (res.token) {
        localStorage.setItem('ais_token', res.token);
        onRegister(res.worker);
      } else {
        setError(res.error || 'Registration failed');
        setPinStep('set'); setPin(''); setPinConfirm('');
      }
    } catch {
      setError('Connection error');
      setPinStep('set'); setPin(''); setPinConfirm('');
    } finally {
      setLoading(false);
    }
  }

  const steps = [
    // 0: Phone
    <motion.div key="phone" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.stepWrap}>
      <div style={s.stepTitle}>Your mobile number</div>
      <div style={s.stepSub}>Used to identify your account securely</div>
      <div style={s.phoneDisplay}>
        <span style={s.phonePrefix}>+91</span>
        <span style={{ ...s.phoneNum, color: phone.length ? 'var(--text)' : 'var(--faint)' }}>
          {phone.length ? phone.replace(/(\d{5})(\d{0,5})/, '$1 $2') : '· · · · · · · · · ·'}
        </span>
      </div>
      <div style={s.numpad}>
        {NUMPAD.map((k,i) => (
          <motion.button key={i} onClick={() => k && handlePhoneKey(k)} style={{ ...s.key, opacity: k?1:0, pointerEvents: k?'auto':'none', background: k==='⌫'?'transparent':'var(--surface2)', color: k==='⌫'?'var(--muted)':'var(--text)', fontSize: k==='⌫'?18:20 }} whileTap={k?{scale:0.88,background:'var(--coral-dim)'}:{}} transition={{duration:0.1}}>{k}</motion.button>
        ))}
      </div>
      <motion.button onClick={next} disabled={phone.length < 10} style={{ ...s.cta, opacity: phone.length===10?1:0.4 }} whileTap={phone.length===10?{scale:0.97}:{}}>Continue →</motion.button>
    </motion.div>,

    // 1: Name
    <motion.div key="name" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.stepWrap}>
      <div style={s.stepTitle}>What's your name?</div>
      <div style={s.stepSub}>This appears on your insurance profile</div>
      <input
        autoFocus
        style={s.input}
        placeholder="Full name"
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && name.trim().length > 1 && next()}
      />
      <motion.button onClick={next} disabled={name.trim().length < 2} style={{ ...s.cta, opacity: name.trim().length>=2?1:0.4, marginTop: 'auto' }} whileTap={name.trim().length>=2?{scale:0.97}:{}}>Continue →</motion.button>
    </motion.div>,

    // 2: Platform
    <motion.div key="platform" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.stepWrap}>
      <div style={s.stepTitle}>Your delivery platform</div>
      <div style={s.stepSub}>Where do you primarily work?</div>
      <div style={s.chips}>
        {PLATFORMS.map(p => (
          <motion.button
            key={p}
            onClick={() => { setPlatform(p); }}
            style={{ ...s.chip, background: platform===p ? 'var(--coral-dim)' : 'var(--surface2)', border: `1px solid ${platform===p ? 'var(--coral)' : 'var(--border2)'}`, color: platform===p ? 'var(--coral)' : 'var(--text2)' }}
            whileTap={{ scale: 0.95 }}
          >{p}</motion.button>
        ))}
      </div>
      <motion.button onClick={next} disabled={!platform} style={{ ...s.cta, opacity: platform?1:0.4, marginTop: 'auto' }} whileTap={platform?{scale:0.97}:{}}>Continue →</motion.button>
    </motion.div>,

    // 3: City + Zone
    <motion.div key="location" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.stepWrap}>
      <div style={s.stepTitle}>Where do you ride?</div>
      <div style={s.stepSub}>Your city determines your insurance risk pool</div>
      <div style={s.label}>City</div>
      <div style={s.chips}>
        {CITIES.map(c => (
          <motion.button
            key={c}
            onClick={() => { setCity(c); setZone(''); }}
            style={{ ...s.chip, background: city===c ? 'var(--blue-dim)' : 'var(--surface2)', border: `1px solid ${city===c ? 'var(--blue)' : 'var(--border2)'}`, color: city===c ? 'var(--blue)' : 'var(--text2)' }}
            whileTap={{ scale: 0.95 }}
          >{c}</motion.button>
        ))}
      </div>
      <AnimatePresence>
        {city && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ width: '100%' }}>
            <div style={{ ...s.label, marginTop: 14 }}>Zone in {city}</div>
            <div style={s.chips}>
              {CITY_ZONES[city].map(z => (
                <motion.button
                  key={z}
                  onClick={() => setZone(z)}
                  style={{ ...s.chip, background: zone===z ? 'var(--blue-dim)' : 'var(--surface2)', border: `1px solid ${zone===z ? 'var(--blue)' : 'var(--border2)'}`, color: zone===z ? 'var(--blue)' : 'var(--text2)' }}
                  whileTap={{ scale: 0.95 }}
                >{z}</motion.button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <motion.button onClick={next} disabled={!city || !zone} style={{ ...s.cta, opacity: city&&zone?1:0.4, marginTop: 'auto' }} whileTap={city&&zone?{scale:0.97}:{}}>Continue →</motion.button>
    </motion.div>,

    // 4: Work hours
    <motion.div key="hours" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.stepWrap}>
      <div style={s.stepTitle}>When do you work?</div>
      <div style={s.stepSub}>Helps us calculate your risk exposure window</div>
      <div style={s.chips}>
        {HOURS_PRESETS.map(h => (
          <motion.button
            key={h.value}
            onClick={() => setHours(h.value)}
            style={{ ...s.chip, ...s.chipWide, background: hours===h.value ? 'var(--green-dim)' : 'var(--surface2)', border: `1px solid ${hours===h.value ? 'var(--green)' : 'var(--border2)'}`, color: hours===h.value ? 'var(--green)' : 'var(--text2)' }}
            whileTap={{ scale: 0.95 }}
          >
            <span style={{ fontWeight: 700 }}>{h.label}</span>
            <span style={{ fontSize: 10, color: 'inherit', opacity: 0.7, marginTop: 2, fontFamily: 'var(--font-mono)' }}>{h.value}</span>
          </motion.button>
        ))}
      </div>
      <motion.button onClick={next} disabled={!hours} style={{ ...s.cta, opacity: hours?1:0.4, marginTop: 'auto' }} whileTap={hours?{scale:0.97}:{}}>Continue →</motion.button>
    </motion.div>,

    // 5: PIN
    <motion.div key="pin" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.stepWrap}>
      <div style={s.stepTitle}>{pinStep === 'set' ? 'Create your PIN' : 'Confirm your PIN'}</div>
      <div style={s.stepSub}>{pinStep === 'set' ? 'Choose a 4-digit PIN' : 'Re-enter the PIN to confirm'}</div>
      <div style={s.dots}>
        {[0,1,2,3].map(i => {
          const arr = pinStep === 'set' ? pin : pinConfirm;
          return (
            <motion.div
              key={i}
              style={{ ...s.dot, background: i < arr.length ? 'var(--coral)' : 'var(--surface2)', border: `2px solid ${i < arr.length ? 'var(--coral)' : 'var(--border2)'}` }}
              animate={{ scale: i === arr.length - 1 && arr.length > 0 ? [1,1.3,1] : 1 }}
              transition={{ duration: 0.2 }}
            />
          );
        })}
      </div>
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }} style={s.errMsg}>{error}</motion.div>
        )}
      </AnimatePresence>
      <div style={s.numpad}>
        {NUMPAD.map((k,i) => (
          <motion.button key={i} onClick={() => k && handlePinKey(k)} disabled={loading} style={{ ...s.key, opacity: k?1:0, pointerEvents: k?'auto':'none', background: k==='⌫'?'transparent':'var(--surface2)', color: k==='⌫'?'var(--muted)':'var(--text)', fontSize: k==='⌫'?18:20 }} whileTap={k?{scale:0.88,background:'var(--coral-dim)'}:{}} transition={{duration:0.1}}>{k}</motion.button>
        ))}
      </div>
    </motion.div>,
  ];

  const STEP_LABELS = ['Phone','Name','Platform','Location','Hours','PIN'];
  const progressPct = (step / (STEPS.length - 1)) * 100;

  return (
    <div style={s.root}>
      {/* Header */}
      <div style={s.header}>
        <motion.button onClick={back} style={s.backBtn} whileTap={{ scale: 0.95 }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 3L5 8l5 5"/>
          </svg>
        </motion.button>
        <div style={s.stepIndicator}>
          <span style={s.stepCount}>{step + 1} / {STEPS.length}</span>
          <span style={s.stepName}>{STEP_LABELS[step]}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div style={s.progressTrack}>
        <motion.div
          style={s.progressFill}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.4, ease: [0.32,0.72,0,1] }}
        />
      </div>

      {/* Step content */}
      <div style={s.content}>
        <AnimatePresence custom={dir} mode="wait">
          {steps[step]}
        </AnimatePresence>
      </div>
    </div>
  );
}

const s = {
  root:          { display: 'flex', flexDirection: 'column', height: '100%' },
  header:        { display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 },
  backBtn:       { background: 'none', border: 'none', cursor: 'pointer', padding: '4px 0', display: 'flex', alignItems: 'center' },
  stepIndicator: { display: 'flex', gap: 8, alignItems: 'baseline' },
  stepCount:     { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)', letterSpacing: '0.5px' },
  stepName:      { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--coral)', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' },
  progressTrack: { height: 3, background: 'var(--surface2)', borderRadius: 2, marginBottom: 24, overflow: 'hidden' },
  progressFill:  { height: '100%', background: 'var(--coral)', borderRadius: 2 },
  content:       { flex: 1, overflow: 'hidden', position: 'relative' },
  stepWrap:      { position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', overflowY: 'auto' },
  stepTitle:     { fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.4px', marginBottom: 6 },
  stepSub:       { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)', marginBottom: 24, lineHeight: 1.5 },
  input:         { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: '14px 18px', fontSize: 16, fontWeight: 700, color: 'var(--text)', fontFamily: 'var(--font-sans)', outline: 'none', marginBottom: 12 },
  label:         { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', marginBottom: 10, textTransform: 'uppercase' },
  chips:         { display: 'flex', flexWrap: 'wrap', gap: 8, width: '100%' },
  chip:          { padding: '9px 14px', borderRadius: 12, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'flex', flexDirection: 'column', alignItems: 'center' },
  chipWide:      { flexDirection: 'column', minWidth: 'calc(50% - 4px)', flex: '1 0 calc(50% - 4px)' },
  phoneDisplay:  { width: '100%', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 16, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 },
  phonePrefix:   { fontFamily: 'var(--font-mono)', fontSize: 15, color: 'var(--muted)', fontWeight: 600 },
  phoneNum:      { fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, letterSpacing: '2px', flex: 1 },
  numpad:        { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, width: '100%', marginBottom: 12 },
  key:           { height: 56, borderRadius: 16, border: 'none', cursor: 'pointer', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center' },
  cta:           { width: '100%', padding: '15px', borderRadius: 16, border: 'none', background: 'var(--coral)', color: '#fff', fontSize: 15, fontWeight: 700, cursor: 'pointer', letterSpacing: '-0.2px', flexShrink: 0 },
  dots:          { display: 'flex', gap: 14, marginBottom: 20 },
  dot:           { width: 18, height: 18, borderRadius: '50%' },
  errMsg:        { fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--red)', marginBottom: 10 },
};
