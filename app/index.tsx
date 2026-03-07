import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuthStore } from '@/lib/store';
import api from '@/lib/api';
import { MotiView } from 'moti';

export default function AuthScreen() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { setAuth } = useAuthStore();

  const handleAuth = async () => {
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const { data } = await api.post(endpoint, { username, password });
      await setAuth(data.user, data.token);
    } catch (err: any) {
      console.log('Auth error:', JSON.stringify(err.response?.data));
      setError(err.response?.data?.error || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <MotiView
        from={{ opacity: 0, translateY: 20 }}
        animate={{ opacity: 1, translateY: 0 }}
        transition={{ type: 'spring', damping: 15 }}
        className="w-full max-w-sm rounded-3xl border border-zinc-100 bg-white p-8 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 dark:shadow-none">
        <Text className="mb-2 mt-4 text-center text-3xl font-extrabold text-zinc-900 dark:text-zinc-50">
          {isLogin ? 'Welcome Back' : 'Create Account'}
        </Text>
        <Text className="mb-8 text-center text-zinc-500 dark:text-zinc-400">
          {isLogin ? 'Sign in to continue chatting' : 'Sign up to get started'}
        </Text>

        <View className="space-y-4">
          <View>
            <Text className="mb-1 ml-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Username
            </Text>
            <TextInput
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              placeholder="Enter your username"
              placeholderTextColor="#9ca3af"
              className="mx-auto h-14 w-full rounded-2xl border border-transparent bg-zinc-100 px-5 font-medium text-zinc-900 focus:border-indigo-500 dark:bg-zinc-800 dark:text-white dark:focus:border-indigo-400"
            />
          </View>

          <View className="mt-4">
            <Text className="mb-1 ml-1 text-sm font-semibold text-zinc-700 dark:text-zinc-300">
              Password
            </Text>
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              placeholder="Enter your password"
              placeholderTextColor="#9ca3af"
              className="mx-auto h-14 w-full rounded-2xl border border-transparent bg-zinc-100 px-5 font-medium text-zinc-900 focus:border-indigo-500 dark:bg-zinc-800 dark:text-white dark:focus:border-indigo-400"
            />
          </View>

          {error ? (
            <Text className="mt-2 text-center font-medium text-red-500">{error}</Text>
          ) : null}

          <TouchableOpacity
            onPress={handleAuth}
            disabled={loading}
            activeOpacity={0.8}
            className="mt-6 h-14 w-full items-center justify-center rounded-2xl bg-indigo-600 shadow-lg shadow-indigo-600/30 dark:bg-indigo-500">
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-lg font-bold tracking-wide text-white">
                {isLogin ? 'Sign In' : 'Sign Up'}
              </Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setIsLogin(!isLogin)}
            className="mt-6 items-center"
            activeOpacity={0.6}>
            <Text className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <Text className="font-bold text-indigo-600 dark:text-indigo-400">
                {isLogin ? 'Sign Up' : 'Sign In'}
              </Text>
            </Text>
          </TouchableOpacity>
        </View>
      </MotiView>
    </View>
  );
}
