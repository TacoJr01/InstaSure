import * as SecureStore from 'expo-secure-store';

const BASE = 'https://ais-backend-production-a9a4.up.railway.app/api';

async function token() {
  return SecureStore.getItemAsync('ais_token');
}

async function headers(auth = false) {
  const h = { 'Content-Type': 'application/json' };
  if (auth) {
    const t = await token();
    if (t) h['x-auth-token'] = t;
  }
  return h;
}

async function get(path) {
  try {
    const r = await fetch(`${BASE}${path}`, { headers: await headers(true) });
    return r.json();
  } catch { return null; }
}

async function post(path, body) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: await headers(false),
      body: JSON.stringify(body),
    });
    return r.json();
  } catch { return null; }
}

async function patch(path, body) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: await headers(true),
      body: JSON.stringify(body),
    });
    return r.json();
  } catch { return null; }
}

export const api = {
  // Auth
  login:    (phone, pin) => post('/auth/login', { phone, pin }),
  register: (data)       => post('/auth/register', data),
  me:       ()           => get('/me'),
  logout:   ()           => post('/auth/logout', {}),

  // App
  dashboard:     () => get('/dashboard'),
  coverage:      () => get('/coverage'),
  patchCoverage: (data) => patch('/coverage', data),
  activity:      () => get('/activity'),
  payouts:       () => get('/payouts'),
  user:          () => get('/user'),
};

export const storage = {
  setToken: (t) => SecureStore.setItemAsync('ais_token', t),
  getToken: ()  => SecureStore.getItemAsync('ais_token'),
  clear:    ()  => SecureStore.deleteItemAsync('ais_token'),
};

// ── MOCK DATA (fallback when API unavailable) ─────────────
export const MOCK = {
  dashboard: {
    user: { name: 'Rahul Sharma', initials: 'RS', platform: 'Swiggy', location: 'Chennai', zone: 'Velachery', upi: 'rahul@upi', workHours: '10 AM – 10 PM', memberSince: 'Jan 2024' },
    weeklyProtected: 1240,
    premium: 40,
    coverageLimit: 1500,
    weeklyUsagePct: 83,
    protection: { rain: 'active', lowOrders: 'active', pollution: 'watching', curfew: 'active' },
    lastPayout: { amount: 300, reason: 'Rain', date: 'Today', time: '11:42 AM' },
    alerts: [{ id: 'a1', type: 'rain', title: 'Rain today', message: "Orders may slow. You're covered.", badge: 'AUTO ON' }],
    compensationEligible: true,
  },
  coverage: { rain: 800, lowOrders: 500, pollution: 200, curfew: 300 },
  activity: {
    normalOrders: 10, todayOrders: 4, dropPercent: 60, compensationEligible: true,
    week: [
      { day: 'Mon', orders: 9 }, { day: 'Tue', orders: 10 },
      { day: 'Wed', orders: 8 }, { day: 'Thu', orders: 11 }, { day: 'Fri', orders: 4 },
    ],
    forecast: [
      { day: 'Tomorrow', label: 'May be slow', status: 'slow' },
      { day: 'Weekend',  label: 'Looks good',  status: 'good' },
    ],
  },
  payouts: {
    total: 950, count: 4,
    payouts: [
      { id: 'p1', amount: 300, reason: 'Rain payout',  type: 'rain',      date: 'Today',        time: '11:42 AM' },
      { id: 'p2', amount: 200, reason: 'Low Orders',   type: 'lowOrders', date: 'Yesterday',    time: '9:05 PM'  },
      { id: 'p3', amount: 300, reason: 'Rain payout',  type: 'rain',      date: 'Mon 14 Jan',   time: '2:30 PM'  },
      { id: 'p4', amount: 150, reason: 'Low Orders',   type: 'lowOrders', date: 'Sun 13 Jan',   time: '8:10 PM'  },
    ],
  },
};
