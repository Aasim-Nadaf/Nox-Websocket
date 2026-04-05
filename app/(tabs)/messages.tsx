import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  InteractionManager,
  ScrollView,
  TextInput,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore, useChatStore } from '@/lib/store';
import { Menu, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function MessagesScreen() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const { user: currentUser } = useAuthStore();
  const { chatsList, setChatsList } = useChatStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useEffect(() => {
    if (currentUser) {
      InteractionManager.runAfterInteractions(() => {
        fetchChats();
      });
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

  const filteredChats = useMemo(() => {
    if (!searchQuery.trim()) return chatsList;
    const query = searchQuery.toLowerCase();
    return chatsList.filter((chat: any) => {
      const username = chat.user.username.toLowerCase();
      const lastMsg = chat.lastMessage?.content?.toLowerCase() || '';
      return username.includes(query) || lastMsg.includes(query);
    });
  }, [chatsList, searchQuery]);

  const formatTimeAgo = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);

    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderRecentThought = (item: any) => (
    <TouchableOpacity
      key={item.user.id}
      activeOpacity={0.7}
      onPress={() => router.push(`/chat/${item.user.id}?username=${item.user.username}`)}
      className="mr-6 items-center">
      <View className="relative h-16 w-16 items-center justify-center rounded-full bg-secondary">
        <Image
          source={{ uri: `https://i.pravatar.cc/150?u=${item.user.username}` }}
          className="h-full w-full rounded-full opacity-80 grayscale"
          resizeMode="cover"
        />
      </View>
      <Text className="mt-2 font-jakarta text-[10px] font-medium uppercase tracking-widest text-foreground">
        {item.user.username.split(' ')[0]}
      </Text>
    </TouchableOpacity>
  );

  const renderConversation = ({ item, index }: { item: any; index: number }) => {
    const isUnread = index === 1; // Visual indicator for design purposes
    const timeText = formatTimeAgo(item.lastMessage?.createdAt);
    const lastMessage = item.lastMessage ? item.lastMessage.content : 'No message yet...';

    return (
      <TouchableOpacity
        key={item.user.id}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${item.user.id}?username=${item.user.username}`)}
        className="mb-8 flex-row items-center border-b border-border/20 pb-2">
        {/* Avatar */}
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary">
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${item.user.username}` }}
            className="h-full w-full grayscale"
            resizeMode="cover"
          />
        </View>

        {/* Content */}
        <View className="ml-5 flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="font-jakarta text-lg font-bold text-foreground">
              {item.user.username}
            </Text>
            <Text className="font-jakarta text-[10px] font-medium uppercase text-foreground opacity-60">
              {timeText}
            </Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className={`flex-1 pr-4 font-jakarta text-sm ${isUnread ? 'font-bold text-muted-foreground' : 'text-muted-foreground opacity-80'}`}
              numberOfLines={1}>
              {lastMessage}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="small" color={isDark ? '#fff' : '#000'} />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        {!isSearching ? (
          <>
            <TouchableOpacity activeOpacity={0.7} className="w-10">
              <Menu size={22} color={isDark ? '#fff' : '#000'} strokeWidth={1.5} />
            </TouchableOpacity>

            <Text className="font-newsreader text-3xl font-bold italic text-foreground">Nox</Text>

            <TouchableOpacity
              onPress={() => setIsSearching(true)}
              activeOpacity={0.7}
              className="w-10 items-end">
              <Search size={22} color={isDark ? '#fff' : '#000'} strokeWidth={1.5} />
            </TouchableOpacity>
          </>
        ) : (
          <View className="flex-1 flex-row items-center justify-center">
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="mr-4">
              <X size={20} color={isDark ? '#fff' : '#000'} strokeWidth={2} />
            </TouchableOpacity>
            <TextInput
              autoFocus
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search Conversations..."
              placeholderTextColor={isDark ? '#666' : '#aaa'}
              className="flex-1 font-newsreader text-xl font-bold italic text-foreground"
              // style={{ paddingBottom: 4 }}
            />
          </View>
        )}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}>
        {/* Recent Thoughts */}
        {!isSearching && (
          <View className="mt-8">
            <Text className="mb-6 px-6 font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
              Recent thoughts
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 24 }}>
              {/* "You" Entry */}
              <TouchableOpacity activeOpacity={0.7} className="mr-6 items-center">
                <View className="relative h-16 w-16 items-center justify-center rounded-full border border-dashed border-muted-foreground/30 bg-secondary">
                  <Text className="font-jakarta text-2xl text-muted-foreground opacity-40">+</Text>
                  <View className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-background bg-primary" />
                </View>
                <Text className="mt-2 font-jakarta text-[10px] font-medium uppercase tracking-widest text-muted-foreground">
                  You
                </Text>
              </TouchableOpacity>

              {chatsList.slice(0, 5).map(renderRecentThought)}
            </ScrollView>
          </View>
        )}

        {/* Conversations List */}
        <View className="mt-6 px-6">
          <View className="mb-8 flex-row items-baseline justify-between">
            <Text className="font-newsreader text-4xl font-bold italic text-foreground">
              {isSearching ? 'Conversations' : 'Conversations'}
            </Text>
            {/* {isSearching && (
              <Text className="font-jakarta text-[10px] font-bold uppercase text-muted-foreground opacity-40">
                {filteredChats.length} Found
              </Text>
            )} */}
          </View>

          {filteredChats.length === 0 ? (
            <View className="items-center justify-center py-20">
              <Text className="font-jakarta text-sm italic text-muted-foreground opacity-60">
                {isSearching ? 'No thoughts found...' : 'No active conversations...'}
              </Text>
            </View>
          ) : (
            filteredChats.map((item, index) => renderConversation({ item, index }))
          )}
        </View>
      </ScrollView>
    </View>
  );
}
