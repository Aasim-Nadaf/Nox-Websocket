import React from 'react';
import { View, TouchableOpacity, ImageBackground, Dimensions } from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';
import { useColorScheme } from 'nativewind';

const { width } = Dimensions.get('window');
const circleSize = Math.min(width * 0.7, 280);

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  return (
    <View
      className="flex-1 bg-white dark:bg-zinc-950"
      style={{ paddingTop: Math.max(insets.top, 16), paddingBottom: Math.max(insets.bottom, 16) }}>
      <View className="flex-1 px-8 pb-4">
        {/* Top App Bar / Logo Section */}
        <View className="items-center justify-center pb-2 pt-6">
          <View className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-black/10 dark:border-white/10">
            <MessageSquare color={isDark ? 'white' : 'black'} size={24} />
          </View>
        </View>

        {/* Hero Section with Circle Image */}
        <View className="mt-8 items-center justify-center py-6">
          <View className="relative">
            <View
              style={{ width: circleSize, height: circleSize, borderRadius: circleSize / 2 }}
              className="overflow-hidden border-8 border-white bg-slate-200 shadow-xl dark:border-slate-900 dark:bg-slate-800">
              <ImageBackground
                source={{
                  uri: 'https://images.unsplash.com/photo-1543807535-eceef0bc6599?q=80&w=600&auto=format&fit=crop',
                }}
                style={{ flex: 1 }}
                imageStyle={{ borderRadius: circleSize / 2, opacity: 0.9 }}
                className="grayscale" // Using nativewind for basic grayscale effect visually if possible, or just standard photo styling
              />
            </View>

            {/* Subtle Decorative Element */}
            <View className="absolute -bottom-2 -right-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#111418] shadow-lg dark:bg-white">
              <MessageSquare
                color={isDark ? 'black' : 'white'}
                size={22}
                fill={isDark ? 'black' : 'white'}
              />
            </View>
          </View>
        </View>

        {/* Content Section */}
        <View className="flex-1 justify-center py-8">
          <Text className="text-center text-[42px] font-extrabold leading-[1.1] tracking-tight text-slate-900 dark:text-slate-100">
            Beyond{'\n'}words.
          </Text>
          <Text className="mx-auto mt-4 max-w-[280px] text-center text-lg font-medium leading-relaxed text-slate-500 dark:text-slate-400">
            A sophisticated way to connect with those who matter most.
          </Text>
        </View>

        {/* Action Section */}
        <View className="space-y-4">
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push({ pathname: '/auth', params: { isLogin: 'false' } })}
            className="flex h-16 w-full items-center justify-center rounded-full bg-[#111418] shadow-lg active:scale-95 dark:bg-slate-100">
            <Text className="text-lg font-bold tracking-wide text-white dark:text-[#111418]">
              Get Started
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.6}
            onPress={() => router.push({ pathname: '/auth', params: { isLogin: 'true' } })}
            className="flex items-center justify-center py-3">
            <Text className="text-base font-semibold leading-normal text-slate-400 dark:text-slate-500">
              Already have an account?{' '}
              <Text className="text-[#111418] underline underline-offset-4 dark:text-slate-200">
                Sign In
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
