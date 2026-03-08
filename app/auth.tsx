import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useLocalSearchParams, useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';

export default function AuthScreen() {
  const { isLogin: isLoginParam } = useLocalSearchParams<{ isLogin?: string }>();
  const [isLogin, setIsLogin] = useState(isLoginParam !== 'false');

  // Update state if param changes
  useEffect(() => {
    if (isLoginParam !== undefined) {
      setIsLogin(isLoginParam !== 'false');
    }
  }, [isLoginParam]);

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  const { setAuth } = useAuthStore();

  const handleAuth = async () => {
    if (!username || !password) {
      Toast.show({
        type: 'error',
        text1: 'Missing Fields',
        text2: 'Please fill in all fields',
      });
      return;
    }
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { username, password });

      Toast.show({
        type: 'success',
        text1: 'Success',
        text2: isLogin ? 'Successfully logged in!' : 'Successfully created account!',
      });

      setTimeout(async () => {
        await setAuth(data.user, data.token);
      }, 1000);
    } catch (err: any) {
      console.log('Auth error:', JSON.stringify(err.response?.data));
      Toast.show({
        type: 'error',
        text1: 'Authentication Failed',
        text2: err.response?.data?.error || 'Something went wrong',
      });
    } finally {
      setLoading(false);
    }
  };

  const renderSignIn = () => (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-6">
        <TouchableOpacity
          onPress={() => {
            router.replace('/');
          }}
          activeOpacity={0.7}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <View className="w-12" />
      </View>

      <View className="flex-1 flex-col px-8">
        <View className="pb-10 pt-4">
          <Text className="text-[40px] font-extrabold tracking-tight text-black dark:text-white">
            Welcome Back
          </Text>
          <Text className="mt-3 text-lg font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
            Sign in to continue chatting.
          </Text>
        </View>

        <View className="space-y-6">
          <View className="flex flex-col gap-2">
            <Text className="ml-2 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Username
            </Text>
            <View className="relative">
              <Input
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="Alex Johnson"
                placeholderTextColor="#a1a1aa"
                className="h-[60px] w-full rounded-2xl bg-zinc-100 px-6 text-base font-medium text-black focus:border-2 focus:border-black dark:bg-zinc-900 dark:text-white dark:focus:border-white"
              />
            </View>
          </View>

          <View className="flex flex-col gap-2">
            <Text className="ml-2 mt-2 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Password
            </Text>
            <View className="relative">
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="••••••••"
                placeholderTextColor="#a1a1aa"
                className="h-[60px] w-full rounded-2xl bg-zinc-100 pl-6 pr-14 text-base font-medium text-black focus:border-2 focus:border-black dark:bg-zinc-900 dark:text-white dark:focus:border-white"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                className="absolute right-4 top-0 h-[60px] items-center justify-center px-2">
                {showPassword ? (
                  <EyeOff size={22} color="#71717a" />
                ) : (
                  <Eye size={22} color="#71717a" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="mt-12">
          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
            className="h-[60px] w-full items-center justify-center rounded-2xl bg-black shadow-lg shadow-black/20 dark:bg-white dark:shadow-white/10">
            {loading ? (
              <ActivityIndicator color={isDark ? 'black' : 'white'} />
            ) : (
              <Text className="text-lg font-bold text-white dark:text-black">Sign In</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-10 items-center justify-center">
          <Text className="text-base font-medium text-zinc-500 dark:text-zinc-400">
            Don't have an account?{' '}
          </Text>
          <TouchableOpacity
            className="mt-2 py-2"
            activeOpacity={0.6}
            onPress={() => {
              setIsLogin(false);
            }}>
            <Text className="text-lg font-extrabold text-black dark:text-white">
              Create Account
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mt-auto items-center justify-center px-2 pb-8 pt-8 text-center">
          <Text className="text-center text-[12px] font-medium leading-relaxed text-zinc-400 dark:text-zinc-500">
            Forgot Password? <Text className="underline">Recover your account here</Text>.
          </Text>
        </View>
      </View>
    </View>
  );

  const renderSignUp = () => (
    <View className="flex-1">
      <View className="flex-row items-center justify-between px-6 pb-2 pt-6">
        <TouchableOpacity
          onPress={() => {
            router.replace('/');
          }}
          activeOpacity={0.7}
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <ArrowLeft size={24} color={isDark ? 'white' : 'black'} />
        </TouchableOpacity>
        <View className="w-12" />
      </View>

      <View className="flex-1 flex-col px-8">
        <View className="pb-10 pt-4">
          <Text className="text-[40px] font-extrabold tracking-tight text-black dark:text-white">
            Create Account
          </Text>
          <Text className="mt-3 text-lg font-medium leading-relaxed text-zinc-500 dark:text-zinc-400">
            Join minimalist messaging community.
          </Text>
        </View>

        <View className="space-y-6">
          <View className="flex flex-col gap-2">
            <Text className="ml-2 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Username
            </Text>
            <View className="relative">
              <Input
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                placeholder="Alex Johnson"
                placeholderTextColor="#a1a1aa"
                className="h-[60px] w-full rounded-2xl bg-zinc-100 px-6 text-base font-medium text-black focus:border-2 focus:border-black dark:bg-zinc-900 dark:text-white dark:focus:border-white"
              />
            </View>
          </View>

          <View className="flex flex-col gap-2">
            <Text className="ml-2 mt-2 text-xs font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
              Password
            </Text>
            <View className="relative">
              <Input
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
                placeholder="••••••••"
                placeholderTextColor="#a1a1aa"
                className="h-[60px] w-full rounded-2xl bg-zinc-100 pl-6 pr-14 text-base font-medium text-black focus:border-2 focus:border-black dark:bg-zinc-900 dark:text-white dark:focus:border-white"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
                className="absolute right-4 top-0 h-[60px] items-center justify-center px-2">
                {showPassword ? (
                  <EyeOff size={22} color="#71717a" />
                ) : (
                  <Eye size={22} color="#71717a" />
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View className="mt-12">
          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
            className="h-[60px] w-full items-center justify-center rounded-2xl bg-black shadow-lg shadow-black/20 dark:bg-white dark:shadow-white/10">
            {loading ? (
              <ActivityIndicator color={isDark ? 'black' : 'white'} />
            ) : (
              <Text className="text-lg font-bold text-white dark:text-black">Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        <View className="mt-10 items-center justify-center">
          <Text className="text-base font-medium text-zinc-500 dark:text-zinc-400">
            Already have an account?{' '}
          </Text>
          <TouchableOpacity
            className="mt-2 py-2"
            activeOpacity={0.6}
            onPress={() => {
              setIsLogin(true);
            }}>
            <Text className="text-lg font-extrabold text-black dark:text-white">Log In</Text>
          </TouchableOpacity>
        </View>

        <View className="mt-auto items-center justify-center px-2 pb-8 pt-8 text-center">
          <Text className="text-center text-[12px] font-medium leading-relaxed text-zinc-400 dark:text-zinc-500">
            By creating an account, you agree to our{' '}
            <Text className="underline">Terms of Service</Text> and{' '}
            <Text className="underline">Privacy Policy</Text>.
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-white dark:bg-zinc-950"
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      style={{ paddingTop: Math.max(insets.top, 16) }}>
      <ScrollView
        contentContainerStyle={{ flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        {isLogin ? renderSignIn() : renderSignUp()}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
