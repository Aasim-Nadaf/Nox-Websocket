import React from 'react';
import { View, Text, TouchableOpacity, Switch, Image } from 'react-native';
import { useAuthStore } from '@/lib/store';
import { useColorScheme } from 'nativewind';
import {
  User,
  LogOut,
  Moon,
  Sun,
  MessageSquare,
  Phone,
  Video,
  ChevronRight,
  Bell,
  Image as ImageIcon,
  MoreVertical,
} from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ProfileScreen() {
  const { user, logout } = useAuthStore();
  const { colorScheme, setColorScheme } = useColorScheme();
  const insets = useSafeAreaInsets();

  const isDark = colorScheme === 'dark';

  const toggleTheme = () => {
    setColorScheme(isDark ? 'light' : 'dark');
  };

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950" style={{ paddingTop: insets.top + 16 }}>
      <View className="mb-2 flex-row items-center justify-between px-6">
        <Text className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Profile
        </Text>
        <TouchableOpacity className="-mr-2 h-10 w-10 items-center justify-center">
          <MoreVertical size={24} color={isDark ? '#fff' : '#09090b'} />
        </TouchableOpacity>
      </View>

      {/* Avatar Section */}
      <View className="mb-6 items-center justify-center">
        <View className="h-[140px] w-[140px] items-center justify-center rounded-full border-[1.5px] border-zinc-900 p-2 dark:border-zinc-300">
          <View className="h-full w-full items-center justify-center overflow-hidden rounded-full bg-orange-100 dark:bg-orange-900/30">
            {/* Using a placeholder User icon since we don't have images */}
            <Image
              source={{ uri: `https://i.pravatar.cc/150?u=${user?.username}` }}
              className="h-full w-full rounded-full"
              resizeMode="cover"
            />
          </View>
        </View>
        <Text className="mt-5 text-[28px] font-bold tracking-tight text-zinc-900 dark:text-white">
          {user?.username || 'GuestUser'}
        </Text>
        <Text className="mt-1 text-base text-zinc-400 dark:text-zinc-500">Online</Text>
      </View>

      {/* Action Buttons Row */}
      <View className="mb-10 flex-row items-center justify-center gap-x-4 px-6">
        <TouchableOpacity
          activeOpacity={0.8}
          className="min-w-[140px] flex-row items-center justify-center rounded-full bg-black px-6 py-3.5 dark:bg-white">
          <MessageSquare size={18} color={isDark ? '#000' : '#fff'} className="mr-2" />
          <Text className="ml-2 text-base font-semibold text-white dark:text-black">Message</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="h-[52px] w-[52px] items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <Phone size={20} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.8}
          className="h-[52px] w-[52px] items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <Video size={20} color={isDark ? '#fff' : '#000'} />
        </TouchableOpacity>
      </View>

      {/* List Items */}
      <View className="gap-y-6 px-6">
        {/* Dark Mode */}
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              {isDark ? (
                <Moon size={22} color={isDark ? '#fff' : '#000'} />
              ) : (
                <Sun size={22} color={isDark ? '#fff' : '#000'} />
              )}
            </View>
            <Text className="ml-4 text-[17px] font-semibold text-zinc-900 dark:text-white">
              Dark Mode
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ false: '#e4e4e7', true: '#000000' }}
            thumbColor={'#ffffff'}
            ios_backgroundColor="#e4e4e7"
          />
        </View>

        {/* Notifications */}
        <TouchableOpacity activeOpacity={0.7} className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
              <Bell size={22} color={isDark ? '#fff' : '#000'} />
            </View>
            <Text className="ml-4 text-[17px] font-semibold text-zinc-900 dark:text-white">
              Notifications
            </Text>
          </View>
          <ChevronRight size={20} color="#a1a1aa" />
        </TouchableOpacity>

        {/* Sign Out (Styled as Block Contact in design) */}
        <TouchableOpacity
          onPress={logout}
          activeOpacity={0.7}
          className="flex-row items-center justify-between">
          <View className="flex-row items-center">
            <View className="h-12 w-12 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/30">
              <LogOut size={22} color="#ef4444" />
            </View>
            <Text className="ml-4 text-[17px] font-semibold text-red-500">Sign Out</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}
