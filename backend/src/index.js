const express = require('express');
const cors = require('cors');
const morgan = require('morgan');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── SHARED STATE ───────────────────────────────────────────
// Workers is the single source of truth for both apps
const workers = [
  { id: 'u1', name: 'Rahul Sharma',   initials: 'RS', platform: 'Swiggy',  location: 'Chennai',   zone: 'Velachery',       gtsScore: 742, gtsTier: 'high',   status: 'active',  weeklyEarnings: 950,  premium: 40, lastActive: '2 min ago',  upi: 'rahul@upi',    workHours: '10 AM – 10 PM', memberSince: 'Jan 2024', coverageLimit: 1500, weeklyUsagePct: 83  },
  { id: 'u2', name: 'Priya Nair',     initials: 'PN', platform: 'Zomato',  location: 'Mumbai',    zone: 'Andheri West',    gtsScore: 612, gtsTier: 'medium', status: 'active',  weeklyEarnings: 650,  premium: 35, lastActive: '15 min ago', upi: 'priya@upi',    workHours: '8 AM – 8 PM',  memberSince: 'Mar 2024', coverageLimit: 1200, weeklyUsagePct: 65  },
  { id: 'u3', name: 'Arjun Mehta',    initials: 'AM', platform: 'Zepto',   location: 'Bangalore', zone: 'Koramangala',     gtsScore: 481, gtsTier: 'low',    status: 'flagged', weeklyEarnings: 0,    premium: 25, lastActive: '1 hr ago',   upi: 'arjun@upi',    workHours: '9 AM – 9 PM',  memberSince: 'May 2024', coverageLimit: 800,  weeklyUsagePct: 0   },
  { id: 'u4', name: 'Deepa Krishnan', initials: 'DK', platform: 'Swiggy',  location: 'Chennai',   zone: 'Anna Nagar',      gtsScore: 815, gtsTier: 'high',   status: 'active',  weeklyEarnings: 1100, premium: 45, lastActive: '5 min ago',  upi: 'deepa@upi',    workHours: '10 AM – 10 PM',memberSince: 'Feb 2024', coverageLimit: 1500, weeklyUsagePct: 88  },
  { id: 'u5', name: 'Ravi Teja',      initials: 'RT', platform: 'Amazon',  location: 'Hyderabad', zone: 'Gachibowli',      gtsScore: 558, gtsTier: 'medium', status: 'active',  weeklyEarnings: 580,  premium: 30, lastActive: '30 min ago', upi: 'ravi@upi',     workHours: '7 AM – 7 PM',  memberSince: 'Apr 2024', coverageLimit: 1000, weeklyUsagePct: 55  },
  { id: 'u6', name: 'Sneha Patel',    initials: 'SP', platform: 'Zomato',  location: 'Pune',      zone: 'Koregaon Park',   gtsScore: 378, gtsTier: 'low',    status: 'flagged', weeklyEarnings: 0,    premium: 20, lastActive: '3 hr ago',   upi: 'sneha@upi',    workHours: '11 AM – 11 PM',memberSince: 'Jun 2024', coverageLimit: 700,  weeklyUsagePct: 0   },
  { id: 'u7', name: 'Karan Singh',    initials: 'KS', platform: 'Swiggy',  location: 'Delhi',     zone: 'Connaught Place', gtsScore: 724, gtsTier: 'high',   status: 'active',  weeklyEarnings: 820,  premium: 40, lastActive: '8 min ago',  upi: 'karan@upi',    workHours: '10 AM – 10 PM',memberSince: 'Jan 2024', coverageLimit: 1500, weeklyUsagePct: 75  },
  { id: 'u8', name: 'Meera Iyer',     initials: 'MI', platform: 'Zepto',   location: 'Bangalore', zone: 'Indiranagar',     gtsScore: 639, gtsTier: 'medium', status: 'active',  weeklyEarnings: 710,  premium: 35, lastActive: '22 min ago', upi: 'meera@upi',    workHours: '9 AM – 9 PM',  memberSince: 'Mar 2024', coverageLimit: 1200, weeklyUsagePct: 68  },
];

