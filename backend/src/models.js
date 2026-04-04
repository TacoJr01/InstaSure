const mongoose = require('mongoose');

// ── WORKER ─────────────────────────────────────────────────
const workerSchema = new mongoose.Schema({
  id:                 { type: String, required: true, unique: true },
  name:               { type: String, required: true },
  initials:           String,
  phone:              { type: String, required: true, unique: true },
  pin:                { type: String, required: true },
  platform:           String,
  location:           String,
  zone:               String,
  gtsScore:           { type: Number, default: 600 },
  gtsTier:            { type: String, default: 'medium' },
  status:             { type: String, default: 'active' },
  weeklyEarnings:     { type: Number, default: 0 },
  premium:            { type: Number, default: 0 },
  lastActive:         String,
  upi:                String,
  workHours:          String,
  memberSince:        String,
  activeDeliveryDays: { type: Number, default: 0 },
  policyNumber:       String,
  policyStart:        String,
  policyRenewal:      String,
  coverage: {
    rain:       { type: Number, default: 800 },
    lowOrders:  { type: Number, default: 500 },
    pollution:  { type: Number, default: 200 },
    curfew:     { type: Number, default: 300 },
  },
  compensationEligible: { type: Boolean, default: false },
  premiumState: {
    paid:         { type: Boolean, default: false },
    lastPaidDate: String,
    expiresDate:  String,
    txId:         String,
  },
  settings: {
    autoRenew:      { type: Boolean, default: true },
    notifications:  { type: Boolean, default: true },
    smartCoverage:  { type: Boolean, default: true },
  },
}, { timestamps: true });

// ── PAYOUT ─────────────────────────────────────────────────
const payoutSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  workerId:   { type: String, required: true },
  workerName: String,
  platform:   String,
  amount:     Number,
  type:       String,
  reason:     String,
  date:       String,
  time:       String,
  auto:       Boolean,
  status:     { type: String, default: 'paid' },
}, { timestamps: true });

// ── FRAUD FLAG ─────────────────────────────────────────────
const fraudFlagSchema = new mongoose.Schema({
  id:         { type: String, required: true, unique: true },
  workerId:   String,
  workerName: String,
  platform:   String,
  location:   String,
  reason:     String,
  detail:     String,
  confidence: Number,
  date:       String,
  gtsScore:   Number,
  status:     { type: String, default: 'open' },
}, { timestamps: true });

// ── ADMIN ALERT ────────────────────────────────────────────
const adminAlertSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  type:     String,
  zone:     String,
  severity: String,
  message:  String,
  time:     String,
  active:   { type: Boolean, default: true },
}, { timestamps: true });

// ── WORKER ALERT ───────────────────────────────────────────
const workerAlertSchema = new mongoose.Schema({
  id:       { type: String, required: true, unique: true },
  workerId: String,
  type:     String,
  title:    String,
  message:  String,
  badge:    String,
}, { timestamps: true });

// ── ADMIN SETTINGS ─────────────────────────────────────────
const adminSettingsSchema = new mongoose.Schema({
  key: { type: String, default: 'singleton', unique: true },
  triggers: {
    rain:      { enabled: Boolean, autoPay: Boolean, payoutAmount: Number, label: String },
    lowOrders: { enabled: Boolean, autoPay: Boolean, payoutAmount: Number, label: String },
    curfew:    { enabled: Boolean, autoPay: Boolean, payoutAmount: Number, label: String },
    outage:    { enabled: Boolean, autoPay: Boolean, payoutAmount: Number, label: String },
  },
  gigtrust: { highMin: Number, mediumMin: Number },
  premium:  { minPremium: Number, maxPremium: Number, coverageDivisor: Number },
  platform: { active: Boolean, maintenanceMode: Boolean, fraudAutoSuspend: Boolean },
}, { timestamps: true });

module.exports = {
  Worker:        mongoose.model('Worker',        workerSchema),
  Payout:        mongoose.model('Payout',        payoutSchema),
  FraudFlag:     mongoose.model('FraudFlag',     fraudFlagSchema),
  AdminAlert:    mongoose.model('AdminAlert',    adminAlertSchema),
  WorkerAlert:   mongoose.model('WorkerAlert',   workerAlertSchema),
  AdminSettings: mongoose.model('AdminSettings', adminSettingsSchema),
};
