import React, { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import Home from './screens/Home.jsx';
import Coverage from './screens/Coverage.jsx';
import Activity from './screens/Activity.jsx';
import Payouts from './screens/Payouts.jsx';
import Profile from './screens/Profile.jsx';
import { fetchDashboard } from './api.js';

const TABS = [
  {
    id: 'home', label: 'Home',
    icon: (active) => (
      <svg viewBox="0 0 22 22" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? 'var(--coral)' : 'var(--faint)'}>
        <path d="M3 9.5L11 3l8 6.5V19a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"/>
        <rect x="8" y="13" width="6" height="7" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'coverage', label: 'Cover',
    icon: (active) => (
      <svg viewBox="0 0 22 22" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? 'var(--blue)' : 'var(--faint)'}>
        <path d="M11 2l7.5 3.5V11c0 4.5-3.5 7.5-7.5 8.5C3.5 18.5 3 15 3 11V5.5L11 2z"/>
      </svg>
    ),
  },
  {
    id: 'activity', label: 'Activity',
    icon: (active) => (
      <svg viewBox="0 0 22 22" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? 'var(--amber)' : 'var(--faint)'}>
        <rect x="4" y="13" width="3" height="6" rx="1"/>
        <rect x="9.5" y="8" width="3" height="11" rx="1"/>
        <rect x="15" y="4" width="3" height="15" rx="1"/>
      </svg>
    ),
  },
  {
    id: 'payouts', label: 'Payouts',
    icon: (active) => (
      <svg viewBox="0 0 22 22" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? 'var(--green)' : 'var(--faint)'}>
        <rect x="2" y="6" width="18" height="13" rx="2"/>
        <path d="M2 10h18"/>
        <circle cx="6" cy="14" r="1" fill={active ? 'var(--green)' : 'var(--faint)'}/>
        <path d="M10 14h6"/>
      </svg>
    ),
  },
  {
    id: 'profile', label: 'Profile',
    icon: (active) => (
      <svg viewBox="0 0 22 22" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"
        stroke={active ? 'var(--purple)' : 'var(--faint)'}>
        <circle cx="11" cy="8" r="3.5"/>
        <path d="M3 19c0-4 3.6-7 8-7s8 3 8 7"/>
      </svg>
    ),
  },
];

const TAB_COLORS = {
  home: 'var(--coral)',
  coverage: 'var(--blue)',
  activity: 'var(--amber)',
  payouts: 'var(--green)',
  profile: 'var(--purple)',
};

const screenVariants = {
  enter: (dir) => ({ opacity: 0, x: dir > 0 ? 40 : -40, scale: 0.97 }),
  center: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.32, ease: [0.32, 0.72, 0, 1] } },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -40 : 40, scale: 0.97, transition: { duration: 0.22, ease: [0.32, 0.72, 0, 1] } }),
};

const SCREEN_ORDER = ['home', 'coverage', 'activity', 'payouts', 'profile'];

