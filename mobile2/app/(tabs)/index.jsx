import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ScrollView, View, Text, StyleSheet, Animated, Pressable, Dimensions,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { api, MOCK } from '../../src/api';

const SW = Dimensions.get('window').width;

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
  const { colors } = useTheme();
  return (
    <View style={{ width: 14, height: 14, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 14, height: 14, borderRadius: 7, backgroundColor: colors.greenDim }, { transform: [{ scale: pulse }] }]} />
      <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green }} />
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

const GTS_TIER = {
  high:   { label: 'HIGH' },
  medium: { label: 'MED'  },
  low:    { label: 'LOW'  },
};

function GigTrustCard({ gts }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeGtsStyles(colors), [colors]);

  const tierKey = gts?.tier || 'high';
  const tierLabel = GTS_TIER[tierKey]?.label || 'HIGH';
  const tierColor = tierKey === 'high' ? colors.green : tierKey === 'medium' ? colors.amber : colors.coral;
  const tierBg    = tierKey === 'high' ? colors.greenDim : tierKey === 'medium' ? colors.amberDim : colors.coralDim;

  const score = gts?.score || 742;
  const [count, setCount] = useState(0);

  useEffect(() => {
    const dur = 1400, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setCount(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const CIRC = Math.PI * 38;
  const fill = ((score - 300) / 600) * CIRC;

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <Svg width={90} height={52} viewBox="0 0 100 56">
          <Path d="M 12 52 A 38 38 0 0 1 88 52" stroke={colors.track} strokeWidth={10} strokeLinecap="round" fill="none" />
          <Path
            d="M 12 52 A 38 38 0 0 1 88 52"
            stroke={tierColor}
            strokeWidth={10}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${fill} ${CIRC}`}
          />
        </Svg>
        <View style={styles.scoreWrap}>
          <Text style={[styles.score, { color: tierColor }]}>{count}</Text>
        </View>
      </View>
      <View style={styles.right}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 7, marginBottom: 5 }}>
          <View style={[styles.badge, { backgroundColor: tierBg }]}>
            <Text style={[styles.badgeTxt, { color: tierColor }]}>{tierLabel}</Text>
          </View>
          <Text style={styles.trend}>{gts?.trend || '+12 this week'}</Text>
        </View>
        <Text style={styles.mode}>{gts?.payoutMode || 'Instant payout unlocked'}</Text>
        <Text style={styles.range}>Score range 300 – 900</Text>
      </View>
    </View>
  );
}

const makeGtsStyles = (c) => StyleSheet.create({
  card:      { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg },
  left:      { position: 'relative', width: 90, height: 52 },
  scoreWrap: { position: 'absolute', bottom: -2, left: 0, right: 0, alignItems: 'center' },
  score:     { fontSize: 18, fontWeight: '900', letterSpacing: -0.5 },
  right:     { flex: 1 },
  badge:     { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  badgeTxt:  { fontFamily: fonts.mono, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  trend:     { fontFamily: fonts.mono, fontSize: 9, color: c.green },
  mode:      { fontSize: 13, fontWeight: '700', color: c.text, marginBottom: 3 },
  range:     { fontFamily: fonts.mono, fontSize: 10, color: c.faint, fontStyle: 'italic' },
});

const shieldLabels = { rain: 'Rain', lowOrders: 'Low Orders', pollution: 'Pollution', curfew: 'Curfew' };

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [d, setD] = useState(MOCK.dashboard);
  const [dismissed, setDismissed] = useState([]);
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
  const shieldColors = { rain: colors.blue, lowOrders: colors.green, pollution: colors.amber, curfew: colors.purple };

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

        <Text style={styles.eyebrow}>{d.user?.name} · {d.user?.platform}</Text>
        <AnimatedNumber target={d.weeklyProtected || 1240} style={styles.heroAmt} />
        <Text style={styles.heroSub}>shielded this week</Text>

        <View style={styles.liveRow}>
          <LiveDot />
          <Text style={styles.liveTxt}>PROTECTED</Text>
        </View>

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

        {(d.alerts || []).filter(a => !dismissed.includes(a.id)).map(a => (
          <View key={a.id} style={[styles.alertStrip, { marginBottom: 8 }]}>
            <View style={styles.alertBar} />
            <View style={{ flex: 1 }}>
              <Text style={styles.alertTitle}>{a.title}</Text>
              <Text style={styles.alertDesc}>{a.message}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 6 }}>
              <Pressable onPress={() => setDismissed(p => [...p, a.id])} style={styles.dismissBtn}>
                <Text style={{ color: colors.muted, fontSize: 10, lineHeight: 12 }}>✕</Text>
              </Pressable>
              <View style={styles.alertBadge}>
                <Text style={styles.alertBadgeTxt}>{a.badge}</Text>
              </View>
            </View>
          </View>
        ))}

        <View style={styles.divider} />

        <Text style={styles.sectionLabel}>ACTIVE SHIELDS</Text>
        <View style={styles.card}>
          {Object.entries(protection).map(([key, status], i, arr) => (
            <View key={key} style={[styles.shieldRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
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

        <Text style={styles.sectionLabel}>GIGTRUST SCORE</Text>
        <GigTrustCard gts={d.gigTrust} />

        <View style={styles.divider} />
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>Money is added automatically.{'\n'}No application needed.</Text>
        </View>
        <View style={{ height: 24 }} />
      </Animated.View>
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: c.bg },
  content:       { paddingHorizontal: 24, paddingBottom: 96 },
  eyebrow:       { fontFamily: fonts.mono, fontSize: 11, color: c.muted, letterSpacing: 0.2, fontStyle: 'italic' },
  heroAmt:       { fontSize: Math.min(52, SW * 0.13), fontWeight: '900', color: c.text, letterSpacing: -2, lineHeight: Math.min(56, SW * 0.14), marginTop: 4 },
  heroSub:       { fontFamily: fonts.mono, fontSize: 11, color: c.faint, marginTop: 4, fontStyle: 'italic' },
  liveRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  liveTxt:       { fontFamily: fonts.mono, fontSize: 10, color: c.green, letterSpacing: 1 },
  progWrap:      { marginTop: 16 },
  progHeader:    { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 7 },
  progLbl:       { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1 },
  progVal:       { fontFamily: fonts.mono, fontSize: 9, color: c.muted },
  progTrack:     { height: 3, backgroundColor: c.track, borderRadius: 2 },
  progFill:      { height: '100%', backgroundColor: c.text, borderRadius: 2 },
  divider:       { height: 1, backgroundColor: c.border, marginVertical: 16 },
  alertStrip:    { flexDirection: 'row', gap: 12, alignItems: 'stretch', padding: 14, backgroundColor: 'rgba(232,132,58,0.06)', borderWidth: 1, borderColor: 'rgba(232,132,58,0.2)', borderRadius: 16 },
  alertBar:      { width: 3, backgroundColor: c.coral, borderRadius: 2 },
  alertTitle:    { fontSize: 13, fontWeight: '700', color: c.coral },
  alertDesc:     { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 2, fontStyle: 'italic' },
  alertBadge:    { paddingHorizontal: 10, paddingVertical: 4, backgroundColor: c.coral, borderRadius: 20, alignSelf: 'center' },
  alertBadgeTxt: { fontFamily: fonts.mono, fontSize: 8, color: '#fff', letterSpacing: 0.5 },
  sectionLabel:  { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1.2, marginBottom: 10 },
  card:          { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  shieldRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  shieldLeft:    { flexDirection: 'row', alignItems: 'center', gap: 10 },
  shieldDot:     { width: 7, height: 7, borderRadius: 3.5 },
  shieldName:    { fontSize: 14, fontWeight: '600', color: c.text2 },
  shieldStatus:  { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.5 },
  payoutCard:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg },
  payoutLabel:   { fontFamily: fonts.mono, fontSize: 10, color: c.faint, fontStyle: 'italic' },
  payoutAmt:     { fontSize: 32, fontWeight: '900', color: c.green, letterSpacing: -1, lineHeight: 36, marginTop: 2 },
  payoutMeta:    { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 3, fontStyle: 'italic' },
  checkRing:     { width: 38, height: 38, borderRadius: 19, borderWidth: 2, borderColor: c.green, alignItems: 'center', justifyContent: 'center' },
  dismissBtn:    { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: c.border2, alignItems: 'center', justifyContent: 'center' },
  noteCard:      { padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.15)', borderRadius: 14 },
  noteText:      { fontFamily: fonts.mono, fontSize: 11, color: c.muted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
});
