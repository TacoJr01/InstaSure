const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── MOCK DATA ──────────────────────────────────────────────
const user = {
  id: 'u1',
  name: 'Rahul Sharma',
  initials: 'RS',
  platform: 'Swiggy',
  location: 'Chennai',
  zone: 'Velachery',
  upi: 'rahul@upi',
  workHours: '10 AM – 10 PM',
  memberSince: 'Jan 2024',
  weeklyProtected: 1240,
  premium: 40,
  coverageLimit: 1500,
  weeklyUsagePct: 83,
};

const coverage = {
  rain: 800,
  lowOrders: 500,
  pollution: 200,
  curfew: 300,
  status: 'active',
};

const protection = {
  rain: 'active',
  lowOrders: 'active',
  pollution: 'watching',
  curfew: 'active',
};

const activity = {
  normalOrders: 10,
  todayOrders: 4,
  dropPercent: 60,
  compensationEligible: true,
  week: [
    { day: 'Mon', orders: 9, normal: true },
    { day: 'Tue', orders: 10, normal: true },
    { day: 'Wed', orders: 8, normal: true },
    { day: 'Thu', orders: 11, normal: true },
    { day: 'Fri', orders: 4, normal: false },
  ],
  forecast: [
    { day: 'Tomorrow', status: 'slow', label: 'May be slow' },
    { day: 'Weekend', status: 'good', label: 'Looks good' },
  ],
};

const payouts = [
  { id: 'p1', amount: 300, reason: 'Rain', type: 'rain', date: 'Today', time: '11:42 AM', auto: true },
  { id: 'p2', amount: 200, reason: 'Low Orders', type: 'lowOrders', date: 'Yesterday', time: '9:05 PM', auto: true },
  { id: 'p3', amount: 300, reason: 'Rain', type: 'rain', date: 'Mon 14 Jan', time: '2:30 PM', auto: true },
  { id: 'p4', amount: 150, reason: 'Low Orders', type: 'lowOrders', date: 'Sun 13 Jan', time: '8:10 PM', auto: true },
];

const alerts = [
  { id: 'a1', type: 'rain', title: 'Rain today', message: "Orders may slow. You're fully covered.", badge: 'AUTO ON' },
];

// ── ROUTES ─────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/user', (_, res) => res.json(user));

app.get('/api/coverage', (_, res) => res.json({ ...coverage, protection }));

app.patch('/api/coverage', (req, res) => {
  const { rain, lowOrders, pollution, curfew } = req.body;
  if (rain !== undefined) coverage.rain = rain;
  if (lowOrders !== undefined) coverage.lowOrders = lowOrders;
  if (pollution !== undefined) coverage.pollution = pollution;
  if (curfew !== undefined) coverage.curfew = curfew;
  res.json({ ...coverage, protection });
});

app.get('/api/activity', (_, res) => res.json(activity));

app.get('/api/payouts', (_, res) => {
  const total = payouts.reduce((s, p) => s + p.amount, 0);
  res.json({ payouts, total, count: payouts.length });
});

app.get('/api/alerts', (_, res) => res.json(alerts));

app.get('/api/dashboard', (_, res) => {
  res.json({
    user,
    weeklyProtected: user.weeklyProtected,
    premium: user.premium,
    coverageLimit: user.coverageLimit,
    weeklyUsagePct: user.weeklyUsagePct,
    protection,
    lastPayout: payouts[0],
    alerts,
    compensationEligible: activity.compensationEligible,
  });
});

app.listen(PORT, () => {
  console.log(`\n🛡  AIS Backend running on http://localhost:${PORT}\n`);
});
