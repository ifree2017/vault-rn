import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { PaperProvider, MD3DarkTheme } from 'react-native-paper';
import AppNavigator from './src/navigation/AppNavigator';
import { useAuthStore } from './src/store';
import { warnIfJailbroken } from './src/services/security';

const theme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: '#6c63ff',
    background: '#0f0f1a',
    surface: '#1a1a2e',
    onSurface: '#e0e0e0',
    onBackground: '#e0e0e0',
  },
};

export default function App() {
  const restoreAuth = useAuthStore((s) => s.restoreAuth);

  useEffect(() => {
    restoreAuth();
    // Phase 2.1: warn if device appears jailbroken/rooted
    warnIfJailbroken();
  }, []);

  return (
    <PaperProvider theme={theme}>
      <StatusBar style="light" />
      <AppNavigator />
    </PaperProvider>
  );
}
