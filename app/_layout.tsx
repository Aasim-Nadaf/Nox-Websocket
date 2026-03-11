import '@/global.css';

import { configureReanimatedLogger, ReanimatedLogLevel } from 'react-native-reanimated';

configureReanimatedLogger({
  level: ReanimatedLogLevel.warn,
  strict: false, // Reanimated runs in strict mode by default
});

import { NAV_THEME } from '@/lib/theme';
import { ThemeProvider } from '@react-navigation/native';
import { PortalHost } from '@rn-primitives/portal';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'nativewind';
import { useEffect } from 'react';
import { useAuthStore } from '@/lib/store';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toast-config';

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const { isLoading, isAuthenticated, loadAuth } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'chat';

    if (isAuthenticated && !inAuthGroup) {
      // Redirect to main app
      router.replace('/(tabs)/messages');
    } else if (!isAuthenticated && inAuthGroup) {
      // Redirect to login
      router.replace('/');
    }
  }, [isAuthenticated, isLoading, segments]);

  if (isLoading) {
    return null; // Or a splash screen
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack screenOptions={{ headerShown: false }} />
      <PortalHost />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}
