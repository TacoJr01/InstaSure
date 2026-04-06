require('dotenv').config();
const express  = require('express');
const cors     = require('cors');
const morgan   = require('morgan');
const crypto   = require('crypto');
const mongoose = require('mongoose');

const { Worker, Payout, FraudFlag, AdminAlert, WorkerAlert, AdminSettings } = require('./models');

const app  = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(morgan('dev'));

// ── DB CONNECTION ──────────────────────────────────────────
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => { console.error('❌ MongoDB connection error:', err); process.exit(1); });

// ── ACTUARIAL CONFIG (stateless — no DB needed) ────────────
const CITY_RISK = {
  Delhi:     { rain:0.06, pollution:0.25, lowOrders:0.12, curfew:0.08, riskScore:82, pool:'Delhi NCR AQI Pool'    },
  Mumbai:    { rain:0.18, pollution:0.04, lowOrders:0.10, curfew:0.05, riskScore:78, pool:'Mumbai Monsoon Pool'   },
  Chennai:   { rain:0.08, pollution:0.03, lowOrders:0.12, curfew:0.05, riskScore:72, pool:'Chennai Rain Pool'     },
  Bangalore: { rain:0.10, pollution:0.04, lowOrders:0.15, curfew:0.04, riskScore:68, pool:'Bangalore Mixed Pool'  },
  Hyderabad: { rain:0.07, pollution:0.05, lowOrders:0.14, curfew:0.03, riskScore:62, pool:'Hyderabad Demand Pool' },
  Pune:      { rain:0.09, pollution:0.03, lowOrders:0.11, curfew:0.03, riskScore:58, pool:'Pune Rain Pool'        },
};
const GTS_MULTIPLIERS   = { high:0.85, medium:1.0, low:1.25 };
const ACTUARIAL_LOAD    = 0.32;
const PRICING = {
  avgDailyIncome:        700,
  daysExposedPerWeek:    5,
  incomeReplacementRate: 0.40,
  weeklyPremiumMin:      20,
  weeklyPremiumMax:      50,
  activityThresholdDays: 5,
  restrictedTierLoading: 1.30,
};

// ── AUTH HELPERS ───────────────────────────────────────────
function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex').slice(0, 16);
}
// In-memory sessions (token → workerId). Survives restarts fine for demo;
// for production, swap with JWT or a Redis-backed session store.
const sessions = new Map();
function createToken(workerId) {
  const token = crypto.randomBytes(20).toString('hex');
  sessions.set(token, workerId);
  return token;
}
async function getWorkerFromToken(req) {
  const token = req.headers['x-auth-token'];
  if (token && sessions.has(token)) {
    return Worker.findOne({ id: sessions.get(token) });
  }
  return Worker.findOne({ id: 'u1' }); // fallback for dev
}

