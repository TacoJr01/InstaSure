const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');
const crypto  = require('crypto');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── AUTH HELPERS ───────────────────────────────────────────
function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex').slice(0, 16);
}
const sessions = new Map(); // token → workerId
function createToken(workerId) {
  const token = crypto.randomBytes(20).toString('hex');
  sessions.set(token, workerId);
  return token;
}
function getWorkerFromToken(req) {
  const token = req.headers['x-auth-token'];
  if (token && sessions.has(token)) {
    const wId = sessions.get(token);
    return workers.find(w => w.id === wId);
  }
  return workers.find(w => w.id === 'u1'); // fallback for dev
}

// ── CITY RISK & ACTUARIAL CONFIG ───────────────────────────
const CITY_RISK = {
  Delhi:     { rain:0.06, pollution:0.25, lowOrders:0.12, curfew:0.08, riskScore:82, pool:'Delhi NCR AQI Pool'    },
  Mumbai:    { rain:0.18, pollution:0.04, lowOrders:0.10, curfew:0.05, riskScore:78, pool:'Mumbai Monsoon Pool'   },
  Chennai:   { rain:0.08, pollution:0.03, lowOrders:0.12, curfew:0.05, riskScore:72, pool:'Chennai Rain Pool'     },
  Bangalore: { rain:0.10, pollution:0.04, lowOrders:0.15, curfew:0.04, riskScore:68, pool:'Bangalore Mixed Pool'  },
  Hyderabad: { rain:0.07, pollution:0.05, lowOrders:0.14, curfew:0.03, riskScore:62, pool:'Hyderabad Demand Pool' },
  Pune:      { rain:0.09, pollution:0.03, lowOrders:0.11, curfew:0.03, riskScore:58, pool:'Pune Rain Pool'        },
};
const GTS_MULTIPLIERS = { high:0.85, medium:1.0, low:1.25 };
const ACTUARIAL_LOAD  = 0.32;
const actuaryState    = { historicalPremiums: 2400 };

// ── ADMIN SETTINGS ─────────────────────────────────────────
const adminSettings = {
  triggers: {
    rain:      { enabled:true,  autoPay:true,  payoutAmount:300, label:'Rain'           },
    lowOrders: { enabled:true,  autoPay:false, payoutAmount:200, label:'Low Orders'     },
    curfew:    { enabled:true,  autoPay:true,  payoutAmount:250, label:'Curfew'         },
    outage:    { enabled:false, autoPay:false, payoutAmount:150, label:'Platform Outage'},
  },
  gigtrust: { highMin:700, mediumMin:500 },
  premium:  { minPremium:25, maxPremium:80, coverageDivisor:1800 },
  platform: { active:true, maintenanceMode:false, fraudAutoSuspend:true },
};

