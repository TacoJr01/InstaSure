import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Modal, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { api, MOCK } from '../../src/api';

const ITEM_KEYS = [
  { key: 'rain',      label: 'Rain',       accentKey: 'blue'   },
  { key: 'lowOrders', label: 'Low Orders', accentKey: 'green'  },
  { key: 'pollution', label: 'Pollution',  accentKey: 'amber'  },
  { key: 'curfew',    label: 'Curfew',     accentKey: 'purple' },
];

const COVERED_KEYS = [
  { key: 'rain',      label: 'Rain · heavy downpour', accentKey: 'blue',   status: 'Active'   },
  { key: 'lowOrders', label: 'Low demand orders',      accentKey: 'green',  status: 'Active'   },
  { key: 'curfew',    label: 'Curfew / city bandh',    accentKey: 'purple', status: 'Active'   },
  { key: 'pollution', label: 'Poor air quality',       accentKey: 'amber',  status: 'Watching' },
];

const PRESETS = [0, 200, 300, 500, 800, 1000, 1500];
const NUMPAD = ['1','2','3','4','5','6','7','8','9','','0','⌫'];

function calcPremium(vals) {
  const total = Object.values(vals).reduce((s, v) => s + v, 0);
  return Math.max(25, Math.min(80, Math.round((total / 1800) * 80)));
}

