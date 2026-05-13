import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuthStore, useChatStore, Message } from '@/lib/store';
import { wsManager } from '@/lib/websocket';
import api from '@/lib/api';
import { Send, ChevronLeft, MoreVertical, Mic, Plus } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function ChatScreen() {
  const {
    id: otherUserId,
    username,
    name,
    isGroup,
  } = useLocalSearchParams<{ id: string; username?: string; name?: string; isGroup?: string }>();

  const isGroupChat = String(isGroup) === 'true';
  const chatName = isGroupChat ? name : username;

  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [historyLoading, setHistoryLoading] = useState(true);

  const { user: currentUser } = useAuthStore();
  const typingUsers = useChatStore((state) => state.typingUsers);
  const chatsList = useChatStore((state) => state.chatsList);

  const isTyping = otherUserId ? !!typingUsers[otherUserId as string] : false;
  const chatPartner = !isGroupChat
    ? chatsList.find((c) => c.type === 'direct' && c.user?.id === otherUserId)?.user
    : null;

  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // Design tokens
  const pageBg = isDark ? '#111111' : '#faf8f5';
  const surface = isDark ? '#1c1c1c' : '#ffffff';
  const border = isDark ? '#2a2a2a' : '#e2ddd7';
  const inputBg = isDark ? '#1c1c1c' : '#f0ede8';
  const textPrimary = isDark ? '#f5f2ed' : '#1a1a1a';
  const textMuted = isDark ? 'rgba(245,242,237,0.45)' : 'rgba(0,0,0,0.4)';

  // ── Register chat-specific WS handler ────────────────────────────────────
  const sOtherUserId = otherUserId ? String(otherUserId) : null;
  const sMyId = currentUser?.id ? String(currentUser.id) : null;

  useEffect(() => {
    wsManager.onChatMessageHandler = (msg: any) => {
      if (!msg || !msg.type) return;

      // 1. Update local messages list if it belongs to this conversation
      const isGroupMsg = msg.type === 'new_group_message';
      const newMsg: Message = msg.message;
      if (!newMsg || !newMsg.id) return;

      let belongsToThisChat = false;
      if (isGroupMsg) {
        belongsToThisChat = isGroupChat && String(msg.groupId) === sOtherUserId;
      } else {
        const sSndr = String(newMsg.senderId);
        const sRcvr = newMsg.receiverId ? String(newMsg.receiverId) : '';
        const isFromOther = sSndr === sOtherUserId;
        const isFromMe = sSndr === sMyId && sRcvr === sOtherUserId;
        belongsToThisChat = !isGroupChat && (isFromOther || isFromMe);
      }

      if (belongsToThisChat) {
        setMessages((prev) => {
          const sSndr = String(newMsg.senderId);
          // Replace optimistic message OR append if not found
          const idx = prev.findIndex(
            (m) =>
              String(m.id) === String(newMsg.id) ||
              (String(m.id).startsWith('temp-') &&
                m.content === newMsg.content &&
                String(m.senderId) === sSndr)
          );
          if (idx >= 0) {
            const next = [...prev];
            next[idx] = newMsg;
            return next;
          }
          return [...prev, newMsg];
        });
      }
    };

    return () => {
      wsManager.onChatMessageHandler = null;
    };
  }, [sOtherUserId, isGroupChat]);

  // ── Fetch message history ─────────────────────────────────────────────────
  useEffect(() => {
    loadHistory();
  }, [otherUserId, currentUser?.id]);

  const loadHistory = async () => {
    if (!currentUser?.id || !otherUserId) {
      console.warn('[ChatScreen] Missing IDs:', { currentUserId: currentUser?.id, otherUserId });
      setHistoryLoading(false);
      return;
    }
    setHistoryLoading(true);
    try {
      const endpoint = isGroupChat
        ? `messages/group/${otherUserId}`
        : `messages/${currentUser.id}/${otherUserId}`;
      console.log('[ChatScreen] Loading history from:', endpoint);
      const { data } = await api.get(endpoint);
      if (Array.isArray(data)) {
        setMessages(data);
      } else {
        console.warn('[ChatScreen] History data is not an array:', data);
      }
    } catch (e: any) {
      console.error('[ChatScreen] loadHistory error:', e?.response?.data || e.message);
    } finally {
      setHistoryLoading(false);
    }
  };

  // ── Scroll to bottom on new messages ─────────────────────────────────────
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
    }
  }, [messages.length]);

  // ── Typing indicator ──────────────────────────────────────────────────────
  const handleTextChange = (text: string) => {
    setContent(text);
    if (!currentUser?.id || !otherUserId) return;
    wsManager.sendTypingStatus(otherUserId as string, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsManager.sendTypingStatus(otherUserId as string, false);
    }, 1500);
  };

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = useCallback(() => {
    const text = content.trim();
    if (!text || !currentUser?.id || !otherUserId) return;

    // 1. Optimistic update — appears instantly in UI
    const tempMsg: any = {
      id: `temp-${Date.now()}`,
      content: text,
      senderId: currentUser.id,
      receiverId: isGroupChat ? null : (otherUserId as string),
      groupId: isGroupChat ? (otherUserId as string) : null,
      status: 'SENDING',
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempMsg]);

    // 2. Send via WebSocket
    if (isGroupChat) {
      wsManager.sendGroupMessage(otherUserId as string, text);
    } else {
      wsManager.sendMessage(otherUserId as string, text);
      wsManager.sendTypingStatus(otherUserId as string, false);
    }

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setContent('');
  }, [content, currentUser?.id, otherUserId, isGroupChat]);

  // ── Render ────────────────────────────────────────────────────────────────
  const renderMessage = ({ item }: { item: any }) => {
    const isMine = String(item.senderId) === String(currentUser?.id);
    const time = item.createdAt
      ? new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const isSending = String(item.id).startsWith('temp-');

    const bubbleBg = isDark ? (isMine ? '#ffffff' : '#1c1c1c') : isMine ? '#1a1a1a' : '#ffffff';
    const bubbleText = isDark ? (isMine ? '#111111' : '#f5f2ed') : isMine ? '#faf8f5' : '#1a1a1a';

    return (
      <View style={{ marginBottom: 18, alignItems: isMine ? 'flex-end' : 'flex-start' }}>
        <View
          style={{
            maxWidth: '75%',
            backgroundColor: bubbleBg,
            borderRadius: 18,
            borderBottomRightRadius: isMine ? 4 : 18,
            borderBottomLeftRadius: isMine ? 18 : 4,
            borderWidth: isMine ? 0 : 1,
            borderColor: border,
            paddingHorizontal: 14,
            paddingVertical: 10,
            opacity: isSending ? 0.65 : 1,
          }}>
          {!isMine && isGroupChat && item.sender?.username && (
            <Text
              style={{
                fontSize: 10,
                fontWeight: '700',
                textTransform: 'uppercase',
                letterSpacing: 0.5,
                color: textMuted,
                marginBottom: 3,
              }}>
              {item.sender.username}
            </Text>
          )}
          <Text style={{ fontSize: 15, lineHeight: 22, color: bubbleText }}>{item.content}</Text>
        </View>

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            paddingHorizontal: 4,
          }}>
          <Text style={{ fontSize: 11, color: textMuted }}>{time}</Text>
          {isMine && (
            <Text
              style={{
                marginLeft: 4,
                fontSize: 11,
                color: item.status === 'READ' ? '#3b82f6' : textMuted,
              }}>
              {isSending ? '○' : item.status === 'READ' ? '✓✓' : '✓'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const TypingBubble = () => (
    <View style={{ alignItems: 'flex-start', marginBottom: 18 }}>
      <View
        style={{
          backgroundColor: surface,
          borderRadius: 18,
          borderBottomLeftRadius: 4,
          borderWidth: 1,
          borderColor: border,
          paddingHorizontal: 16,
          paddingVertical: 12,
          flexDirection: 'row',
          gap: 5,
          alignItems: 'center',
        }}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={{ width: 7, height: 7, borderRadius: 4, backgroundColor: textMuted }}
          />
        ))}
      </View>
    </View>
  );

  const statusText = isGroupChat
    ? 'Group Chat'
    : isTyping
      ? 'typing...'
      : chatPartner?.isOnline
        ? 'online'
        : chatPartner?.lastSeen
          ? `last seen ${new Date(chatPartner.lastSeen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
          : 'offline';

  const statusColor =
    !isGroupChat && (isTyping || chatPartner?.isOnline)
      ? isDark
        ? '#4ade80'
        : '#16a34a'
      : textMuted;

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* Header */}
      <View
        style={{
          paddingTop: insets.top || 44,
          paddingBottom: 14,
          paddingHorizontal: 20,
          backgroundColor: pageBg,
          borderBottomWidth: 1,
          borderBottomColor: border,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }}>
            <ChevronLeft size={24} color={textPrimary} />
          </TouchableOpacity>

          <View
            style={{
              width: 38,
              height: 38,
              borderRadius: 19,
              marginRight: 10,
              overflow: 'hidden',
              backgroundColor: inputBg,
            }}>
            <Image
              source={{
                uri: isGroupChat
                  ? `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'G')}&background=1a1a1a&color=fff`
                  : `https://i.pravatar.cc/150?u=${chatName}`,
              }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text
              style={{ fontSize: 15, fontWeight: '700', color: textPrimary, letterSpacing: -0.2 }}
              numberOfLines={1}>
              {chatName || 'Chat'}
            </Text>
            <Text
              style={{ fontSize: 12, color: statusColor, fontWeight: isTyping ? '600' : '400' }}>
              {statusText}
            </Text>
          </View>
        </View>

        <TouchableOpacity style={{ padding: 4 }}>
          <MoreVertical size={22} color={textMuted} />
        </TouchableOpacity>
      </View>

      {/* Messages + Input */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 20}>
        {historyLoading ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
            <ActivityIndicator size="small" color={textPrimary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(item) => String(item.id)}
            renderItem={renderMessage}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: 16 }}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            initialNumToRender={30}
            maxToRenderPerBatch={20}
            windowSize={15}
            ListHeaderComponent={
              <View style={{ alignItems: 'center', marginBottom: 24 }}>
                <View
                  style={{
                    backgroundColor: inputBg,
                    borderRadius: 100,
                    paddingHorizontal: 14,
                    paddingVertical: 5,
                  }}>
                  <Text
                    style={{
                      fontSize: 11,
                      color: textMuted,
                      fontWeight: '600',
                      letterSpacing: 0.6,
                      textTransform: 'uppercase',
                    }}>
                    Today
                  </Text>
                </View>
              </View>
            }
            ListEmptyComponent={
              <View style={{ alignItems: 'center', paddingVertical: 40 }}>
                <Text style={{ fontSize: 13, color: textMuted, fontStyle: 'italic' }}>
                  No messages yet. Say hello! 👋
                </Text>
              </View>
            }
            ListFooterComponent={isTyping ? <TypingBubble /> : null}
          />
        )}

        {/* Input bar */}
        <View
          style={{
            backgroundColor: pageBg,
            borderTopWidth: 1,
            borderTopColor: border,
            paddingTop: 10,
            paddingHorizontal: 20,
            paddingBottom: Math.max(insets.bottom, 16),
          }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 10 }}>
            <View
              style={{
                flex: 1,
                minHeight: 48,
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: inputBg,
                borderRadius: 24,
                borderWidth: 1,
                borderColor: border,
                paddingHorizontal: 14,
              }}>
              <TouchableOpacity style={{ marginRight: 10 }}>
                <Plus size={20} color={textMuted} />
              </TouchableOpacity>
              <TextInput
                value={content}
                onChangeText={handleTextChange}
                placeholder="Message…"
                placeholderTextColor={textMuted}
                multiline
                style={{
                  flex: 1,
                  maxHeight: 120,
                  fontSize: 15,
                  color: textPrimary,
                  paddingVertical: 12,
                }}
              />
            </View>

            <TouchableOpacity
              onPress={content.trim() ? handleSend : undefined}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: isDark ? '#ffffff' : '#1a1a1a',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {content.trim() ? (
                <Send size={18} color={isDark ? '#111' : '#f5f2ed'} style={{ marginLeft: 2 }} />
              ) : (
                <Mic size={19} color={isDark ? '#111' : '#f5f2ed'} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
