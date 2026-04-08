import React, { createContext, useContext, useMemo, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import { darkColors, lightColors } from './theme';

const ThemeContext = createContext(null);
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    SecureStore.getItemAsync('ais_theme').then(v => {
      if (v === 'light') setIsDark(false);
    });
  }, []);

  function toggleTheme() {
    const next = !isDark;
    setIsDark(next);
    SecureStore.setItemAsync('ais_theme', next ? 'dark' : 'light');
  }

  const value = useMemo(() => ({
    colors: isDark ? darkColors : lightColors,
    isDark,
    toggleTheme,
  }), [isDark]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
