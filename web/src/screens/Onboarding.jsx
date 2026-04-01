import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const PLATFORMS = [
  { id: 'Swiggy',  label: 'Swiggy',  color: '#FC8019' },
  { id: 'Zomato',  label: 'Zomato',  color: '#E23744' },
  { id: 'Zepto',   label: 'Zepto',   color: '#7B2EF7' },
  { id: 'Amazon',  label: 'Amazon',  color: '#FF9900' },
];

const CITIES = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune'];

const HOURS = [
  { id: 'Morning (6 AM – 12 PM)',   label: 'Morning',   sub: '6 AM – 12 PM' },
  { id: 'Afternoon (12 PM – 6 PM)', label: 'Afternoon', sub: '12 PM – 6 PM' },
  { id: 'Evening (6 PM – 12 AM)',   label: 'Evening',   sub: '6 PM – 12 AM' },
  { id: 'All Day (8 AM – 10 PM)',   label: 'All Day',   sub: '8 AM – 10 PM' },
];

const slideVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 60 : -60 }),
  center: { opacity: 1, x: 0, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -60 : 60, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }),
};

export default function Onboarding({ onComplete }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [platform, setPlatform] = useState('');
  const [city, setCity] = useState('');
  const [zone, setZone] = useState('');
  const [hours, setHours] = useState('');

  // Total steps: 0=welcome, 1=platform, 2=location, 3=hours, 4=done
  const TOTAL = 4;

  function next() {
    setDir(1);
    setStep(s => s + 1);
  }
  function back() {
    setDir(-1);
    setStep(s => s - 1);
  }
  function finish() {
    onComplete({ platform, location: city, zone: zone || city, workHours: hours });
  }

  const canNext = [
    true,            // welcome: always next
    !!platform,      // platform selected
    !!city,          // city selected
    !!hours,         // hours selected
  ][step] ?? true;

  return (
    <div style={s.root}>
      {/* Progress dots */}
      {step > 0 && step < TOTAL && (
        <motion.div
          style={s.dotsRow}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {[1, 2, 3].map(n => (
            <div key={n} style={{ ...s.dot, background: step >= n ? 'var(--coral)' : 'var(--border2)' }} />
          ))}
        </motion.div>
      )}

      <div style={s.contentArea}>
        <AnimatePresence custom={dir} mode="wait">

          {/* Step 0: Welcome */}
          {step === 0 && (
            <motion.div key="welcome" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.slide}>
              <motion.div
                initial={{ scale: 0.7, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, delay: 0.1 }}
                style={s.shieldIcon}
              >
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" stroke="var(--coral)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20 4l14 5.5V20c0 8.5-6.5 14-14 15.5C6.5 34 6 29 6 20V9.5L20 4z"/>
                  <polyline points="13,20 18,25 27,15"/>
                </svg>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
                <div style={s.welcomeTitle}>InstaSure</div>
                <div style={s.welcomeSub}>Zero-touch income protection for gig workers</div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={s.welcomeFeatures}>
                {[
                  'Automatic payouts — no claims needed',
                  'Covers rain, demand drops & more',
                  'Powered by your GigTrust Score',
                ].map((f, i) => (
                  <div key={i} style={s.featureRow}>
                    <div style={s.featureDot} />
                    <span style={s.featureTxt}>{f}</span>
                  </div>
                ))}
              </motion.div>
            </motion.div>
          )}

          {/* Step 1: Platform */}
          {step === 1 && (
            <motion.div key="platform" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.slide}>
              <div style={s.stepLabel}>STEP 1 OF 3</div>
              <div style={s.stepTitle}>Which platform do you work on?</div>
              <div style={s.stepSub}>We'll tailor your coverage to your platform's patterns</div>
              <div style={s.platformGrid}>
                {PLATFORMS.map(p => (
                  <motion.button
                    key={p.id}
                    style={{
                      ...s.platformBtn,
                      borderColor: platform === p.id ? p.color : 'var(--border2)',
                      background: platform === p.id ? `${p.color}18` : 'var(--surface)',
                    }}
                    onClick={() => setPlatform(p.id)}
                    whileTap={{ scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 400 }}
                  >
                    <span style={{ ...s.platformName, color: platform === p.id ? p.color : 'var(--text2)' }}>{p.label}</span>
                    {platform === p.id && (
                      <motion.div
                        layoutId="platformCheck"
                        style={{ ...s.platformCheck, background: p.color }}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,5 4,8 8,3"/>
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Location */}
          {step === 2 && (
            <motion.div key="location" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.slide}>
              <div style={s.stepLabel}>STEP 2 OF 3</div>
              <div style={s.stepTitle}>Where are you based?</div>
              <div style={s.stepSub}>Used to fetch local weather, demand and zone data</div>

              <div style={s.fieldGroup}>
                <div style={s.fieldLabel}>CITY</div>
                <div style={s.cityGrid}>
                  {CITIES.map(c => (
                    <motion.button
                      key={c}
                      style={{
                        ...s.cityBtn,
                        borderColor: city === c ? 'var(--blue)' : 'var(--border2)',
                        background: city === c ? 'rgba(74,143,232,0.12)' : 'var(--surface)',
                        color: city === c ? 'var(--blue)' : 'var(--text2)',
                      }}
                      onClick={() => setCity(c)}
                      whileTap={{ scale: 0.95 }}
                    >
                      {c}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div style={{ ...s.fieldGroup, marginTop: 16 }}>
                <div style={s.fieldLabel}>ZONE / AREA (optional)</div>
                <input
                  type="text"
                  placeholder="e.g. Velachery, Andheri West"
                  value={zone}
                  onChange={e => setZone(e.target.value)}
                  style={s.textInput}
                />
              </div>
            </motion.div>
          )}

          {/* Step 3: Work Hours */}
          {step === 3 && (
            <motion.div key="hours" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={s.slide}>
              <div style={s.stepLabel}>STEP 3 OF 3</div>
              <div style={s.stepTitle}>When do you usually work?</div>
              <div style={s.stepSub}>Helps us monitor the right time windows for your income</div>
              <div style={s.hoursList}>
                {HOURS.map(h => (
                  <motion.button
                    key={h.id}
                    style={{
                      ...s.hourBtn,
                      borderColor: hours === h.id ? 'var(--purple)' : 'var(--border2)',
                      background: hours === h.id ? 'var(--purple-dim)' : 'var(--surface)',
                    }}
                    onClick={() => setHours(h.id)}
                    whileTap={{ scale: 0.97 }}
                  >
                    <div>
                      <div style={{ ...s.hourLabel, color: hours === h.id ? 'var(--purple)' : 'var(--text2)' }}>{h.label}</div>
                      <div style={s.hourSub}>{h.sub}</div>
                    </div>
                    {hours === h.id && (
                      <motion.div
                        style={s.hourCheck}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: 'spring', stiffness: 400 }}
                      >
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="var(--purple)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="2,6 5,9 10,3"/>
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 4: Done */}
          {step === 4 && (
            <motion.div key="done" custom={dir} variants={slideVariants} initial="enter" animate="center" exit="exit" style={{ ...s.slide, textAlign: 'center', alignItems: 'center' }}>
              <motion.div
                style={s.doneRing}
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 240, delay: 0.1 }}
              >
                <svg width="36" height="36" viewBox="0 0 36 36" fill="none" stroke="var(--green)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="7,18 14,25 29,10"/>
                </svg>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                <div style={s.doneTitle}>Your plan is ready</div>
                <div style={s.doneSub}>Coverage starts immediately</div>
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={s.doneSummary}>
                {[
                  { label: 'Platform', val: platform },
                  { label: 'City', val: city },
                  { label: 'Hours', val: hours.split(' (')[0] },
                ].map(({ label, val }) => (
                  <div key={label} style={s.summaryRow}>
                    <span style={s.summaryKey}>{label}</span>
                    <span style={s.summaryVal}>{val}</span>
                  </div>
                ))}
              </motion.div>
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }} style={s.premiumNote}>
                Weekly premium: <strong style={{ color: 'var(--amber)' }}>₹40</strong> · Coverage up to <strong style={{ color: 'var(--green)' }}>₹1,500</strong>
              </motion.div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Nav buttons */}
      <div style={s.navRow}>
        {step > 0 && step < TOTAL && (
          <motion.button style={s.btnBack} onClick={back} whileTap={{ scale: 0.95 }}>
            Back
          </motion.button>
        )}
        {step < TOTAL && (
          <motion.button
            style={{ ...s.btnNext, opacity: canNext ? 1 : 0.4, flex: step === 0 ? 1 : 0, minWidth: step === 0 ? 'auto' : 130 }}
            onClick={next}
            disabled={!canNext}
            whileTap={{ scale: canNext ? 0.97 : 1 }}
          >
            {step === 0 ? 'Get Started' : 'Next'}
          </motion.button>
        )}
        {step === TOTAL && (
          <motion.button
            style={{ ...s.btnNext, flex: 1 }}
            onClick={finish}
            whileTap={{ scale: 0.97 }}
          >
            Enter App
          </motion.button>
        )}
      </div>
    </div>
  );
}

const s = {
  root: { display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0, paddingTop: 8 },
  dotsRow: { display: 'flex', justifyContent: 'center', gap: 7, marginBottom: 24, flexShrink: 0 },
  dot: { width: 7, height: 7, borderRadius: '50%', transition: 'background 0.3s' },
  contentArea: { flex: 1, position: 'relative', minHeight: 0 },
  slide: { position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden', display: 'flex', flexDirection: 'column' },
  // Welcome
  shieldIcon: { width: 72, height: 72, borderRadius: '50%', background: 'rgba(232,132,58,0.10)', border: '1.5px solid rgba(232,132,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  welcomeTitle: { fontSize: 36, fontWeight: 900, color: 'var(--text)', letterSpacing: '-1.5px', lineHeight: 1 },
  welcomeSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 14, color: 'var(--muted)', marginTop: 8, lineHeight: 1.5 },
  welcomeFeatures: { marginTop: 28, display: 'flex', flexDirection: 'column', gap: 12 },
  featureRow: { display: 'flex', alignItems: 'center', gap: 12 },
  featureDot: { width: 7, height: 7, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  featureTxt: { fontSize: 14, color: 'var(--text2)', lineHeight: 1.4 },
  // Steps
  stepLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1.5px', marginBottom: 8 },
  stepTitle: { fontSize: 22, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.8px', lineHeight: 1.15, marginBottom: 6 },
  stepSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', marginBottom: 20, lineHeight: 1.5 },
  platformGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 },
  platformBtn: { position: 'relative', padding: '18px 12px', border: '1.5px solid', borderRadius: 16, cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 },
  platformName: { fontSize: 15, fontWeight: 700, letterSpacing: '-0.2px' },
  platformCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  fieldGroup: {},
  fieldLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', marginBottom: 8 },
  cityGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 },
  cityBtn: { padding: '10px 6px', border: '1.5px solid', borderRadius: 12, cursor: 'pointer', fontSize: 12, fontWeight: 600, textAlign: 'center' },
  textInput: { width: '100%', padding: '12px 14px', background: 'var(--surface)', border: '1.5px solid var(--border2)', borderRadius: 14, fontSize: 13, color: 'var(--text)', fontFamily: 'var(--font-sans)', outline: 'none' },
  hoursList: { display: 'flex', flexDirection: 'column', gap: 10 },
  hourBtn: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', border: '1.5px solid', borderRadius: 16, cursor: 'pointer', textAlign: 'left' },
  hourLabel: { fontSize: 14, fontWeight: 700, letterSpacing: '-0.2px', marginBottom: 2 },
  hourSub: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)' },
  hourCheck: { width: 22, height: 22, borderRadius: '50%', border: '1.5px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  // Done
  doneRing: { width: 76, height: 76, borderRadius: '50%', border: '2.5px solid var(--green)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  doneTitle: { fontSize: 26, fontWeight: 900, color: 'var(--text)', letterSpacing: '-0.8px' },
  doneSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 13, color: 'var(--muted)', marginTop: 5 },
  doneSummary: { width: '100%', marginTop: 24, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 16, padding: '4px 16px' },
  summaryRow: { display: 'flex', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid #13131A' },
  summaryKey: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--faint)' },
  summaryVal: { fontSize: 13, fontWeight: 600, color: 'var(--text2)' },
  premiumNote: { marginTop: 14, padding: 12, background: 'rgba(232,132,58,0.06)', border: '1px solid rgba(232,132,58,0.15)', borderRadius: 12, fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 12, color: 'var(--muted)', textAlign: 'center', width: '100%' },
  // Nav
  navRow: { display: 'flex', gap: 10, paddingTop: 16, flexShrink: 0, paddingBottom: 4, position: 'sticky', bottom: 0, background: 'var(--bg)', marginTop: 'auto' },
  btnBack: { padding: '13px 20px', background: 'var(--surface)', border: '1px solid var(--border2)', borderRadius: 14, fontSize: 14, fontWeight: 600, color: 'var(--muted)', cursor: 'pointer' },
  btnNext: { padding: '13px 0', background: 'var(--coral)', border: 'none', borderRadius: 14, fontSize: 14, fontWeight: 700, color: '#fff', cursor: 'pointer', letterSpacing: '-0.2px' },
};
