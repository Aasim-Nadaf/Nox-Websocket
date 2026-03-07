import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore, useChatStore } from '@/lib/store';
import { User, Bell, Search, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface UserModel {
  id: string;
  username: string;
}

export default function MessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const { user: currentUser } = useAuthStore();
  const { chatsList, setChatsList } = useChatStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (currentUser) {
      fetchChats();
    }
  }, [currentUser]);

  const fetchChats = async () => {
    try {
      const { data } = await api.get(`/chats/${currentUser?.id}`);
      setChatsList(data);
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredChats = chatsList.filter((chat) =>
    chat.user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const isToday =
      date.getDate() === now.getDate() &&
      date.getMonth() === now.getMonth() &&
      date.getFullYear() === now.getFullYear();

    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const renderItem = ({ item, index }: { item: any; index: number }) => {
    // Generate some mock variations for online/unread based on index for design context
    const isOnline = index % 3 === 0;
    const unreadCount = 0; // Keeping 0 to be realistic since we don't have read receipts yet
    const timeText = formatTime(item.lastMessage?.createdAt);
    const lastMessage = item.lastMessage ? item.lastMessage.content : 'Tap to chat...';

    return (
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${item.user.id}?username=${item.user.username}`)}
        className="mb-6 flex-row items-center pl-1 pr-4">
        {/* Avatar with Online Badge */}
        <View className="relative mr-4 h-14 w-14 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30">
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.user.username}` }}
            className="h-full w-full rounded-full"
            resizeMode="cover"
          />
          {isOnline && (
            <View className="absolute bottom-0 right-0 h-4 w-4 rounded-full border-2 border-white bg-green-500 dark:border-zinc-950" />
          )}
        </View>

        {/* Name and Last Message */}
        <View className="flex-1">
          <Text className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            {item.user.username}
          </Text>
          <Text className="mt-1 text-sm text-zinc-500 dark:text-zinc-400" numberOfLines={1}>
            {lastMessage}
          </Text>
        </View>

        {/* Time and Unread Badge */}
        <View className="items-end pl-2">
          <Text className="text-xs text-zinc-400 dark:text-zinc-500">{timeText}</Text>
          {unreadCount > 0 ? (
            <View className="mt-1 h-5 min-w-[20px] items-center justify-center rounded-full bg-black px-1 dark:bg-white">
              <Text className="text-[10px] font-bold text-white dark:text-black">
                {unreadCount}
              </Text>
            </View>
          ) : (
            <View className="mt-1 h-5" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-white dark:bg-zinc-950">
        <ActivityIndicator size="large" color="#4f46e5" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-white pt-4 dark:bg-zinc-950" style={{ paddingTop: insets.top + 16 }}>
      {/* Header */}
      <View className="mb-6 flex-row items-center justify-between px-6">
        <Text className="text-3xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
          Messages
        </Text>
        <TouchableOpacity className="h-10 w-10 items-center justify-center rounded-full bg-zinc-100 dark:bg-zinc-900">
          <Bell size={20} color="#09090b" className="dark:color-white" />
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View className="mb-8 px-6">
        <View className="h-12 flex-row items-center rounded-full border border-zinc-100 bg-zinc-50 px-4 dark:border-zinc-800 dark:bg-zinc-900">
          <Search size={20} color="#a1a1aa" />
          <TextInput
            placeholder="Search chats"
            placeholderTextColor="#a1a1aa"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="ml-3 flex-1 text-base text-zinc-900 dark:text-white"
          />
        </View>
      </View>

      {/* List */}
      <FlatList
        data={filteredChats}
        keyExtractor={(item) => item.user.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center pt-24">
            <Text className="text-lg text-zinc-500 dark:text-zinc-400">No chats found.</Text>
          </View>
        }
      />

      {/* <TouchableOpacity
        className="absolute bottom-[110px] right-6 h-14 w-14 items-center justify-center rounded-full bg-black shadow-lg shadow-black/20 dark:bg-white"
        activeOpacity={0.8}>
        <Plus size={24} color="white" className="dark:color-black" />
      </TouchableOpacity> */}
    </View>
  );
}
