const BASE = '/api';

function token() {
  return localStorage.getItem('ais_token') || '';
}
function authHeaders() {
  return { 'Content-Type': 'application/json', 'x-auth-token': token() };
}
function getHeaders() {
  return { 'x-auth-token': token() };
}

export async function postLogin(phone, pin) {
  const r = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phone, pin }),
  });
  return r.json();
}
export async function postRegister(data) {
  const r = await fetch(`${BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function postLogout() {
  const r = await fetch(`${BASE}/auth/logout`, {
    method: 'POST',
    headers: authHeaders(),
  });
  return r.json();
}
export async function fetchMe() {
  const r = await fetch(`${BASE}/auth/me`, { headers: getHeaders() });
  return r.json();
}
export async function fetchDashboard() {
  const r = await fetch(`${BASE}/dashboard`, { headers: getHeaders() });
  return r.json();
}
export async function fetchCoverage() {
  const r = await fetch(`${BASE}/coverage`, { headers: getHeaders() });
  return r.json();
}
export async function patchCoverage(data) {
  const r = await fetch(`${BASE}/coverage`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function fetchActivity() {
  const r = await fetch(`${BASE}/activity`, { headers: getHeaders() });
  return r.json();
}
export async function fetchPayouts() {
  const r = await fetch(`${BASE}/payouts`, { headers: getHeaders() });
  return r.json();
}
export async function fetchUser() {
  const r = await fetch(`${BASE}/user`, { headers: getHeaders() });
  return r.json();
}
export async function fetchGigTrust() {
  const r = await fetch(`${BASE}/gigtrust`, { headers: getHeaders() });
  return r.json();
}
export async function postVerify(data) {
  const r = await fetch(`${BASE}/verify`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}
export async function fetchPolicy() {
  const r = await fetch(`${BASE}/policy`, { headers: getHeaders() });
  return r.json();
}
export async function fetchPremiumBreakdown() {
  const r = await fetch(`${BASE}/premium-breakdown`, { headers: getHeaders() });
  return r.json();
}
export async function fetchPremiumStatus() {
  const r = await fetch(`${BASE}/premium-status`, { headers: getHeaders() });
  return r.json();
}
export async function postPayment(pin) {
  const r = await fetch(`${BASE}/payment`, {
    method: 'POST',
    headers: authHeaders(),
    body: JSON.stringify({ pin }),
  });
  return r.json();
}
export async function fetchSettings() {
  const r = await fetch(`${BASE}/settings`, { headers: getHeaders() });
  return r.json();
}
export async function patchSettings(data) {
  const r = await fetch(`${BASE}/settings`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify(data),
  });
  return r.json();
}