export default function App() {
  const [tab, setTab] = useState('home');
  const [prevTab, setPrevTab] = useState('home');
  const [dashboard, setDashboard] = useState(null);

  useEffect(() => {
    fetchDashboard().then(setDashboard).catch(() => setDashboard(getMockDashboard()));
  }, []);

  const direction = SCREEN_ORDER.indexOf(tab) - SCREEN_ORDER.indexOf(prevTab);

  function goTo(id) {
    setPrevTab(tab);
    setTab(id);
  }

  const screens = { home: Home, coverage: Coverage, activity: Activity, payouts: Payouts, profile: Profile };
  const Screen = screens[tab];

  return (
    <div style={styles.root}>
      {/* Desktop hint */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.6 }}
        style={styles.desktopHint}
      >
        Adaptive Income Shield
      </motion.div>

      {/* Phone shell */}
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        style={styles.shell}
      >
        {/* Dynamic island */}
        <div style={styles.island} />

        {/* Grid background */}
        <svg style={styles.gridBg} viewBox="0 0 390 844" preserveAspectRatio="none">
          <line x1="90" y1="0" x2="90" y2="844" stroke="#1A1A22" strokeWidth="0.8"/>
          <line x1="240" y1="0" x2="240" y2="844" stroke="#1A1A22" strokeWidth="0.8"/>
          <line x1="0" y1="220" x2="390" y2="220" stroke="#1A1A22" strokeWidth="0.8"/>
          <line x1="0" y1="520" x2="390" y2="520" stroke="#1A1A22" strokeWidth="0.8"/>
          <line x1="240" y1="0" x2="390" y2="220" stroke="#1E1E28" strokeWidth="0.8"/>
          <line x1="90" y1="0" x2="0" y2="160" stroke="#1E1E28" strokeWidth="0.8"/>
        </svg>

        {/* Screens */}
        <div style={styles.screenArea}>
          <AnimatePresence custom={direction} mode="popLayout">
            <motion.div
              key={tab}
              custom={direction}
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={styles.screenWrapper}
            >
              <Screen dashboard={dashboard} />
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Nav */}
        <div style={styles.nav}>
          {TABS.map((t) => {
            const active = tab === t.id;
            return (
              <motion.button
                key={t.id}
                onClick={() => goTo(t.id)}
                style={{ ...styles.navBtn, background: active ? `${TAB_COLORS[t.id]}18` : 'transparent' }}
                whileTap={{ scale: 0.88 }}
                transition={{ type: 'spring', stiffness: 400, damping: 20 }}
              >
                <motion.div
                  animate={{ y: active ? -2 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                  style={{ width: 22, height: 22 }}
                >
                  {t.icon(active)}
                </motion.div>
                <motion.span
                  animate={{ color: active ? TAB_COLORS[t.id] : 'var(--faint)', fontWeight: active ? 600 : 400 }}
                  style={styles.navLabel}
                >
                  {t.label}
                </motion.span>
                {active && (
                  <motion.div
                    layoutId="navPip"
                    style={{ ...styles.navPip, background: TAB_COLORS[t.id] }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

const styles = {
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  desktopHint: {
    fontFamily: 'var(--font-mono)',
    fontSize: 10,
    color: 'var(--faint)',
    letterSpacing: '2px',
    textTransform: 'uppercase',
  },
  shell: {
    width: 390,
    height: 844,
    background: 'var(--bg)',
    borderRadius: 52,
    overflow: 'hidden',
    position: 'relative',
    border: '1px solid #2A2A36',
    boxShadow: '0 40px 120px rgba(0,0,0,0.8), 0 0 0 1px rgba(255,255,255,0.04) inset',
    flexShrink: 0,
  },
  island: {
    position: 'absolute',
    top: 12,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 120,
    height: 34,
    background: '#000',
    borderRadius: 17,
    zIndex: 100,
  },
  gridBg: {
    position: 'absolute',
    inset: 0,
    pointerEvents: 'none',
    zIndex: 0,
    width: '100%',
    height: '100%',
  },
  screenArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 82,
    zIndex: 1,
    overflow: 'hidden',
  },
  screenWrapper: {
    position: 'absolute',
    inset: 0,
    overflowY: 'auto',
    overflowX: 'hidden',
    paddingTop: 68,
    paddingBottom: 16,
    paddingLeft: 24,
    paddingRight: 24,
  },
  nav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 82,
    background: 'rgba(10,10,14,0.96)',
    borderTop: '1px solid var(--border)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: 14,
    paddingTop: 4,
    paddingLeft: 6,
    paddingRight: 6,
    zIndex: 50,
    backdropFilter: 'blur(20px)',
  },
  navBtn: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: 4,
    border: 'none',
    cursor: 'pointer',
    padding: '6px 14px',
    borderRadius: 14,
    position: 'relative',
  },
  navLabel: {
    fontFamily: 'var(--font-mono)',
    fontSize: 8,
    letterSpacing: '0.3px',
  },
  navPip: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    transform: 'translateX(-50%)',
    width: 4,
    height: 4,
    borderRadius: '50%',
  },
};

function getMockDashboard() {
  return {
    user: { name: 'Rahul Sharma', platform: 'Swiggy', location: 'Chennai', zone: 'Velachery' },
    weeklyProtected: 1240,
    premium: 40,
    coverageLimit: 1500,
    weeklyUsagePct: 83,
    protection: { rain: 'active', lowOrders: 'active', pollution: 'watching', curfew: 'active' },
    lastPayout: { amount: 300, reason: 'Rain', date: 'Today', time: '11:42 AM' },
    alerts: [{ id: 'a1', type: 'rain', title: 'Rain today', message: "Orders may slow. You're fully covered.", badge: 'AUTO ON' }],
    compensationEligible: true,
  };
}
