import React, { useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, TextInput,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, fonts, radius } from '../theme';
import { api, storage } from '../api';

const PLATFORMS = ['Swiggy', 'Zomato', 'Zepto', 'Amazon', 'Blinkit', 'Other'];
const CITIES    = ['Chennai', 'Mumbai', 'Bangalore', 'Delhi', 'Hyderabad', 'Pune'];
const ZONES = {
  Chennai:   ['Velachery', 'Anna Nagar', 'T. Nagar', 'Adyar'],
  Mumbai:    ['Andheri West', 'Bandra', 'Dadar', 'Powai'],
  Bangalore: ['Koramangala', 'Indiranagar', 'Whitefield', 'BTM Layout'],
  Delhi:     ['Connaught Place', 'Karol Bagh', 'Dwarka', 'Rohini'],
  Hyderabad: ['Gachibowli', 'Hitech City', 'Banjara Hills', 'Kukatpally'],
  Pune:      ['Koregaon Park', 'Kothrud', 'Viman Nagar', 'Shivajinagar'],
};
const WORK_HOURS = ['6 AM – 2 PM', '8 AM – 8 PM', '10 AM – 10 PM', '2 PM – 10 PM', '6 PM – 2 AM'];

const STEPS = ['Phone', 'Name', 'Platform', 'Location', 'Hours', 'PIN'];

function Chip({ label, selected, color = colors.coral, onPress }) {
  return (
    <Pressable
      style={[chip.base, selected && { backgroundColor: color + '22', borderColor: color }]}
      onPress={onPress}
    >
      <Text style={[chip.txt, selected && { color }]}>{label}</Text>
    </Pressable>
  );
}
const chip = StyleSheet.create({
  base: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: 24, borderWidth: 1, borderColor: colors.border2 },
  txt:  { fontFamily: fonts.mono, fontSize: 11, color: colors.muted },
});

function PinDots({ length, filled }) {
  return (
    <View style={{ flexDirection: 'row', gap: 16, justifyContent: 'center', marginTop: 20, marginBottom: 8 }}>
      {Array.from({ length }).map((_, i) => (
        <View key={i} style={[pdot.base, i < filled && pdot.filled]} />
      ))}
    </View>
  );
}
const pdot = StyleSheet.create({
  base:   { width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: colors.border2 },
  filled: { backgroundColor: colors.coral, borderColor: colors.coral },
});