// ── HELPERS ────────────────────────────────────────────────
function calcGtsTier(score, settings) {
  const high   = settings?.gigtrust?.highMin   ?? 700;
  const medium = settings?.gigtrust?.mediumMin ?? 500;
  if (score >= high)   return 'high';
  if (score >= medium) return 'medium';
  return 'low';
}
function getUnderwritingTier(worker) {
  const days = worker.activeDeliveryDays || 0;
  if (days < PRICING.activityThresholdDays) return 'restricted';
  if (days < 15) return 'standard';
  return 'preferred';
}
function calcActuarialPremium(worker, cov) {
  const city   = CITY_RISK[worker.location] || { rain:0.08, pollution:0.03, lowOrders:0.12, curfew:0.05 };
  const gtsM   = GTS_MULTIPLIERS[worker.gtsTier] || 1.0;
  const uwTier = getUnderwritingTier(worker);
  const uwLoad = uwTier === 'restricted' ? PRICING.restrictedTierLoading : 1.0;
  const { weeklyPremiumMin, weeklyPremiumMax } = PRICING;
  const expectedLoss =
    city.rain      * (cov.rain      || 0) +
    city.pollution * (cov.pollution || 0) +
    city.lowOrders * (cov.lowOrders || 0) +
    city.curfew    * (cov.curfew    || 0);
  return Math.max(weeklyPremiumMin, Math.min(weeklyPremiumMax, Math.round(expectedLoss * gtsM * uwLoad * ACTUARIAL_LOAD)));
}
function getGtsComponents(w) {
  const base = Math.round((w.gtsScore - 300) / 6);
  return [
    { key:'consistency', label:'Work Consistency',  score: Math.min(100, Math.max(30, base - 5)) },
    { key:'gps',         label:'GPS Integrity',      score: Math.min(100, Math.max(30, base + 8)) },
    { key:'behavior',    label:'Behavioral Pattern', score: Math.min(100, Math.max(30, base - 3)) },
    { key:'claims',      label:'Claim History',      score: Math.min(100, Math.max(30, base + 6)) },
    { key:'peer',        label:'Peer Comparison',    score: Math.min(100, Math.max(30, base - 9)) },
  ];
}
function makeInitials(name) {
  return name.trim().split(/\s+/).map(p => p[0].toUpperCase()).join('').slice(0, 2);
}
function nowTime() {
  return new Date().toLocaleTimeString('en-IN', { hour:'2-digit', minute:'2-digit', hour12:true });
}
function genId(prefix) {
  return `${prefix}${Date.now().toString(36)}`;
}
const protection = { rain:'active', lowOrders:'active', pollution:'watching', curfew:'active' };
const activity   = {
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

// ── HEALTH ─────────────────────────────────────────────────
app.get('/api/health', (_, res) => res.json({ ok:true, ts:Date.now(), db: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' }));

// ── AUTH ROUTES ────────────────────────────────────────────
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, phone, pin, platform, location, zone, workHours } = req.body;
    if (!name || !phone || !pin) return res.status(400).json({ error: 'Name, phone and PIN are required' });

    const exists = await Worker.findOne({ phone });
    if (exists) return res.status(409).json({ error: 'Phone number already registered' });

    // BCR guard
    const paidPayouts   = await Payout.find({ status: 'paid' });
    const allWorkers    = await Worker.find();
    const totalClaims   = paidPayouts.reduce((s, p) => s + p.amount, 0);
    const totalPremiums = 2400 + allWorkers.reduce((s, w) => s + w.premium, 0);
    const bcr           = totalPremiums > 0 ? totalClaims / totalPremiums : 0;
    if (bcr > 0.85) return res.status(503).json({ error: 'New enrolments temporarily paused due to high pool loss ratio. Please try again soon.' });

    const wId        = `u${Date.now().toString(36)}`;
    const policyNum  = `ISP-${new Date().getFullYear()}-${String(allWorkers.length + 1).padStart(4,'0')}`;
    const today      = new Date();
    const renewal    = new Date(today.getTime() + 7*24*60*60*1000);
    const startStr   = today.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const renewalStr = renewal.toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' });
    const loc        = location || 'Chennai';

    const newWorker = new Worker({
      id: wId, name: name.trim(), initials: makeInitials(name),
      phone, pin: hashPin(pin),
      platform: platform || 'Swiggy',
      location: loc, zone: zone || '',
      workHours: workHours || '9 AM – 9 PM',
      gtsScore: 600, gtsTier: 'medium',
      status: 'active', weeklyEarnings: 0,
      lastActive: 'Just joined',
      upi: `${phone}@upi`,
      memberSince: today.toLocaleDateString('en-IN', { month:'short', year:'numeric' }),
      activeDeliveryDays: 0,
      policyNumber: policyNum, policyStart: startStr, policyRenewal: renewalStr,
      coverage: { rain:800, lowOrders:500, pollution:200, curfew:300 },
    });
    newWorker.premium = calcActuarialPremium(newWorker, newWorker.coverage);
    await newWorker.save();

    const token = createToken(wId);
    res.json({ success:true, token, worker: { id:newWorker.id, name:newWorker.name, initials:newWorker.initials } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { phone, pin } = req.body;
    if (!phone || !pin) return res.status(400).json({ error: 'Phone and PIN required' });
    const w = await Worker.findOne({ phone });
    if (!w || w.pin !== hashPin(pin)) return res.status(401).json({ error: 'Invalid phone or PIN' });
    const token = createToken(w.id);
    res.json({ success:true, token, worker: { id:w.id, name:w.name, initials:w.initials } });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/auth/logout', (req, res) => {
  const token = req.headers['x-auth-token'];
  if (token) sessions.delete(token);
  res.json({ success: true });
});

app.get('/api/auth/me', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    if (!w) return res.status(401).json({ error: 'Not authenticated' });
    res.json({ id:w.id, name:w.name, initials:w.initials, platform:w.platform, location:w.location });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── WORKER ROUTES ──────────────────────────────────────────
app.get('/api/user', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    res.json({ ...w.toObject(), weeklyProtected: w.weeklyEarnings });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/coverage', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    res.json({ ...w.coverage.toObject(), protection, premium: w.premium });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/coverage', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    const { rain, lowOrders, pollution, curfew } = req.body;
    if (rain      !== undefined) w.coverage.rain      = rain;
    if (lowOrders !== undefined) w.coverage.lowOrders = lowOrders;
    if (pollution !== undefined) w.coverage.pollution = pollution;
    if (curfew    !== undefined) w.coverage.curfew    = curfew;
    w.premium = calcActuarialPremium(w, w.coverage);
    await w.save();
    res.json({ ...w.coverage.toObject(), protection, premium: w.premium });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/activity', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    res.json({ ...activity, compensationEligible: w.compensationEligible });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/payouts', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    const payouts = await Payout.find({ workerId: w.id }).sort({ createdAt: -1 });
    const total   = payouts.filter(p => p.status === 'paid').reduce((s, p) => s + p.amount, 0);
    res.json({ payouts, total, count: payouts.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/alerts', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    const alerts = await WorkerAlert.find({ workerId: w.id }).sort({ createdAt: -1 });
    res.json(alerts);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/gigtrust', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    const payoutMode = w.gtsScore >= 700 ? 'Instant payout unlocked' : w.gtsScore >= 500 ? 'Partial payout mode' : 'Payout held — score too low';
    res.json({ score:w.gtsScore, tier:w.gtsTier, trend:'+12 this week', payoutMode, components:getGtsComponents(w) });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/policy', async (req, res) => {
  try {
    const w      = await getWorkerFromToken(req);
    const uwTier = getUnderwritingTier(w);
    const cityR  = CITY_RISK[w.location] || {};
    res.json({
      policyNumber:           w.policyNumber,
      activeDeliveryDays:     w.activeDeliveryDays,
      activityDays30:         w.activeDeliveryDays,
      policyStart:            w.policyStart,
      policyRenewal:          w.policyRenewal,
      eligibleForCoverage:    w.activeDeliveryDays >= 7,
      underwritingTier:       w.gtsTier,
      activityTier:           uwTier,
      activityTierLoading:    uwTier === 'restricted' ? PRICING.restrictedTierLoading : 1.0,
      activityThreshold:      PRICING.activityThresholdDays,
      cityRiskPool:           cityR.pool || `${w.location} Pool`,
      cityRiskScore:          cityR.riskScore || 0,
      location:               w.location,
      weeklyPremium:          w.premium,
      premiumRange:           { min: PRICING.weeklyPremiumMin, max: PRICING.weeklyPremiumMax },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/premium-breakdown', async (req, res) => {
  try {
    const w    = await getWorkerFromToken(req);
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
      city:w.location, gtsTier:w.gtsTier, gtsMultiplier:gtsM,
      loadFactor:ACTUARIAL_LOAD, components, totalExpected,
      afterGts: Math.round(totalExpected * gtsM),
      finalPremium: calcActuarialPremium(w, cov),
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/premium-status', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    res.json({ ...w.premiumState.toObject(), amount: w.premium, upi: w.upi });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/payment', async (req, res) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) return res.status(400).json({ error: 'Invalid PIN' });
    const settings = await AdminSettings.findOne({ key: 'singleton' });
    if (settings && !settings.platform.active) return res.status(503).json({ error: 'Platform is offline.' });
    const w   = await getWorkerFromToken(req);
    const now = new Date();
    const exp = new Date(now.getTime() + 7*24*60*60*1000);
    w.premiumState = {
      paid: true,
      lastPaidDate: now.toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
      expiresDate:  exp.toLocaleDateString('en-IN', { day:'numeric', month:'short' }),
      txId: `TXN${Date.now().toString().slice(-10)}`,
    };
    await w.save();
    res.json({ success:true, ...w.premiumState.toObject(), amount:w.premium, upi:w.upi, message:`₹${w.premium} paid · Coverage active for 7 days` });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/settings', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    res.json(w.settings.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/settings', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    const { autoRenew, notifications, smartCoverage } = req.body;
    if (autoRenew     !== undefined) w.settings.autoRenew     = autoRenew;
    if (notifications !== undefined) w.settings.notifications = notifications;
    if (smartCoverage !== undefined) w.settings.smartCoverage = smartCoverage;
    await w.save();
    res.json(w.settings.toObject());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/onboard', async (req, res) => {
  try {
    const w = await getWorkerFromToken(req);
    const { platform, location, zone, workHours } = req.body;
    if (platform)  w.platform  = platform;
    if (location)  { w.location = location; w.premium = calcActuarialPremium(w, w.coverage); }
    if (zone)      w.zone      = zone;
    if (workHours) w.workHours = workHours;
    await w.save();
    res.json({ success:true, user: w });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/verify', async (req, res) => {
  try {
    const { gps, selfie } = req.body;
    if (!gps || !selfie) return res.status(400).json({ error: 'GPS and selfie confirmation required' });
    const settings = await AdminSettings.findOne({ key: 'singleton' });
    if (settings && !settings.platform.active)       return res.status(503).json({ error: 'Platform is currently offline.' });
    if (settings && settings.platform.maintenanceMode) return res.status(503).json({ error: 'Platform is under maintenance.' });
    const w = await getWorkerFromToken(req);
    if (w.status === 'suspended') return res.status(403).json({ error: 'Account suspended. Contact support.' });
    w.compensationEligible = false;
    const payout = new Payout({
      id: genId('ap'), workerId:w.id, workerName:w.name,
      platform:w.platform, amount:200, reason:'Low Orders', type:'lowOrders',
      date:'Today', time:nowTime(), auto:false, status:'paid',
    });
    await payout.save();
    w.weeklyEarnings += 200;
    w.gtsScore = Math.min(900, w.gtsScore + 10);
    w.gtsTier  = calcGtsTier(w.gtsScore, settings);
    await w.save();
    res.json({ success:true, payout, message:'₹200 payout triggered and sent to your UPI.' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/dashboard', async (req, res) => {
  try {
    const w           = await getWorkerFromToken(req);
    const payouts     = await Payout.find({ workerId:w.id, status:'paid' }).sort({ createdAt:-1 });
    const lastPayout  = payouts[0] || null;
    const workerAlerts = await WorkerAlert.find({ workerId:w.id }).sort({ createdAt:-1 });
    const payoutMode  = w.gtsScore >= 700 ? 'Instant payout unlocked' : w.gtsScore >= 500 ? 'Partial payout mode' : 'Payout held — score too low';
    res.json({
      user:            { name:w.name, platform:w.platform, location:w.location, zone:w.zone, initials:w.initials },
      weeklyProtected: w.weeklyEarnings,
      premium:         w.premium,
      coverageLimit:   Object.values(w.coverage.toObject()).reduce((s,v)=>s+v,0),
      weeklyUsagePct:  Math.min(100, Math.round((w.weeklyEarnings / Math.max(1, Object.values(w.coverage.toObject()).reduce((s,v)=>s+v,0))) * 100)),
      protection,
      lastPayout,
      alerts:               workerAlerts,
      compensationEligible: w.compensationEligible,
      suspended:            w.status === 'suspended',
      gigTrust: { score:w.gtsScore, tier:w.gtsTier, trend:'+12 this week', payoutMode },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── ADMIN ROUTES ───────────────────────────────────────────
app.post('/api/admin/auth/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@instasure.com' && password === 'Admin@123') {
    res.json({ success:true, token:'admin-token-instasure', name:'Admin', role:'operator' });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

app.get('/api/admin/stats', async (_, res) => {
  try {
    const workers  = await Worker.find();
    const payouts  = await Payout.find();
    const active   = workers.filter(w => w.status === 'active').length;
    const flagged  = workers.filter(w => w.status === 'flagged').length;
    const suspended= workers.filter(w => w.status === 'suspended').length;
    const paid     = payouts.filter(p => p.status === 'paid');
    const held     = payouts.filter(p => p.status === 'held').length;
    const high     = workers.filter(w => w.gtsTier === 'high').length;
    const medium   = workers.filter(w => w.gtsTier === 'medium').length;
    const low      = workers.filter(w => w.gtsTier === 'low').length;
    const avg      = workers.length ? Math.round(workers.reduce((s,w)=>s+w.gtsScore,0)/workers.length) : 0;
    res.json({
      totalWorkers:active+flagged+suspended, activeWorkers:active, flaggedWorkers:flagged, suspendedWorkers:suspended,
      totalPayouts:paid.length, totalDisbursed:paid.reduce((s,p)=>s+p.amount,0), heldPayouts:held,
      gtsDistribution:{high,medium,low}, avgGts:avg,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/workers', async (_, res) => {
  try {
    const workers = await Worker.find().select('-pin');
    res.json(workers);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/workers/:id', async (req, res) => {
  try {
    const w = await Worker.findOne({ id: req.params.id });
    if (!w) return res.status(404).json({ error: 'Worker not found' });
    const { status } = req.body;
    if (status) {
      w.status = status;
      if (status === 'suspended') w.compensationEligible = false;
    }
    await w.save();
    const obj = w.toObject(); delete obj.pin;
    res.json(obj);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/payouts', async (_, res) => {
  try {
    const payouts = await Payout.find().sort({ createdAt: -1 });
    const total   = payouts.filter(p => p.status === 'paid').reduce((s,p)=>s+p.amount,0);
    res.json({ payouts, total, count: payouts.length });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/payouts/:id', async (req, res) => {
  try {
    const p = await Payout.findOne({ id: req.params.id });
    if (!p) return res.status(404).json({ error: 'Payout not found' });
    const { action } = req.body;
    const w = await Worker.findOne({ id: p.workerId });
    const settings = await AdminSettings.findOne({ key: 'singleton' });
    if (action === 'approve') {
      p.status = 'paid';
      if (w) { w.weeklyEarnings += p.amount; w.gtsScore = Math.min(900, w.gtsScore+5); w.gtsTier = calcGtsTier(w.gtsScore, settings); await w.save(); }
    } else if (action === 'reject') {
      p.status = 'rejected';
      if (w) { w.gtsScore = Math.max(300, w.gtsScore-20); w.gtsTier = calcGtsTier(w.gtsScore, settings); await w.save(); }
    }
    await p.save();
    res.json(p);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/fraud', async (_, res) => {
  try {
    res.json(await FraudFlag.find().sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/fraud/:id', async (req, res) => {
  try {
    const flag = await FraudFlag.findOne({ id: req.params.id });
    if (!flag) return res.status(404).json({ error: 'Flag not found' });
    const { status } = req.body;
    const settings = await AdminSettings.findOne({ key: 'singleton' });
    flag.status = status;
    await flag.save();
    const w = await Worker.findOne({ id: flag.workerId });
    if (w) {
      if (status === 'confirmed') {
        w.gtsScore = Math.max(300, w.gtsScore-80); w.gtsTier = calcGtsTier(w.gtsScore, settings); w.status = 'suspended';
        await Payout.updateMany({ workerId:w.id, status:'held' }, { status:'rejected' });
      } else if (status === 'cleared') {
        w.gtsScore = Math.min(900, w.gtsScore+40); w.gtsTier = calcGtsTier(w.gtsScore, settings); w.status = 'active';
        const held = await Payout.find({ workerId:w.id, status:'held' });
        for (const p of held) { p.status = 'paid'; await p.save(); w.weeklyEarnings += p.amount; }
      }
      await w.save();
    }
    res.json({ flag, worker: w ? (({ pin, ...rest }) => rest)(w.toObject()) : null });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/alerts', async (_, res) => {
  try {
    res.json(await AdminAlert.find().sort({ createdAt: -1 }));
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/alerts/:id', async (req, res) => {
  try {
    const alert = await AdminAlert.findOne({ id: req.params.id });
    if (!alert) return res.status(404).json({ error: 'Alert not found' });
    alert.active = false;
    await alert.save();
    res.json(alert);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/actuary', async (_, res) => {
  try {
    const workers  = await Worker.find();
    const payouts  = await Payout.find({ status:'paid' });
    const totalClaims   = payouts.reduce((s,p)=>s+p.amount,0);
    const totalPremiums = 2400 + workers.reduce((s,w)=>s+w.premium,0);
    const bcr           = totalPremiums > 0 ? +(totalClaims/totalPremiums).toFixed(3) : 0;
    const cities        = [...new Set(workers.map(w=>w.location))];
    const cityPools     = cities.map(city => {
      const pool   = workers.filter(w=>w.location===city);
      const risk   = CITY_RISK[city] || {};
      const riskSum= (risk.rain||0)+(risk.pollution||0)+(risk.lowOrders||0)+(risk.curfew||0);
      return {
        city, pool:risk.pool||`${city} Pool`,
        enrolled:pool.length, eligible:pool.filter(w=>w.activeDeliveryDays>=7).length,
        avgPremium:pool.length ? Math.round(pool.reduce((s,w)=>s+w.premium,0)/pool.length) : 0,
        riskScore:risk.riskScore||Math.round(riskSum*100),
        status:riskSum<0.30?'balanced':riskSum<0.50?'elevated':'high',
      };
    });
    const eligible        = workers.filter(w=>w.activeDeliveryDays>=7).length;
    const affectedWorkers = workers.filter(w=>w.location==='Mumbai'||w.location==='Chennai');
    const stressExtra     = affectedWorkers.length*2*300;
    const stressBcr       = totalPremiums>0 ? +((totalClaims+stressExtra)/totalPremiums).toFixed(3) : 0;
    res.json({
      bcr, lossRatio:+(bcr*100).toFixed(1), totalClaims, totalPremiums,
      bcrTarget:{min:0.55,max:0.70}, bcrStatus:bcr<0.55?'under':bcr<=0.70?'healthy':'over',
      cityPools,
      enrollment:{ total:workers.length, eligible, ineligible:workers.length-eligible, flagged:workers.filter(w=>w.status==='flagged').length, suspended:workers.filter(w=>w.status==='suspended').length },
      stressScenario:{ label:'14-Day Monsoon', affectedCities:['Mumbai','Chennai'], affectedWorkers:affectedWorkers.length, extraClaims:stressExtra, projectedBcr:stressBcr, projectedLossRatio:+(stressBcr*100).toFixed(1), capitalAlert:stressBcr>0.85 },
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.get('/api/admin/settings', async (_, res) => {
  try {
    const s = await AdminSettings.findOne({ key: 'singleton' });
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch('/api/admin/settings', async (req, res) => {
  try {
    const s = await AdminSettings.findOne({ key: 'singleton' });
    const { triggers, gigtrust, premium, platform } = req.body;
    if (triggers) for (const [k,v] of Object.entries(triggers)) if (s.triggers[k]) Object.assign(s.triggers[k], v);
    if (gigtrust) Object.assign(s.gigtrust, gigtrust);
    if (premium)  Object.assign(s.premium, premium);
    if (platform) Object.assign(s.platform, platform);
    s.markModified('triggers'); s.markModified('gigtrust'); s.markModified('premium'); s.markModified('platform');
    await s.save();
    res.json(s);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post('/api/admin/simulate', async (req, res) => {
  try {
    const { type, zone } = req.body;
    const settings = await AdminSettings.findOne({ key: 'singleton' });
    if (settings && !settings.platform.active) return res.status(503).json({ error: 'Platform is offline.' });
    const triggerCfg = settings?.triggers?.[type];
    if (triggerCfg && !triggerCfg.enabled) return res.status(400).json({ error: `Trigger "${type}" is disabled in Settings.` });

    const TRIGGER_META = {
      rain:      { title:'Rain Alert',     workerMsg:"Heavy rainfall in your zone — checking your eligibility." },
      lowOrders: { title:'Low Demand',     workerMsg:'Demand drop detected in your zone — verify to claim compensation.' },
      curfew:    { title:'Zone Curfew',    workerMsg:'Zone restriction detected — payout being processed.' },
      outage:    { title:'Platform Issue', workerMsg:'Platform outage detected — verifying your eligibility.' },
    };
    const meta         = TRIGGER_META[type] || TRIGGER_META.lowOrders;
    const simZone      = zone || 'All Zones';
    const now          = nowTime();
    const isAutoPay    = triggerCfg ? triggerCfg.autoPay : (type === 'rain' || type === 'curfew');
    const payoutAmount = triggerCfg ? triggerCfg.payoutAmount : (type === 'rain' ? 300 : 250);
    const alertType    = type === 'outage' ? 'lowOrders' : type;

    const newAdminAlert = new AdminAlert({
      id: genId('sim'), type: alertType,
      zone:`${simZone} [SIMULATED]`,
      severity: type === 'rain' || type === 'curfew' ? 'high' : 'medium',
      message:`[SIMULATED] ${meta.title} — workers evaluated for payout eligibility.`,
      time:now, active:true,
    });
    await newAdminAlert.save();

    const workers = await Worker.find({ status: { $ne: 'suspended' } });
    for (const w of workers) {
      const workerAlert = new WorkerAlert({
        id: genId('wa'), workerId:w.id, type:alertType,
        title:meta.title, message:meta.workerMsg,
        badge: isAutoPay ? 'AUTO ON' : 'VERIFY',
      });
      await workerAlert.save();
      if (isAutoPay) {
        const uwTier = getUnderwritingTier(w);
        const gtsOk  = w.gtsTier !== 'low' || !(settings?.platform?.fraudAutoSuspend);
        if (gtsOk && uwTier !== 'restricted') {
          const payout = new Payout({
            id: genId('ap'), workerId:w.id, workerName:w.name,
            platform:w.platform, amount:payoutAmount, reason:triggerCfg?.label||type,
            type, date:'Today', time:now, auto:true, status:'paid',
          });
          await payout.save();
          w.weeklyEarnings += payoutAmount;
          await w.save();
        } else {
          const heldPayout = new Payout({
            id:genId('ap'), workerId:w.id, workerName:w.name,
            platform:w.platform, amount:payoutAmount, reason:triggerCfg?.label||type,
            type, date:'Today', time:now, auto:false, status:'held',
          });
          await heldPayout.save();
        }
      } else {
        w.compensationEligible = true;
        await w.save();
      }
    }

    res.json({ success:true, alert:newAdminAlert, autoPaid:isAutoPay, payoutAmount });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

// ── TEMP SEED ENDPOINT (remove after first use) ────────────
app.post('/api/seed-demo', async (req, res) => {
  const secret = req.headers['x-seed-secret'];
  if (secret !== 'instasure-seed-2024') return res.status(403).json({ error: 'forbidden' });
  try {
    const { Worker, Payout, FraudFlag, AdminAlert, WorkerAlert, AdminSettings } = require('./models');
    const crypto = require('crypto');
    function hashPin(pin) { return crypto.createHash('sha256').update(String(pin)).digest('hex').slice(0, 16); }

    const SEED_WORKERS = [
      { id:'u1', name:'Rahul Sharma',   initials:'RS', phone:'9100000001', pin:hashPin('1234'), platform:'Swiggy',  location:'Chennai',   zone:'Velachery',       gtsScore:742, gtsTier:'high',   status:'active',  weeklyEarnings:950,  premium:40, lastActive:'2 min ago',  upi:'rahul@upi',  workHours:'10 AM – 10 PM', memberSince:'Jan 2024', activeDeliveryDays:21, policyNumber:'ISP-2024-0001', policyStart:'6 Jan 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:800, lowOrders:500, pollution:200, curfew:300}, compensationEligible:true },
      { id:'u2', name:'Priya Nair',     initials:'PN', phone:'9100000002', pin:hashPin('1234'), platform:'Zomato',  location:'Mumbai',    zone:'Andheri West',    gtsScore:612, gtsTier:'medium', status:'active',  weeklyEarnings:650,  premium:35, lastActive:'15 min ago', upi:'priya@upi',  workHours:'8 AM – 8 PM',   memberSince:'Mar 2024', activeDeliveryDays:14, policyNumber:'ISP-2024-0002', policyStart:'4 Mar 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:1000,lowOrders:400, pollution:100, curfew:200} },
      { id:'u3', name:'Arjun Mehta',    initials:'AM', phone:'9100000003', pin:hashPin('1234'), platform:'Zepto',   location:'Bangalore', zone:'Koramangala',     gtsScore:481, gtsTier:'low',    status:'flagged', weeklyEarnings:0,    premium:25, lastActive:'1 hr ago',   upi:'arjun@upi',  workHours:'9 AM – 9 PM',   memberSince:'May 2024', activeDeliveryDays:5,  policyNumber:'ISP-2024-0003', policyStart:'2 May 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:500, lowOrders:300, pollution:100, curfew:200} },
      { id:'u4', name:'Deepa Krishnan', initials:'DK', phone:'9100000004', pin:hashPin('1234'), platform:'Swiggy',  location:'Chennai',   zone:'Anna Nagar',      gtsScore:815, gtsTier:'high',   status:'active',  weeklyEarnings:1100, premium:45, lastActive:'5 min ago',  upi:'deepa@upi',  workHours:'10 AM – 10 PM', memberSince:'Feb 2024', activeDeliveryDays:28, policyNumber:'ISP-2024-0004', policyStart:'1 Feb 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:900, lowOrders:600, pollution:200, curfew:300} },
      { id:'u5', name:'Ravi Teja',      initials:'RT', phone:'9100000005', pin:hashPin('1234'), platform:'Amazon',  location:'Hyderabad', zone:'Gachibowli',      gtsScore:558, gtsTier:'medium', status:'active',  weeklyEarnings:580,  premium:30, lastActive:'30 min ago', upi:'ravi@upi',   workHours:'7 AM – 7 PM',   memberSince:'Apr 2024', activeDeliveryDays:18, policyNumber:'ISP-2024-0005', policyStart:'1 Apr 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:600, lowOrders:400, pollution:200, curfew:200} },
      { id:'u6', name:'Sneha Patel',    initials:'SP', phone:'9100000006', pin:hashPin('1234'), platform:'Zomato',  location:'Pune',      zone:'Koregaon Park',   gtsScore:378, gtsTier:'low',    status:'flagged', weeklyEarnings:0,    premium:20, lastActive:'3 hr ago',   upi:'sneha@upi',  workHours:'11 AM – 11 PM', memberSince:'Jun 2024', activeDeliveryDays:4,  policyNumber:'ISP-2024-0006', policyStart:'3 Jun 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:500, lowOrders:300, pollution:100, curfew:100} },
      { id:'u7', name:'Karan Singh',    initials:'KS', phone:'9100000007', pin:hashPin('1234'), platform:'Swiggy',  location:'Delhi',     zone:'Connaught Place', gtsScore:724, gtsTier:'high',   status:'active',  weeklyEarnings:820,  premium:40, lastActive:'8 min ago',  upi:'karan@upi',  workHours:'10 AM – 10 PM', memberSince:'Jan 2024', activeDeliveryDays:19, policyNumber:'ISP-2024-0007', policyStart:'8 Jan 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:400, lowOrders:500, pollution:1000,curfew:400} },
      { id:'u8', name:'Meera Iyer',     initials:'MI', phone:'9100000008', pin:hashPin('1234'), platform:'Zepto',   location:'Bangalore', zone:'Indiranagar',     gtsScore:639, gtsTier:'medium', status:'active',  weeklyEarnings:710,  premium:35, lastActive:'22 min ago', upi:'meera@upi',  workHours:'9 AM – 9 PM',   memberSince:'Mar 2024', activeDeliveryDays:16, policyNumber:'ISP-2024-0008', policyStart:'5 Mar 2024',  policyRenewal:'8 Apr 2026', coverage:{rain:700, lowOrders:500, pollution:100, curfew:200} },
    ];
    const SEED_PAYOUTS = [
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
    const SEED_FRAUD = [
      { id:'f1', workerId:'u3', workerName:'Arjun Mehta', platform:'Zepto',  location:'Bangalore', reason:'GPS spoofing detected', detail:'Static coordinates for 47 min during claimed active delivery', confidence:87, date:'Today',     gtsScore:481, status:'open' },
      { id:'f2', workerId:'u6', workerName:'Sneha Patel', platform:'Zomato', location:'Pune',      reason:'Claim pattern anomaly', detail:'4 low-order claims in 6 days — 3× peer average for this zone',  confidence:72, date:'Yesterday', gtsScore:378, status:'open' },
    ];
    const SEED_ADMIN_ALERTS = [
      { id:'aa1', type:'rain',      zone:'Velachery, Chennai',     severity:'high',   message:'Heavy rainfall — 14 workers affected, auto-payouts triggered', time:'11:40 AM',   active:true  },
      { id:'aa2', type:'lowOrders', zone:'Andheri West, Mumbai',   severity:'medium', message:'Demand drop >50% detected — 3 workers pending verification',   time:'9:00 PM',    active:true  },
      { id:'aa3', type:'curfew',    zone:'Koramangala, Bangalore', severity:'low',    message:'Zone restriction lifted — coverage resumed normally',           time:'Mon 14 Jan', active:false },
    ];
    const SEED_WORKER_ALERTS = [
      { id:'wa1', workerId:'u1', type:'rain', title:'Rain today', message:"Orders may slow. You're fully covered.", badge:'AUTO ON' },
    ];
    const SEED_ADMIN_SETTINGS = {
      key: 'singleton',
      triggers: { rain:{enabled:true,autoPay:true,payoutAmount:300,label:'Rain'}, lowOrders:{enabled:true,autoPay:false,payoutAmount:200,label:'Low Orders'}, curfew:{enabled:true,autoPay:true,payoutAmount:250,label:'Curfew'}, outage:{enabled:false,autoPay:false,payoutAmount:150,label:'Platform Outage'} },
      gigtrust: { highMin:700, mediumMin:500 },
      premium:  { minPremium:20, maxPremium:50, coverageDivisor:1800 },
      platform: { active:true, maintenanceMode:false, fraudAutoSuspend:true },
    };

    await Promise.all([Worker.deleteMany({}), Payout.deleteMany({}), FraudFlag.deleteMany({}), AdminAlert.deleteMany({}), WorkerAlert.deleteMany({}), AdminSettings.deleteMany({})]);
    await Worker.insertMany(SEED_WORKERS);
    await Payout.insertMany(SEED_PAYOUTS);
    await FraudFlag.insertMany(SEED_FRAUD);
    await AdminAlert.insertMany(SEED_ADMIN_ALERTS);
    await WorkerAlert.insertMany(SEED_WORKER_ALERTS);
    await AdminSettings.create(SEED_ADMIN_SETTINGS);
    res.json({ success:true, message:'Seeded 8 workers, 9 payouts, 2 fraud flags, 3 admin alerts' });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(PORT, () => {
  console.log(`\n🛡  InstaSure Backend (MongoDB) → http://localhost:${PORT}\n`);
  console.log('   Demo login: phone 9100000001, PIN 1234 (Rahul Sharma)');
  console.log('   Admin login: admin@instasure.com / Admin@123\n');
});