// The active worker for the worker app (u1 = Rahul)
const ACTIVE_WORKER_ID = 'u1';
function getWorker() { return workers.find(w => w.id === ACTIVE_WORKER_ID); }

const coverage = { rain: 800, lowOrders: 500, pollution: 200, curfew: 300 };
const protection = { rain: 'active', lowOrders: 'active', pollution: 'watching', curfew: 'active' };

const activity = {
  normalOrders: 10, todayOrders: 4, dropPercent: 60, compensationEligible: true,
  week: [
    { day: 'Mon', orders: 9 }, { day: 'Tue', orders: 10 },
    { day: 'Wed', orders: 8 }, { day: 'Thu', orders: 11 }, { day: 'Fri', orders: 4 },
  ],
  forecast: [
    { day: 'Tomorrow', status: 'slow', label: 'May be slow' },
    { day: 'Weekend',  status: 'good', label: 'Looks good'  },
  ],
};

// Worker payouts (worker-facing)
const payouts = [
  { id: 'p1', amount: 300, reason: 'Rain',       type: 'rain',      date: 'Today',      time: '11:42 AM', auto: true,  status: 'paid' },
  { id: 'p2', amount: 200, reason: 'Low Orders', type: 'lowOrders', date: 'Yesterday',  time: '9:05 PM',  auto: true,  status: 'paid' },
  { id: 'p3', amount: 300, reason: 'Rain',       type: 'rain',      date: 'Mon 14 Jan', time: '2:30 PM',  auto: true,  status: 'paid' },
  { id: 'p4', amount: 150, reason: 'Low Orders', type: 'lowOrders', date: 'Sun 13 Jan', time: '8:10 PM',  auto: true,  status: 'paid' },
];

// Worker-facing alerts
const workerAlerts = [
  { id: 'a1', type: 'rain', title: 'Rain today', message: "Orders may slow. You're fully covered.", badge: 'AUTO ON' },
];

// GigTrust for active worker
const gigTrust = {
  score: 742, tier: 'high', trend: '+12 this week', payoutMode: 'Instant payout unlocked',
  components: [
    { key: 'consistency', label: 'Work Consistency', score: 88 },
    { key: 'gps',         label: 'GPS Integrity',     score: 95 },
    { key: 'behavior',    label: 'Behavioral Pattern', score: 82 },
    { key: 'claims',      label: 'Claim History',      score: 90 },
    { key: 'peer',        label: 'Peer Comparison',    score: 76 },
  ],
};

const settings = { autoRenew: true, notifications: true, smartCoverage: true };

// Premium payment state for active worker
const premiumState = {
  paid: false,
  lastPaidDate: null,
  expiresDate: null,
  txId: null,
};

// Admin-controlled platform settings
const adminSettings = {
  triggers: {
    rain:      { enabled: true,  autoPay: true,  payoutAmount: 300, label: 'Rain' },
    lowOrders: { enabled: true,  autoPay: false, payoutAmount: 200, label: 'Low Orders' },
    curfew:    { enabled: true,  autoPay: true,  payoutAmount: 250, label: 'Curfew' },
    outage:    { enabled: false, autoPay: false, payoutAmount: 150, label: 'Platform Outage' },
  },
  gigtrust: { highMin: 700, mediumMin: 500 },
  premium:  { minPremium: 25, maxPremium: 80, coverageDivisor: 1800 },
  platform: { active: true, maintenanceMode: false, fraudAutoSuspend: true },
};

