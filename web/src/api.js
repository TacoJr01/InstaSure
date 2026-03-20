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
