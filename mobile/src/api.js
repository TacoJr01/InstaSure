// Change this to your machine's local IP when testing on device
const BASE = 'http://localhost:3001/api';

async function get(path) {
  try {
    const r = await fetch(`${BASE}${path}`);
    return r.json();
  } catch {
    return null;
  }
}

async function patch(path, body) {
  try {
    const r = await fetch(`${BASE}${path}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return r.json();
  } catch {
    return null;
  }
}

export const api = {
  dashboard: () => get('/dashboard'),
  coverage:  () => get('/coverage'),
  patchCoverage: (data) => patch('/coverage', data),
  activity:  () => get('/activity'),
  payouts:   () => get('/payouts'),
  user:      () => get('/user'),
};

// ── MOCK DATA (used as fallback) ──────────────────────────
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
      { day: 'Weekend', label: 'Looks good', status: 'good' },
    ],
  },
  payouts: {
    total: 950,
    count: 4,
    payouts: [
      { id: 'p1', amount: 300, reason: 'Rain payout', type: 'rain', date: 'Today', time: '11:42 AM' },
      { id: 'p2', amount: 200, reason: 'Low Orders', type: 'lowOrders', date: 'Yesterday', time: '9:05 PM' },
      { id: 'p3', amount: 300, reason: 'Rain payout', type: 'rain', date: 'Mon 14 Jan', time: '2:30 PM' },
      { id: 'p4', amount: 150, reason: 'Low Orders', type: 'lowOrders', date: 'Sun 13 Jan', time: '8:10 PM' },
    ],
  },
};
