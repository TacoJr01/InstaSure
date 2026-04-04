import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Overview from './screens/Overview.jsx';
import Workers from './screens/Workers.jsx';
import Payouts from './screens/Payouts.jsx';
import Alerts from './screens/Alerts.jsx';
import Settings from './screens/Settings.jsx';
import Actuary from './screens/Actuary.jsx';
import AdminLogin from './screens/AdminLogin.jsx';
import { fetchStats } from './api.js';

const NAV = [
  {
    id: 'overview', label: 'Overview',
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? 'var(--coral)' : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="1" width="6" height="6" rx="1.5"/>
        <rect x="9" y="1" width="6" height="6" rx="1.5"/>
        <rect x="1" y="9" width="6" height="6" rx="1.5"/>
        <rect x="9" y="9" width="6" height="6" rx="1.5"/>
      </svg>
    ),
  },
  {
    id: 'workers', label: 'Workers',
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? 'var(--blue)' : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="6" cy="5" r="2.5"/>
        <path d="M1 13c0-3 2.2-5 5-5s5 2 5 5"/>
        <circle cx="12" cy="5" r="2"/>
        <path d="M11 13h4c0-2.5-1.5-4-3-4"/>
      </svg>
    ),
  },
  {
    id: 'payouts', label: 'Payouts',
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? 'var(--green)' : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <rect x="1" y="4" width="14" height="10" rx="1.5"/>
        <path d="M1 7.5h14"/>
        <circle cx="4.5" cy="10.5" r="0.8" fill={active ? 'var(--green)' : 'var(--muted)'}/>
        <path d="M7.5 10.5h5"/>
      </svg>
    ),
  },
  {
    id: 'actuary', label: 'Actuary',
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#2DD4BF' : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M2 14 L2 6 L5 6 L5 14"/>
        <path d="M6.5 14 L6.5 3 L9.5 3 L9.5 14"/>
        <path d="M11 14 L11 8 L14 8 L14 14"/>
        <line x1="1" y1="14" x2="15" y2="14"/>
      </svg>
    ),
  },
  {
    id: 'alerts', label: 'Alerts',
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? 'var(--amber)' : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <path d="M8 1.5L14 12.5H2L8 1.5z"/>
        <line x1="8" y1="6" x2="8" y2="9"/>
        <circle cx="8" cy="11" r="0.6" fill={active ? 'var(--amber)' : 'var(--muted)'}/>
      </svg>
    ),
  },
  {
    id: 'settings', label: 'Settings',
    icon: (active) => (
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? 'var(--purple)' : 'var(--muted)'} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="8" cy="8" r="2.5"/>
        <path d="M8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3.05 3.05l1.06 1.06M11.89 11.89l1.06 1.06M3.05 12.95l1.06-1.06M11.89 4.11l1.06-1.06"/>
      </svg>
    ),
  },
];

const NAV_COLORS = {
  overview: 'var(--coral)',
  workers:  'var(--blue)',
  payouts:  'var(--green)',
  actuary:  '#2DD4BF',
  alerts:   'var(--amber)',
  settings: 'var(--purple)',
};

const PAGE_TITLES = {
  overview: 'Overview',
  workers:  'Workers',
  payouts:  'Payouts',
  actuary:  'Actuary',
  alerts:   'Alerts',
  settings: 'Settings',
};

const screenVariants = {
  enter:  { opacity: 0, y: 12 },
  center: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.32, 0.72, 0, 1] } },
  exit:   { opacity: 0, y: -8, transition: { duration: 0.18 } },
};

const SCREENS = { overview: Overview, workers: Workers, payouts: Payouts, actuary: Actuary, alerts: Alerts, settings: Settings };

