import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  TextInput,
  RefreshControl,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useRouter, Href } from 'expo-router';
import api from '@/lib/api';
import { useAuthStore, useChatStore } from '@/lib/store';
import { Menu, Search, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';
import { useFocusEffect } from '@react-navigation/native';

export default function MessagesScreen() {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { user: currentUser } = useAuthStore();
  const chatsList = useChatStore((state) => state.chatsList);
  const setChatsList = useChatStore((state) => state.setChatsList);

  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  useFocusEffect(
    useCallback(() => {
      fetchChats();
    }, [currentUser?.id])
  );

  const fetchChats = async (isRefresh = false) => {
    if (!currentUser?.id) return;
    if (isRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    try {
      const { data } = await api.get(`chats/${currentUser.id}`);
      // data is an array of {type, user?, group?, lastMessage}
      if (Array.isArray(data)) {
        setChatsList(data);
      }
    } catch (error) {
      console.error('Failed to fetch chats', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Only show direct chats (individual users), sorted by lastMessage date
  const filteredChats = useMemo(() => {
    // 1. Filter for direct chats only
    let list = chatsList.filter((c: any) => c.type === 'direct' && c.user);
    
    // 2. Filter based on search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      list = list.filter((chat: any) => {
        const name = chat.user?.username?.toLowerCase() || '';
        const lastMsg = chat.lastMessage?.content?.toLowerCase() || '';
        return name.includes(query) || lastMsg.includes(query);
      });
    }

    // 3. Sort by lastMessage date (latest first, then users with no messages)
    const sorted = [...list].sort((a, b) => {
      const timeA = a.lastMessage ? new Date(a.lastMessage.createdAt).getTime() : 0;
      const timeB = b.lastMessage ? new Date(b.lastMessage.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    return sorted;
  }, [chatsList, searchQuery]);

  const allUsers = useMemo(() => {
    return filteredChats;
  }, [filteredChats]);

  const formatTime = (dateString?: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / 60000);
    if (diffInMinutes < 1) return 'now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}h`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d`;
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderRecentThought = (item: any, index: number) => {
    if (!item || item.type === 'group' || !item.user) return null;
    const { id, username, isOnline } = item.user;
    return (
      <TouchableOpacity
        key={id || index}
        activeOpacity={0.7}
        onPress={() => router.push(`/chat/${id}?username=${encodeURIComponent(username)}` as Href)}
        style={{ marginRight: 24, alignItems: 'center' }}>
        <View style={{ position: 'relative', width: 64, height: 64 }}>
          <Image
            source={{ uri: `https://i.pravatar.cc/150?u=${username}` }}
            style={{ width: 64, height: 64, borderRadius: 32, opacity: 0.85 }}
            resizeMode="cover"
          />
          {isOnline && (
            <View
              style={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                width: 16,
                height: 16,
                borderRadius: 8,
                backgroundColor: '#22c55e',
                borderWidth: 2,
                borderColor: isDark ? '#111' : '#fafafa',
              }}
            />
          )}
        </View>
        <Text
          style={{
            marginTop: 8,
            fontSize: 10,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: 1.5,
            color: isDark ? '#f5f2ed' : '#1a1a1a',
          }}
          numberOfLines={1}>
          {username?.split(' ')[0] || 'User'}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderConversation = (item: any, index: number) => {
    if (!item) return null;
    
    const isGroup = item.type === 'group';
    const chatName = isGroup ? item.group?.name : item.user?.username;
    const chatId = isGroup ? item.group?.id : item.user?.id;
    const isOnline = !isGroup && item.user?.isOnline;

    if (!chatId) return null;

    const lastMsgContent = item.lastMessage?.content || 'No messages yet';
    const timeText = formatTime(item.lastMessage?.createdAt);
    const isMine = item.lastMessage?.senderId === currentUser?.id;
    const isRead = item.lastMessage?.status === 'READ';

    const avatarUri = isGroup
      ? `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'G')}&background=1a1a1a&color=fff`
      : `https://i.pravatar.cc/150?u=${chatName}`;

    const navigationPath = isGroup
      ? `/chat/${chatId}?name=${encodeURIComponent(chatName)}&isGroup=true`
      : `/chat/${chatId}?username=${encodeURIComponent(chatName)}`;

    return (
      <TouchableOpacity
        key={chatId}
        activeOpacity={0.7}
        onPress={() => router.push(navigationPath as Href)}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          marginBottom: 28,
          paddingBottom: 8,
          borderBottomWidth: 1,
          borderBottomColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
        }}>
        {/* Avatar */}
        <View style={{ position: 'relative', width: 60, height: 60 }}>
          <Image
            source={{ uri: avatarUri }}
            style={{ width: 60, height: 60, borderRadius: 30 }}
            resizeMode="cover"
          />
          {isOnline && (
            <View
              style={{
                position: 'absolute',
                bottom: 1,
                right: 1,
                width: 13,
                height: 13,
                borderRadius: 7,
                backgroundColor: '#22c55e',
                borderWidth: 2,
                borderColor: isDark ? '#111' : '#fafafa',
              }}
            />
          )}
        </View>

        {/* Content */}
        <View style={{ marginLeft: 16, flex: 1 }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
            <Text
              style={{
                fontSize: 16,
                fontWeight: '700',
                color: isDark ? '#f5f2ed' : '#1a1a1a',
                flex: 1,
              }}
              numberOfLines={1}>
              {chatName}
            </Text>
            {timeText ? (
              <Text
                style={{
                  fontSize: 11,
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  color: isDark ? 'rgba(245,242,237,0.4)' : 'rgba(0,0,0,0.35)',
                  marginLeft: 8,
                }}>
                {timeText}
              </Text>
            ) : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {isMine && (
              <Text
                style={{
                  marginRight: 4,
                  fontSize: 12,
                  color: isRead ? '#3b82f6' : isDark ? 'rgba(245,242,237,0.4)' : 'rgba(0,0,0,0.35)',
                }}>
                {isRead ? '✓✓' : '✓'}
              </Text>
            )}
            <Text
              numberOfLines={1}
              style={{
                flex: 1,
                fontSize: 13,
                color: isDark ? 'rgba(245,242,237,0.55)' : 'rgba(0,0,0,0.5)',
                paddingRight: 8,
              }}>
              {isGroup && item.lastMessage?.sender?.username && !isMine 
                ? `${item.lastMessage.sender.username}: ${lastMsgContent}`
                : lastMsgContent}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const textPrimary = isDark ? '#f5f2ed' : '#1a1a1a';
  const textMuted = isDark ? 'rgba(245,242,237,0.45)' : 'rgba(0,0,0,0.4)';
  const bgColor = isDark ? '#111111' : '#fafaf8';
  const searchBg = isDark ? '#1c1c1c' : '#f0ede8';

  return (
    <View style={{ flex: 1, backgroundColor: bgColor, paddingTop: insets.top }}>
      {/* Header */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingHorizontal: 24,
          paddingVertical: 16,
        }}>
        {!isSearching ? (
          <>
            <TouchableOpacity activeOpacity={0.7} style={{ width: 40 }}>
              <Menu size={22} color={textPrimary} strokeWidth={1.5} />
            </TouchableOpacity>

            <Text
              style={{
                fontSize: 28,
                fontWeight: '700',
                fontStyle: 'italic',
                color: textPrimary,
              }}>
              Nox
            </Text>

            <TouchableOpacity
              onPress={() => setIsSearching(true)}
              activeOpacity={0.7}
              style={{ width: 40, alignItems: 'flex-end' }}>
              <Search size={22} color={textPrimary} strokeWidth={1.5} />
            </TouchableOpacity>
          </>
        ) : (
          <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              style={{ marginRight: 12 }}>
              <X size={20} color={textPrimary} strokeWidth={2} />
            </TouchableOpacity>
            <View
              style={{
                flex: 1,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: searchBg,
                borderRadius: 20,
                paddingHorizontal: 14,
                height: 40,
              }}>
              <Search size={16} color={textMuted} />
              <TextInput
                autoFocus
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search conversations..."
                placeholderTextColor={textMuted}
                style={{
                  flex: 1,
                  marginLeft: 8,
                  fontSize: 15,
                  color: textPrimary,
                }}
              />
            </View>
          </View>
        )}
      </View>

      {loading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="small" color={textPrimary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 120 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchChats(true)}
              tintColor={textPrimary}
            />
          }>
          {/* Recent Thoughts (horizontal avatars) */}
          {!isSearching && allUsers.length > 0 && (
            <View style={{ marginTop: 24 }}>
              <Text
                style={{
                  marginBottom: 16,
                  paddingHorizontal: 24,
                  fontSize: 10,
                  fontWeight: '700',
                  textTransform: 'uppercase',
                  letterSpacing: 3,
                  color: textPrimary,
                  opacity: 0.7,
                }}>
                Recent
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingHorizontal: 24 }}>
                {/* "You" */}
                <TouchableOpacity activeOpacity={0.7} style={{ marginRight: 24, alignItems: 'center' }}>
                  <View
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 32,
                      backgroundColor: isDark ? '#1c1c1c' : '#eeece9',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderWidth: 1,
                      borderStyle: 'dashed',
                      borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
                    }}>
                    <Text style={{ fontSize: 22, color: textMuted }}>+</Text>
                  </View>
                  <Text
                    style={{
                      marginTop: 8,
                      fontSize: 10,
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: 1.5,
                      color: textMuted,
                    }}>
                    You
                  </Text>
                </TouchableOpacity>
                {allUsers.slice(0, 10).map((item: any, idx: number) =>
                  renderRecentThought(item, idx)
                )}
              </ScrollView>
            </View>
          )}

          {/* Conversations */}
          <View style={{ marginTop: 28, paddingHorizontal: 24 }}>
            <Text
              style={{
                fontSize: 36,
                fontWeight: '800',
                fontStyle: 'italic',
                color: textPrimary,
                marginBottom: 24,
              }}>
              Conversations
            </Text>

            {filteredChats.length === 0 ? (
              <View style={{ alignItems: 'center', justifyContent: 'center', paddingVertical: 80 }}>
                <Text
                  style={{
                    fontSize: 14,
                    fontStyle: 'italic',
                    color: textMuted,
                  }}>
                  {isSearching ? 'No results found...' : 'No users found...'}
                </Text>
              </View>
            ) : (
              filteredChats.map((item: any, index: number) => renderConversation(item, index))
            )}
          </View>
        </ScrollView>
      )}
    </View>
  );
}
