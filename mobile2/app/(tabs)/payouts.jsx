import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Animated, Dimensions } from 'react-native';
import Svg, { Path, Line, Circle } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { api, MOCK } from '../../src/api';

const SW = Dimensions.get('window').width;

function RainIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Path d="M5 13a4 4 0 01.5-7.9A5 5 0 0115 8h.5a3 3 0 010 6H5z"/>
      <Line x1="7" y1="16" x2="7" y2="18"/><Line x1="10" y1="16" x2="10" y2="18"/><Line x1="13" y1="16" x2="13" y2="18"/>
    </Svg>
  );
}
function ScooterIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="5" cy="15" r="2"/><Circle cx="15" cy="15" r="2"/>
      <Path d="M3 15H2V11l3-5h5v5H5"/><Path d="M10 11h5l2 4h-4"/><Path d="M10 6h3"/>
    </Svg>
  );
}
function CurfewIcon({ color }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <Circle cx="10" cy="10" r="7"/>
      <Line x1="10" y1="3" x2="10" y2="10"/><Line x1="10" y1="10" x2="14" y2="10"/>
    </Svg>
  );
}

const FILTERS = ['all', 'rain', 'lowOrders', 'curfew'];
const FILTER_LABELS = { all: 'All', rain: 'Rain', lowOrders: 'Low Orders', curfew: 'Curfew' };

function AnimatedTotal({ target }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
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

function PayoutRow({ p, isLast }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [expanded, setExpanded] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;

  const TYPE_META = {
    rain:      { label: 'Rain',       color: colors.blue,   bg: colors.blueDim,   Icon: RainIcon    },
    lowOrders: { label: 'Low Orders', color: colors.amber,  bg: colors.amberDim,  Icon: ScooterIcon },
    curfew:    { label: 'Curfew',     color: colors.purple, bg: colors.purpleDim, Icon: CurfewIcon  },
  };

  const meta = TYPE_META[p.type] || TYPE_META.rain;
  const { Icon } = meta;
  const isPaid = p.status !== 'rejected' && p.status !== 'held';

  function toggle() {
    Animated.timing(anim, { toValue: expanded ? 0 : 1, duration: 200, useNativeDriver: false }).start();
    setExpanded(e => !e);
  }

  const detailHeight = anim.interpolate({ inputRange: [0, 1], outputRange: [0, 94] });

  return (
    <View style={[styles.payoutWrap, !isLast && styles.payoutBorder]}>
      <Pressable style={styles.payoutItem} onPress={toggle}>
        <View style={[styles.iconWrap, { backgroundColor: meta.bg }]}>
          <Icon color={meta.color} />
        </View>
        <View style={styles.payoutInfo}>
          <Text style={styles.payoutReason}>{p.reason}</Text>
          <Text style={styles.payoutDate}>{p.date} · {p.time}</Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 4 }}>
          <Text style={[styles.payoutAmt, !isPaid && { color: colors.muted, textDecorationLine: 'line-through' }]}>
            +₹{p.amount}
          </Text>
          <View style={[styles.statusPill, { backgroundColor: isPaid ? colors.greenDim : colors.amberDim, borderColor: isPaid ? 'rgba(62,201,122,0.25)' : 'rgba(232,184,74,0.25)' }]}>
            <Text style={[styles.statusTxt, { color: isPaid ? colors.green : colors.amber }]}>
              {p.status === 'held' ? 'Held' : 'Paid'}
            </Text>
          </View>
        </View>
      </Pressable>

      <Animated.View style={{ height: detailHeight, overflow: 'hidden' }}>
        <View style={styles.detailInner}>
          {[
            { k: 'TRIGGER', v: meta.label,                        c: meta.color     },
            { k: 'METHOD',  v: p.auto ? 'Automatic' : 'Verified', c: colors.text2   },
            { k: 'AMOUNT',  v: `₹${p.amount}`,                    c: colors.text2   },
            { k: 'STATUS',  v: isPaid ? 'Credited to UPI' : p.status === 'held' ? 'Under review' : 'Rejected', c: isPaid ? colors.green : colors.amber },
          ].map(({ k, v, c }) => (
            <View key={k} style={styles.detailRow}>
              <Text style={styles.detailKey}>{k}</Text>
              <Text style={[styles.detailVal, { color: c }]}>{v}</Text>
            </View>
          ))}
        </View>
      </Animated.View>
    </View>
  );
}

