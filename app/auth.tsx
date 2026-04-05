import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Image,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import {
  Eye,
  EyeOff,
  ArrowLeft,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  Chrome,
  Apple,
} from 'lucide-react-native';
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

  const handleSocialLogin = (provider: string) => {
    Toast.show({
      type: 'info',
      text1: 'Coming Soon',
      text2: `${provider} login will be available in a future update.`,
    });
  };

  return (
    <View className="flex-1 bg-background">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ paddingTop: insets.top }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-4">
            <TouchableOpacity
              onPress={() => router.back()}
              className="h-10 w-10 items-center justify-center rounded-full bg-secondary">
              <ArrowLeft size={20} color={isDark ? '#fff' : '#000'} />
            </TouchableOpacity>
            <Text className="font-jakarta text-sm uppercase tracking-widest opacity-40">Nox</Text>
            <View className="w-10" />
          </View>

          <View className="flex-1 px-8 pt-6">
            {/* Title Section */}
            <View className="mb-10">
              <Text className="font-jakarta text-[42px] font-bold leading-tight text-foreground">
                {isLogin ? 'Welcome back' : 'Create account'}
              </Text>
              <View className="mt-2 flex-row items-center">
                <Text className="font-jakarta text-muted-foreground">
                  {isLogin ? "Don't have an account? " : 'Already have an account? '}
                </Text>
                <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
                  <Text className="font-jakarta font-bold text-foreground underline">
                    {isLogin ? 'Sign up' : 'Sign in'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Inputs */}
            <View className="space-y-4">
              <View className="relative">
                <View className="absolute bottom-0 left-6 top-0 z-10 justify-center">
                  <Mail size={20} color={isDark ? '#666' : '#999'} />
                </View>
                <Input
                  value={username}
                  onChangeText={setUsername}
                  placeholder="Email address"
                  placeholderTextColor={isDark ? '#444' : '#bbb'}
                  autoCapitalize="none"
                  className="h-[72px] rounded-[32px] border-0 bg-secondary pl-16 pr-6 font-jakarta text-lg text-foreground"
                />
              </View>

              <View className="relative mt-4">
                <View className="absolute bottom-0 left-6 top-0 z-10 justify-center">
                  <Lock size={20} color={isDark ? '#666' : '#999'} />
                </View>
                <Input
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="Password"
                  placeholderTextColor={isDark ? '#444' : '#bbb'}
                  autoCapitalize="none"
                  className="h-[72px] rounded-[32px] border-0 bg-secondary pl-16 pr-14 font-jakarta text-lg text-foreground"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  className="absolute bottom-0 right-6 top-0 justify-center">
                  {showPassword ? (
                    <EyeOff size={20} color={isDark ? '#666' : '#999'} />
                  ) : (
                    <Eye size={20} color={isDark ? '#666' : '#999'} />
                  )}
                </TouchableOpacity>
              </View>

              {isLogin && (
                <TouchableOpacity className="mt-2 self-end pr-2">
                  <Text className="font-jakarta text-sm font-medium text-muted-foreground underline">
                    Forgot password?
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Main Action Button */}
            <TouchableOpacity
              onPress={handleAuth}
              disabled={loading}
              activeOpacity={0.8}
              className="mt-10 h-[72px] items-center justify-center rounded-[32px] bg-primary shadow-sm">
              {loading ? (
                <ActivityIndicator color={isDark ? '#000' : '#fff'} />
              ) : (
                <Text className="font-jakarta text-xl font-bold text-primary-foreground">
                  {isLogin ? 'Sign in' : 'Create account'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View className="my-10 flex-row items-center">
              <View className="h-[1px] flex-1 bg-border opacity-50" />
              <Text className="mx-4 font-jakarta text-xs uppercase tracking-widest text-muted-foreground">
                or
              </Text>
              <View className="h-[1px] flex-1 bg-border opacity-50" />
            </View>

            {/* Social Logins */}
            <View className="space-y-4">
              <TouchableOpacity
                onPress={() => handleSocialLogin('Google')}
                className="mb-4 h-[64px] flex-row items-center justify-center gap-1 space-x-3 rounded-[32px] border border-border">
                <Chrome size={20} color={isDark ? '#fff' : '#000'} />
                <Text className="font-jakarta text-base font-medium text-foreground">
                  Continue with Google
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => handleSocialLogin('Apple')}
                className="h-[64px] flex-row items-center justify-center gap-1 space-x-3 rounded-[32px] border border-border">
                <Apple size={20} color={isDark ? '#fff' : '#000'} />
                <Text className="font-jakarta text-base font-medium text-foreground">
                  Continue with Apple
                </Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View className="mb-20 mt-12">
              <Text className="text-center font-jakarta text-xs leading-relaxed text-muted-foreground">
                By signing {isLogin ? 'in' : 'up'}, you agree to our{' '}
                <Text className="text-foreground underline">Terms of Service</Text> and{' '}
                <Text className="text-foreground underline">Privacy Policy</Text>.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Tabs (Visual only component matching design) */}
      {/* <View 
        className="absolute bottom-10 self-center bg-secondary rounded-full flex-row p-2 shadow-lg"
        style={{ paddingHorizontal: 8 }}>
        <TouchableOpacity 
          onPress={() => setIsLogin(true)}
          className={`px-8 py-3 rounded-full flex-row items-center space-x-2 ${isLogin ? 'bg-primary' : ''}`}>
          <LogIn size={18} color={isLogin ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')} />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setIsLogin(false)}
          className={`px-8 py-3 rounded-full flex-row items-center space-x-2 ${!isLogin ? 'bg-primary' : ''}`}>
          <UserPlus size={18} color={!isLogin ? (isDark ? '#000' : '#fff') : (isDark ? '#fff' : '#000')} />
        </TouchableOpacity>
      </View> */}
    </View>
  );
}
