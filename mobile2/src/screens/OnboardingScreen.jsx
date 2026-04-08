import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, Pressable, Animated, TextInput, ScrollView, Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { fonts, radius } from '../theme';
import { useTheme } from '../ThemeContext';

const SW = Dimensions.get('window').width;

const PLATFORMS = [
  { id: 'Swiggy',  color: '#FC8019' },
  { id: 'Zomato',  color: '#E23744' },
  { id: 'Zepto',   color: '#7B2EF7' },
  { id: 'Amazon',  color: '#FF9900' },
];

const CITIES = ['Chennai', 'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Pune'];

const HOURS = [
  { id: 'Morning (6 AM – 12 PM)',   label: 'Morning',   sub: '6 AM – 12 PM'  },
  { id: 'Afternoon (12 PM – 6 PM)', label: 'Afternoon', sub: '12 PM – 6 PM'  },
  { id: 'Evening (6 PM – 12 AM)',   label: 'Evening',   sub: '6 PM – 12 AM'  },
  { id: 'All Day (8 AM – 10 PM)',   label: 'All Day',   sub: '8 AM – 10 PM'  },
];

// When worker is provided (post-registration), skip selection steps — just welcome → summary
export default function OnboardingScreen({ onComplete, worker }) {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const styles = makeStyles(colors);

  const prefilled = !!worker;
  const TOTAL_STEPS = prefilled ? 1 : 4; // 0=welcome, (1-3 only if not prefilled), last=done

  const [step, setStep]         = useState(0);
  const [platform, setPlatform] = useState(worker?.platform || '');
  const [city, setCity]         = useState(worker?.location || '');
  const [zone, setZone]         = useState(worker?.zone || '');
  const [hours, setHours]       = useState(worker?.workHours || '');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const canNext = prefilled ? true : ([true, !!platform, !!city, !!hours][step] ?? true);

  function animate(dir, callback) {
    Animated.sequence([
      Animated.timing(slideAnim, { toValue: dir * -30, duration: 150, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: dir * 30, duration: 0, useNativeDriver: true }),
    ]).start(() => {
      callback();
      Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }).start();
    });
  }

  function next() { animate(1, () => setStep(s => s + 1)); }
  function back() { animate(-1, () => setStep(s => s - 1)); }
  function finish() {
    onComplete({ platform, location: city, zone: zone || city, workHours: hours });
  }

  // Map logical step to content index when prefilled (0=welcome, 1=done)
  const contentStep = prefilled && step === 1 ? 4 : step;

  return (
    <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 16 }]}>

      {/* Progress dots — only shown when not prefilled */}
      {!prefilled && step > 0 && step < TOTAL_STEPS && (
        <View style={styles.dotsRow}>
          {[1, 2, 3].map(n => (
            <View key={n} style={[styles.dot, { backgroundColor: step >= n ? colors.coral : colors.border2 }]} />
          ))}
        </View>
      )}

      {/* Slide content */}
      <Animated.View style={[styles.contentArea, { transform: [{ translateX: slideAnim }] }]}>

        {/* Step 0: Welcome */}
        {contentStep === 0 && (
          <ScrollView contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
            <View style={styles.shieldIcon}>
              <Text style={{ fontSize: 32 }}>🛡️</Text>
            </View>
            <Text style={styles.welcomeTitle}>InstaSure</Text>
            <Text style={styles.welcomeSub}>Zero-touch income protection for gig workers</Text>
            <View style={styles.featureList}>
              {[
                'Automatic payouts — no claims needed',
                'Covers rain, demand drops & more',
                'Powered by your GigTrust Score',
              ].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={[styles.featureDot, { backgroundColor: colors.green }]} />
                  <Text style={styles.featureTxt}>{f}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Step 1: Platform */}
        {contentStep === 1 && (
          <ScrollView contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepLabel}>STEP 1 OF 3</Text>
            <Text style={styles.stepTitle}>Which platform do you work on?</Text>
            <Text style={styles.stepSub}>We'll tailor your coverage to your platform's patterns</Text>
            <View style={styles.platformGrid}>
              {PLATFORMS.map(p => (
                <Pressable
                  key={p.id}
                  style={[styles.platformBtn, {
                    borderColor: platform === p.id ? p.color : colors.border2,
                    backgroundColor: platform === p.id ? p.color + '18' : colors.surface,
                  }]}
                  onPress={() => setPlatform(p.id)}
                >
                  <Text style={[styles.platformName, { color: platform === p.id ? p.color : colors.text2 }]}>{p.id}</Text>
                  {platform === p.id && (
                    <View style={[styles.platformCheck, { backgroundColor: p.color }]}>
                      <Text style={{ color: '#fff', fontSize: 10, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Step 2: Location */}
        {contentStep === 2 && (
          <ScrollView contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepLabel}>STEP 2 OF 3</Text>
            <Text style={styles.stepTitle}>Where are you based?</Text>
            <Text style={styles.stepSub}>Used to fetch local weather, demand and zone data</Text>
            <Text style={styles.fieldLabel}>CITY</Text>
            <View style={styles.cityGrid}>
              {CITIES.map(c => (
                <Pressable
                  key={c}
                  style={[styles.cityBtn, {
                    borderColor: city === c ? colors.blue : colors.border2,
                    backgroundColor: city === c ? colors.blueDim : colors.surface,
                  }]}
                  onPress={() => setCity(c)}
                >
                  <Text style={[styles.cityBtnTxt, { color: city === c ? colors.blue : colors.text2 }]}>{c}</Text>
                </Pressable>
              ))}
            </View>
            <Text style={[styles.fieldLabel, { marginTop: 16 }]}>ZONE / AREA (optional)</Text>
            <TextInput
              placeholder="e.g. Velachery, Andheri West"
              placeholderTextColor={colors.faint}
              value={zone}
              onChangeText={setZone}
              style={[styles.textInput, { color: colors.text, backgroundColor: colors.surface, borderColor: colors.border2 }]}
            />
          </ScrollView>
        )}

        {/* Step 3: Work Hours */}
        {contentStep === 3 && (
          <ScrollView contentContainerStyle={styles.slide} showsVerticalScrollIndicator={false}>
            <Text style={styles.stepLabel}>STEP 3 OF 3</Text>
            <Text style={styles.stepTitle}>When do you usually work?</Text>
            <Text style={styles.stepSub}>Helps us monitor the right time windows for your income</Text>
            <View style={styles.hoursList}>
              {HOURS.map(h => (
                <Pressable
                  key={h.id}
                  style={[styles.hourBtn, {
                    borderColor: hours === h.id ? colors.purple : colors.border2,
                    backgroundColor: hours === h.id ? colors.purpleDim : colors.surface,
                  }]}
                  onPress={() => setHours(h.id)}
                >
                  <View>
                    <Text style={[styles.hourLabel, { color: hours === h.id ? colors.purple : colors.text2 }]}>{h.label}</Text>
                    <Text style={styles.hourSub}>{h.sub}</Text>
                  </View>
                  {hours === h.id && (
                    <View style={[styles.hourCheck, { borderColor: colors.purple }]}>
                      <Text style={{ color: colors.purple, fontSize: 12, fontWeight: '800' }}>✓</Text>
                    </View>
                  )}
                </Pressable>
              ))}
            </View>
          </ScrollView>
        )}

        {/* Step 4: Done */}
        {contentStep === 4 && (
          <ScrollView contentContainerStyle={[styles.slide, { alignItems: 'center' }]} showsVerticalScrollIndicator={false}>
            <View style={[styles.doneRing, { borderColor: colors.green }]}>
              <Text style={{ fontSize: 32, color: colors.green }}>✓</Text>
            </View>
            <Text style={styles.doneTitle}>Your plan is ready</Text>
            <Text style={styles.doneSub}>Coverage starts immediately</Text>
            <View style={styles.doneSummary}>
              {[
                { label: 'Platform', val: platform },
                { label: 'City',     val: city       },
                { label: 'Hours',    val: hours.split(' (')[0] },
              ].map(({ label, val }, i, arr) => (
                <View key={label} style={[styles.summaryRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.rowDivider }]}>
                  <Text style={styles.summaryKey}>{label}</Text>
                  <Text style={styles.summaryVal}>{val}</Text>
                </View>
              ))}
            </View>
            <View style={styles.premiumNote}>
              <Text style={[styles.premiumNoteTxt]}>
                Weekly premium: <Text style={{ color: colors.amber }}>₹40</Text>
                {'  '}Coverage up to: <Text style={{ color: colors.green }}>₹1,500</Text>
              </Text>
            </View>
          </ScrollView>
        )}

      </Animated.View>

      {/* Nav buttons */}
      <View style={styles.navRow}>
        {step > 0 && step < TOTAL_STEPS && (
          <Pressable style={styles.btnBack} onPress={back}>
            <Text style={[styles.btnBackTxt, { color: colors.muted }]}>Back</Text>
          </Pressable>
        )}
        {step < TOTAL_STEPS && (
          <Pressable
            style={[styles.btnNext, { backgroundColor: colors.coral, opacity: canNext ? 1 : 0.4, flex: step === 0 ? 1 : 0, minWidth: step === 0 ? undefined : 130 }]}
            onPress={next}
            disabled={!canNext}
          >
            <Text style={styles.btnNextTxt}>{step === 0 ? 'Get Started' : 'Next'}</Text>
          </Pressable>
        )}
        {step === TOTAL_STEPS && (
          <Pressable style={[styles.btnNext, { backgroundColor: colors.coral, flex: 1 }]} onPress={finish}>
            <Text style={styles.btnNextTxt}>Enter App</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const makeStyles = (c) => StyleSheet.create({
  root:          { flex: 1, backgroundColor: c.bg, paddingHorizontal: 24 },
  dotsRow:       { flexDirection: 'row', justifyContent: 'center', gap: 7, marginBottom: 24 },
  dot:           { width: 7, height: 7, borderRadius: 3.5 },
  contentArea:   { flex: 1 },
  slide:         { flexGrow: 1, paddingBottom: 8 },
  // Welcome
  shieldIcon:    { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(232,132,58,0.12)', borderWidth: 1, borderColor: 'rgba(232,132,58,0.25)', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  welcomeTitle:  { fontSize: 36, fontWeight: '900', color: c.text, letterSpacing: -1.5, lineHeight: 36 },
  welcomeSub:    { fontFamily: fonts.mono, fontSize: 13, color: c.muted, marginTop: 8, lineHeight: 20, fontStyle: 'italic' },
  featureList:   { marginTop: 28, gap: 12 },
  featureRow:    { flexDirection: 'row', alignItems: 'center', gap: 12 },
  featureDot:    { width: 7, height: 7, borderRadius: 3.5 },
  featureTxt:    { fontSize: 14, color: c.text2, lineHeight: 20 },
  // Step header
  stepLabel:     { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1.5, marginBottom: 8 },
  stepTitle:     { fontSize: 22, fontWeight: '900', color: c.text, letterSpacing: -0.8, lineHeight: 26, marginBottom: 6 },
  stepSub:       { fontFamily: fonts.mono, fontSize: 11, color: c.muted, marginBottom: 20, lineHeight: 16, fontStyle: 'italic' },
  // Platform
  platformGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  platformBtn:   { position: 'relative', width: (SW - 48 - 10) / 2, paddingVertical: 18, paddingHorizontal: 12, borderWidth: 1.5, borderRadius: 16, alignItems: 'center' },
  platformName:  { fontSize: 15, fontWeight: '700', letterSpacing: -0.2 },
  platformCheck: { position: 'absolute', top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  // Location
  fieldLabel:    { fontFamily: fonts.mono, fontSize: 9, color: c.faint, letterSpacing: 1, marginBottom: 8 },
  cityGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cityBtn:       { paddingVertical: 10, paddingHorizontal: 14, borderWidth: 1.5, borderRadius: 12 },
  cityBtnTxt:    { fontSize: 12, fontWeight: '600' },
  textInput:     { paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1.5, borderRadius: 14, fontSize: 13, fontFamily: fonts.mono },
  // Hours
  hoursList:     { gap: 10 },
  hourBtn:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderWidth: 1.5, borderRadius: 16 },
  hourLabel:     { fontSize: 14, fontWeight: '700', letterSpacing: -0.2, marginBottom: 2 },
  hourSub:       { fontFamily: fonts.mono, fontSize: 10, color: c.faint },
  hourCheck:     { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  // Done
  doneRing:      { width: 76, height: 76, borderRadius: 38, borderWidth: 2.5, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  doneTitle:     { fontSize: 26, fontWeight: '900', color: c.text, letterSpacing: -0.8 },
  doneSub:       { fontFamily: fonts.mono, fontSize: 12, color: c.muted, marginTop: 5, fontStyle: 'italic' },
  doneSummary:   { width: '100%', marginTop: 24, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border, borderRadius: radius.lg, paddingHorizontal: 16 },
  summaryRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 12 },
  summaryKey:    { fontFamily: fonts.mono, fontSize: 10, color: c.faint },
  summaryVal:    { fontSize: 13, fontWeight: '600', color: c.text2 },
  premiumNote:   { width: '100%', marginTop: 14, padding: 12, backgroundColor: 'rgba(232,132,58,0.06)', borderWidth: 1, borderColor: 'rgba(232,132,58,0.15)', borderRadius: 12 },
  premiumNoteTxt:{ fontFamily: fonts.mono, fontSize: 12, color: c.muted, textAlign: 'center', fontStyle: 'italic' },
  // Nav
  navRow:        { flexDirection: 'row', gap: 10, paddingTop: 16 },
  btnBack:       { paddingHorizontal: 20, paddingVertical: 14, backgroundColor: c.surface, borderWidth: 1, borderColor: c.border2, borderRadius: 14 },
  btnBackTxt:    { fontSize: 14, fontWeight: '600' },
  btnNext:       { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  btnNextTxt:    { fontSize: 14, fontWeight: '700', color: '#fff', letterSpacing: -0.2 },
});