// ── WORKERS (single source of truth) ──────────────────────
const workers = [
  { id:'u1', name:'Rahul Sharma',   initials:'RS', phone:'9100000001', pin:hashPin('1234'), platform:'Swiggy',  location:'Chennai',   zone:'Velachery',       gtsScore:742, gtsTier:'high',   status:'active',  weeklyEarnings:950,  premium:40, lastActive:'2 min ago',  upi:'rahul@upi',  workHours:'10 AM – 10 PM', memberSince:'Jan 2024', activeDeliveryDays:21, policyNumber:'ISP-2024-0001', policyStart:'6 Jan 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:800, lowOrders:500, pollution:200, curfew:300} },
  { id:'u2', name:'Priya Nair',     initials:'PN', phone:'9100000002', pin:hashPin('1234'), platform:'Zomato',  location:'Mumbai',    zone:'Andheri West',    gtsScore:612, gtsTier:'medium', status:'active',  weeklyEarnings:650,  premium:35, lastActive:'15 min ago', upi:'priya@upi',  workHours:'8 AM – 8 PM',   memberSince:'Mar 2024', activeDeliveryDays:14, policyNumber:'ISP-2024-0002', policyStart:'4 Mar 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:1000,lowOrders:400, pollution:100, curfew:200} },
  { id:'u3', name:'Arjun Mehta',    initials:'AM', phone:'9100000003', pin:hashPin('1234'), platform:'Zepto',   location:'Bangalore', zone:'Koramangala',     gtsScore:481, gtsTier:'low',    status:'flagged', weeklyEarnings:0,    premium:25, lastActive:'1 hr ago',   upi:'arjun@upi',  workHours:'9 AM – 9 PM',   memberSince:'May 2024', activeDeliveryDays:5,  policyNumber:'ISP-2024-0003', policyStart:'2 May 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:500, lowOrders:300, pollution:100, curfew:200} },
  { id:'u4', name:'Deepa Krishnan', initials:'DK', phone:'9100000004', pin:hashPin('1234'), platform:'Swiggy',  location:'Chennai',   zone:'Anna Nagar',      gtsScore:815, gtsTier:'high',   status:'active',  weeklyEarnings:1100, premium:45, lastActive:'5 min ago',  upi:'deepa@upi',  workHours:'10 AM – 10 PM', memberSince:'Feb 2024', activeDeliveryDays:28, policyNumber:'ISP-2024-0004', policyStart:'1 Feb 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:900, lowOrders:600, pollution:200, curfew:300} },
  { id:'u5', name:'Ravi Teja',      initials:'RT', phone:'9100000005', pin:hashPin('1234'), platform:'Amazon',  location:'Hyderabad', zone:'Gachibowli',      gtsScore:558, gtsTier:'medium', status:'active',  weeklyEarnings:580,  premium:30, lastActive:'30 min ago', upi:'ravi@upi',   workHours:'7 AM – 7 PM',   memberSince:'Apr 2024', activeDeliveryDays:18, policyNumber:'ISP-2024-0005', policyStart:'1 Apr 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:600, lowOrders:400, pollution:200, curfew:200} },
  { id:'u6', name:'Sneha Patel',    initials:'SP', phone:'9100000006', pin:hashPin('1234'), platform:'Zomato',  location:'Pune',      zone:'Koregaon Park',   gtsScore:378, gtsTier:'low',    status:'flagged', weeklyEarnings:0,    premium:20, lastActive:'3 hr ago',   upi:'sneha@upi',  workHours:'11 AM – 11 PM', memberSince:'Jun 2024', activeDeliveryDays:4,  policyNumber:'ISP-2024-0006', policyStart:'3 Jun 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:500, lowOrders:300, pollution:100, curfew:100} },
  { id:'u7', name:'Karan Singh',    initials:'KS', phone:'9100000007', pin:hashPin('1234'), platform:'Swiggy',  location:'Delhi',     zone:'Connaught Place', gtsScore:724, gtsTier:'high',   status:'active',  weeklyEarnings:820,  premium:40, lastActive:'8 min ago',  upi:'karan@upi',  workHours:'10 AM – 10 PM', memberSince:'Jan 2024', activeDeliveryDays:19, policyNumber:'ISP-2024-0007', policyStart:'8 Jan 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:400, lowOrders:500, pollution:1000,curfew:400} },
  { id:'u8', name:'Meera Iyer',     initials:'MI', phone:'9100000008', pin:hashPin('1234'), platform:'Zepto',   location:'Bangalore', zone:'Indiranagar',     gtsScore:639, gtsTier:'medium', status:'active',  weeklyEarnings:710,  premium:35, lastActive:'22 min ago', upi:'meera@upi',  workHours:'9 AM – 9 PM',   memberSince:'Mar 2024', activeDeliveryDays:16, policyNumber:'ISP-2024-0008', policyStart:'5 Mar 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:700, lowOrders:500, pollution:100, curfew:200} },
];

let workerIdCounter = 9;

// ── PER-WORKER STATE MAPS ──────────────────────────────────
const workerAlertsMap = {
  u1: [{ id:'a1', type:'rain', title:'Rain today', message:"Orders may slow. You're fully covered.", badge:'AUTO ON' }],
};
const compensationMap   = { u1: true };    // workerId → boolean
const premiumStateMap   = {};              // workerId → { paid, lastPaidDate, expiresDate, txId }
const workerSettingsMap = {};              // workerId → { autoRenew, notifications, smartCoverage }

function getWorkerAlerts(wId)     { return workerAlertsMap[wId] || []; }
function isEligible(wId)          { return !!compensationMap[wId]; }
function getPremiumState(wId)     { return premiumStateMap[wId]   || { paid:false, lastPaidDate:null, expiresDate:null, txId:null }; }
function getWorkerSettings(wId)   { return workerSettingsMap[wId] || { autoRenew:true, notifications:true, smartCoverage:true }; }

// ── SHARED DEMO DATA ───────────────────────────────────────
const allPayouts = [
  { id:'ap1', workerId:'u1', workerName:'Rahul Sharma',   platform:'Swiggy', amount:300, type:'rain',      reason:'Rain',       date:'Today',      time:'11:42 AM', auto:true,  status:'paid' },
  { id:'ap2', workerId:'u4', workerName:'Deepa Krishnan', platform:'Swiggy', amount:250, type:'rain',      reason:'Rain',       date:'Today',      time:'11:40 AM', auto:true,  status:'paid' },
  { id:'ap3', workerId:'u7', workerName:'Karan Singh',    platform:'Swiggy', amount:250, type:'rain',      reason:'Rain',       date:'Today',      time:'11:38 AM', auto:true,  status:'paid' },
  { id:'ap4', workerId:'u1', workerName:'Rahul Sharma',   platform:'Swiggy', amount:200, type:'lowOrders', reason:'Low Orders', date:'Yesterday',  time:'9:05 PM',  auto:false, status:'paid' },
  { id:'ap5', workerId:'u2', workerName:'Priya Nair',     platform:'Zomato', amount:200, type:'lowOrders', reason:'Low Orders', date:'Yesterday',  time:'8:30 PM',  auto:false, status:'paid' },
  { id:'ap6', workerId:'u8', workerName:'Meera Iyer',     platform:'Zepto',  amount:180, type:'lowOrders', reason:'Low Orders', date:'Yesterday',  time:'7:55 PM',  auto:false, status:'paid' },
  { id:'ap7', workerId:'u5', workerName:'Ravi Teja',      platform:'Amazon', amount:150, type:'lowOrders', reason:'Low Orders', date:'Mon 14 Jan', time:'6:20 PM',  auto:true,  status:'paid' },
  { id:'ap8', workerId:'u3', workerName:'Arjun Mehta',    platform:'Zepto',  amount:300, type:'rain',      reason:'Rain',       date:'Mon 14 Jan', time:'2:10 PM',  auto:false, status:'held' },
  { id:'ap9', workerId:'u6', workerName:'Sneha Patel',    platform:'Zomato', amount:200, type:'lowOrders', reason:'Low Orders', date:'Sun 13 Jan', time:'5:45 PM',  auto:false, status:'held' },
];

const fraudFlags = [
  { id:'f1', workerId:'u3', workerName:'Arjun Mehta', platform:'Zepto',  location:'Bangalore', reason:'GPS spoofing detected', detail:'Static coordinates for 47 min during claimed active delivery', confidence:87, date:'Today',     gtsScore:481, status:'open' },
  { id:'f2', workerId:'u6', workerName:'Sneha Patel', platform:'Zomato', location:'Pune',      reason:'Claim pattern anomaly', detail:'4 low-order claims in 6 days — 3× peer average for this zone',  confidence:72, date:'Yesterday', gtsScore:378, status:'open' },
];

const adminAlerts = [
  { id:'aa1', type:'rain',      zone:'Velachery, Chennai',    severity:'high',   message:'Heavy rainfall — 14 workers affected, auto-payouts triggered', time:'11:40 AM',   active:true  },
  { id:'aa2', type:'lowOrders', zone:'Andheri West, Mumbai',  severity:'medium', message:'Demand drop >50% detected — 3 workers pending verification',   time:'9:00 PM',    active:true  },
  { id:'aa3', type:'curfew',    zone:'Koramangala, Bangalore',severity:'low',    message:'Zone restriction lifted — coverage resumed normally',           time:'Mon 14 Jan', active:false },
];

const protection = { rain:'active', lowOrders:'active', pollution:'watching', curfew:'active' };

const activity = {
  normalOrders:10, todayOrders:4, dropPercent:60,
  week: [
    { day:'Mon', orders:9 }, { day:'Tue', orders:10 },
    { day:'Wed', orders:8 }, { day:'Thu', orders:11 }, { day:'Fri', orders:4 },
  ],
  forecast: [
    { day:'Tomorrow', status:'slow', label:'May be slow' },
    { day:'Weekend',  status:'good', label:'Looks good'  },
  ],
};

// ── HELPERS ────────────────────────────────────────────────
function calcGtsTier(score) {
  if (score >= adminSettings.gigtrust.highMin)   return 'high';
  if (score >= adminSettings.gigtrust.mediumMin) return 'medium';
  return 'low';
}

function calcActuarialPremium(worker, cov) {
  const city = CITY_RISK[worker.location] || { rain:0.08, pollution:0.03, lowOrders:0.12, curfew:0.05 };
  const gtsM = GTS_MULTIPLIERS[worker.gtsTier] || 1.0;
  const { minPremium, maxPremium } = adminSettings.premium;
  const expected =
    (city.rain      * (cov.rain      || 0)) +
    (city.pollution * (cov.pollution || 0)) +
    (city.lowOrders * (cov.lowOrders || 0)) +
    (city.curfew    * (cov.curfew    || 0));
  return Math.max(minPremium, Math.min(maxPremium, Math.round(expected * gtsM * ACTUARIAL_LOAD)));
}

function getGtsComponents(w) {
  const base = Math.round((w.gtsScore - 300) / 6);
  return [
    { key:'consistency', label:'Work Consistency',   score: Math.min(100, Math.max(30, base - 5)) },
    { key:'gps',         label:'GPS Integrity',       score: Math.min(100, Math.max(30, base + 8)) },
    { key:'behavior',    label:'Behavioral Pattern',  score: Math.min(100, Math.max(30, base - 3)) },
    { key:'claims',      label:'Claim History',       score: Math.min(100, Math.max(30, base + 6)) },
    { key:'peer',        label:'Peer Comparison',     score: Math.min(100, Math.max(30, base - 9)) },
  ];
}

function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
}

function makeInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0].toUpperCase()).join('').slice(0, 2);
}

// ── AUTH ROUTES ────────────────────────────────────────────
app.post('/api/auth/register', (req, res) => {
  const { name, phone, pin, platform, location, zone, workHours } = req.body;
  if (!name || !phone || !pin) return res.status(400).json({ error: 'Name, phone and PIN are required' });
  if (workers.find(w => w.phone === phone)) return res.status(409).json({ error: 'Phone number already registered' });

  const id          = `u${workerIdCounter++}`;
  const policyNum   = `ISP-${new Date().getFullYear()}-${String(id.slice(1)).padStart(4,'0')}`;
  const today       = new Date();
  const renewal     = new Date(today.getTime() + 7*24*60*60*1000);
  const startStr    = today.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const renewalStr  = renewal.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
  const loc         = location || 'Chennai';
  const cityRisk    = CITY_RISK[loc] || CITY_RISK.Chennai;
  const newWorker   = {
    id, name: name.trim(), initials: makeInitials(name),
    phone, pin: hashPin(pin),
    platform: platform || 'Swiggy',
    location: loc, zone: zone || '',
    workHours: workHours || '9 AM – 9 PM',
    gtsScore: 600, gtsTier: 'medium',
    status: 'active',
    weeklyEarnings: 0,
    premium: 0,
    lastActive: 'Just joined',
    upi: `${phone}@upi`,
    memberSince: today.toLocaleDateString('en-IN', { month:'short', year:'numeric' }),
    activeDeliveryDays: 0,
    policyNumber: policyNum,
    policyStart:   startStr,
    policyRenewal: renewalStr,
    coverage: { rain:800, lowOrders:500, pollution:200, curfew:300 },
  };
  newWorker.premium = calcActuarialPremium(newWorker, newWorker.coverage);
  workers.push(newWorker);
  const token = createToken(id);
  res.json({ success:true, token, worker: { id: newWorker.id, name: newWorker.name, initials: newWorker.initials } });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, pin } = req.body;
  if (!phone || !pin) return res.status(400).json({ error: 'Phone and PIN required' });
  const w = workers.find(w => w.phone === phone);
  if (!w || w.pin !== hashPin(pin)) return res.status(401).json({ error: 'Invalid phone or PIN' });
  const token = createToken(w.id);
  res.json({ success:true, token, worker: { id:w.id, name:w.name, initials:w.initials } });
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-auth-token'];
  if (token) sessions.delete(token);
  res.json({ success: true });
});

app.get('/api/auth/me', (req, res) => {
  const w = getWorkerFromToken(req);
  if (!w) return res.status(401).json({ error: 'Not authenticated' });
  res.json({ id:w.id, name:w.name, initials:w.initials, platform:w.platform, location:w.location });
});

// ── WORKER ROUTES ──────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok:true, ts:Date.now() }));

app.get('/api/user', (req, res) => {
  const w = getWorkerFromToken(req);
  res.json({ ...w, weeklyProtected: w.weeklyEarnings });
});

app.get('/api/coverage', (req, res) => {
  const w = getWorkerFromToken(req);
  res.json({ ...w.coverage, protection, premium: w.premium });
});

app.patch('/api/coverage', (req, res) => {
  const w = getWorkerFromToken(req);
  const { rain, lowOrders, pollution, curfew } = req.body;
  if (rain      !== undefined) w.coverage.rain      = rain;
  if (lowOrders !== undefined) w.coverage.lowOrders = lowOrders;
  if (pollution !== undefined) w.coverage.pollution = pollution;
  if (curfew    !== undefined) w.coverage.curfew    = curfew;
  const newPremium = calcActuarialPremium(w, w.coverage);
  w.premium = newPremium;
  res.json({ ...w.coverage, protection, premium: newPremium });
});

app.get('/api/activity', (req, res) => {
  const w = getWorkerFromToken(req);
  res.json({ ...activity, compensationEligible: isEligible(w.id) });
});

app.get('/api/payouts', (req, res) => {
  const w = getWorkerFromToken(req);
  const workerPayouts = allPayouts.filter(p => p.workerId === w.id);
  const total = workerPayouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
  res.json({ payouts: workerPayouts, total, count: workerPayouts.length });
});

app.get('/api/alerts', (req, res) => {
  const w = getWorkerFromToken(req);
  res.json(getWorkerAlerts(w.id));
});

app.get('/api/gigtrust', (req, res) => {
  const w = getWorkerFromToken(req);
  const payoutMode = w.gtsScore >= 700 ? 'Instant payout unlocked' : w.gtsScore >= 500 ? 'Partial payout mode' : 'Payout held — score too low';
  res.json({
    score: w.gtsScore, tier: w.gtsTier,
    trend: '+12 this week', payoutMode,
    components: getGtsComponents(w),
  });
});

app.get('/api/policy', (req, res) => {
  const w = getWorkerFromToken(req);
  res.json({
    policyNumber:        w.policyNumber,
    activeDeliveryDays:  w.activeDeliveryDays,
    policyStart:         w.policyStart,
    policyRenewal:       w.policyRenewal,
    eligibleForCoverage: w.activeDeliveryDays >= 7,
    underwritingTier:    w.gtsTier,
    cityRiskPool:        (CITY_RISK[w.location] || {}).pool || `${w.location} Pool`,
    location:            w.location,
  });
});

app.get('/api/premium-breakdown', (req, res) => {
  const w    = getWorkerFromToken(req);
  const city = CITY_RISK[w.location] || { rain:0.08, pollution:0.03, lowOrders:0.12, curfew:0.05 };
  const gtsM = GTS_MULTIPLIERS[w.gtsTier] || 1.0;
  const cov  = w.coverage;
  const components = [
    { trigger:'rain',      label:'Rain',       probability:city.rain,      coverage:cov.rain,      expected:Math.round(city.rain      * cov.rain)      },
    { trigger:'lowOrders', label:'Low Orders', probability:city.lowOrders, coverage:cov.lowOrders, expected:Math.round(city.lowOrders * cov.lowOrders) },
    { trigger:'pollution', label:'Pollution',  probability:city.pollution, coverage:cov.pollution, expected:Math.round(city.pollution * cov.pollution) },
    { trigger:'curfew',    label:'Curfew',     probability:city.curfew,    coverage:cov.curfew,    expected:Math.round(city.curfew    * cov.curfew)    },
  ];
  const totalExpected = components.reduce((s, c) => s + c.expected, 0);
  res.json({
    city: w.location, gtsTier: w.gtsTier, gtsMultiplier: gtsM,
    loadFactor: ACTUARIAL_LOAD, components, totalExpected,
    afterGts: Math.round(totalExpected * gtsM),
    finalPremium: calcActuarialPremium(w, cov),
  });
});

app.get('/api/premium-status', (req, res) => {
  const w = getWorkerFromToken(req);
  const ps = getPremiumState(w.id);
  res.json({ ...ps, amount: w.premium, upi: w.upi });
});

app.post('/api/payment', (req, res) => {
  const { pin } = req.body;
  if (!pin || pin.length < 4) return res.status(400).json({ error: 'Invalid PIN' });
  if (!adminSettings.platform.active) return res.status(503).json({ error: 'Platform is offline.' });
  const w   = getWorkerFromToken(req);
  const now = new Date();
  const exp = new Date(now.getTime() + 7*24*60*60*1000);
  const ps  = {
    paid: true,
    lastPaidDate: now.toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    expiresDate:  exp.toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
    txId: `TXN${Date.now().toString().slice(-10)}`,
  };
  premiumStateMap[w.id] = ps;
  res.json({ success:true, ...ps, amount: w.premium, upi: w.upi, message:`₹${w.premium} paid · Coverage active for 7 days` });
});

app.get('/api/settings', (req, res) => {
  const w = getWorkerFromToken(req);
  res.json(getWorkerSettings(w.id));
});

app.patch('/api/settings', (req, res) => {
  const w = getWorkerFromToken(req);
  const current = getWorkerSettings(w.id);
  const { autoRenew, notifications, smartCoverage } = req.body;
  const updated = {
    autoRenew:      autoRenew      !== undefined ? autoRenew      : current.autoRenew,
    notifications:  notifications  !== undefined ? notifications  : current.notifications,
    smartCoverage:  smartCoverage  !== undefined ? smartCoverage  : current.smartCoverage,
  };
  workerSettingsMap[w.id] = updated;
  res.json(updated);
});

app.post('/api/onboard', (req, res) => {
  const w = getWorkerFromToken(req);
  const { platform, location, zone, workHours } = req.body;
  if (platform)  w.platform  = platform;
  if (location)  { w.location = location; w.premium = calcActuarialPremium(w, w.coverage); }
  if (zone)      w.zone      = zone;
  if (workHours) w.workHours = workHours;
  res.json({ success:true, user: w });
});

app.post('/api/verify', (req, res) => {
  const { gps, selfie } = req.body;
  if (!gps || !selfie) return res.status(400).json({ error: 'GPS and selfie confirmation required' });
  if (!adminSettings.platform.active)       return res.status(503).json({ error: 'Platform is currently offline.' });
  if (adminSettings.platform.maintenanceMode) return res.status(503).json({ error: 'Platform is under maintenance.' });

  const w = getWorkerFromToken(req);
  if (w.status === 'suspended') return res.status(403).json({ error: 'Account suspended. Contact support.' });

  compensationMap[w.id] = false;
  const payout = {
    id: `ap${allPayouts.length + 1}`, workerId: w.id, workerName: w.name,
    platform: w.platform, amount: 200, reason: 'Low Orders', type: 'lowOrders',
    date: 'Today', time: nowTime(), auto: false, status: 'paid',
  };
  allPayouts.unshift(payout);
  w.weeklyEarnings += 200;
  w.gtsScore = Math.min(900, w.gtsScore + 10);
  w.gtsTier  = calcGtsTier(w.gtsScore);
  res.json({ success:true, payout, message:'₹200 payout triggered and sent to your UPI.' });
});

app.get('/api/dashboard', (req, res) => {
  const w = getWorkerFromToken(req);
  const workerPayouts = allPayouts.filter(p => p.workerId === w.id && p.status === 'paid');
  const lastPayout    = workerPayouts[0] || null;
  const payoutMode    = w.gtsScore >= 700 ? 'Instant payout unlocked' : w.gtsScore >= 500 ? 'Partial payout mode' : 'Payout held — score too low';
  res.json({
    user: { name:w.name, platform:w.platform, location:w.location, zone:w.zone, initials:w.initials },
    weeklyProtected: w.weeklyEarnings,
    premium:         w.premium,
    coverageLimit:   Object.values(w.coverage).reduce((s,v)=>s+v,0),
    weeklyUsagePct:  Math.min(100, Math.round((w.weeklyEarnings / Math.max(1, Object.values(w.coverage).reduce((s,v)=>s+v,0))) * 100)),
    protection,
    lastPayout,
    alerts:               getWorkerAlerts(w.id),
    compensationEligible: isEligible(w.id),
    suspended:            w.status === 'suspended',
    gigTrust: { score:w.gtsScore, tier:w.gtsTier, trend:'+12 this week', payoutMode },
  });
});

// ── ADMIN ROUTES ───────────────────────────────────────────
app.get('/api/admin/stats', (_, res) => {
  const active    = workers.filter(w => w.status === 'active').length;
  const flagged   = workers.filter(w => w.status === 'flagged').length;
  const suspended = workers.filter(w => w.status === 'suspended').length;
  const paid      = allPayouts.filter(p => p.status === 'paid');
  const held      = allPayouts.filter(p => p.status === 'held').length;
  const high      = workers.filter(w => w.gtsTier === 'high').length;
  const medium    = workers.filter(w => w.gtsTier === 'medium').length;
  const low       = workers.filter(w => w.gtsTier === 'low').length;
  const avg       = Math.round(workers.reduce((s, w) => s + w.gtsScore, 0) / workers.length);
  res.json({
    totalWorkers: workers.length, activeWorkers: active, flaggedWorkers: flagged, suspendedWorkers: suspended,
    totalPayouts: paid.length, totalDisbursed: paid.reduce((s,p) => s+p.amount, 0), heldPayouts: held,
    gtsDistribution: { high, medium, low }, avgGts: avg,
  });
});

app.get('/api/admin/workers', (_, res) => res.json(workers.map(w => ({ ...w, pin: undefined }))));

app.patch('/api/admin/workers/:id', (req, res) => {
  const w = workers.find(w => w.id === req.params.id);
  if (!w) return res.status(404).json({ error: 'Worker not found' });
  const { status } = req.body;
  if (status) {
    w.status = status;
    if (status === 'suspended') compensationMap[w.id] = false;
  }
  res.json({ ...w, pin: undefined });
});

app.get('/api/admin/payouts', (_, res) => {
  const total = allPayouts.filter(p => p.status === 'paid').reduce((s,p) => s+p.amount, 0);
  res.json({ payouts: allPayouts, total, count: allPayouts.length });
});

app.patch('/api/admin/payouts/:id', (req, res) => {
  const p = allPayouts.find(p => p.id === req.params.id);
  if (!p) return res.status(404).json({ error: 'Payout not found' });
  const { action } = req.body;
  const w = workers.find(w => w.id === p.workerId);
  if (action === 'approve') {
    p.status = 'paid';
    if (w) { w.weeklyEarnings += p.amount; w.gtsScore = Math.min(900, w.gtsScore + 5); w.gtsTier = calcGtsTier(w.gtsScore); }
  } else if (action === 'reject') {
    p.status = 'rejected';
    if (w) { w.gtsScore = Math.max(300, w.gtsScore - 20); w.gtsTier = calcGtsTier(w.gtsScore); }
  }
  res.json(p);
});

app.get('/api/admin/fraud', (_, res) => res.json(fraudFlags));

app.patch('/api/admin/fraud/:id', (req, res) => {
  const flag = fraudFlags.find(f => f.id === req.params.id);
  if (!flag) return res.status(404).json({ error: 'Flag not found' });
  const { status } = req.body;
  flag.status = status;
  const w = workers.find(w => w.id === flag.workerId);
  if (w) {
    if (status === 'confirmed') {
      w.gtsScore = Math.max(300, w.gtsScore - 80); w.gtsTier = calcGtsTier(w.gtsScore); w.status = 'suspended';
      allPayouts.filter(p => p.workerId === w.id && p.status === 'held').forEach(p => p.status = 'rejected');
    } else if (status === 'cleared') {
      w.gtsScore = Math.min(900, w.gtsScore + 40); w.gtsTier = calcGtsTier(w.gtsScore); w.status = 'active';
      allPayouts.filter(p => p.workerId === w.id && p.status === 'held').forEach(p => { p.status = 'paid'; w.weeklyEarnings += p.amount; });
    }
  }
  res.json({ flag, worker: w ? { ...w, pin: undefined } : null });
});

app.get('/api/admin/actuary', (_, res) => {
  const paidClaims   = allPayouts.filter(p => p.status === 'paid');
  const totalClaims  = paidClaims.reduce((s,p) => s+p.amount, 0);
  const totalPremiums= actuaryState.historicalPremiums + workers.reduce((s,w) => s+w.premium, 0);
  const bcr          = totalPremiums > 0 ? +(totalClaims / totalPremiums).toFixed(3) : 0;
  const cities       = [...new Set(workers.map(w => w.location))];
  const cityPools    = cities.map(city => {
    const pool    = workers.filter(w => w.location === city);
    const risk    = CITY_RISK[city] || {};
    const riskSum = (risk.rain||0) + (risk.pollution||0) + (risk.lowOrders||0) + (risk.curfew||0);
    return {
      city, pool: risk.pool || `${city} Pool`,
      enrolled:   pool.length,
      eligible:   pool.filter(w => w.activeDeliveryDays >= 7).length,
      avgPremium: pool.length ? Math.round(pool.reduce((s,w)=>s+w.premium,0)/pool.length) : 0,
      riskScore:  risk.riskScore || Math.round(riskSum*100),
      status:     riskSum < 0.30 ? 'balanced' : riskSum < 0.50 ? 'elevated' : 'high',
    };
  });
  const eligible        = workers.filter(w => w.activeDeliveryDays >= 7).length;
  const affectedWorkers = workers.filter(w => w.location === 'Mumbai' || w.location === 'Chennai');
  const stressExtra     = affectedWorkers.length * 2 * 300;
  const stressBcr       = totalPremiums > 0 ? +((totalClaims + stressExtra)/totalPremiums).toFixed(3) : 0;
  res.json({
    bcr, lossRatio: +(bcr*100).toFixed(1), totalClaims, totalPremiums,
    bcrTarget: { min:0.55, max:0.70 },
    bcrStatus:  bcr < 0.55 ? 'under' : bcr <= 0.70 ? 'healthy' : 'over',
    cityPools,
    enrollment: { total:workers.length, eligible, ineligible:workers.length-eligible, flagged:workers.filter(w=>w.status==='flagged').length, suspended:workers.filter(w=>w.status==='suspended').length },
    stressScenario: { label:'14-Day Monsoon', affectedCities:['Mumbai','Chennai'], affectedWorkers:affectedWorkers.length, extraClaims:stressExtra, projectedBcr:stressBcr, projectedLossRatio:+(stressBcr*100).toFixed(1), capitalAlert:stressBcr>0.85 },
  });
});

app.get('/api/admin/settings',  (_, res) => res.json(adminSettings));
app.patch('/api/admin/settings', (req, res) => {
  const { triggers, gigtrust, premium, platform } = req.body;
  if (triggers) for (const [k,v] of Object.entries(triggers)) if (adminSettings.triggers[k]) Object.assign(adminSettings.triggers[k], v);
  if (gigtrust) Object.assign(adminSettings.gigtrust, gigtrust);
  if (premium)  Object.assign(adminSettings.premium, premium);
  if (platform) Object.assign(adminSettings.platform, platform);
  res.json(adminSettings);
});

app.get('/api/admin/alerts', (_, res) => res.json(adminAlerts));
app.patch('/api/admin/alerts/:id', (req, res) => {
  const alert = adminAlerts.find(a => a.id === req.params.id);
  if (!alert) return res.status(404).json({ error: 'Alert not found' });
  alert.active = false;
  res.json(alert);
});

// Admin login (hardcoded credentials)
app.post('/api/admin/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@instasure.com' && password === 'Admin@123') {
    res.json({ success:true, token:'admin-token-instasure', name:'Admin', role:'operator' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.post('/api/admin/simulate', (req, res) => {
  const { type, zone } = req.body;
  if (!adminSettings.platform.active) return res.status(503).json({ error: 'Platform is offline.' });
  const triggerCfg = adminSettings.triggers[type];
  if (triggerCfg && !triggerCfg.enabled) return res.status(400).json({ error: `Trigger "${type}" is disabled in Settings.` });

  const TRIGGER_META = {
    rain:      { title:'Rain Alert',     workerMsg:'Heavy rainfall in your zone — checking your eligibility.' },
    lowOrders: { title:'Low Demand',     workerMsg:'Demand drop detected in your zone — verify to claim compensation.' },
    curfew:    { title:'Zone Curfew',    workerMsg:'Zone restriction detected — payout being processed.' },
    outage:    { title:'Platform Issue', workerMsg:'Platform outage detected — verifying your eligibility.' },
  };
  const meta         = TRIGGER_META[type] || TRIGGER_META.lowOrders;
  const simZone      = zone || 'All Zones';
  const now          = nowTime();
  const isAutoPay    = triggerCfg ? triggerCfg.autoPay : (type === 'rain' || type === 'curfew');
  const payoutAmount = triggerCfg ? triggerCfg.payoutAmount : (type === 'rain' ? 300 : 250);

  const newAdminAlert = {
    id:`sim-${Date.now()}`, type: type === 'outage' ? 'lowOrders' : type,
    zone:`${simZone} [SIMULATED]`,
    severity: type === 'rain' || type === 'curfew' ? 'high' : 'medium',
    message:`[SIMULATED] ${meta.title} — workers evaluated for payout eligibility.`,
    time:now, active:true,
  };
  adminAlerts.unshift(newAdminAlert);

  // Push alert and compensation to ALL active workers
  workers.filter(w => w.status !== 'suspended').forEach(w => {
    if (!workerAlertsMap[w.id]) workerAlertsMap[w.id] = [];
    workerAlertsMap[w.id].unshift({
      id:`wa-${Date.now()}-${w.id}`, type: type === 'outage' ? 'lowOrders' : type,
      title: meta.title, message: meta.workerMsg,
      badge: isAutoPay ? 'AUTO ON' : 'VERIFY',
    });
    if (isAutoPay) {
      const payout = {
        id:`ap${allPayouts.length+1}`, workerId:w.id, workerName:w.name,
        platform:w.platform, amount:payoutAmount, reason:triggerCfg?.label||type,
        type, date:'Today', time:now, auto:true, status:'paid',
      };
      allPayouts.unshift(payout);
      w.weeklyEarnings += payoutAmount;
    } else {
      compensationMap[w.id] = true;
    }
  });

  res.json({ success:true, alert:newAdminAlert, autoPaid:isAutoPay, payoutAmount });
});

app.listen(PORT, () => {
  console.log(`\n🛡  InstaSure Backend → http://localhost:${PORT}\n`);
  console.log('   Demo login: phone 9100000001, PIN 1234 (Rahul Sharma)');
  console.log('   Admin login: admin@instasure.com / Admin@123\n');
});