// Admin payouts (all workers)
const allPayouts = [
  { id: 'ap1', workerId: 'u1', workerName: 'Rahul Sharma',   platform: 'Swiggy', amount: 300, type: 'rain',      reason: 'Rain',       date: 'Today',      time: '11:42 AM', auto: true,  status: 'paid'   },
  { id: 'ap2', workerId: 'u4', workerName: 'Deepa Krishnan', platform: 'Swiggy', amount: 250, type: 'rain',      reason: 'Rain',       date: 'Today',      time: '11:40 AM', auto: true,  status: 'paid'   },
  { id: 'ap3', workerId: 'u7', workerName: 'Karan Singh',    platform: 'Swiggy', amount: 250, type: 'rain',      reason: 'Rain',       date: 'Today',      time: '11:38 AM', auto: true,  status: 'paid'   },
  { id: 'ap4', workerId: 'u1', workerName: 'Rahul Sharma',   platform: 'Swiggy', amount: 200, type: 'lowOrders', reason: 'Low Orders', date: 'Yesterday',  time: '9:05 PM',  auto: false, status: 'paid'   },
  { id: 'ap5', workerId: 'u2', workerName: 'Priya Nair',     platform: 'Zomato', amount: 200, type: 'lowOrders', reason: 'Low Orders', date: 'Yesterday',  time: '8:30 PM',  auto: false, status: 'paid'   },
  { id: 'ap6', workerId: 'u8', workerName: 'Meera Iyer',     platform: 'Zepto',  amount: 180, type: 'lowOrders', reason: 'Low Orders', date: 'Yesterday',  time: '7:55 PM',  auto: false, status: 'paid'   },
  { id: 'ap7', workerId: 'u5', workerName: 'Ravi Teja',      platform: 'Amazon', amount: 150, type: 'lowOrders', reason: 'Low Orders', date: 'Mon 14 Jan', time: '6:20 PM',  auto: true,  status: 'paid'   },
  { id: 'ap8', workerId: 'u3', workerName: 'Arjun Mehta',    platform: 'Zepto',  amount: 300, type: 'rain',      reason: 'Rain',       date: 'Mon 14 Jan', time: '2:10 PM',  auto: false, status: 'held'   },
  { id: 'ap9', workerId: 'u6', workerName: 'Sneha Patel',    platform: 'Zomato', amount: 200, type: 'lowOrders', reason: 'Low Orders', date: 'Sun 13 Jan', time: '5:45 PM',  auto: false, status: 'held'   },
];

const fraudFlags = [
  { id: 'f1', workerId: 'u3', workerName: 'Arjun Mehta', platform: 'Zepto',  location: 'Bangalore', reason: 'GPS spoofing detected',  detail: 'Static coordinates for 47 min during claimed active delivery', confidence: 87, date: 'Today',     gtsScore: 481, status: 'open' },
  { id: 'f2', workerId: 'u6', workerName: 'Sneha Patel', platform: 'Zomato', location: 'Pune',      reason: 'Claim pattern anomaly',  detail: '4 low-order claims in 6 days — 3× peer average for this zone',  confidence: 72, date: 'Yesterday', gtsScore: 378, status: 'open' },
];

const adminAlerts = [
  { id: 'aa1', type: 'rain',      zone: 'Velachery, Chennai',    severity: 'high',   message: 'Heavy rainfall — 14 workers affected, auto-payouts triggered', time: '11:40 AM',   active: true  },
  { id: 'aa2', type: 'lowOrders', zone: 'Andheri West, Mumbai',  severity: 'medium', message: 'Demand drop >50% detected — 3 workers pending verification',   time: '9:00 PM',    active: true  },
  { id: 'aa3', type: 'curfew',    zone: 'Koramangala, Bangalore',severity: 'low',    message: 'Zone restriction lifted — coverage resumed normally',           time: 'Mon 14 Jan', active: false },
];

// ── HELPERS ────────────────────────────────────────────────
function calcGtsTier(score) {
  if (score >= adminSettings.gigtrust.highMin)   return 'high';
  if (score >= adminSettings.gigtrust.mediumMin) return 'medium';
  return 'low';
}