export default function App() {
  const [theme, setTheme] = useState(() => localStorage.getItem('ais_admin_theme') || 'dark');
  const [authed, setAuthed] = useState(() => !!localStorage.getItem('ais_admin_token'));
  const [page, setPage]   = useState('overview');
  const [stats, setStats] = useState({ totalWorkers: 0, flaggedWorkers: 0, suspendedWorkers: 0 });
  const Screen = SCREENS[page];

  // Apply theme
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('ais_admin_theme', theme);
  }, [theme]);

  useEffect(() => {
    if (!authed) return;
    function load() { fetchStats().then(setStats).catch(() => {}); }
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [authed]);

  function handleLogin(token) {
    setAuthed(true);
  }

  function handleLogout() {
    localStorage.removeItem('ais_admin_token');
    setAuthed(false);
    setPage('overview');
  }

  function toggleTheme() {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }

  if (!authed) {
    return <AdminLogin onLogin={handleLogin} />;
  }

  return (
    <div style={s.root}>
      {/* Sidebar */}
      <aside style={s.sidebar}>
        {/* Brand */}
        <div style={s.brand}>
          <div style={s.brandIcon}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="var(--coral)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 1.5l6.5 2.5V9c0 4-3 6.5-6.5 7.5C2.5 15.5 2.5 13 2.5 9V4L9 1.5z"/>
              <polyline points="6,9 8,11 12,7"/>
            </svg>
          </div>
          <div>
            <div style={s.brandName}>InstaSure</div>
            <div style={s.brandSub}>Admin Console</div>
          </div>
        </div>

        {/* Live indicator */}
        <div style={s.liveRow}>
          <motion.div
            style={s.liveDot}
            animate={{ scale: [1, 1.6, 1], opacity: [1, 0.3, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <span style={s.liveTxt}>LIVE</span>
        </div>

        <div style={s.sidebarDivider} />

        {/* Nav */}
        <nav style={s.nav}>
          {NAV.map(n => {
            const active = page === n.id;
            return (
              <motion.button
                key={n.id}
                onClick={() => setPage(n.id)}
                style={{
                  ...s.navItem,
                  background: active ? `${NAV_COLORS[n.id]}14` : 'transparent',
                  borderColor: active ? `${NAV_COLORS[n.id]}30` : 'transparent',
                }}
                whileHover={{ background: `${NAV_COLORS[n.id]}0E` }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.15 }}
              >
                {n.icon(active)}
                <span style={{ ...s.navLabel, color: active ? NAV_COLORS[n.id] : 'var(--muted)', fontWeight: active ? 600 : 400 }}>
                  {n.label}
                </span>
                {active && (
                  <motion.div
                    layoutId="navIndicator"
                    style={{ ...s.navIndicator, background: NAV_COLORS[n.id] }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </motion.button>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={s.sidebarFooter}>
          {/* Theme toggle */}
          <motion.button
            onClick={toggleTheme}
            style={s.themeBtn}
            whileTap={{ scale: 0.95 }}
            title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          >
            {theme === 'dark' ? (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="8" cy="8" r="3"/><path d="M8 1v1M8 14v1M1 8h1M14 8h1M3.05 3.05l.7.7M12.25 12.25l.7.7M3.05 12.95l.7-.7M12.25 3.75l.7-.7"/>
              </svg>
            ) : (
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M13.5 10.5A6 6 0 015.5 2.5a6 6 0 108 8z"/>
              </svg>
            )}
            <span style={s.themeBtnLabel}>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </motion.button>

          {/* Logout */}
          <motion.button
            onClick={handleLogout}
            style={s.logoutBtn}
            whileTap={{ scale: 0.95 }}
          >
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="var(--muted)" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2H3a1 1 0 00-1 1v10a1 1 0 001 1h3"/><path d="M11 11l3-3-3-3"/><path d="M14 8H6"/>
            </svg>
            <span style={s.themeBtnLabel}>Sign out</span>
          </motion.button>

          <div style={s.footerDivider} />
          <div style={s.footerLabel}>BACKEND</div>
          <div style={s.footerUrl}>localhost:3001</div>
        </div>
      </aside>

      {/* Main */}
      <main style={s.main}>
        {/* Top bar */}
        <div style={s.topBar}>
          <div>
            <div style={s.pageTitle}>{PAGE_TITLES[page]}</div>
            <div style={s.pageSub}>InstaSure operator dashboard</div>
          </div>
          <div style={s.topRight}>
            <div style={s.topBadge}>{stats.totalWorkers} Workers</div>
            {stats.suspendedWorkers > 0 && (
              <div style={{ ...s.topBadge, background: 'var(--amber-dim)', border: '1px solid rgba(232,184,74,0.2)', color: 'var(--amber)' }}>{stats.suspendedWorkers} Suspended</div>
            )}
            {stats.flaggedWorkers > 0 && (
              <div style={{ ...s.topBadge, background: 'var(--red-dim)', border: '1px solid rgba(232,90,74,0.2)', color: 'var(--red)' }}>{stats.flaggedWorkers} Flags</div>
            )}
          </div>
        </div>

        {/* Screen */}
        <div style={s.content}>
          <AnimatePresence mode="wait">
            <motion.div
              key={page}
              variants={screenVariants}
              initial="enter"
              animate="center"
              exit="exit"
              style={{ height: '100%' }}
            >
              <Screen />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

const s = {
  root: { display: 'flex', height: '100%', background: 'var(--bg)' },
  // Sidebar
  sidebar: { width: 'var(--sidebar-w)', flexShrink: 0, background: 'var(--surface)', borderRight: '1px solid var(--border)', display: 'flex', flexDirection: 'column', padding: '24px 0' },
  brand: { display: 'flex', alignItems: 'center', gap: 12, padding: '0 20px 20px' },
  brandIcon: { width: 36, height: 36, borderRadius: 10, background: 'var(--coral-dim)', border: '1px solid rgba(232,132,58,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  brandName: { fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.3px' },
  brandSub: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '0.5px', marginTop: 1 },
  liveRow: { display: 'flex', alignItems: 'center', gap: 7, padding: '0 20px 16px' },
  liveDot: { width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', flexShrink: 0 },
  liveTxt: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--green)', letterSpacing: '1.5px' },
  sidebarDivider: { height: 1, background: 'var(--border)', margin: '0 0 16px' },
  nav: { display: 'flex', flexDirection: 'column', gap: 4, padding: '0 12px', flex: 1 },
  navItem: { display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 10, border: '1px solid', cursor: 'pointer', position: 'relative', textAlign: 'left' },
  navLabel: { fontSize: 13, letterSpacing: '-0.1px' },
  navIndicator: { position: 'absolute', right: 10, width: 5, height: 5, borderRadius: '50%' },
  sidebarFooter: { padding: '12px 12px 0', borderTop: '1px solid var(--border)', marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: 4 },
  themeBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', width: '100%' },
  logoutBtn: { display: 'flex', alignItems: 'center', gap: 8, padding: '7px 10px', borderRadius: 8, border: 'none', cursor: 'pointer', background: 'transparent', width: '100%' },
  themeBtnLabel: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', letterSpacing: '0.3px' },
  footerDivider: { height: 1, background: 'var(--border)', margin: '4px 0' },
  footerLabel: { fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--faint)', letterSpacing: '1px', padding: '0 10px' },
  footerUrl: { fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--muted)', padding: '0 10px 4px' },
  // Main
  main: { flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' },
  topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 32px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--surface)' },
  pageTitle: { fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.5px' },
  pageSub: { fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: 11, color: 'var(--muted)', marginTop: 2 },
  topRight: { display: 'flex', gap: 8 },
  topBadge: { padding: '5px 12px', borderRadius: 20, background: 'var(--green-dim)', border: '1px solid rgba(62,201,122,0.2)', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--green)', letterSpacing: '0.3px' },
  content: { flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '28px 32px' },
};
