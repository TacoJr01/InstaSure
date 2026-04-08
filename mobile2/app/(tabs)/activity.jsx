import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { api, MOCK } from '../../src/api';

function AnimatedBar({ pct, color, delay }) {
  const { colors } = useTheme();
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 700, delay, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={{ flex: 1, height: 8, backgroundColor: colors.track, borderRadius: 4, overflow: 'hidden' }}>
      <Animated.View style={[{ height: '100%', borderRadius: 4, backgroundColor: color }, { width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }]} />
    </View>
  );
}

function VerifyFlow({ onClose, onSuccess }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeVfyStyles(colors), [colors]);
  const [step, setStep]           = useState(1);
  const [gpsProgress, setGpsProg] = useState(0);
  const [gpsOk, setGpsOk]         = useState(false);
  const [selfieOk, setSelfieOk]   = useState(false);
  const [loading, setLoading]     = useState(false);
  const [payout, setPayout]       = useState(null);
  const gpsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (step !== 1) return;
    let val = 0;
    const iv = setInterval(() => {
      val = Math.min(val + 4, 100);
      setGpsProg(val);
      Animated.timing(gpsAnim, { toValue: val, duration: 80, useNativeDriver: false }).start();
      if (val >= 100) { clearInterval(iv); setGpsOk(true); }
    }, 80);
    return () => clearInterval(iv);
  }, [step]);

  async function submit() {
    setLoading(true);
    try {
      const res = await api.verify?.({ gps: true, selfie: true });
      setPayout(res?.payout || { amount: 200 });
    } catch {
      setPayout({ amount: 200 });
    }
    setLoading(false);
    setStep(3);
    onSuccess?.();
  }

  const gpsWidth = gpsAnim.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] });

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Pressable onPress={onClose} style={styles.backBtn}>
          <Text style={{ color: colors.muted, fontSize: 18 }}>←</Text>
        </Pressable>
        <Text style={styles.title}>Verify to Claim</Text>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.stepsRow}>
        {[1, 2, 3].map((n, i) => (
          <React.Fragment key={n}>
            <View style={[styles.stepDot, { backgroundColor: step > n ? colors.green : step === n ? colors.blue : colors.border2 }]}>
              <Text style={styles.stepNum}>{step > n ? '✓' : n}</Text>
            </View>
            {i < 2 && <View style={[styles.stepLine, { backgroundColor: step > n ? colors.green : colors.border2 }]} />}
          </React.Fragment>
        ))}
      </View>

      {step === 1 && (
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <Text style={{ fontSize: 28 }}>📍</Text>
          </View>
          <Text style={styles.stepName}>GPS Verification</Text>
          <Text style={styles.stepDesc}>Confirming you are in your active delivery zone</Text>
          <View style={styles.progTrack}>
            <Animated.View style={[styles.progFill, { width: gpsWidth, backgroundColor: gpsOk ? colors.green : colors.blue }]} />
          </View>
          <Text style={[styles.stepSub, { color: gpsOk ? colors.green : colors.muted }]}>
            {gpsOk ? 'Location confirmed ✓' : `Scanning… ${gpsProgress}%`}
          </Text>
          {gpsOk && (
            <Pressable style={[styles.cta, { backgroundColor: colors.blue }]} onPress={() => setStep(2)}>
              <Text style={styles.ctaTxt}>Continue to Selfie</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === 2 && (
        <View style={styles.card}>
          <View style={styles.iconRing}>
            <Text style={{ fontSize: 28 }}>🤳</Text>
          </View>
          <Text style={styles.stepName}>Selfie Verification</Text>
          <Text style={styles.stepDesc}>Take a selfie from your current pickup location</Text>
          {!selfieOk ? (
            <Pressable style={[styles.cta, { backgroundColor: colors.amberDim, borderWidth: 1, borderColor: colors.amber }]} onPress={() => setSelfieOk(true)}>
              <Text style={[styles.ctaTxt, { color: colors.amber }]}>Take Selfie</Text>
            </Pressable>
          ) : (
            <View style={styles.selfieDone}>
              <Text style={{ color: colors.green, fontSize: 13, fontWeight: '600' }}>✓ Selfie captured</Text>
            </View>
          )}
          {selfieOk && (
            <Pressable style={[styles.cta, { backgroundColor: colors.blue, marginTop: 10 }]} onPress={submit} disabled={loading}>
              <Text style={styles.ctaTxt}>{loading ? 'Processing…' : 'Submit Verification'}</Text>
            </Pressable>
          )}
        </View>
      )}

      {step === 3 && (
        <View style={[styles.card, { alignItems: 'center' }]}>
          <View style={styles.successRing}>
            <Text style={{ fontSize: 32 }}>✓</Text>
          </View>
          <Text style={styles.successAmt}>+₹{payout?.amount || 200}</Text>
          <Text style={styles.successLabel}>Payout triggered</Text>
          <Text style={styles.successDesc}>Sent to your UPI automatically</Text>
          <Pressable style={[styles.cta, { backgroundColor: colors.green, marginTop: 20 }]} onPress={onClose}>
            <Text style={[styles.ctaTxt, { color: '#0E0E12' }]}>Done</Text>
          </Pressable>
        </View>
      )}

      <View style={styles.claimNote}>
        <Text style={{ fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textAlign: 'center', fontStyle: 'italic' }}>
          Eligible compensation: <Text style={{ color: colors.green }}>₹200</Text> for &gt;50% demand drop
        </Text>
      </View>
    </View>
  );
}

const makeVfyStyles = (c) => StyleSheet.create({
  root:        { flex: 1 },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  backBtn:     { width: 32, alignItems: 'center' },
  title:       { fontSize: 17, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  stepsRow:    { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  stepDot:     { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  stepNum:     { fontFamily: fonts.mono, fontSize: 11, color: '#fff', fontWeight: '600' },
  stepLine:    { flex: 1, height: 2, borderRadius: 1, marginHorizontal: 4 },
  card:        { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, padding: 20, alignItems: 'center', gap: 8 },
  iconRing:    { width: 60, height: 60, borderRadius: 30, backgroundColor: c.surface2, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  stepName:    { fontSize: 16, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  stepDesc:    { fontFamily: fonts.mono, fontSize: 11, color: c.muted, textAlign: 'center', lineHeight: 16, fontStyle: 'italic' },
  stepSub:     { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.3, marginTop: 4 },
  progTrack:   { width: '100%', height: 6, backgroundColor: c.track, borderRadius: 3, overflow: 'hidden', marginTop: 8 },
  progFill:    { height: '100%', borderRadius: 3 },
  cta:         { width: '100%', marginTop: 12, paddingVertical: 13, borderRadius: 14, alignItems: 'center' },
  ctaTxt:      { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
  selfieDone:  { paddingHorizontal: 16, paddingVertical: 10, backgroundColor: 'rgba(62,201,122,0.08)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.2)', borderRadius: 12 },
  successRing: { width: 68, height: 68, borderRadius: 34, borderWidth: 2.5, borderColor: c.green, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  successAmt:  { fontSize: 38, fontWeight: '900', color: c.green, letterSpacing: -1.5, lineHeight: 42 },
  successLabel:{ fontSize: 14, fontWeight: '700', color: c.text, marginTop: 4 },
  successDesc: { fontFamily: fonts.mono, fontSize: 11, color: c.muted, fontStyle: 'italic', marginTop: 2 },
  claimNote:   { marginTop: 16, padding: 12, backgroundColor: 'rgba(74,143,232,0.06)', borderWidth: 1, borderColor: 'rgba(74,143,232,0.15)', borderRadius: 12 },
});

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [data, setData]        = useState(MOCK.activity);
  const [verifying, setVerify] = useState(false);

  useEffect(() => {
    api.activity().then(d => { if (d) setData(d); });
  }, []);

  const maxOrders = Math.max(...data.week.map(w => w.orders));

  if (verifying) {
    return (
      <ScrollView style={[styles.scroll, { paddingTop: insets.top + 16 }]} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <VerifyFlow
          onClose={() => setVerify(false)}
          onSuccess={() => setData(d => ({ ...d, compensationEligible: false }))}
        />
      </ScrollView>
    );
  }

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>today's picture</Text>
      <Text style={styles.hero}>Orders{'\n'}are low</Text>
      <Text style={styles.sub}>{data.dropPercent}% fewer than your average</Text>

      <View style={styles.divider} />

      <View style={styles.statGrid}>
        {[
          { label: 'TODAY',  val: String(data.todayOrders),               color: colors.coral, sub: 'orders so far' },
          { label: 'NORMAL', val: String(data.normalOrders),              color: colors.text,  sub: 'avg / day'     },
          { label: 'DROP',   val: `${data.dropPercent}%`,                 color: colors.amber, sub: 'below avg'     },
          { label: 'STATUS', val: data.compensationEligible ? '✓' : '—', color: colors.green, sub: 'eligible'      },
        ].map(stat => (
          <View key={stat.label} style={styles.statCard}>
            <Text style={styles.statLbl}>{stat.label}</Text>
            <Text style={[styles.statVal, { color: stat.color }]}>{stat.val}</Text>
            <Text style={styles.statSub}>{stat.sub}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>THIS WEEK</Text>

      <View style={styles.card}>
        {data.week.map((w, i) => {
          const isToday = i === data.week.length - 1;
          return (
            <View key={w.day} style={styles.barRow}>
              <Text style={styles.barLabel}>{w.day}</Text>
              <AnimatedBar pct={(w.orders / maxOrders) * 100} color={isToday ? colors.coral : colors.text2} delay={200 + i * 80} />
              <Text style={[styles.barVal, { color: isToday ? colors.coral : colors.muted }]}>{w.orders}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      {data.compensationEligible && (
        <>
          <View style={styles.greenAlert}>
            <View style={[styles.alertBar, { backgroundColor: colors.green }]} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.alertTitle, { color: colors.green }]}>Compensation likely</Text>
              <Text style={styles.alertDesc}>Drop &gt;50% detected. Verify to trigger payout.</Text>
            </View>
          </View>
          <Pressable style={styles.verifyCta} onPress={() => setVerify(true)}>
            <Text style={styles.verifyCtaTxt}>Verify to Claim ₹200</Text>
          </Pressable>
          <View style={styles.divider} />
        </>
      )}

      <Text style={styles.sectionLabel}>FORECAST</Text>
      <View style={styles.card}>
        {data.forecast.map((f, i) => (
          <View key={f.day} style={[styles.foreRow, i < data.forecast.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
            <Text style={styles.foreName}>{f.day}</Text>
            <Text style={[styles.foreStatus, { color: f.status === 'good' ? colors.green : colors.amber }]}>{f.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: c.bg },
  content:      { paddingHorizontal: 24, paddingBottom: 96 },
  eyebrow:      { fontFamily: fonts.mono, fontSize: 11, color: c.muted, fontStyle: 'italic' },
  hero:         { fontSize: 40, fontWeight: '900', color: c.text, letterSpacing: -1.5, lineHeight: 44, marginTop: 4 },
  sub:          { fontFamily: fonts.mono, fontSize: 11, color: c.faint, marginTop: 6, fontStyle: 'italic' },
  divider:      { height: 1, backgroundColor: c.border, marginVertical: 16 },
  statGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard:     { flex: 1, minWidth: '45%', backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: 14 },
  statLbl:      { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 0.8, marginBottom: 6 },
  statVal:      { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statSub:      { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 3, fontStyle: 'italic' },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1.2, marginBottom: 10 },
  card:         { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  barRow:       { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  barLabel:     { fontFamily: fonts.mono, fontSize: 9, color: c.muted, width: 28 },
  barVal:       { fontFamily: fonts.mono, fontSize: 9, width: 18, textAlign: 'right' },
  greenAlert:   { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.2)', borderRadius: 16 },
  alertBar:     { width: 3, borderRadius: 2 },
  alertTitle:   { fontSize: 13, fontWeight: '700' },
  alertDesc:    { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 2, fontStyle: 'italic' },
  verifyCta:    { marginTop: 10, paddingVertical: 14, backgroundColor: c.green, borderRadius: 16, alignItems: 'center' },
  verifyCtaTxt: { fontSize: 14, fontWeight: '700', color: '#0E0E12', letterSpacing: -0.2 },
  foreRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  foreName:     { fontSize: 13, fontWeight: '600', color: c.text2 },
  foreStatus:   { fontFamily: fonts.mono, fontSize: 10 },
});
