import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated, Pressable } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../src/theme';
import { api, MOCK } from '../src/api';

function RainIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 13a4 4 0 01.5-7.9A5 5 0 0115 8h.5a3 3 0 010 6H5z"/>
      <Line x1="7" y1="16" x2="7" y2="18"/><Line x1="10" y1="16" x2="10" y2="18"/><Line x1="13" y1="16" x2="13" y2="18"/>
    </Svg>
  );
}

function ScooterIcon({ color }) {
  return (
    <Svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="5" cy="15" r="2"/><Circle cx="15" cy="15" r="2"/>
      <Path d="M3 15H2V11l3-5h5v5H5"/><Path d="M10 11h5l2 4h-4"/><Path d="M10 6h3"/>
    </Svg>
  );
}

function AnimatedTotal({ target }) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const dur = 1000, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setVal(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [target]);
  return <Text style={styles.heroAmt}>₹{val.toLocaleString('en-IN')}</Text>;
}

export default function PayoutsScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(MOCK.payouts);

  useEffect(() => {
    api.payouts().then(d => { if (d) setData(d); });
  }, []);

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>your earnings</Text>
      <AnimatedTotal target={data.total} />
      <Text style={styles.sub}>received this week · {data.count} payouts</Text>

      <View style={styles.liveRow}>
        <View style={styles.liveDot} />
        <Text style={styles.liveTxt}>AUTO-PROCESSED</Text>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>PAYOUT HISTORY</Text>

      {data.payouts.map((p, i) => (
        <Pressable
          key={p.id}
          style={[styles.payoutItem, { opacity: i > 1 ? 0.45 : 1 }, i < data.payouts.length - 1 && styles.payoutBorder]}
        >
          <View style={[styles.iconWrap, { backgroundColor: p.type === 'rain' ? colors.blueDim : colors.amberDim }]}>
            {p.type === 'rain' ? <RainIcon color={colors.blue} /> : <ScooterIcon color={colors.amber} />}
          </View>
          <View style={styles.payoutInfo}>
            <Text style={styles.payoutReason}>{p.reason}</Text>
            <Text style={styles.payoutDate}>{p.date} · {p.time} · Auto</Text>
          </View>
          <Text style={styles.payoutAmt}>+₹{p.amount}</Text>
        </Pressable>
      ))}

      <View style={styles.divider} />
      <View style={styles.noteCard}>
        <Text style={styles.noteTxt}>No need to apply.{'\n'}Money is added to your UPI automatically.</Text>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, fontStyle: 'italic' },
  heroAmt: { fontSize: 48, fontWeight: '900', color: colors.text, letterSpacing: -2, lineHeight: 52, marginTop: 4 },
  sub: { fontFamily: fonts.mono, fontSize: 11, color: colors.faint, marginTop: 4, fontStyle: 'italic' },
  liveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  liveDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.green },
  liveTxt: { fontFamily: fonts.mono, fontSize: 10, color: colors.green, letterSpacing: 1 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.2, marginBottom: 10 },
  payoutItem: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  payoutBorder: { borderBottomWidth: 1, borderBottomColor: colors.border },
  iconWrap: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  payoutInfo: { flex: 1 },
  payoutReason: { fontSize: 13, fontWeight: '700', color: colors.text },
  payoutDate: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 2 },
  payoutAmt: { fontSize: 18, fontWeight: '900', color: colors.green, letterSpacing: -0.5 },
  noteCard: { padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.15)', borderRadius: 14 },
  noteTxt: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
});
