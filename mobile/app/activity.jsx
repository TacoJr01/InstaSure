import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../src/theme';
import { api, MOCK } from '../src/api';

function AnimatedBar({ pct, color, delay }) {
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: pct, duration: 700, delay, useNativeDriver: false }).start();
  }, [pct]);
  return (
    <View style={bar.track}>
      <Animated.View style={[bar.fill, { width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }), backgroundColor: color }]} />
    </View>
  );
}
const bar = StyleSheet.create({
  track: { flex: 1, height: 8, backgroundColor: '#1C1C24', borderRadius: 4, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4 },
});

export default function ActivityScreen() {
  const insets = useSafeAreaInsets();
  const [data, setData] = useState(MOCK.activity);

  useEffect(() => {
    api.activity().then(d => { if (d) setData(d); });
  }, []);

  const maxOrders = Math.max(...data.week.map(w => w.orders));

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

      {/* Stat grid */}
      <View style={styles.statGrid}>
        {[
          { label: 'TODAY', val: String(data.todayOrders), color: colors.coral, sub: 'orders so far' },
          { label: 'NORMAL', val: String(data.normalOrders), color: colors.text, sub: 'avg / day' },
          { label: 'DROP', val: `${data.dropPercent}%`, color: colors.amber, sub: 'below avg' },
          { label: 'STATUS', val: data.compensationEligible ? '✓' : '—', color: colors.green, sub: 'eligible' },
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
              <AnimatedBar
                pct={(w.orders / maxOrders) * 100}
                color={isToday ? colors.coral : colors.text2}
                delay={200 + i * 80}
              />
              <Text style={[styles.barVal, { color: isToday ? colors.coral : colors.muted }]}>{w.orders}</Text>
            </View>
          );
        })}
      </View>

      <View style={styles.divider} />

      {data.compensationEligible && (
        <View style={styles.greenAlert}>
          <View style={[styles.alertBar, { backgroundColor: colors.green }]} />
          <View>
            <Text style={[styles.alertTitle, { color: colors.green }]}>Compensation likely</Text>
            <Text style={styles.alertDesc}>Drop &gt;50% detected. Payout processing.</Text>
          </View>
        </View>
      )}

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>FORECAST</Text>

      <View style={styles.card}>
        {data.forecast.map((f, i) => (
          <View key={f.day} style={[styles.foreRow, i < data.forecast.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#13131A' }]}>
            <Text style={styles.foreName}>{f.day}</Text>
            <Text style={[styles.foreStatus, { color: f.status === 'good' ? colors.green : colors.amber }]}>{f.label}</Text>
          </View>
        ))}
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 24 },
  eyebrow: { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, fontStyle: 'italic' },
  hero: { fontSize: 40, fontWeight: '900', color: colors.text, letterSpacing: -1.5, lineHeight: 44, marginTop: 4 },
  sub: { fontFamily: fonts.mono, fontSize: 11, color: colors.faint, marginTop: 6, fontStyle: 'italic' },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  statGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: { flex: 1, minWidth: '45%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  statLbl: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 0.8, marginBottom: 6 },
  statVal: { fontSize: 24, fontWeight: '900', letterSpacing: -0.5 },
  statSub: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 3, fontStyle: 'italic' },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.2, marginBottom: 10 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 7 },
  barLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.muted, width: 28 },
  barVal: { fontFamily: fonts.mono, fontSize: 9, width: 18, textAlign: 'right' },
  greenAlert: { flexDirection: 'row', gap: 12, padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.2)', borderRadius: 16 },
  alertBar: { width: 3, borderRadius: 2 },
  alertTitle: { fontSize: 13, fontWeight: '700' },
  alertDesc: { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 2, fontStyle: 'italic' },
  foreRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  foreName: { fontSize: 13, fontWeight: '600', color: colors.text2 },
  foreStatus: { fontFamily: fonts.mono, fontSize: 10 },
});
