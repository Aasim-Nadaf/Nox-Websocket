import React, { useEffect } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useColorScheme } from 'nativewind';
import { useAuthStore } from '@/lib/store';

export default function SplashScreen() {
  const router = useRouter();
  const { hasSeenOnboarding, setHasShownSplash, isLoading: isAuthLoading } = useAuthStore();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    // Wait until auth loading is finished to get the correct onboarding state
    if (isAuthLoading) return;

    const timer = setTimeout(() => {
      setHasShownSplash(true);
      if (hasSeenOnboarding) {
        router.replace('/');
      } else {
        router.replace('/onboarding');
      }
    }, 2500);

    return () => clearTimeout(timer);
  }, [hasSeenOnboarding, isAuthLoading]);

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 items-center justify-center">
        <Text
          style={{ fontFamily: 'Newsreader_600SemiBold' }}
          className="text-7xl tracking-tighter text-foreground">
          Nox
        </Text>

        <View className="absolute bottom-16">
          <Text
            style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
            className="text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
            The Tactile Editorial
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
