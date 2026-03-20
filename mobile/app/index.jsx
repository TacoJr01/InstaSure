import React, { useEffect, useRef, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Animated, Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../src/theme';
import { api, MOCK } from '../src/api';

function LiveDot() {
  const pulse = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.6, duration: 900, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();
  }, []);
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[styles.dotRing, { transform: [{ scale: pulse }] }]} />
      <View style={styles.dotCore} />
    </View>
  );
}

function AnimatedNumber({ target, style }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1200;
    const start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      setVal(Math.round(target * ease));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <Text style={style}>₹{val.toLocaleString('en-IN')}</Text>;
}

const shieldColors = {
  rain: colors.blue, lowOrders: colors.green,
  pollution: colors.amber, curfew: colors.purple,
};
const shieldLabels = { rain: 'Rain', lowOrders: 'Low Orders', pollution: 'Pollution', curfew: 'Curfew' };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [d, setD] = useState(MOCK.dashboard);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    api.dashboard().then(data => { if (data) setD(data); });
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
  }, []);

  const protection = d.protection || {};

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        {/* Greeting */}
        <Text style={styles.eyebrow}>{d.user?.name} · {d.user?.platform}</Text>

        {/* Hero amount */}
        <AnimatedNumber target={d.weeklyProtected || 1240} style={styles.heroAmt} />
        <Text style={styles.heroSub}>shielded this week</Text>

        {/* Live badge */}
        <View style={styles.liveRow}>
          <LiveDot />
          <Text style={styles.liveTxt}>PROTECTED</Text>
        </View>

        {/* Progress */}
        <View style={styles.progWrap}>
          <View style={styles.progHeader}>
            <Text style={styles.progLbl}>WEEKLY USAGE</Text>
            <Text style={styles.progVal}>{d.weeklyUsagePct}%</Text>
          </View>
          <View style={styles.progTrack}>
            <Animated.View style={[styles.progFill, { width: `${d.weeklyUsagePct}%` }]} />
          </View>
        </View>

        <View style={styles.divider} />

        {/* Alerts */}
        {(d.alerts || []).map(a => (
          <View key={a.id} style={styles.alertStrip}>
            <View style={styles.alertBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <Text style={styles.alertDesc}>{a.message}</Text>
            </View>
            <View style={styles.alertBadge}>
              <Text style={styles.alertBadgeTxt}>{a.badge}</Text>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        {/* Shields */}
        <Text style={styles.sectionLabel}>ACTIVE SHIELDS</Text>
        <View style={styles.card}>
          {Object.entries(protection).map(([key, status], i, arr) => (
            <View key={key} style={[styles.shieldRow, i < arr.length - 1 && styles.shieldBorder]}>
              <View style={styles.shieldLeft}>
                <View style={[styles.shieldDot, { backgroundColor: shieldColors[key] }]} />
                <Text style={styles.shieldName}>{shieldLabels[key]}</Text>
              </View>
              <Text style={[styles.shieldStatus, { color: status === 'active' ? shieldColors[key] : colors.amber }]}>
                {status === 'active' ? 'ON' : '—'}
              </Text>
            </View>
          ))}
        </View>

        <View style={styles.divider} />

        {/* Last payout */}
        <Text style={styles.sectionLabel}>LAST PAYOUT</Text>
        <Pressable style={styles.payoutCard}>
          <View>
            <Text style={styles.payoutLabel}>last payout</Text>
            <Text style={styles.payoutAmt}>+₹{d.lastPayout?.amount}</Text>
            <Text style={styles.payoutMeta}>{d.lastPayout?.reason} · {d.lastPayout?.date} · Auto</Text>
          </View>
          <View style={styles.checkRing}>
            <Text style={{ color: colors.green, fontSize: 16, fontWeight: '700' }}>✓</Text>
          </View>
        </Pressable>

        <View style={styles.divider} />
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>Money is added automatically.{'\n'}No application needed.</Text>
        </View>
        <View style={{ height: 24 }} />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24, paddingBottom: 16 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, letterSpacing: 0.2, fontStyle: 'italic' },
  heroAmt: { fontSize: 52, fontWeight: '900', color: colors.text, letterSpacing: -2, lineHeight: 56, marginTop: 4 },
  heroSub: { fontFamily: fonts.mono, fontSize: 11, color: colors.faint, marginTop: 4, fontStyle: 'italic' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  dotRing: { position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.greenDim },
  dotCore: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
  liveTxt: { fontFamily: fonts.mono, fontSize: 10, color: colors.green, letterSpacing: 1 },
  progWrap: { marginTop: 16 },
  progHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progLbl: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1 },
  progVal: { fontFamily: fonts.mono, fontSize: 9, color: colors.muted },
  progTrack: { height: 3, backgroundColor: '#1C1C24', borderRadius: 2 },
  progFill: { height: '100%', backgroundColor: colors.text, borderRadius: 2 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  alertStrip: { flexDirection: 'row', gap: 12, alignItems: 'stretch', padding: 14, backgroundColor: 'rgba(232,132,58,0.06)', borderWidth: 1, borderColor: 'rgba(232,132,58,0.2)', borderRadius: 16 },
  alertBar: { width: 3, backgroundColor: colors.coral, borderRadius: 2 },
  alertTitle: { fontSize: 13, fontWeight: '700', color: colors.coral },
  alertDesc: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 2, fontStyle: 'italic' },
  alertBadge: { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: colors.coral, borderRadius: 20, alignSelf: 'center' },
  alertBadgeTxt: { fontFamily: fonts.mono, fontSize: 8, color: '#fff', letterSpacing: 0.5 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.2, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  shieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  shieldBorder: { borderBottomWidth: 1, borderBottomColor: '#13131A' },
  shieldLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shieldDot: { width: 7, height: 7, borderRadius: 3.5 },
  shieldName: { fontSize: 14, fontWeight: '600', color: colors.text2 },
  shieldStatus: { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  payoutCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg },
  payoutLabel: { fontFamily: fonts.mono, fontSize: 10, color: colors.faint, fontStyle: 'italic' },
  payoutAmt: { fontSize: 32, fontWeight: '900', color: colors.green, letterSpacing: -1, lineHeight: 36, marginTop: 2 },
  payoutMeta: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 3, fontStyle: 'italic' },
  checkRing: { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: colors.green, alignItems: 'center', justifyContent: 'center' },
  noteCard: { padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.15)', borderRadius: 14 },
  noteText: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
});
