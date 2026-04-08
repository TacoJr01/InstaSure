import React, { useEffect, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../src/theme';
import { api, MOCK } from '../src/api';

const ITEMS = [
  { key: 'rain',      label: 'Rain',       color: colors.blue   },
  { key: 'lowOrders', label: 'Low Orders', color: colors.green  },
  { key: 'pollution', label: 'Pollution',  color: colors.amber  },
  { key: 'curfew',    label: 'Curfew',     color: colors.purple },
];

const PRESETS = [0, 200, 300, 500, 800, 1000, 1500];

const COVERED = [
  { key: 'rain',      label: 'Rain · heavy downpour',  color: colors.blue,   status: 'Active'   },
  { key: 'lowOrders', label: 'Low demand orders',       color: colors.green,  status: 'Active'   },
  { key: 'curfew',    label: 'Curfew / city bandh',     color: colors.purple, status: 'Active'   },
  { key: 'pollution', label: 'Poor air quality',        color: colors.amber,  status: 'Watching' },
];

function CoverageRow({ item, value, onChange }) {
  return (
    <View style={row.wrap}>
      <View style={row.header}>
        <View style={[row.dot, { backgroundColor: item.color }]} />
        <Text style={row.name}>{item.label}</Text>
        <Text style={[row.amt, { color: item.color }]}>₹{value}</Text>
      </View>
      <View style={row.presets}>
        {PRESETS.map(p => (
          <Pressable
            key={p}
            style={[row.chip, value === p && { backgroundColor: item.color + '22', borderColor: item.color }]}
            onPress={() => { onChange(item.key, p); api.patchCoverage({ [item.key]: p }); }}
          >
            <Text style={[row.chipTxt, value === p && { color: item.color }]}>
              {p === 0 ? 'Off' : `₹${p}`}
            </Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const row = StyleSheet.create({
  wrap:     { paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#13131A' },
  header:   { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  dot:      { width: 7, height: 7, borderRadius: 3.5 },
  name:     { fontSize: 13, fontWeight: '600', color: colors.text2, flex: 1 },
  amt:      { fontFamily: fonts.mono, fontSize: 13, fontWeight: '600' },
  presets:  { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip:     { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1, borderColor: colors.border2 },
  chipTxt:  { fontFamily: fonts.mono, fontSize: 9, color: colors.muted },
});

export default function CoverageScreen() {
  const insets = useSafeAreaInsets();
  const [vals, setVals] = useState(MOCK.coverage);

  useEffect(() => {
    api.coverage().then(d => {
      if (d) setVals({ rain: d.rain, lowOrders: d.lowOrders, pollution: d.pollution, curfew: d.curfew });
    });
  }, []);

  const total = Object.values(vals).reduce((a, b) => a + b, 0);

  const handleChange = (key, val) => setVals(p => ({ ...p, [key]: val }));

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.eyebrow}>your plan</Text>
      <Text style={styles.hero}>₹40</Text>
      <Text style={styles.sub}>per week · up to ₹1,500 support</Text>

      <View style={styles.pillRow}>
        <View style={styles.pillDark}><Text style={styles.pillDarkTxt}>Chennai · Velachery</Text></View>
        <View style={styles.pillCoral}><Text style={styles.pillCoralTxt}>Active</Text></View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>COVERAGE CONTROLS</Text>

      <View style={styles.card}>
        {ITEMS.map(item => (
          <CoverageRow key={item.key} item={item} value={vals[item.key]} onChange={handleChange} />
        ))}
        <View style={styles.totalRow}>
          <Text style={styles.totalLbl}>total coverage</Text>
          <Text style={styles.totalVal}>₹{total.toLocaleString('en-IN')}</Text>
        </View>
      </View>

      <View style={styles.divider} />
      <Text style={styles.sectionLabel}>WHAT'S COVERED</Text>

      <View style={styles.card}>
        {COVERED.map(({ key, label, color, status }, i) => (
          <View key={key} style={[styles.covRow, i < COVERED.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#13131A' }]}>
            <View style={styles.covLeft}>
              <View style={[styles.dot, { backgroundColor: color }]} />
              <Text style={styles.covName}>{label}</Text>
            </View>
            <Text style={[styles.covStatus, { color }]}>{status}</Text>
          </View>
        ))}
      </View>

      <View style={styles.note}>
        <Text style={styles.noteTxt}>Plan adapts to your area risk automatically</Text>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: colors.bg },
  content:      { paddingHorizontal: 24 },
  eyebrow:      { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, fontStyle: 'italic' },
  hero:         { fontSize: 52, fontWeight: '900', color: colors.text, letterSpacing: -2, lineHeight: 56, marginTop: 4 },
  sub:          { fontFamily: fonts.mono, fontSize: 11, color: colors.faint, fontStyle: 'italic', marginTop: 4 },
  pillRow:      { flexDirection: 'row', gap: 8, marginTop: 12 },
  pillDark:     { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border2 },
  pillDarkTxt:  { fontFamily: fonts.mono, fontSize: 9, color: colors.text2 },
  pillCoral:    { paddingHorizontal: 12, paddingVertical: 5, borderRadius: 20, backgroundColor: colors.coral },
  pillCoralTxt: { fontFamily: fonts.mono, fontSize: 9, color: '#fff', fontWeight: '500' },
  divider:      { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.2, marginBottom: 10 },
  card:         { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  totalRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline', paddingVertical: 14 },
  totalLbl:     { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, fontStyle: 'italic' },
  totalVal:     { fontSize: 22, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  covRow:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10 },
  covLeft:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:          { width: 7, height: 7, borderRadius: 3.5 },
  covName:      { fontSize: 13, fontWeight: '600', color: colors.text2 },
  covStatus:    { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.3 },
  note:         { padding: 12, backgroundColor: 'rgba(155,122,232,0.06)', borderWidth: 1, borderColor: 'rgba(155,122,232,0.15)', borderRadius: 14, marginTop: 14 },
  noteTxt:      { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, textAlign: 'center', fontStyle: 'italic' },
});