export default function PayoutsScreen() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [data, setData] = useState(MOCK.payouts);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    api.payouts().then(d => { if (d) setData(d); });
  }, []);

  const TYPE_META_COLORS = {
    rain: colors.blue, lowOrders: colors.amber, curfew: colors.purple,
  };

  const payouts = data.payouts || [];
  const filtered = filter === 'all' ? payouts : payouts.filter(p => p.type === filter);

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
        <Text style={styles.liveTxt}>AUTO-PROCESSED · UPI</Text>
      </View>

      <View style={styles.divider} />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }} contentContainerStyle={styles.filterRow}>
        {FILTERS.map(f => {
          const active = filter === f;
          const col = f === 'all' ? colors.green : (TYPE_META_COLORS[f] || colors.muted);
          return (
            <Pressable key={f} style={[styles.filterBtn, active && { backgroundColor: col + '22', borderColor: col + '66' }]} onPress={() => setFilter(f)}>
              <Text style={[styles.filterTxt, { color: active ? col : colors.muted, fontWeight: active ? '600' : '400' }]}>{FILTER_LABELS[f]}</Text>
            </Pressable>
          );
        })}
      </ScrollView>

      <Text style={styles.sectionLabel}>PAYOUT HISTORY</Text>

      {filtered.length === 0
        ? <Text style={styles.empty}>No {FILTER_LABELS[filter].toLowerCase()} payouts yet</Text>
        : <View style={styles.list}>
            {filtered.map((p, i) => <PayoutRow key={p.id} p={p} isLast={i === filtered.length - 1} />)}
          </View>
      }

      <View style={styles.divider} />
      <View style={styles.noteCard}>
        <Text style={styles.noteTxt}>No need to apply.{'\n'}Money is added to your UPI automatically.</Text>
      </View>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: c.bg },
  content:      { paddingHorizontal: 24, paddingBottom: 96 },
  eyebrow:      { fontFamily: fonts.mono, fontSize: 11, color: c.muted, fontStyle: 'italic' },
  heroAmt:      { fontSize: Math.min(48, SW * 0.12), fontWeight: '900', color: c.text, letterSpacing: -2, lineHeight: Math.min(52, SW * 0.13), marginTop: 4 },
  sub:          { fontFamily: fonts.mono, fontSize: 11, color: c.faint, marginTop: 4, fontStyle: 'italic' },
  liveRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 10 },
  liveDot:      { width: 7, height: 7, borderRadius: 3.5, backgroundColor: c.green },
  liveTxt:      { fontFamily: fonts.mono, fontSize: 10, color: c.green, letterSpacing: 1 },
  divider:      { height: 1, backgroundColor: c.border, marginVertical: 16 },
  filterRow:    { flexDirection: 'row', gap: 8, paddingRight: 8 },
  filterBtn:    { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: c.border2 },
  filterTxt:    { fontFamily: fonts.mono, fontSize: 10, letterSpacing: 0.3 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1.2, marginBottom: 10 },
  list:         { borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, overflow: 'hidden', backgroundColor: c.surface },
  payoutWrap:   { paddingHorizontal: 16 },
  payoutBorder: { borderBottomWidth: 1, borderBottomColor: c.border },
  payoutItem:   { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  iconWrap:     { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  payoutInfo:   { flex: 1 },
  payoutReason: { fontSize: 13, fontWeight: '700', color: c.text },
  payoutDate:   { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 2 },
  payoutAmt:    { fontSize: 17, fontWeight: '900', color: c.green, letterSpacing: -0.5 },
  statusPill:   { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10, borderWidth: 1 },
  statusTxt:    { fontFamily: fonts.mono, fontSize: 8, letterSpacing: 0.3 },
  detailInner:  { backgroundColor: c.surface2, borderRadius: 12, padding: 12, marginBottom: 10, gap: 6 },
  detailRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 2 },
  detailKey:    { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 0.5 },
  detailVal:    { fontSize: 11, fontWeight: '600' },
  empty:        { textAlign: 'center', paddingVertical: 32, fontFamily: fonts.mono, fontSize: 12, color: c.muted, fontStyle: 'italic' },
  noteCard:     { padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.15)', borderRadius: 14 },
  noteTxt:      { fontFamily: fonts.mono, fontSize: 11, color: c.muted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
});
