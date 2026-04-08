import React, { useEffect, useRef, useState } from 'react';
import { ScrollView, View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../src/theme';
import { api, MOCK } from '../src/api';
import { useAuth } from '../src/AuthContext';

function Toggle({ on, onToggle }) {
  const anim = useRef(new Animated.Value(on ? 1 : 0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: on ? 1 : 0, useNativeDriver: false, stiffness: 500, damping: 30 }).start();
  }, [on]);
  const bg = anim.interpolate({ inputRange: [0, 1], outputRange: ['#1C1C22', colors.green] });
  const tx = anim.interpolate({ inputRange: [0, 1], outputRange: [2, 22] });
  return (
    <Pressable onPress={onToggle}>
      <Animated.View style={[styles.toggleTrack, { backgroundColor: bg }]}>
        <Animated.View style={[styles.toggleThumb, { transform: [{ translateX: tx }] }]} />
      </Animated.View>
    </Pressable>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { user: authUser, logout } = useAuth();
  const [user, setUser]       = useState(authUser || MOCK.dashboard.user);
  const [data, setData]       = useState(MOCK.dashboard);
  const [settings, setSettings] = useState({ autoRenew: true, notifications: true, smartCoverage: true });

  useEffect(() => {
    api.user().then(d => { if (d) setUser(d); });
    api.dashboard().then(d => { if (d) setData(d); });
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
          <View key={key} style={[styles.row, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#13131A' }]}>
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
          { key: 'autoRenew',     label: 'Auto renew',      sub: 'Renews every Monday' },
          { key: 'notifications', label: 'Notifications',   sub: 'Rain alerts, payouts' },
          { key: 'smartCoverage', label: 'Smart coverage',  sub: 'Adjusts to your zone risk' },
        ].map(({ key, label, sub }, i, arr) => (
          <View key={key} style={[styles.settingRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: '#13131A' }]}>
            <View style={{ flex: 1 }}>
              <Text style={styles.rowVal}>{label}</Text>
              <Text style={styles.rowSub}>{sub}</Text>
            </View>
            <Toggle on={settings[key]} onToggle={() => toggle(key)} />
          </View>
        ))}
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

      {/* Sign out */}
      <Pressable style={({ pressed }) => [styles.signOutBtn, pressed && { opacity: 0.7 }]} onPress={logout}>
        <Text style={styles.signOutTxt}>Sign out</Text>
      </Pressable>

      <View style={{ height: 32 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll:       { flex: 1, backgroundColor: colors.bg },
  content:      { paddingHorizontal: 24 },
  avatarRow:    { flexDirection: 'row', alignItems: 'center', gap: 16, paddingBottom: 20, borderBottomWidth: 1, borderBottomColor: colors.border },
  avatar:       { width: 64, height: 64, borderRadius: 32, backgroundColor: colors.coralDim, borderWidth: 2, borderColor: colors.coral, alignItems: 'center', justifyContent: 'center' },
  avatarTxt:    { fontSize: 22, fontWeight: '800', color: colors.coral },
  userName:     { fontSize: 20, fontWeight: '800', color: colors.text, letterSpacing: -0.3 },
  userSub:      { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, marginTop: 3, fontStyle: 'italic' },
  liveRow:      { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 6 },
  liveDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green },
  liveTxt:      { fontFamily: fonts.mono, fontSize: 9, color: colors.green, letterSpacing: 0.8 },
  divider:      { height: 1, backgroundColor: colors.border, marginVertical: 16 },
  sectionLabel: { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.2, marginBottom: 10 },
  card:         { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  row:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  settingRow:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14 },
  rowKey:       { fontFamily: fonts.mono, fontSize: 10, color: colors.faint, letterSpacing: 0.5 },
  rowVal:       { fontSize: 13, fontWeight: '600', color: colors.text2, flex: 1, textAlign: 'right', marginLeft: 8 },
  rowSub:       { fontFamily: fonts.mono, fontSize: 10, color: colors.faint, marginTop: 2, fontStyle: 'italic' },
  toggleTrack:  { width: 46, height: 26, borderRadius: 13, justifyContent: 'center' },
  toggleThumb:  { width: 20, height: 20, borderRadius: 10, backgroundColor: '#fff', position: 'absolute' },
  statGrid:     { flexDirection: 'row', gap: 10, marginBottom: 16 },
  statCard:     { flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14 },
  statLbl:      { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 0.8, marginBottom: 6 },
  statVal:      { fontSize: 22, fontWeight: '900', letterSpacing: -0.5 },
  statSub:      { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 3, fontStyle: 'italic' },
  noteCard:     { padding: 14, backgroundColor: 'rgba(62,201,122,0.06)', borderWidth: 1, borderColor: 'rgba(62,201,122,0.15)', borderRadius: 14, marginBottom: 4 },
  noteTxt:      { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, lineHeight: 18, textAlign: 'center', fontStyle: 'italic' },
  signOutBtn:   { borderWidth: 1, borderColor: colors.border2, borderRadius: radius.lg, paddingVertical: 14, alignItems: 'center' },
  signOutTxt:   { fontFamily: fonts.mono, fontSize: 12, color: colors.muted, letterSpacing: 0.5 },
});
