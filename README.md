# AIS — Adaptive Income Shield

A full-stack mobile-first app for delivery workers (Swiggy, Zomato) that
automatically compensates income loss from rain, low orders, curfews, and
pollution days.

---

## Monorepo Structure

```
ais/
├── backend/          Node.js + Express REST API
├── web/              React + Vite (phone-shell UI, Framer Motion)
└── mobile/           React Native + Expo SDK 54
```

---

## Quick Start

### 1. Backend
```bash
cd backend
npm install
npm run dev
# → http://localhost:3001
```

API endpoints:
- GET  /api/dashboard
- GET  /api/user
- GET  /api/coverage
- PATCH /api/coverage   (update slider values)
- GET  /api/activity
- GET  /api/payouts
- GET  /api/alerts
- GET  /api/health

### 2. Web App
```bash
cd web
npm install
npm run dev
# → http://localhost:5173  (proxies /api to :3001)
```

5 animated screens: Home · Coverage · Activity · Payouts · Profile

### 3. Mobile (Expo SDK 54)
```bash
cd mobile
npm install
npx expo start
# Press 'a' for Android emulator
# Scan QR with Expo Go for physical device
```

NOTE: For physical device, edit mobile/src/api.js and change BASE to your
machine's local IP, e.g. http://192.168.1.42:3001/api

---

## Design System

Fonts: DM Serif Display (italic labels) · Sora 900 (hero numbers) · DM Mono (status)
Background: Architectural grid lines — no blobs, no AI gradients
Sliders: 4px track · dark circle thumb · per-color ring · Apple feel
Colors: Coral (brand) · Blue (rain) · Green (money) · Amber (caution) · Purple (curfew)

---

## Run Everything

```bash
# Backend + Web together
npm install && npm run dev

# Mobile separately
cd mobile && npx expo start
```

## Tech Stack
- Backend: Node.js 22 · Express 4 · CORS · Morgan
- Web: React 18 · Vite 5 · Framer Motion 11
- Mobile: React Native · Expo SDK 54 · Expo Router 4 · Reanimated 3
