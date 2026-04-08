import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated,
  KeyboardAvoidingView, Platform, TextInput, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { api, storage } from '../api';

function NumPad({ onPress }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <View style={pad.grid}>
      {keys.map((k, i) => (
        k === '' ? <View key={i} style={pad.empty} /> :
        <Pressable
          key={i}
          style={({ pressed }) => [pad.key, pressed && pad.keyPressed]}
          onPress={() => onPress(k)}
        >
          <Text style={pad.keyTxt}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const pad = StyleSheet.create({
  grid:       { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 10, alignSelf: 'center', marginTop: 24 },
  empty:      { width: 70, height: 70 },
  key:        { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  keyPressed: { backgroundColor: colors.surface2, borderColor: colors.border2 },
  keyTxt:     { fontSize: 22, fontWeight: '300', color: colors.text },
});

function PinDots({ length, filled }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 28 }}>
      {Array.from({ length }).map((_, i) => (
        <View key={i} style={[dot.base, i < filled && dot.filled]} />
      ))}
    </View>
  );
}

const dot = StyleSheet.create({
  base:   { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border2 },
  filled: { backgroundColor: colors.coral, borderColor: colors.coral },
});

export default function LoginScreen({ onLogin, onRegister }) {
  const insets = useSafeAreaInsets();
  const [phase, setPhase]   = useState('phone'); // phone | pin
  const [phone, setPhone]   = useState('');
  const [pin, setPin]       = useState('');
  const [error, setError]   = useState('');
  const [loading, setLoading] = useState(false);
  const shakeAnim = useRef(new Animated.Value(0)).current;

  function shake() {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 8,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -8, duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,  duration: 60, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,  duration: 60, useNativeDriver: true }),
    ]).start();
  }

  async function handlePhoneNext() {
    if (phone.length < 10) { setError('Enter a valid 10-digit phone number'); shake(); return; }
    setError('');
    setPhase('pin');
  }

  function handleNumPad(key) {
    if (loading) return;
    if (key === '⌫') {
      if (phase === 'phone') setPhone(p => p.slice(0, -1));
      else setPin(p => p.slice(0, -1));
      return;
    }
    if (phase === 'phone') {
      if (phone.length < 10) setPhone(p => p + key);
    } else {
      if (pin.length < 4) {
        const next = pin + key;
        setPin(next);
        if (next.length === 4) submitLogin(phone, next);
      }
    }
  }

  async function submitLogin(ph, p) {
    setLoading(true);
    setError('');
    try {
      const res = await api.login(ph, p);
      if (res?.token) {
        await storage.setToken(res.token);
        onLogin(res.worker);
      } else {
        setError(res?.error || 'Invalid phone or PIN');
        setPin('');
        shake();
      }
    } catch {
      setError('Could not connect. Check internet.');
      setPin('');
      shake();
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={[styles.root, { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 16 }]}>
      {/* Logo */}
      <View style={styles.logoWrap}>
        <View style={styles.logoMark}>
          <Text style={styles.logoTxt}>IS</Text>
        </View>
        <Text style={styles.wordmark}>instasure</Text>
        <Text style={styles.tagline}>income protection for gig workers</Text>
      </View>

      {/* Input area */}
      <Animated.View style={[styles.inputWrap, { transform: [{ translateX: shakeAnim }] }]}>
        {phase === 'phone' ? (
          <>
            <Text style={styles.inputLabel}>PHONE NUMBER</Text>
            <View style={styles.phoneBox}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.phoneInput}
                value={phone}
                onChangeText={t => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                placeholder="9100000001"
                placeholderTextColor={colors.faint}
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
              />
            </View>
          </>
        ) : (
          <>
            <Text style={styles.inputLabel}>ENTER PIN</Text>
            <Text style={styles.phoneSub}>+91 {phone}</Text>
            <PinDots length={4} filled={pin.length} />
          </>
        )}
        {!!error && <Text style={styles.errorTxt}>{error}</Text>}
      </Animated.View>

      {/* Numpad or Continue button */}
      {phase === 'phone' ? (
        <Pressable
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}
          onPress={handlePhoneNext}
        >
          <Text style={styles.btnTxt}>Continue →</Text>
        </Pressable>
      ) : (
        loading ? (
          <ActivityIndicator color={colors.coral} style={{ marginTop: 40 }} />
        ) : (
          <NumPad onPress={handleNumPad} />
        )
      )}

      {phase === 'pin' && (
        <Pressable style={styles.backBtn} onPress={() => { setPhase('phone'); setPin(''); setError(''); }}>
          <Text style={styles.backTxt}>← Back</Text>
        </Pressable>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerTxt}>New to InstaSure?</Text>
        <Pressable onPress={onRegister}>
          <Text style={styles.footerLink}> Create account</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:         { flex: 1, backgroundColor: colors.bg, paddingHorizontal: 28, justifyContent: 'space-between' },
  logoWrap:     { alignItems: 'center', paddingTop: 16 },
  logoMark:     { width: 52, height: 52, borderRadius: 16, backgroundColor: colors.coralDim, borderWidth: 1.5, borderColor: colors.coral, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  logoTxt:      { fontSize: 18, fontWeight: '900', color: colors.coral, letterSpacing: 1 },
  wordmark:     { fontSize: 26, fontWeight: '900', color: colors.text, letterSpacing: -0.5 },
  tagline:      { fontFamily: fonts.mono, fontSize: 10, color: colors.muted, marginTop: 4, fontStyle: 'italic' },
  inputWrap:    { alignItems: 'center' },
  inputLabel:   { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.5, marginBottom: 12 },
  phoneBox:     { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: colors.border2, paddingBottom: 8, gap: 10 },
  countryCode:  { fontSize: 22, fontWeight: '300', color: colors.muted },
  phoneInput:   { fontSize: 28, fontWeight: '300', color: colors.text, letterSpacing: 2, minWidth: 180 },
  phoneSub:     { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, fontStyle: 'italic' },
  errorTxt:     { fontFamily: fonts.mono, fontSize: 10, color: colors.coral, marginTop: 14, fontStyle: 'italic' },
  btn:          { backgroundColor: colors.coral, borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center' },
  btnTxt:       { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
  backBtn:      { alignSelf: 'center', marginTop: 8 },
  backTxt:      { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
  footer:       { flexDirection: 'row', justifyContent: 'center', paddingTop: 8 },
  footerTxt:    { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
  footerLink:   { fontFamily: fonts.mono, fontSize: 11, color: colors.coral, fontWeight: '700' },
});