function calcPremium(coverageObj) {
  const { minPremium, maxPremium, coverageDivisor } = adminSettings.premium;
  const total = Object.values(coverageObj).reduce((s, v) => s + v, 0);
  return Math.max(minPremium, Math.min(maxPremium, Math.round((total / coverageDivisor) * maxPremium)));
}

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
}

// ── WORKER ROUTES ──────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok: true, ts: Date.now() }));

app.get('/api/user', (_, res) => {
  const w = getWorker();
  res.json({ ...w, weeklyProtected: w.weeklyEarnings });
});

app.get('/api/coverage', (_, res) => {
  const w = getWorker();
  res.json({ ...coverage, protection, premium: w.premium });
});

app.patch('/api/coverage', (req, res) => {
  const { rain, lowOrders, pollution, curfew } = req.body;
  if (rain      !== undefined) coverage.rain      = rain;
  if (lowOrders !== undefined) coverage.lowOrders = lowOrders;
  if (pollution !== undefined) coverage.pollution = pollution;
  if (curfew    !== undefined) coverage.curfew    = curfew;
  // Recalculate premium
  const newPremium = calcPremium(coverage);
  getWorker().premium = newPremium;
  res.json({ ...coverage, protection, premium: newPremium });
});

app.get('/api/activity', (_, res) => res.json(activity));

app.get('/api/payouts', (_, res) => {
  const total = payouts.reduce((s, p) => s + p.amount, 0);
  res.json({ payouts, total, count: payouts.length });
});

app.get('/api/alerts', (_, res) => res.json(workerAlerts));

app.get('/api/gigtrust', (_, res) => res.json({ ...gigTrust, score: getWorker().gtsScore, tier: getWorker().gtsTier }));

app.get('/api/premium-status', (_, res) => {
  const w = getWorker();
  res.json({ ...premiumState, amount: w.premium, upi: w.upi });
});

app.post('/api/payment', (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'Invalid PIN' });

  if (!adminSettings.platform.active) {
    return res.status(503).json({ error: 'Platform is offline. Payment cannot be processed.' });
  }

  const w = getWorker();
  const now = new Date();
  const expires = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  premiumState.paid = true;
  premiumState.lastPaidDate = now.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  premiumState.expiresDate  = expires.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  premiumState.txId = `TXN${Date.now().toString().slice(-10)}`;

  res.json({
    success: true,
    txId: premiumState.txId,
    amount: w.premium,
    upi: w.upi,
    paidDate: premiumState.lastPaidDate,
    expiresDate: premiumState.expiresDate,
    message: `₹${w.premium} paid · Coverage active for 7 days`,
  });
});

app.get('/api/settings', (_, res) => res.json(settings));

app.patch('/api/settings', (req, res) => {
  const { autoRenew, notifications, smartCoverage } = req.body;
  if (autoRenew       !== undefined) settings.autoRenew       = autoRenew;
  if (notifications   !== undefined) settings.notifications   = notifications;
  if (smartCoverage   !== undefined) settings.smartCoverage   = smartCoverage;
  res.json(settings);
});

app.post('/api/onboard', (req, res) => {
  const { platform, location, zone, workHours } = req.body;
  const w = getWorker();
  if (platform)  w.platform  = platform;
  if (location)  w.location  = location;
  if (zone)      w.zone      = zone;
  if (workHours) w.workHours = workHours;
  res.json({ success: true, user: w });
});

