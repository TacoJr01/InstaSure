import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../../src/theme';
import { useTheme } from '../../src/ThemeContext';
import { api, MOCK } from '../../src/api';
import { useAuth } from '../../src/AuthContext';

function Toggle({ on, onToggle }) {
  const { colors } = useTheme();
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: on ? 1 : 0, useNativeDriver: false, stiffness: 500, damping: 30 }).start();
  }, [on]);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: [colors.surface2, colors.green] });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <Pressable onPress={onToggle}>
      <Animated.View style={{ width: 46, height: 26, borderRadius: 13, justifyContent: 'center', backgroundColor: bg }}>
        <Animated.View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute', transform: [{ translateX: tx }] }} />
      </Animated.View>
    </Pressable>
  );
}

function AnimatedBar({ score, color, delay }) {
  const { colors } = useTheme();
  const width = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.timing(width, { toValue: score, duration: 800, delay, useNativeDriver: false }).start();
  }, [score]);
  return (
    <View style={{ flex: 1, height: 5, backgroundColor: colors.track, borderRadius: 3, overflow: 'hidden' }}>
      <Animated.View style={{ height: '100%', borderRadius: 3, backgroundColor: color, width: width.interpolate({ inputRange: [0, 100], outputRange: ['0%', '100%'] }) }} />
    </View>
  );
}

