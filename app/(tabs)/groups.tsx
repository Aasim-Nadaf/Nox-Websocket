import React, { useState, useMemo, useCallback } from 'react';
import { View, TextInput, TouchableOpacity, Image, FlatList } from 'react-native';
import { Text } from '@/components/ui/text';
import { useFocusEffect } from '@react-navigation/native';
import { useRouter } from 'expo-router';
import { useAuthStore, useChatStore } from '@/lib/store';
import api from '@/lib/api';
import { Search, X, Users, Menu } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function GroupsScreen() {
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { user: currentUser } = useAuthStore();
  const { chatsList, setChatsList } = useChatStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useFocusEffect(
    useCallback(() => {
      if (currentUser) {
        fetchChats();
      }
    }, [currentUser])
  );

  const fetchChats = async () => {
    if (!currentUser?.id) return;
    try {
      const { data } = await api.get(`chats/${currentUser.id}`);
      setChatsList(data);
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGroups = useMemo(() => {
    const groups = chatsList.filter((chat: any) => chat.type === 'group');
    if (!searchQuery.trim()) return groups;
    const query = searchQuery.toLowerCase();
    return groups.filter((chat: any) => {
      const name = chat.group?.name?.toLowerCase() || '';
      const lastMsg = chat.lastMessage?.content?.toLowerCase() || '';
      return name.includes(query) || lastMsg.includes(query);
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

  const renderGroup = ({ item }: { item: any }) => {
    const timeText = formatTimeAgo(item.lastMessage?.createdAt);
    const lastMessage = item.lastMessage ? item.lastMessage.content : 'No messages yet...';
    const name = item.group?.name || 'Group';
    const id = item.group?.id;
    const avatarUri = `https://ui-avatars.com/api/?name=${name}&background=1a1a1a&color=fff&size=150`;

    if (!id) return null;

    return (
      <TouchableOpacity
        key={id}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${id}?name=${name}&isGroup=true`)}
        className="mb-8 flex-row items-center border-b border-border/20 pb-2">
        <View className="h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-secondary">
          <Image
            source={{ uri: avatarUri }}
            className="h-full w-full grayscale"
            resizeMode="cover"
          />
        </View>

        <View className="ml-5 flex-1">
          <View className="mb-1 flex-row items-center justify-between">
            <Text className="font-jakarta text-lg font-bold text-foreground">{name}</Text>
          </View>
          <View className="flex-row items-center justify-between">
            <Text
              className="mr-4 flex-1 font-jakarta text-[13px] font-medium leading-5 opacity-70"
              numberOfLines={2}>
              {item.lastMessage?.sender?.username
                ? `${item.lastMessage.sender.username}: ${lastMessage}`
                : lastMessage}
            </Text>
            {timeText ? (
              <Text className="mt-1 font-jakarta text-[11px] font-bold uppercase tracking-wider opacity-30">
                {timeText}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const textPrimary = isDark ? '#fff' : '#000';
  const textMuted = isDark ? '#555' : '#aaa';

  return (
    <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        {!isSearching ? (
          <>
            <TouchableOpacity activeOpacity={0.7} className="w-10">
              <Menu size={22} color={textPrimary} strokeWidth={1.5} />
            </TouchableOpacity>

            <Text className="font-newsreader text-3xl font-bold italic text-foreground">Group</Text>

            <TouchableOpacity onPress={() => setIsSearching(true)} className="w-10 items-end">
              <Search size={22} color={textPrimary} strokeWidth={1.5} />
            </TouchableOpacity>
          </>
        ) : (
          <View className="h-12 flex-1 flex-row items-center rounded-full bg-secondary px-4">
            <Search size={18} color={textMuted} />
            <TextInput
              className="ml-3 flex-1 font-jakarta text-[15px] text-foreground"
              placeholder="Search groups..."
              placeholderTextColor={textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoFocus
            />
            <TouchableOpacity onPress={() => setIsSearching(false)}>
              <X size={18} color={textMuted} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View className="flex-1">
        <View className="mt-2 flex-1 px-6">
          <View className="mb-8 flex-row items-baseline justify-between">
            <Text className="font-jakarta text-[10px] font-bold uppercase tracking-[3px] text-foreground opacity-80">
              All groups
            </Text>
            {!isSearching && (
              <TouchableOpacity
                onPress={() => router.push('/create-group')}
                className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1.5">
                <Text className="font-jakarta text-xs font-bold text-primary">+ New</Text>
              </TouchableOpacity>
            )}
          </View>

          {filteredGroups.length === 0 ? (
            <View className="mt-10 flex-1 items-center justify-center opacity-40">
              <Users size={48} color={textPrimary} strokeWidth={1} style={{ marginBottom: 16 }} />
              <Text className="mb-2 font-newsreader text-xl text-foreground">No Groups Yet</Text>
              <Text className="font-jakarta text-xs text-muted-foreground">
                Tap + New to start a group
              </Text>
            </View>
          ) : (
            <FlatList
              data={filteredGroups}
              keyExtractor={(item: any) => item.group?.id || Math.random().toString()}
              renderItem={renderGroup}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 120 }}
            />
          )}
        </View>
      </View>
    </View>
  );
}