app.post('/api/verify', (req, res) => {
  const { gps, selfie } = req.body;
  if (!gps || !selfie) return res.status(400).json({ error: 'GPS and selfie confirmation required' });

  // Check platform status
  if (!adminSettings.platform.active) {
    return res.status(503).json({ error: 'Platform is currently offline. Please try again later.' });
  }
  if (adminSettings.platform.maintenanceMode) {
    return res.status(503).json({ error: 'Platform is under maintenance. Claims are temporarily paused.' });
  }

  const w = getWorker();

  // Check if worker is suspended
  if (w.status === 'suspended') {
    return res.status(403).json({ error: 'Your account is currently suspended. Contact support.' });
  }

  activity.compensationEligible = false;

  const newPayout = { id: `p${payouts.length + 1}`, amount: 200, reason: 'Low Orders', type: 'lowOrders', date: 'Today', time: nowTime(), auto: false };
  payouts.unshift(newPayout);

  // Also add to allPayouts so admin sees it
  allPayouts.unshift({ ...newPayout, id: `ap${allPayouts.length + 1}`, workerId: w.id, workerName: w.name, platform: w.platform, status: 'paid' });

  // Update worker earnings
  w.weeklyEarnings += 200;

  // Bump GigTrust score +10 for verified claim
  w.gtsScore = Math.min(900, w.gtsScore + 10);
  w.gtsTier  = calcGtsTier(w.gtsScore);
  gigTrust.score = w.gtsScore;
  gigTrust.tier  = w.gtsTier;
  gigTrust.trend = '+10 this week';

  res.json({ success: true, payout: newPayout, message: '₹200 payout triggered and sent to your UPI.' });
});

app.get('/api/dashboard', (_, res) => {
  const w = getWorker();
  res.json({
    user: { name: w.name, platform: w.platform, location: w.location, zone: w.zone, initials: w.initials },
    weeklyProtected: w.weeklyEarnings,
    premium: w.premium,
    coverageLimit: w.coverageLimit,
    weeklyUsagePct: w.weeklyUsagePct,
    protection,
    lastPayout: payouts[0],
    alerts: workerAlerts,
    compensationEligible: activity.compensationEligible,
    suspended: w.status === 'suspended',
    gigTrust: { score: w.gtsScore, tier: w.gtsTier, trend: gigTrust.trend, payoutMode: w.gtsScore >= 700 ? 'Instant payout unlocked' : w.gtsScore >= 500 ? 'Partial payout mode' : 'Payout held — score too low' },
  });
});

// ── ADMIN ROUTES ───────────────────────────────────────────
app.get('/api/admin/stats', (_, res) => {
  const active    = workers.filter(w => w.status === 'active').length;
  const flagged   = workers.filter(w => w.status === 'flagged').length;
  const suspended = workers.filter(w => w.status === 'suspended').length;
  const paid      = allPayouts.filter(p => p.status === 'paid');
  const held      = allPayouts.filter(p => p.status === 'held').length;
  const high   = workers.filter(w => w.gtsTier === 'high').length;
  const medium = workers.filter(w => w.gtsTier === 'medium').length;
  const low    = workers.filter(w => w.gtsTier === 'low').length;
  const avg    = Math.round(workers.reduce((s, w) => s + w.gtsScore, 0) / workers.length);
  res.json({
    totalWorkers: workers.length, activeWorkers: active, flaggedWorkers: flagged, suspendedWorkers: suspended,
    totalPayouts: paid.length, totalDisbursed: paid.reduce((s, p) => s + p.amount, 0), heldPayouts: held,
    gtsDistribution: { high, medium, low }, avgGts: avg,
  });
});

app.get('/api/admin/workers', (_, res) => res.json(workers));

app.patch('/api/admin/workers/:id', (req, res) => {
  const w = workers.find(w => w.id === req.params.id);
  if (!w) return res.status(404).json({ error: 'Worker not found' });

  const { status } = req.body;
  if (status) {
    w.status = status;
    // If suspended, clear any pending eligibility for that worker
    if (status === 'suspended' && w.id === ACTIVE_WORKER_ID) {
      activity.compensationEligible = false;
    }
  }
  res.json(w);
});

app.get('/api/admin/payouts', (_, res) => {
  const total = allPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  res.json({ payouts: allPayouts, total, count: allPayouts.length });
});