function GigTrustSection({ gts }) {
  const { colors } = useTheme();
  const styles = useMemo(() => makeGtsStyles(colors), [colors]);
  const [count, setCount] = useState(0);
  const score = gts?.score || 742;
  const tierKey = gts?.tier || 'high';
  const tierColor = tierKey === 'high' ? colors.green : tierKey === 'medium' ? colors.amber : colors.coral;
  const tierBg    = tierKey === 'high' ? colors.greenDim : tierKey === 'medium' ? colors.amberDim : colors.coralDim;
  const tierLabel = tierKey === 'high' ? 'HIGH' : tierKey === 'medium' ? 'MEDIUM' : 'LOW';
  const tierDesc  = tierKey === 'high' ? 'Instant payouts' : tierKey === 'medium' ? 'Partial / delayed' : 'Under review';

  useEffect(() => {
    const dur = 1400, start = Date.now();
    const tick = () => {
      const p = Math.min((Date.now() - start) / dur, 1);
      setCount(Math.round(score * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [score]);

  const CIRC = Math.PI * 52;
  const fill = ((score - 300) / 600) * CIRC;

  return (
    <View style={styles.card}>
      {/* Arc gauge */}
      <View style={styles.gaugeWrap}>
        <Svg width={130} height={74} viewBox="0 0 160 90" fill="none">
          <Path d="M 8 88 A 72 72 0 0 1 152 88" stroke={colors.track} strokeWidth={12} strokeLinecap="round" fill="none" />
          <Path
            d="M 8 88 A 72 72 0 0 1 152 88"
            stroke={tierColor}
            strokeWidth={12}
            strokeLinecap="round"
            fill="none"
            strokeDasharray={`${fill * (Math.PI * 72) / CIRC} ${Math.PI * 72}`}
          />
          <Path d="M 4 88" stroke="none" />
        </Svg>
        <View style={styles.gaugeCenter}>
          <Text style={[styles.gaugeScore, { color: tierColor }]}>{count}</Text>
          <View style={[styles.gaugeTierBadge, { backgroundColor: tierBg }]}>
            <Text style={[styles.gaugeTierTxt, { color: tierColor }]}>{tierLabel}</Text>
          </View>
        </View>
      </View>

      {/* Mode + trend */}
      <View style={styles.gtsInfo}>
        <View style={styles.gtsModeRow}>
          <Text style={styles.gtsModeLabel}>{gts?.payoutMode || 'Instant payout unlocked'}</Text>
          <Text style={styles.gtsTrend}>{gts?.trend || '+12 this week'}</Text>
        </View>
        <Text style={[styles.gtsDesc, { color: tierColor }]}>{tierDesc}</Text>
      </View>

      {/* Component breakdown */}
      {(gts?.components || []).length > 0 && (
        <View style={styles.components}>
          {(gts.components).map((c, i) => {
            const barColor = c.score >= 85 ? colors.green : c.score >= 70 ? colors.amber : colors.coral;
            return (
              <View key={c.key} style={styles.compRow}>
                <Text style={styles.compLabel}>{c.label}</Text>
                <AnimatedBar score={c.score} color={barColor} delay={300 + i * 60} />
                <Text style={styles.compScore}>{c.score}</Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const makeGtsStyles = (c) => StyleSheet.create({
  card:         { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, padding: 16, overflow: 'hidden' },
  gaugeWrap:    { alignItems: 'center', position: 'relative', marginBottom: 4 },
  gaugeCenter:  { position: 'absolute', bottom: 2, left: 0, right: 0, alignItems: 'center', gap: 4 },
  gaugeScore:   { fontSize: 26, fontWeight: '900', letterSpacing: -1, lineHeight: 28 },
  gaugeTierBadge:{ paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20 },
  gaugeTierTxt: { fontFamily: fonts.mono, fontSize: 8, fontWeight: '700', letterSpacing: 0.8 },
  gtsInfo:      { marginTop: 4, marginBottom: 12 },
  gtsModeRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  gtsModeLabel: { fontSize: 13, fontWeight: '700', color: c.text },
  gtsTrend:     { fontFamily: fonts.mono, fontSize: 10, color: c.green },
  gtsDesc:      { fontFamily: fonts.mono, fontSize: 10, fontStyle: 'italic', marginTop: 3 },
  components:   { borderTopWidth: 1, borderTopColor: c.rowDivider, paddingTop: 12, gap: 10 },
  compRow:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  compLabel:    { fontFamily: fonts.mono, fontSize: 9, color: c.muted, width: 112, letterSpacing: 0.2 },
  compScore:    { fontFamily: fonts.mono, fontSize: 10, color: c.text2, width: 22, textAlign: 'right' },
});

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();
  const { colors, isDark, toggleTheme } = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [user, setUser]         = useState(authUser || MOCK.dashboard.user);
  const [data, setData]         = useState(MOCK.dashboard);
  const [gts, setGts]           = useState(MOCK.gigTrust);
  const [settings, setSettings] = useState({ autoRenew: true, notifications: true, smartCoverage: true });

  useEffect(() => {
    api.user().then(d => { if (d) setUser(d); });
    api.dashboard().then(d => { if (d) setData(d); });
    api.gigTrust().then(d => { if (d) setGts(d); });
  }, []);

  const toggle = (key) => setSettings(p => ({ ...p, [key]: !p[key] }));

  const premium  = data.premium || 40;
  const received = data.lastPayout?.amount || 0;
  const ratio    = received > 0 ? (received / premium).toFixed(1) : '—';

  return (
    <ScrollView
      style={[styles.scroll, { paddingTop: insets.top + 16 }]}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Avatar + name */}
      <View style={styles.avatarRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarTxt}>{user.initials || user.name?.slice(0, 2).toUpperCase() || 'IS'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userSub}>{user.platform} Partner · {user.location}</Text>
          <View style={styles.liveRow}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTxt}>ACTIVE PLAN</Text>
          </View>
        </View>
      </View>

      <View style={styles.divider} />

      {/* GigTrust Score */}
      <Text style={styles.sectionLabel}>GIGTRUST SCORE</Text>
      <GigTrustSection gts={gts} />

      <View style={styles.divider} />

      {/* Details */}
      <Text style={styles.sectionLabel}>YOUR DETAILS</Text>
      <View style={styles.card}>
        {[
          { key: 'PLATFORM',     val: user.platform },
          { key: 'LOCATION',     val: user.zone ? `${user.zone}, ${user.location}` : user.location },
          { key: 'WORK HOURS',   val: user.workHours },
          { key: 'UPI ID',       val: user.upi || '—' },
          { key: 'MEMBER SINCE', val: user.memberSince || '—' },
          { key: 'POLICY NO.',   val: user.policyNumber || '—' },
        ].map(({ key, val }, i, arr) => (
          <View key={key} style={[styles.row, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
            <Text style={styles.rowKey}>{key}</Text>
            <Text style={styles.rowVal}>{val}</Text>
          </View>
        ))}
      </View>

      <View style={styles.divider} />

      {/* Settings */}
      <Text style={styles.sectionLabel}>SETTINGS</Text>
      <View style={styles.card}>
        {[
          { key: 'autoRenew',     label: 'Auto renew',     sub: 'Renews every Monday'       },
          { key: 'notifications', label: 'Notifications',  sub: 'Rain alerts, payouts'       },
          { key: 'smartCoverage', label: 'Smart coverage', sub: 'Adjusts to your zone risk'  },
        ].map(({ key, label, sub }) => (
          <View key={key} style={[styles.settingRow, { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.settingLabel}>{label}</Text>
              <Text style={styles.rowSub}>{sub}</Text>
            </View>
            <Toggle on={settings[key]} onToggle={() => toggle(key)} />
          </View>
        ))}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>Dark mode</Text>
            <Text style={styles.rowSub}>Switch app appearance</Text>
          </View>
          <Toggle on={isDark} onToggle={toggleTheme} />
        </View>
      </View>

      <View style={styles.divider} />

      {/* Stats */}
      <Text style={styles.sectionLabel}>THIS WEEK</Text>
      <View style={styles.statGrid}>
        <View style={styles.statCard}>
          <Text style={styles.statLbl}>PREMIUM</Text>
          <Text style={[styles.statVal, { color: colors.text }]}>₹{premium}</Text>
          <Text style={styles.statSub}>paid this week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLbl}>RECEIVED</Text>
          <Text style={[styles.statVal, { color: colors.green }]}>₹{received}</Text>
          <Text style={styles.statSub}>in payouts</Text>
        </View>
      </View>

      {received > 0 && (
        <View style={styles.noteCard}>
          <Text style={styles.noteTxt}>You earned ₹{ratio} for every ₹1 paid this week.</Text>
        </View>
      )}

      <View style={styles.divider} />

      <Pressable style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]} onPress={logout}>
        <Text style={styles.signOutTxt}>Sign out</Text>
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const makeStyles = (c) => StyleSheet.create({
  scroll:        { flex: 1, backgroundColor: c.bg },
  content:       { paddingHorizontal: 24, paddingBottom: 96 },
  avatarRow:     { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: c.border },
  avatar:        { width: 64, height: 64, borderRadius: 32, backgroundColor: c.coralDim, borderWidth: 2, borderColor: c.coral, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:     { fontSize: 22, fontWeight: '800', color: c.coral },
  userName:      { fontSize: 20, fontWeight: '800', color: c.text, letterSpacing: -0.3 },
  userSub:       { fontFamily: fonts.mono, fontSize: 11, color: c.muted, marginTop: 3, fontStyle: 'italic' },
  liveRow:       { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  liveDot:       { width: 6, height: 6, borderRadius: 3, backgroundColor: c.green },
  liveTxt:       { fontFamily: fonts.mono, fontSize: 9, color: c.green, letterSpacing: 0.8 },
  divider:       { height: 1, backgroundColor: c.border, marginVertical: 16 },
  sectionLabel:  { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1.2, marginBottom: 10 },
  card:          { backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  row:           { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowKey:        { fontFamily: fonts.mono, fontSize: 10, color: c.faint, letterSpacing: 0.5 },
  rowVal:        { fontSize: 13, fontWeight: '600', color: c.text2, flex: 1, textAlign: 'right', marginLeft: 8 },
  settingLabel:  { fontSize: 13, fontWeight: '600', color: c.text2 },
  rowSub:        { fontFamily: fonts.mono, fontSize: 10, color: c.faint, marginTop: 2, fontStyle: 'italic' },
  statGrid:      { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:      { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.md, padding: 14 },
  statLbl:       { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 0.8, marginBottom: 6 },
  statVal:       { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statSub:       { fontFamily: fonts.mono, fontSize: 10, color: c.muted, marginTop: 3, fontStyle: 'italic' },
  noteCard:      { padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.15)', borderRadius: 14, marginBottom: 4 },
  noteTxt:       { fontFamily: fonts.mono, fontSize: 11, color: c.muted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
  signOutBtn:    { borderWidth: 1, borderColor: c.border2, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  signOutTxt:    { fontFamily: fonts.mono, fontSize: 12, color: c.muted, letterSpacing: 0.5 },
});
