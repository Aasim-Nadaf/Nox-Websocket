import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { useAuthStore } from '@/lib/store';
import { useColorScheme } from 'nativewind';
import { User, LogOut, Moon, Sun } from 'lucide-react-native';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View className="flex-1 bg-white p-6 pt-12 dark:bg-zinc-950">
      <View className="mb-10 mt-8 items-center justify-center">
        <View className="mb-4 h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-indigo-100 shadow-xl shadow-indigo-600/10 dark:border-zinc-800 dark:bg-indigo-900/30">
          <User size={48} color="#4f46e5" />
        </View>
        <Text className="text-2xl font-extrabold text-zinc-900 dark:text-white">
          {user?.username || 'GuestUser'}
        </Text>
        <Text className="mt-1 text-zinc-500 dark:text-zinc-400">Online</Text>
      </View>

      <View className="mb-6 rounded-3xl border border-zinc-100 bg-zinc-50 p-2 dark:border-zinc-800/50 dark:bg-zinc-900">
        <View className="flex-row items-center justify-between p-4 px-5">
          <View className="flex-row items-center">
            {isDark ? (
              <Moon size={24} color="#a1a1aa" className="mr-4" />
            ) : (
              <Sun size={24} color="#71717a" className="mr-4" />
            )}
            <Text className="text-lg font-semibold text-zinc-800 dark:text-zinc-200">
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e4e4e7', true: '#4f46e5' }}
            thumbColor={'#ffffff'}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={logout}
        activeOpacity={0.7}
        className="mt-4 flex-row items-center justify-center rounded-2xl border border-transparent bg-red-100 p-4 dark:border-red-500/20 dark:bg-red-500/10">
        <LogOut size={20} color="#ef4444" className="mr-2" />
        <Text className="text-lg font-bold text-red-500">Sign Out</Text>
      </TouchableOpacity>
    </View>
  );
}
