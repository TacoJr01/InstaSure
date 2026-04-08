import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthContext } from '../src/AuthContext';
import { ThemeProvider } from '../src/ThemeContext';
import { api, storage } from '../src/api';
import LoginScreen from '../src/screens/LoginScreen';
import RegisterScreen from '../src/screens/RegisterScreen';
import OnboardingScreen from '../src/screens/OnboardingScreen';

SplashScreen.preventAutoHideAsync();

function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: '#0E0E12', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <Text style={{ fontSize: 22, fontWeight: '900', color: '#F2F0EA', letterSpacing: -0.5 }}>instasure</Text>
      <ActivityIndicator color="#E8843A" />
    </View>
  );
}

export default function RootLayout() {
  const [screen, setScreen]         = useState('loading');
  const [user, setUser]             = useState(null);
  const [newWorker, setNewWorker]   = useState<any>(null);

  useEffect(() => {
    SplashScreen.hideAsync();
    storage.getToken().then(async (token) => {
      if (!token) { setScreen('login'); return; }
      const data = await api.me();
      if (data?.worker) { setUser(data.worker); setScreen('app'); }
      else { await storage.clear(); setScreen('login'); }
    });
  }, []);

  // Existing account login → straight to app
  function handleLogin(worker: any) {
    setUser(worker);
    setScreen('app');
  }

  // New account registration → onboarding first
  function handleRegister(worker: any) {
    setUser(worker);
    setNewWorker(worker);
    setScreen('onboarding');
  }

  function handleOnboardingComplete(_data: any) {
    setScreen('app');
  }

  async function handleLogout() {
    await api.logout();
    await storage.clear();
    setUser(null);
    setScreen('login');
  }

  if (screen === 'loading')    return <SafeAreaProvider><LoadingScreen /></SafeAreaProvider>;
  if (screen === 'login')      return <SafeAreaProvider><LoginScreen onLogin={handleLogin} onRegister={() => setScreen('register')} /></SafeAreaProvider>;
  if (screen === 'register')   return <SafeAreaProvider><RegisterScreen onDone={handleRegister} onBack={() => setScreen('login')} /></SafeAreaProvider>;
  if (screen === 'onboarding') return (
    <ThemeProvider>
      <SafeAreaProvider>
        <OnboardingScreen worker={newWorker} onComplete={handleOnboardingComplete} />
      </SafeAreaProvider>
    </ThemeProvider>
  );

  return (
    <ThemeProvider>
      <AuthContext.Provider value={{ user, setUser, logout: handleLogout } as any}>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
        </SafeAreaProvider>
      </AuthContext.Provider>
    </ThemeProvider>
  );
}
