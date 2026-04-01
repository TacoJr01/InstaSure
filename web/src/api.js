const BASE = '/api';

export async function fetchDashboard() {
  const r = await fetch(`${BASE}/dashboard`);
  return r.json();
}
export async function fetchCoverage() {
  const r = await fetch(`${BASE}/coverage`);
  return r.json();
}
export async function patchCoverage(data) {
  const r = await fetch(`${BASE}/coverage`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function fetchActivity() {
  const r = await fetch(`${BASE}/activity`);
  return r.json();
}
export async function fetchPayouts() {
  const r = await fetch(`${BASE}/payouts`);
  return r.json();
}
export async function fetchUser() {
  const r = await fetch(`${BASE}/user`);
  return r.json();
}
export async function fetchGigTrust() {
  const r = await fetch(`${BASE}/gigtrust`);
  return r.json();
}
export async function postVerify(data) {
  const r = await fetch(`${BASE}/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function postOnboard(data) {
  const r = await fetch(`${BASE}/onboard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function fetchPremiumStatus() {
  const r = await fetch(`${BASE}/premium-status`);
  return r.json();
}
export async function postPayment(pin) {
  const r = await fetch(`${BASE}/payment`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pin }),
  });
  return r.json();
}
export async function fetchSettings() {
  const r = await fetch(`${BASE}/settings`);
  return r.json();
}
export async function patchSettings(data) {
  const r = await fetch(`${BASE}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