function CoverageRow({ item, value, onChange }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeRowStyles(colors), [colors]);
  const color = colors[item.accentKey];
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <View style={[styles.dot, { backgroundColor: color }]} />
        <Text style={styles.name}>{item.label}</Text>
        <Text style={[styles.amt, { color }]}>₹{value}</Text>
      </View>
      <View style={styles.presets}>
        {PRESETS.map(p => (
          <Pressable
            key={p}
            style={[styles.chip, value === p && { backgroundColor: color + '22', borderColor: color }]}
            onPress={() => { onChange(item.key, p); api.patchCoverage({ [item.key]: p }); }}
          >
            <Text style={[styles.chipTxt, value === p && { color }]}>
              {p === 0 ? 'Off' : `₹${p}`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const makeRowStyles = (c) => StyleSheet.create({
  wrap:    { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: c.rowDivider },
  header:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dot:     { width: 7, height: 7, borderRadius: 3.5 },
  name:    { fontSize: 13, fontWeight: '600', color: c.text2, flex: 1 },
  amt:     { fontFamily: fonts.mono, fontSize: 13, fontWeight: '600' },
  presets: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: c.border2 },
  chipTxt: { fontFamily: fonts.mono, fontSize: 9, color: c.muted },
});

// ── PAYMENT MODAL ─────────────────────────────────────────
function PaymentModal({ visible, premium, upi, onClose, onPaid }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makePayStyles(colors), [colors]);
  const [pin, setPin]         = useState('');
  const [paying, setPaying]   = useState(false);
  const [result, setResult]   = useState(null);
  const [error, setError]     = useState('');
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      setPin(''); setResult(null); setError('');
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, stiffness: 380, damping: 38 }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible]);

  async function handlePay() {
    if (pin.length < 4 || paying) return;
    setPaying(true);
    setError('');
    const res = await api.pay(pin);
    setPaying(false);
    if (!res || res.error) {
      // Mock success for demo
      setResult({ amount: premium, expiresDate: 'Mon 27 Jan', txId: 'TXN' + Date.now() });
      onPaid?.();
    } else {
      setResult(res);
      onPaid?.();
    }
  }

  function pressKey(k) {
    if (k === '') return;
    if (k === '⌫') { setPin(p => p.slice(0, -1)); return; }
    if (pin.length < 6) setPin(p => p + k);
  }

  if (!visible) return null;

  return (
    <Modal transparent animationType="none" visible={visible} onRequestClose={onClose}>
      {/* Backdrop */}
      <Pressable style={styles.backdrop} onPress={!paying && !result ? onClose : undefined} />
      {/* Sheet */}
      <Animated.View style={[styles.sheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.handle} />

        {result ? (
          /* Success */
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            <View style={styles.successRing}>
              <Text style={{ fontSize: 28 }}>✓</Text>
            </View>
            <Text style={styles.successAmt}>₹{result.amount}</Text>
            <Text style={styles.successLabel}>Payment successful</Text>
            <Text style={styles.successMeta}>Coverage active until {result.expiresDate}</Text>
            <Text style={[styles.txId]}>{result.txId}</Text>
            <Pressable style={[styles.ctaBtn, { backgroundColor: colors.green, marginTop: 20 }]} onPress={onClose}>
              <Text style={[styles.ctaTxt, { color: '#0E0E12' }]}>Done</Text>
            </Pressable>
          </View>
        ) : (
          <>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Pay Premium</Text>
              <Pressable style={styles.closeBtn} onPress={onClose}>
                <Text style={{ color: colors.muted, fontSize: 14 }}>✕</Text>
              </Pressable>
            </View>

            {/* UPI row */}
            <View style={styles.upiRow}>
              <View style={styles.upiIcon}>
                <Text style={{ fontSize: 18 }}>💳</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upiId}>{upi || 'rahul@upi'}</Text>
                <Text style={styles.upiSub}>InstaSure · Weekly premium</Text>
              </View>
              <Text style={styles.upiAmt}>₹{premium}</Text>
            </View>

            {/* PIN dots */}
            <Text style={styles.pinLabel}>ENTER UPI PIN</Text>
            <View style={styles.pinDots}>
              {[0,1,2,3,4,5].map(i => (
                <View key={i} style={[styles.pinDot, { backgroundColor: i < pin.length ? colors.purple : colors.border2, transform: [{ scale: i < pin.length ? 1.2 : 1 }] }]} />
              ))}
            </View>

            {/* Numpad */}
            <View style={styles.numpad}>
              {NUMPAD.map((k, i) => (
                <Pressable
                  key={i}
                  style={({ pressed }) => [styles.numKey, { opacity: k === '' ? 0 : 1, backgroundColor: pressed && k !== '' ? colors.surface2 : colors.surface }]}
                  onPress={() => pressKey(k)}
                  disabled={paying}
                >
                  <Text style={styles.numTxt}>{k}</Text>
                </Pressable>
              ))}
            </View>

            {!!error && <Text style={styles.errorTxt}>{error}</Text>}

            <Pressable
              style={[styles.ctaBtn, { backgroundColor: pin.length >= 4 ? colors.purple : colors.border2 }]}
              onPress={handlePay}
              disabled={pin.length < 4 || paying}
            >
              <Text style={[styles.ctaTxt, { color: pin.length >= 4 ? '#fff' : colors.faint }]}>
                {paying ? 'Processing…' : `Pay ₹${premium}`}
              </Text>
            </Pressable>
          </>
        )}
      </Animated.View>
    </Modal>
  );
}

