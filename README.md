# InstaSure

### AI-Powered, Zero-Touch, Hyper-Local Insurance for Gig Workers

> InstaSure predicts income loss, validates authenticity, and pays gig workers instantly — without requiring claims.

---
Check out the Deployed Websites

- [User Dashboard](https://insta-sure-web.vercel.app)
- [Admin Dashboard](https://ais-admin-ten.vercel.app/)


## 🧩 Problem Statement

India's gig economy (Swiggy, Zomato, Zepto, Amazon) runs on volatile, unpredictable income. Delivery workers lose **20–30% of their weekly earnings** due to disruptions they have no control over:

- **Environmental** — rain, heat, pollution
- **Social** — curfews, strikes, zone closures
- **Invisible** — demand drops, platform outages

### Why Current Insurance Fails

| Problem | Detail |
|---|---|
| Reactive | Claim-based, not proactive |
| Slow | Payouts take days or weeks |
| Incomplete | Covers only visible events |
| Blind | Cannot detect demand-side income loss |
| Weak | Basic fraud protection only |

### Key Insight

> The biggest income losses are **invisible** — caused by demand fluctuations, not just weather or closures. Traditional insurance cannot detect or respond to this.

---

## 💡 Our Solution

**InstaSure** is an AI-powered parametric insurance platform built specifically for gig workers. It:

- **Predicts** disruption risk before it happens
- **Dynamically adjusts** weekly coverage and pricing
- **Automatically compensates** workers for income loss
- **Validates authenticity** via the GigTrust Score
- Requires **zero manual claims**

---

## 💰 Weekly Premium Model

Premiums are strictly **weekly** (₹20–₹50/week), aligned with gig workers' earning cycles.

### Pricing Formula

```
premium_base = Σ(trigger_probability × coverage_payout) × actuarial_load

Where:
  trigger_probability  = weekly city risk (from CITY_RISK table or MOCK_HISTORICAL_RISK)
  coverage_payout      = per-event payout amount selected by worker (₹200–₹1000)
  actuarial_load       = 0.32 (operating expenses + profit margin)

Adjustments:
  × GTS multiplier     = high: 0.85 | medium: 1.0 | low: 1.25
  × UW tier loading    = preferred: 1.0 | standard: 1.0 | restricted: 1.30

Final cap: max(₹20, min(₹50, premium))
```

### Pricing Example (Rahul, Chennai, High GTS)

| Trigger     | City Prob | Coverage | Expected |
|-------------|-----------|----------|----------|
| Rain        | 8%        | ₹800     | ₹64      |
| Pollution   | 3%        | ₹200     | ₹6       |
| Low Orders  | 12%       | ₹500     | ₹60      |
| Curfew      | 5%        | ₹300     | ₹15      |
| **Total**   |           |          | **₹145** |

`₹145 × 0.85 (high GTS) × 1.0 (preferred UW) × 0.32 (load) = ₹39/week`

### Audit Logging

Every premium calculation is logged:
```
[PRICING] worker=Rahul Sharma city=Chennai gts=high(×0.85) uwTier=preferred(×1.0) expectedLoss=₹145 premium=₹39
```

---

## 🏗️ Underwriting Tiers

Two independent tier systems apply:

### 1. GTS Tier (Reliability / Fraud Risk)
Based on GigTrust Score (300–900):

| Tier   | Score Range | Premium Multiplier |
|--------|-------------|-------------------|
| High   | 700–900     | ×0.85 (discount)  |
| Medium | 500–699     | ×1.00             |
| Low    | <500        | ×1.25 (loading)   |

### 2. Activity Tier (Engagement / Underwriting Risk)
Based on `activity_days_last_30` (same as `activeDeliveryDays` field):

| Tier       | Active Days (30d) | Premium Multiplier | Effect                        |
|------------|------------------|--------------------|-------------------------------|
| Preferred  | ≥15 days         | ×1.00              | Full coverage at base premium |
| Standard   | 5–14 days        | ×1.00              | Full coverage at base premium |
| Restricted | <5 days          | ×1.30              | 30% surcharge, held payouts   |

**Restricted workers:** auto-payouts are held for manual review. GPS + selfie verification required for all claims.

---

## ⚡ Parametric Trigger System

### Trigger Configuration

| Trigger     | Threshold                          | Default Payout | Auto-Pay |
|-------------|-----------------------------------|----------------|----------|
| Rain        | Heavy rainfall in worker zone      | ₹300           | Yes      |
| Low Orders  | ≥50% demand drop vs 7-day average  | ₹200           | No (GPS + selfie verify) |
| Curfew      | Zone geo-restriction detected      | ₹250           | Yes      |
| Pollution   | AQI threshold breach               | ₹200           | No       |

### Hyperlocal Validation

Each trigger is validated against:
- Worker's registered city (city-level risk pool)
- Worker's zone (hyperlocal confirmation)
- Worker's active hours (e.g. rain at 3am doesn't trigger for 10am–10pm worker)

### Historical Risk Data

Precomputed weekly probabilities per city (source: MOCK_HISTORICAL_RISK, simulated from IMD/SAFAR 2022–2023):

| City      | Rain | Pollution | Low Orders | Curfew | Risk Score |
|-----------|------|-----------|------------|--------|------------|
| Delhi     | 6%   | 25%       | 12%        | 8%     | 82         |
| Mumbai    | 18%  | 4%        | 10%        | 5%     | 78         |
| Chennai   | 8%   | 3%        | 12%        | 5%     | 72         |
| Bangalore | 10%  | 4%        | 15%        | 4%     | 68         |
| Hyderabad | 7%   | 5%        | 14%        | 3%     | 62         |
| Pune      | 9%   | 3%        | 11%        | 3%     | 58         |

> **Integration note:** Replace `annualTriggerDays` in `MOCK_HISTORICAL_RISK` with live API values (OpenWeather, SAFAR, civic APIs) without any refactoring.

---

## 🧠 GigTrust Score (GTS)

A real-time reliability score (300–900) — like a credit score for gig behavior.

### Score Components
- Work consistency
- GPS integrity
- Behavioral patterns
- Claim history
- Peer comparison

### Payout Mode by GTS

| Score Range | Action |
|-------------|--------|
| 700–900 | Instant auto-payout |
| 500–699 | Partial / delayed payout |
| <500    | Hold → manual fraud review |

---

## 🚨 Claim Automation Pipeline

**Zero-touch flow — no manual claim filing, no document upload:**

```
1. Trigger Detection     → threshold breach detected (weather/demand API)
2. Policy Validation     → check active coverage, active days ≥7, not suspended
3. Fraud Check           → GTS tier + activity tier + GPS spoofing detection
4. Payout Decision       → auto-pay (high/medium GTS + preferred/standard UW)
                         → hold (low GTS or restricted UW)
5. UPI Transfer          → instant simulated UPI payout
```

### Fraud Checks Applied
- GPS coordinate validation (static coords → flag)
- Platform activity cross-validation
- Duplicate claim prevention (same trigger, same worker, same day)
- Peer-based zone validation (fraud affects subset; real events affect whole zone)
- Claim pattern analysis (>3 claims/week vs zone peers → flag)

### Claim Audit Log Format
```
[CLAIM] AUTO-PAID  | worker=Rahul Sharma trigger=rain     amount=₹300 gts=742 uwTier=preferred
[CLAIM] HELD       | worker=Arjun Mehta  trigger=rain     amount=₹300 gts=481 uwTier=standard  reason=fraud-check
[CLAIM] APPROVED(admin) | payout=ap8 worker=Arjun Mehta trigger=rain amount=₹300
[CLAIM] REJECTED(admin) | payout=ap9 worker=Sneha Patel trigger=lowOrders gts_impact=-20
```

---

## 📊 Actuarial Model

### BCR (Burning Cost Rate)
```
BCR = total_claims / total_premiums
```

| BCR Range | Status     | Action                              |
|-----------|------------|-------------------------------------|
| <0.55     | Under      | Premiums may be too high            |
| 0.55–0.70 | Healthy    | Target zone                         |
| 0.71–0.85 | Elevated   | Monitor; consider premium review    |
| >0.85     | Over       | **Suspend new enrollments**         |

### Stress Scenario: 14-Day Monsoon
- Affected cities: Mumbai + Chennai
- Extra claims modelled at ₹300 × 2 events × affected workers
- If projected BCR > 0.85 → capital alert raised in Actuary screen

### Actuarial Assumptions

| Assumption | Value | Notes |
|------------|-------|-------|
| Avg daily income | ₹700 | Median gig worker, India 2024 |
| Days exposed/week | 5 | Standard gig schedule |
| Income replacement rate | 40% | Per-event compensation fraction |
| Actuarial load | 0.32 | Ops + profit margin |
| Historical premiums (seed) | ₹2,400 | Bootstrap for BCR calculation |
| Weekly premium range | ₹20–₹50 | Affordability constraint |
| Activity threshold | 5 days/30d | Below → restricted UW tier |
| Restricted UW loading | 1.30× | 30% surcharge |

---

## ⚙️ System Workflow

```
Registration → Risk Profiling → Weekly Policy Generation
     → Real-Time Monitoring → Parametric Trigger Engine
          → GigTrust Validation → Zero-Touch Payout
```

1. **Registration** — name, phone, platform, city, zone, work hours, PIN (≤6 steps)
2. **Risk Profiling** — city risk pool assigned, actuarial premium calculated
3. **Weekly Policy** — dynamic premium (₹20–₹50) based on city risk + GTS + activity tier
4. **Real-Time Monitoring** — simulated weather/demand triggers
5. **Trigger Engine** — threshold-based detection per city/zone/hour
6. **GigTrust Validation** — multi-layer fraud check before payout
7. **Instant Payout** — simulated UPI transfer, zero manual input

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Worker App | React + Vite (port 5173) |
| Admin Dashboard | React + Vite (port 5174) |
| Backend API | Node.js + Express (port 3001) |
| Animations | Framer Motion |
| Fonts | Sora, DM Serif Display, DM Mono |

---

## 🚀 Running the Project

```bash
# Backend
cd backend && npm install && npm start

# Worker app
cd web && npm install && npm run dev

# Admin dashboard
cd admin && npm install && npm run dev
```

**Demo credentials:**
- Worker: phone `9100000001`, PIN `1234` (Rahul Sharma, Chennai)
- Admin: `admin@instasure.com` / `Admin@123`

---

## 📈 Business Model

| Metric | Value |
|---|---|
| Weekly subscription | ₹20–₹50/worker |
| 1,000 workers revenue | ₹50,000/week |
| Target BCR | 0.55–0.70 |
| Profitable at | BCR < 0.70 |

---

## 🔹 Resource Constraints

This prototype uses **lightweight mocked alternatives** in place of real external APIs:

- `MOCK_HISTORICAL_RISK` — simulated IMD/SAFAR data (replaces real API calls)
- `CITY_RISK` — precomputed weekly probabilities (pluggable with live data)
- GigTrust scoring — rule-based (pluggable with ML model)
- All models are structured for **real data plug-in without refactoring**

---

## 🏆 What Makes InstaSure Different

| Feature | Traditional Insurance | InstaSure |
|---|---|---|
| Claims | Manual | Zero-touch |
| Pricing | Static annual | AI-dynamic weekly |
| Coverage | Visible events only | + Demand drop + outages |
| Fraud | Basic | Multi-layer GTS + UW tier |
| Trust | None | GigTrust Score (300–900) |
| Payout Speed | Days to weeks | Instant UPI |
| Pricing Model | Annual premium | ₹20–₹50/week |

---

> We are not just building an insurance product.
> We are building a **predictive financial safety net for the global gig economy**.
