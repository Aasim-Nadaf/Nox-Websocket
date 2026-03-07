import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { User } from 'lucide-react-native';

interface UserModel {
  id: string;
  username: string;
}

export default function MessagesScreen() {
  const [users, setUsers] = useState<UserModel[]>([]);
  const [loading, setLoading] = useState(true);
  const { user: currentUser } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/users');
      // Filter out current user from chat list
      setUsers(data.filter((u: UserModel) => u.id !== currentUser?.id));
    } catch (error) {
      console.error('Failed to fetch users', error);
    } finally {
      setLoading(false);
    }
  };

  const renderItem = ({ item }: { item: UserModel }) => (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={() => router.push(`/chat/${item.id}?username=${item.username}`)}
      className="flex-row items-center border-b border-zinc-100 p-4 active:bg-zinc-50 dark:border-zinc-800/50 dark:active:bg-zinc-900">
      <View className="mr-4 h-14 w-14 items-center justify-center rounded-full border border-indigo-200 bg-indigo-100 dark:border-indigo-800/50 dark:bg-indigo-900/30">
        <User size={28} color="#4f46e5" className="opacity-80" />
      </View>
      <View className="flex-1">
        <Text className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{item.username}</Text>
        <Text className="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">Tap to chat</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white dark:bg-zinc-950">
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 24 }}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-24">
            <Text className="text-lg text-zinc-500 dark:text-zinc-400">No other users found.</Text>
          </View>
        }
      />
    </View>
  );
}
