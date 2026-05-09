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
import Toast from 'react-native-toast-message';
import { toastConfig } from '@/components/ui/toast-config';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Newsreader_400Regular,
  Newsreader_600SemiBold,
} from '@expo-google-fonts/newsreader';
import {
  PlusJakartaSans_400Regular,
  PlusJakartaSans_500Medium,
  PlusJakartaSans_700Bold,
} from '@expo-google-fonts/plus-jakarta-sans';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const { colorScheme } = useColorScheme();
  const { isLoading: isAuthLoading, isAuthenticated, loadAuth, hasShownSplash } = useAuthStore();
  const [fontsLoaded, fontError] = useFonts({
    Newsreader_400Regular,
    Newsreader_600SemiBold,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
  });

  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    loadAuth();
  }, []);

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    if (isAuthLoading || !fontsLoaded) return;

    const inAuthGroup =
      segments[0] === '(tabs)' ||
      segments[0] === 'chat' ||
      segments[0] === 'personal-information' ||
      segments[0] === 'privacy-security' ||
      segments[0] === 'create-group';
    const isSplashOrOnboarding = segments[0] === 'splash' || segments[0] === 'onboarding';

    if (isAuthenticated) {
      if (!inAuthGroup) {
        router.replace('/(tabs)/messages');
      }
    } else {
      if (!hasShownSplash && !isSplashOrOnboarding) {
        router.replace('/splash');
      } else if (hasShownSplash && !isSplashOrOnboarding && inAuthGroup) {
        router.replace('/');
      }
    }
  }, [isAuthenticated, isAuthLoading, fontsLoaded, segments, hasShownSplash]);

  if (isAuthLoading || !fontsLoaded) {
    return null;
  }

  return (
    <ThemeProvider value={NAV_THEME[colorScheme ?? 'light']}>
      <StatusBar style={colorScheme === 'dark' ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      />
      <PortalHost />
      <Toast config={toastConfig} />
    </ThemeProvider>
  );
}