app.patch('/api/admin/payouts/:id', (req, res) => {
  const p = allPayouts.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Payout not found' });

  const { action } = req.body; // 'approve' | 'reject'
  if (action === 'approve') {
    p.status = 'paid';
    // Credit to worker earnings
    const w = workers.find(w => w.id === p.workerId);
    if (w) {
      w.weeklyEarnings += p.amount;
      // Bump GTS slightly for cleared payout
      w.gtsScore = Math.min(900, w.gtsScore + 5);
      w.gtsTier  = calcGtsTier(w.gtsScore);
      if (w.id === ACTIVE_WORKER_ID) { gigTrust.score = w.gtsScore; gigTrust.tier = w.gtsTier; }
    }
    // Also add to worker-facing payouts if it's the active worker
    if (p.workerId === ACTIVE_WORKER_ID) {
      payouts.unshift({ id: `p${payouts.length + 1}`, amount: p.amount, reason: p.reason, type: p.type, date: p.date, time: p.time, auto: false, status: 'paid' });
      // NOTE: weeklyEarnings already credited above — do NOT credit again
    }
  } else if (action === 'reject') {
    p.status = 'rejected';
    // Drop GTS for rejected claim
    const w = workers.find(w => w.id === p.workerId);
    if (w) {
      w.gtsScore = Math.max(300, w.gtsScore - 20);
      w.gtsTier  = calcGtsTier(w.gtsScore);
      if (w.id === ACTIVE_WORKER_ID) {
        gigTrust.score = w.gtsScore;
        gigTrust.tier  = w.gtsTier;
        // Add to worker-facing payouts as rejected so they can see it
        payouts.unshift({ id: `p${payouts.length + 1}`, amount: p.amount, reason: p.reason, type: p.type, date: p.date, time: p.time, auto: false, status: 'rejected' });
      }
    }
  }
  res.json(p);
});

app.get('/api/admin/fraud', (_, res) => res.json(fraudFlags));

app.patch('/api/admin/fraud/:id', (req, res) => {
  const flag = fraudFlags.find(f => f.id === req.params.id);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });

  const { status } = req.body; // 'confirmed' | 'cleared'
  flag.status = status;

  const w = workers.find(w => w.id === flag.workerId);
  if (w) {
    if (status === 'confirmed') {
      // Hard fraud confirmed: big GTS drop, keep suspended
      w.gtsScore = Math.max(300, w.gtsScore - 80);
      w.gtsTier  = calcGtsTier(w.gtsScore);
      w.status   = 'suspended';
      // Reject all held payouts for this worker
      allPayouts.filter(p => p.workerId === w.id && p.status === 'held').forEach(p => p.status = 'rejected');
    } else if (status === 'cleared') {
      // Cleared: restore score a bit, mark active
      w.gtsScore = Math.min(900, w.gtsScore + 40);
      w.gtsTier  = calcGtsTier(w.gtsScore);
      w.status   = 'active';
      // Auto-approve their held payouts
      allPayouts.filter(p => p.workerId === w.id && p.status === 'held').forEach(p => {
        p.status = 'paid';
        w.weeklyEarnings += p.amount;
        if (w.id === ACTIVE_WORKER_ID) {
          payouts.unshift({ id: `p${payouts.length + 1}`, amount: p.amount, reason: p.reason, type: p.type, date: p.date, time: p.time, auto: false });
        }
      });
    }
    if (w.id === ACTIVE_WORKER_ID) { gigTrust.score = w.gtsScore; gigTrust.tier = w.gtsTier; }
  }
  res.json({ flag, worker: w });
});

app.get('/api/admin/settings', (_, res) => res.json(adminSettings));

app.patch('/api/admin/settings', (req, res) => {
  const { triggers, gigtrust, premium, platform } = req.body;
  if (triggers) {
    for (const [key, val] of Object.entries(triggers)) {
      if (adminSettings.triggers[key]) Object.assign(adminSettings.triggers[key], val);
    }
  }
  if (gigtrust)  Object.assign(adminSettings.gigtrust, gigtrust);
  if (premium)   Object.assign(adminSettings.premium, premium);
  if (platform)  Object.assign(adminSettings.platform, platform);
  res.json(adminSettings);
});

app.get('/api/admin/alerts', (_, res) => res.json(adminAlerts));