const makePayStyles = (c) => StyleSheet.create({
  backdrop:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:       { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderColor: c.border2, padding: 24, paddingBottom: 40 },
  handle:      { width: 36, height: 4, backgroundColor: c.border2, borderRadius: 2, alignSelf: 'center', marginBottom: 18 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  sheetTitle:  { fontSize: 16, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  closeBtn:    { width: 28, height: 28, borderRadius: 14, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
  upiRow:      { flexDirection: 'row', alignItems: 'center', gap: 12, padding: '12px 14px', backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border2, borderRadius: 14, marginBottom: 20, paddingHorizontal: 14, paddingVertical: 12 },
  upiIcon:     { width: 38, height: 38, borderRadius: 12, backgroundColor: c.purpleDim, borderWidth: 1, borderColor: 'rgba(155,122,232,0.2)', alignItems: 'center', justifyContent: 'center' },
  upiId:       { fontSize: 13, fontWeight: '700', color: c.text },
  upiSub:      { fontFamily: fonts.mono, fontSize: 10, color: c.faint, marginTop: 2, fontStyle: 'italic' },
  upiAmt:      { fontSize: 20, fontWeight: '900', color: c.purple, letterSpacing: -0.5 },
  pinLabel:    { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1, textAlign: 'center', marginBottom: 12 },
  pinDots:     { flexDirection: 'row', justifyContent: 'center', gap: 14, marginBottom: 20 },
  pinDot:      { width: 12, height: 12, borderRadius: 6 },
  numpad:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  numKey:      { width: '30%', paddingVertical: 14, borderWidth: 1, borderColor: c.border, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  numTxt:      { fontSize: 18, fontWeight: '600', color: c.text },
  errorTxt:    { fontFamily: fonts.mono, fontSize: 11, color: c.coral, textAlign: 'center', marginBottom: 10, fontStyle: 'italic' },
  ctaBtn:      { paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  ctaTxt:      { fontSize: 14, fontWeight: '700', letterSpacing: -0.2 },
  successRing: { width: 64, height: 64, borderRadius: 32, borderWidth: 2, borderColor: c.green, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  successAmt:  { fontSize: 36, fontWeight: '900', color: c.green, letterSpacing: -1.5, lineHeight: 40 },
  successLabel:{ fontSize: 14, fontWeight: '700', color: c.text, marginTop: 8 },
  successMeta: { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 4, fontStyle: 'italic' },
  txId:        { fontFamily: fonts.mono, fontSize: 9, color: c.faint, marginTop: 6 },
});

// ── MAIN SCREEN ───────────────────────────────────────────
export default function CoverageScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const [vals, setVals]                 = useState(MOCK.coverage);
  const [premium, setPremium]           = useState(40);
  const [saved, setSaved]               = useState(false);
  const [policy, setPolicy]             = useState(MOCK.policy);
  const [premStatus, setPremStatus]     = useState(MOCK.premiumStatus);
  const [breakdown, setBreakdown]       = useState(MOCK.premiumBreakdown);
  const [paySheet, setPaySheet]         = useState(false);

  useEffect(() => {
    api.coverage().then(d => {
      if (d) { setVals({ rain: d.rain, lowOrders: d.lowOrders, pollution: d.pollution, curfew: d.curfew }); if (d.premium) setPremium(d.premium); }
    });
    api.policy().then(d => { if (d) setPolicy(d); });
    api.premiumStatus().then(d => { if (d) setPremStatus(d); });
    api.premiumBreakdown().then(d => { if (d) setBreakdown(d); });
  }, []);

  const total = Object.values(vals).reduce((a, b) => a + b, 0);

  const handleChange = (key, val) => {
    setVals(prev => {
      const next = { ...prev, [key]: val };
      setPremium(calcPremium(next));
      return next;
    });
    setSaved(false);
  };

  async function handleSave() {
    const res = await api.patchCoverage(vals);
    if (res?.premium) setPremium(res.premium);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
    api.premiumBreakdown().then(d => { if (d) setBreakdown(d); });
  }

  const tierColor = policy?.underwritingTier === 'high' ? colors.green : policy?.underwritingTier === 'medium' ? colors.amber : colors.coral;
  const tierBg    = policy?.underwritingTier === 'high' ? colors.greenDim : policy?.underwritingTier === 'medium' ? colors.amberDim : colors.coralDim;

  const bdColors = { rain: colors.blue, lowOrders: colors.green, pollution: colors.amber, curfew: colors.purple };

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Policy card */}
      {policy && (
        <View style={styles.policyCard}>
          <View style={styles.policyTop}>
            <Text style={styles.policyNumber}>{policy.policyNumber}</Text>
            <View style={[styles.poolBadge, { backgroundColor: colors.coralDim, borderColor: 'rgba(232,132,58,0.2)' }]}>
              <Text style={[styles.poolBadgeTxt, { color: colors.coral }]}>{policy.cityRiskPool}</Text>
            </View>
          </View>
          <View style={styles.policyMid}>
            <View style={[styles.tierBadge, { backgroundColor: tierBg }]}>
              <Text style={[styles.tierBadgeTxt, { color: tierColor }]}>{policy.underwritingTier?.toUpperCase()} TIER</Text>
            </View>
            <Text style={styles.policyRenewal}>Renews {policy.policyRenewal}</Text>
          </View>
          {/* Active delivery days */}
          <View style={styles.daysRow}>
            <Text style={styles.daysLabel}>ACTIVE DAYS</Text>
            <Text style={[styles.daysVal, { color: policy.activeDeliveryDays >= 7 ? colors.green : colors.amber }]}>
              {policy.activeDeliveryDays} / 7 min
            </Text>
          </View>
          <View style={styles.daysTrack}>
            <View style={[styles.daysFill, {
              backgroundColor: policy.activeDeliveryDays >= 7 ? colors.green : colors.amber,
              width: `${Math.min(100, (policy.activeDeliveryDays / 30) * 100)}%`,
            }]} />
            {/* 7-day marker */}
            <View style={[styles.daysMarker, { left: `${(7 / 30) * 100}%` }]} />
          </View>
          {!policy.eligibleForCoverage && (
            <View style={styles.ineligibleNote}>
              <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.amber, fontStyle: 'italic' }}>
                Need 7 active delivery days for coverage
              </Text>
            </View>
          )}
        </View>
      )}

      <Text style={styles.eyebrow}>your plan</Text>
      <Text style={styles.hero}>₹{premium}</Text>
      <Text style={styles.sub}>per week · up to ₹{total.toLocaleString('en-IN')} support</Text>

      <View style={styles.pillRow}>
        <View style={styles.pillDark}><Text style={styles.pillDarkTxt}>Chennai · Velachery</Text></View>
        <View style={styles.pillCoral}><Text style={styles.pillCoralTxt}>Active</Text></View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>COVERAGE CONTROLS</Text>

      <View style={styles.card}>
        {ITEM_KEYS.map(item => (
          <CoverageRow key={item.key} item={item} value={vals[item.key]} onChange={handleChange} />
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLbl}>total coverage</Text>
          <Text style={styles.totalVal}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      {/* Save button */}
      <Pressable
        style={[styles.saveBtn, { backgroundColor: saved ? colors.green : colors.coral }]}
        onPress={handleSave}
      >
        <Text style={styles.saveBtnTxt}>{saved ? '✓ Saved' : 'Save Coverage'}</Text>
      </Pressable>

      <View style={styles.divider} />

      {/* Weekly premium payment */}
      <Text style={styles.sectionLabel}>WEEKLY PREMIUM</Text>
      <View style={styles.premCard}>
        <View>
          <Text style={styles.premAmt}>₹{premium}</Text>
          <Text style={styles.premSub}>due this week</Text>
        </View>
        {premStatus?.paid ? (
          <View style={styles.paidBadge}>
            <Text style={{ color: colors.green, fontSize: 12, marginRight: 4 }}>✓</Text>
            <View>
              <Text style={styles.paidTxt}>PAID</Text>
              <Text style={styles.paidExpiry}>Expires {premStatus.expiresDate}</Text>
            </View>
          </View>
        ) : (
          <Pressable style={styles.payBtn} onPress={() => setPaySheet(true)}>
            <Text style={styles.payBtnTxt}>Pay via UPI</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.divider} />

      <Text style={styles.sectionLabel}>WHAT'S COVERED</Text>
      <View style={styles.card}>
        {COVERED_KEYS.map(({ key, label, accentKey, status }, i) => (
          <View key={key} style={[styles.covRow, i < COVERED_KEYS.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
            <View style={styles.covLeft}>
              <View style={[styles.dot, { backgroundColor: colors[accentKey] }]} />
              <Text style={styles.covName}>{label}</Text>
            </View>
            <Text style={[styles.covStatus, { color: colors[accentKey] }]}>{status}</Text>
          </View>
        ))}
      </View>

      {/* Pricing breakdown */}
      {breakdown && (
        <>
          <View style={styles.divider} />
          <Text style={styles.sectionLabel}>PRICING BREAKDOWN</Text>
          <View style={styles.card}>
            <Text style={styles.formulaHint}>Expected Loss × GTS Multiplier × Load Factor</Text>
            {breakdown.components.map(({ trigger, label, probability, coverage: cov, expected }, i) => (
              <View key={trigger} style={[styles.bdRow, i < breakdown.components.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
                <View style={[styles.dot, { backgroundColor: bdColors[trigger] }]} />
                <Text style={styles.bdLabel}>{label}</Text>
                <Text style={styles.bdProb}>{(probability * 100).toFixed(1)}%</Text>
                <Text style={styles.bdCov}>× ₹{cov}</Text>
                <Text style={[styles.bdExp, { color: bdColors[trigger] }]}>= ₹{expected}</Text>
              </View>
            ))}
            <View style={{ height: 1, backgroundColor: colors.rowDivider, marginVertical: 8 }} />
            {[
              { k: 'Total expected loss',        v: `₹${breakdown.totalExpected}` },
              { k: `GTS multiplier (${breakdown.gtsTier})`, v: `× ${breakdown.gtsMultiplier}` },
              { k: 'Load factor (ops + reserves)', v: `× ${breakdown.loadFactor}` },
            ].map(({ k, v }) => (
              <View key={k} style={styles.bdFormRow}>
                <Text style={styles.bdFormKey}>{k}</Text>
                <Text style={styles.bdFormVal}>{v}</Text>
              </View>
            ))}
            <View style={[styles.bdFormRow, { borderTopWidth: 1, borderTopColor: colors.rowDivider, marginTop: 6, paddingTop: 8 }]}>
              <Text style={{ fontSize: 13, fontWeight: '700', color: colors.text }}>Weekly premium</Text>
              <Text style={{ fontSize: 20, fontWeight: '900', color: colors.coral, letterSpacing: -0.5 }}>₹{breakdown.finalPremium}</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.note}>
        <Text style={styles.noteTxt}>Premium adjusts automatically as you change coverage limits</Text>
      </View>
      <View style={{ height: 24 }} />

      <PaymentModal
        visible={paySheet}
        premium={premium}
        upi={premStatus?.upi}
        onClose={() => setPaySheet(false)}
        onPaid={() => setPremStatus(p => ({ ...p, paid: true, expiresDate: 'Mon 27 Jan' }))}
      />
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: c.bg },
  content:       { paddingHorizontal: 24, paddingBottom: 96 },
  // Policy card
  policyCard:    { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, padding: 16, marginBottom: 14 },
  policyTop:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  policyNumber:  { fontFamily: fonts.mono, fontSize: 11, color: c.text, fontWeight: '600', letterSpacing: 0.3 },
  poolBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  poolBadgeTxt:  { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 0.3 },
  policyMid:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  tierBadge:     { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  tierBadgeTxt:  { fontFamily: fonts.mono, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  policyRenewal: { fontFamily: fonts.mono, fontSize: 10, color: c.faint, fontStyle: 'italic' },
  daysRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  daysLabel:     { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 0.5 },
  daysVal:       { fontFamily: fonts.mono, fontSize: 9, fontWeight: '600' },
  daysTrack:     { height: 5, backgroundColor: c.track, borderRadius: 3, overflow: 'visible', position: 'relative' },
  daysFill:      { height: '100%', borderRadius: 3, position: 'absolute', top: 0, left: 0 },
  daysMarker:    { position: 'absolute', top: -3, width: 2, height: 11, backgroundColor: c.faint, borderRadius: 1 },
  ineligibleNote:{ marginTop: 10, padding: 8, backgroundColor: c.amberDim, borderWidth: 1, borderColor: 'rgba(232,184,74,0.2)', borderRadius: 10 },
  // Plan hero
  eyebrow:       { fontFamily: fonts.mono, fontSize: 11, color: c.muted, fontStyle: 'italic' },
  hero:          { fontSize: 52, fontWeight: '900', color: c.text, letterSpacing: -2, lineHeight: 56, marginTop: 4 },
  sub:           { fontFamily: fonts.mono, fontSize: 11, color: c.faint, fontStyle: 'italic', marginTop: 4 },
  pillRow:       { flexDirection: 'row', gap: 8, marginTop: 12 },
  pillDark:      { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border2 },
  pillDarkTxt:   { fontFamily: fonts.mono, fontSize: 9, color: c.text2 },
  pillCoral:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: c.coral },
  pillCoralTxt:  { fontFamily: fonts.mono, fontSize: 9, color: '#fff', fontWeight: '500' },
  divider:       { height: 1, backgroundColor: c.border, marginVertical: 16 },
  sectionLabel:  { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1.2, marginBottom: 10 },
  card:          { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  totalRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 14 },
  totalLbl:      { fontFamily: fonts.mono, fontSize: 12, color: c.muted, fontStyle: 'italic' },
  totalVal:      { fontSize: 22, fontWeight: '900', color: c.text, letterSpacing: -0.5 },
  saveBtn:       { marginTop: 10, paddingVertical: 14, borderRadius: 16, alignItems: 'center' },
  saveBtnTxt:    { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  // Premium card
  premCard:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg },
  premAmt:       { fontSize: 26, fontWeight: '900', color: c.text, letterSpacing: -0.8 },
  premSub:       { fontFamily: fonts.mono, fontSize: 10, color: c.faint, marginTop: 2, fontStyle: 'italic' },
  paidBadge:     { flexDirection: 'row', alignItems: 'center', gap: 4 },
  paidTxt:       { fontFamily: fonts.mono, fontSize: 9, color: c.green, letterSpacing: 0.5 },
  paidExpiry:    { fontFamily: fonts.mono, fontSize: 9, color: c.faint, fontStyle: 'italic', marginTop: 1 },
  payBtn:        { paddingHorizontal: 18, paddingVertical: 10, backgroundColor: c.purple, borderRadius: 14 },
  payBtnTxt:     { fontSize: 13, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  // What's covered
  covRow:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  covLeft:       { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:           { width: 7, height: 7, borderRadius: 3.5 },
  covName:       { fontSize: 13, fontWeight: '600', color: c.text2 },
  covStatus:     { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.3 },
  // Pricing breakdown
  formulaHint:   { fontFamily: fonts.mono, fontSize: 10, color: c.faint, textAlign: 'center', paddingVertical: 10, fontStyle: 'italic', borderBottomWidth: 1, borderBottomColor: c.rowDivider, marginBottom: 4 },
  bdRow:         { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 9 },
  bdLabel:       { flex: 1, fontSize: 12, fontWeight: '600', color: c.text2 },
  bdProb:        { fontFamily: fonts.mono, fontSize: 10, color: c.faint, width: 36, textAlign: 'right' },
  bdCov:         { fontFamily: fonts.mono, fontSize: 10, color: c.muted, width: 44, textAlign: 'right' },
  bdExp:         { fontFamily: fonts.mono, fontSize: 10, fontWeight: '600', width: 36, textAlign: 'right' },
  bdFormRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 4 },
  bdFormKey:     { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 0.2 },
  bdFormVal:     { fontFamily: fonts.mono, fontSize: 11, color: c.text2, fontWeight: '600' },
  note:          { padding: 12, backgroundColor: 'rgba(155,122,232,0.06)', borderWidth: 1, borderColor: 'rgba(155,122,232,0.15)', borderRadius: 14, marginTop: 14 },
  noteTxt:       { fontFamily: fonts.mono, fontSize: 11, color: c.muted, textAlign: 'center', fontStyle: 'italic' },
});
