const BASE = '/api/admin';

export async function fetchStats() {
  const r = await fetch(`${BASE}/stats`);
  return r.json();
}
export async function fetchWorkers() {
  const r = await fetch(`${BASE}/workers`);
  return r.json();
}
export async function patchWorker(id, data) {
  const r = await fetch(`${BASE}/workers/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function fetchPayouts() {
  const r = await fetch(`${BASE}/payouts`);
  return r.json();
}
export async function patchPayout(id, action) {
  const r = await fetch(`${BASE}/payouts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action }),
  });
  return r.json();
}
export async function fetchFraud() {
  const r = await fetch(`${BASE}/fraud`);
  return r.json();
}
export async function resolveFraudFlag(id, status) {
  const r = await fetch(`${BASE}/fraud/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status }),
  });
  return r.json();
}
export async function fetchAlerts() {
  const r = await fetch(`${BASE}/alerts`);
  return r.json();
}
export async function dismissAlert(id) {
  const r = await fetch(`${BASE}/alerts/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
  });
  return r.json();
}
export async function fetchActuary() {
  const r = await fetch(`${BASE}/actuary`);
  return r.json();
}
export async function fetchAdminSettings() {
  const r = await fetch(`${BASE}/settings`);
  return r.json();
}
export async function patchAdminSettings(data) {
  const r = await fetch(`${BASE}/settings`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function postSimulate(type, zone) {
  const r = await fetch(`${BASE}/simulate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type, zone }),
  });
  return r.json();
}