function NumPad({ onPress }) {
  const keys = ['1','2','3','4','5','6','7','8','9','','0','⌫'];
  return (
    <View style={npad.grid}>
      {keys.map((k, i) => (
        k === '' ? <View key={i} style={npad.empty} /> :
        <Pressable key={i} style={({ pressed }) => [npad.key, pressed && npad.pressed]} onPress={() => onPress(k)}>
          <Text style={npad.txt}>{k}</Text>
        </Pressable>
      ))}
    </View>
  );
}
const npad = StyleSheet.create({
  grid:    { flexDirection: 'row', flexWrap: 'wrap', width: 240, gap: 10, alignSelf: 'center', marginTop: 8 },
  empty:   { width: 70, height: 70 },
  key:     { width: 70, height: 70, borderRadius: 35, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  pressed: { backgroundColor: colors.surface2 },
  txt:     { fontSize: 22, fontWeight: '300', color: colors.text },
});

export default function RegisterScreen({ onDone, onBack }) {
  const insets = useSafeAreaInsets();
  const [step, setStep]         = useState(0);
  const [phone, setPhone]       = useState('');
  const [name, setName]         = useState('');
  const [platform, setPlatform] = useState('');
  const [city, setCity]         = useState('');
  const [zone, setZone]         = useState('');
  const [workHours, setWorkHours] = useState('');
  const [pin, setPin]           = useState('');
  const [pinConfirm, setPinConfirm] = useState('');
  const [pinStep, setPinStep]   = useState('set'); // set | confirm
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  function handleNumPad(key) {
    const current = pinStep === 'set' ? pin : pinConfirm;
    const setter  = pinStep === 'set' ? setPin : setPinConfirm;
    if (key === '⌫') { setter(current.slice(0, -1)); return; }
    if (current.length >= 4) return;
    const next = current + key;
    setter(next);
    if (next.length === 4) {
      if (pinStep === 'set') { setPinStep('confirm'); }
      else { handleRegister(next); }
    }
  }

  async function handleRegister(confirmPin) {
    if (confirmPin !== pin) {
      setError("PINs don't match. Try again.");
      setPinConfirm('');
      setPinStep('set');
      setPin('');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await api.register({ name, phone, pin, platform, location: city, zone, workHours });
      if (res?.token) {
        await storage.setToken(res.token);
        onDone({ ...res.worker, platform, location: city, zone, workHours });
      } else {
        setError(res?.error || 'Registration failed. Try again.');
        setPinConfirm('');
        setPinStep('set');
        setPin('');
      }
    } catch {
      setError('Could not connect. Check internet.');
    } finally {
      setLoading(false);
    }
  }

  function nextStep() {
    setError('');
    if (step === 0 && phone.length < 10) { setError('Enter a valid 10-digit number'); return; }
    if (step === 1 && !name.trim())       { setError('Enter your name'); return; }
    if (step === 2 && !platform)          { setError('Select your platform'); return; }
    if (step === 3 && (!city || !zone))   { setError('Select city and zone'); return; }
    if (step === 4 && !workHours)         { setError('Select your work hours'); return; }
    setStep(s => s + 1);
  }

  const progress = ((step) / (STEPS.length - 1)) * 100;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={step === 0 ? onBack : () => { setStep(s => s - 1); setError(''); }}>
          <Text style={styles.backTxt}>← {step === 0 ? 'Sign in' : 'Back'}</Text>
        </Pressable>
        <Text style={styles.headerTitle}>instasure</Text>
        <Text style={styles.stepCount}>{step + 1}/{STEPS.length}</Text>
      </View>

      {/* Progress bar */}
      <View style={styles.progTrack}>
        <View style={[styles.progFill, { width: `${progress}%` }]} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {/* Step 0 — Phone */}
        {step === 0 && (
          <>
            <Text style={styles.stepTitle}>What's your{'\n'}phone number?</Text>
            <View style={styles.inputBox}>
              <Text style={styles.countryCode}>+91</Text>
              <TextInput
                style={styles.textInput}
                value={phone}
                onChangeText={t => { setPhone(t.replace(/\D/g, '').slice(0, 10)); setError(''); }}
                placeholder="9100000000"
                placeholderTextColor={colors.faint}
                keyboardType="number-pad"
                autoFocus
              />
            </View>
          </>
        )}

        {/* Step 1 — Name */}
        {step === 1 && (
          <>
            <Text style={styles.stepTitle}>What's your{'\n'}name?</Text>
            <TextInput
              style={styles.nameInput}
              value={name}
              onChangeText={t => { setName(t); setError(''); }}
              placeholder="Rahul Sharma"
              placeholderTextColor={colors.faint}
              autoFocus
              autoCapitalize="words"
            />
          </>
        )}

        {/* Step 2 — Platform */}
        {step === 2 && (
          <>
            <Text style={styles.stepTitle}>Which platform{'\n'}do you work on?</Text>
            <View style={styles.chipGrid}>
              {PLATFORMS.map(p => (
                <Chip key={p} label={p} selected={platform === p} onPress={() => { setPlatform(p); setError(''); }} />
              ))}
            </View>
          </>
        )}

        {/* Step 3 — Location */}
        {step === 3 && (
          <>
            <Text style={styles.stepTitle}>Where do you{'\n'}work?</Text>
            <Text style={styles.subLabel}>CITY</Text>
            <View style={styles.chipGrid}>
              {CITIES.map(c => (
                <Chip key={c} label={c} selected={city === c} color={colors.blue}
                  onPress={() => { setCity(c); setZone(''); setError(''); }} />
              ))}
            </View>
            {!!city && (
              <>
                <Text style={[styles.subLabel, { marginTop: 20 }]}>ZONE</Text>
                <View style={styles.chipGrid}>
                  {(ZONES[city] || []).map(z => (
                    <Chip key={z} label={z} selected={zone === z} color={colors.blue}
                      onPress={() => { setZone(z); setError(''); }} />
                  ))}
                </View>
              </>
            )}
          </>
        )}

        {/* Step 4 — Work Hours */}
        {step === 4 && (
          <>
            <Text style={styles.stepTitle}>When do you{'\n'}usually work?</Text>
            <View style={styles.chipGrid}>
              {WORK_HOURS.map(h => (
                <Chip key={h} label={h} selected={workHours === h} color={colors.amber}
                  onPress={() => { setWorkHours(h); setError(''); }} />
              ))}
            </View>
          </>
        )}

        {/* Step 5 — PIN */}
        {step === 5 && (
          <>
            <Text style={styles.stepTitle}>
              {pinStep === 'set' ? 'Set a 4-digit PIN' : 'Confirm your PIN'}
            </Text>
            <Text style={styles.pinSub}>
              {pinStep === 'set' ? "You'll use this to log in" : 'Enter the same PIN again'}
            </Text>
            <PinDots length={4} filled={pinStep === 'set' ? pin.length : pinConfirm.length} />
            {loading
              ? <ActivityIndicator color={colors.coral} style={{ marginTop: 32 }} />
              : <NumPad onPress={handleNumPad} />
            }
          </>
        )}

        {!!error && <Text style={styles.errorTxt}>{error}</Text>}

        {step < 5 && (
          <Pressable style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]} onPress={nextStep}>
            <Text style={styles.btnTxt}>{step === 4 ? 'Next →' : 'Continue →'}</Text>
          </Pressable>
        )}

        <View style={{ height: 32 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: colors.bg },
  header:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 10 },
  backTxt:     { fontFamily: fonts.mono, fontSize: 10, color: colors.muted },
  headerTitle: { fontSize: 14, fontWeight: '900', color: colors.text, letterSpacing: -0.3 },
  stepCount:   { fontFamily: fonts.mono, fontSize: 10, color: colors.faint },
  progTrack:   { height: 2, backgroundColor: colors.border, marginBottom: 12 },
  progFill:    { height: '100%', backgroundColor: colors.coral, borderRadius: 1 },
  content:     { paddingHorizontal: 28, paddingTop: 16 },
  stepTitle:   { fontSize: 30, fontWeight: '900', color: colors.text, letterSpacing: -1, lineHeight: 36, marginBottom: 28 },
  subLabel:    { fontFamily: fonts.mono, fontSize: 9, color: colors.faint, letterSpacing: 1.2, marginBottom: 10 },
  inputBox:    { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1.5, borderBottomColor: colors.border2, paddingBottom: 8, gap: 10 },
  countryCode: { fontSize: 22, fontWeight: '300', color: colors.muted },
  textInput:   { fontSize: 28, fontWeight: '300', color: colors.text, letterSpacing: 2, flex: 1 },
  nameInput:   { fontSize: 24, fontWeight: '300', color: colors.text, borderBottomWidth: 1.5, borderBottomColor: colors.border2, paddingBottom: 8 },
  chipGrid:    { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pinSub:      { fontFamily: fonts.mono, fontSize: 11, color: colors.muted, fontStyle: 'italic', textAlign: 'center' },
  errorTxt:    { fontFamily: fonts.mono, fontSize: 10, color: colors.coral, marginTop: 14, textAlign: 'center', fontStyle: 'italic' },
  btn:         { backgroundColor: colors.coral, borderRadius: radius.xl, paddingVertical: 16, alignItems: 'center', marginTop: 32 },
  btnTxt:      { fontSize: 15, fontWeight: '700', color: '#fff', letterSpacing: 0.3 },
});