app.patch('/api/admin/alerts/:id', (req, res) => {
  const alert = adminAlerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.active = false;
  res.json(alert);
});

// Simulate a parametric trigger — sets worker eligibility + fires alert
app.post('/api/admin/simulate', (req, res) => {
  const { type, zone } = req.body;

  // Respect platform kill-switch
  if (!adminSettings.platform.active) {
    return res.status(503).json({ error: 'Platform is offline. Enable platform in Settings first.' });
  }

  // Respect per-trigger enabled flag
  const triggerCfg = adminSettings.triggers[type];
  if (triggerCfg && !triggerCfg.enabled) {
    return res.status(400).json({ error: `Trigger "${type}" is disabled in Settings.` });
  }

  const TRIGGER_META = {
    rain:      { title: 'Rain Alert',     message: "Heavy rain detected. You're covered.",        badge: 'AUTO ON',  workerMsg: 'Heavy rainfall in your zone — checking your eligibility.' },
    lowOrders: { title: 'Low Demand',     message: 'Order volume dropped >50%. Verify to claim.', badge: 'VERIFY',   workerMsg: 'Demand drop detected in your zone — verify to claim compensation.' },
    curfew:    { title: 'Zone Curfew',    message: "Zone restricted. You're protected.",           badge: 'AUTO ON',  workerMsg: 'Zone restriction detected — payout being processed.' },
    outage:    { title: 'Platform Issue', message: 'Platform outage detected. Checking coverage.', badge: 'CHECKING', workerMsg: 'Platform outage detected — verifying your eligibility.' },
  };

  const meta = TRIGGER_META[type] || TRIGGER_META.lowOrders;
  const simZone = zone || 'All Zones';
  const now = nowTime();

  // Fire admin alert
  const newAdminAlert = {
    id: `sim-${Date.now()}`,
    type: type === 'outage' ? 'lowOrders' : type,
    zone: `${simZone} [SIMULATED]`,
    severity: type === 'rain' || type === 'curfew' ? 'high' : 'medium',
    message: `[SIMULATED] ${meta.title} — workers evaluated for payout eligibility.`,
    time: now,
    active: true,
  };
  adminAlerts.unshift(newAdminAlert);

  // Set active worker as eligible (they'll see it on next poll)
  activity.compensationEligible = true;

  // Determine if this trigger is configured to auto-pay
  const isAutoPay = triggerCfg ? triggerCfg.autoPay : (type === 'rain' || type === 'curfew');
  const payoutAmount = triggerCfg ? triggerCfg.payoutAmount : (type === 'rain' ? 300 : 250);

  // Push worker-facing alert — badge reflects actual auto-pay setting
  workerAlerts.unshift({
    id: `wa-${Date.now()}`,
    type: type === 'outage' ? 'lowOrders' : type,
    title: meta.title,
    message: isAutoPay ? meta.workerMsg : meta.workerMsg,
    badge: isAutoPay ? 'AUTO ON' : 'VERIFY',
  });

  // Auto-pay if trigger is configured for it
  if (isAutoPay) {
    const w = getWorker();
    if (w.status !== 'suspended') {
      const autoPayout = {
        id: `p${payouts.length + 1}`, amount: payoutAmount,
        reason: triggerCfg?.label || type, type,
        date: 'Today', time: now, auto: true, status: 'paid',
      };
      payouts.unshift(autoPayout);
      allPayouts.unshift({ ...autoPayout, id: `ap${allPayouts.length + 1}`, workerId: w.id, workerName: w.name, platform: w.platform, status: 'paid' });
      w.weeklyEarnings += payoutAmount;
      activity.compensationEligible = false; // auto-paid, no manual verify needed
    }
  }

  res.json({ success: true, alert: newAdminAlert, autoPaid: isAutoPay, payoutAmount });
});

app.listen(PORT, () => {
  console.log(`\n🛡  InstaSure Backend running on http://localhost:${PORT}\n`);
});
