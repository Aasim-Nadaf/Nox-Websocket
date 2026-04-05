import React, { useState } from 'react';
import { View, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { ArrowRight } from 'lucide-react-native';
import { useAuthStore } from '@/lib/store';

const { width } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    title: 'The Space.',
    subtitle: 'A private digital correspondence curated for meaning.',
    description:
      'Reject the hyper-glossy, over-engineered aesthetic of modern social apps for something that feels like a physical monograph.',
    highlight: 'Chalk & Carbon',
  },
  {
    title: 'The Rhythm.',
    subtitle: 'Generous white space, the breath of the UI.',
    description:
      'We prioritize the "human" timing in transitions and the ease of reading over visual clutter.',
    highlight: 'Editorial',
  },
  {
    title: 'The Connection.',
    subtitle: 'Quiet, authoritative, and deeply personal.',
    description:
      'Connect with those who matter most in an environment that respects your presence.',
    highlight: 'Private',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const router = useRouter();
  const { setHasSeenOnboarding, setHasShownSplash } = useAuthStore();
  const step = ONBOARDING_DATA[index];

  const handleNext = async () => {
    if (index < ONBOARDING_DATA.length - 1) {
      setIndex(index + 1);
    } else {
      setHasShownSplash(true);
      await setHasSeenOnboarding(true);
      router.replace('/');
    }
  };

  const handleSkip = async () => {
    setHasShownSplash(true);
    await setHasSeenOnboarding(true);
    router.replace('/');
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-1 justify-between px-8 py-10">
        {/* Top Section: Skip */}
        <View className="flex-row justify-end">
          <TouchableOpacity onPress={handleSkip} activeOpacity={0.7}>
            <Text
              style={{ fontFamily: 'PlusJakartaSans_500Medium' }}
              className="text-sm uppercase tracking-widest text-muted-foreground">
              Skip
            </Text>
          </TouchableOpacity>
        </View>

        {/* Middle Section: Content */}
        <View className="flex-1 justify-center">
          <View className="space-y-6">
            <View>
              <Text
                style={{ fontFamily: 'Newsreader_600SemiBold' }}
                className="mb-2 text-base uppercase tracking-[0.4em] text-primary opacity-50">
                {step.highlight}
              </Text>
              <Text
                style={{ fontFamily: 'Newsreader_600SemiBold' }}
                className="text-6xl tracking-tighter text-foreground">
                {step.title}
              </Text>
            </View>

            <View className="space-y-4">
              <Text
                style={{ fontFamily: 'PlusJakartaSans_700Bold' }}
                className="text-2xl leading-tight text-foreground/90">
                {step.subtitle}
              </Text>
              <Text
                style={{ fontFamily: 'PlusJakartaSans_400Regular' }}
                className="text-lg leading-relaxed text-muted-foreground">
                {step.description}
              </Text>
            </View>
          </View>
        </View>

        {/* Bottom Section: Indicators & Next */}
        <View className="flex-row items-center justify-between pb-8">
          {/* Pagination dots (Pills) */}
          <View className="flex-row gap-2">
            {ONBOARDING_DATA.map((_, i) => (
              <View
                key={i}
                className={`h-1.5 rounded-full ${
                  i === index ? 'w-8 bg-foreground' : 'w-2 bg-muted'
                }`}
              />
            ))}
          </View>

          {/* Next Button (Carbon pill) */}
          <TouchableOpacity
            onPress={handleNext}
            activeOpacity={0.9}
            className="h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg">
            <ArrowRight color="white" size={24} />
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}
