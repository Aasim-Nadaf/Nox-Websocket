import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { Text } from '@/components/ui/text';
import { Textarea } from '@/components/ui/textarea';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuthStore, useChatStore } from '@/lib/store';
import { wsManager } from '@/lib/websocket';
import api from '@/lib/api';
import { Send, ChevronLeft, MoreVertical, Plus, Mic, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useColorScheme } from 'nativewind';

export default function ChatScreen() {
  const { id: otherUserId, username } = useLocalSearchParams<{ id: string; username: string }>();
  const [content, setContent] = useState('');
  const { user: currentUser } = useAuthStore();
  const messages = useChatStore((state) => state.messages);
  const setMessages = useChatStore((state) => state.setMessages);
  const typingUsers = useChatStore((state) => state.typingUsers);
  const isTyping = otherUserId ? typingUsers[otherUserId as string] : false;

  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const insets = useSafeAreaInsets();
  const { colorScheme } = useColorScheme();
  const isDark = colorScheme === 'dark';

  // ── Chalk & Carbon tokens ──────────────────────────────────
  const pageBg = isDark ? '#111111' : '#faf8f5';
  const surface = isDark ? '#1c1c1c' : '#ffffff';
  const border = isDark ? '#2a2a2a' : '#e2ddd7';
  const inputBg = isDark ? '#1c1c1c' : '#f4f1ec';
  const textPrimary = isDark ? '#f5f2ed' : '#1a1a1a';
  const textMuted = isDark ? '#4a4a4a' : '#b0aba3';
  const textSec = isDark ? '#8a8a8a' : '#6b6b6b';

  useEffect(() => {
    fetchHistory();
  }, [otherUserId]);

  const fetchHistory = async () => {
    if (!currentUser || !otherUserId) return;
    try {
      const { data } = await api.get(`/messages/${currentUser.id}/${otherUserId}`);
      setMessages(data);
      setTimeout(() => flatListRef.current?.scrollToEnd(), 100);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTextChange = (text: string) => {
    setContent(text);
    if (!currentUser || !otherUserId) return;
    wsManager.sendTypingStatus(otherUserId as string, true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      wsManager.sendTypingStatus(otherUserId as string, false);
    }, 1500);
  };

  const handleSend = () => {
    if (!content.trim() || !currentUser || !otherUserId) return;
    wsManager.sendMessage(otherUserId as string, content.trim());
    wsManager.sendTypingStatus(otherUserId as string, false);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    setContent('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === currentUser?.id;
    const time = new Date(item.createdAt).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={{
          marginBottom: 20,
          alignItems: isMine ? 'flex-end' : 'flex-start',
        }}>
        {/* Bubble */}
        <View
          style={{
            maxWidth: '75%',
            backgroundColor: isMine ? '#1a1a1a' : surface,
            borderRadius: 18,
            borderBottomRightRadius: isMine ? 4 : 18,
            borderBottomLeftRadius: isMine ? 18 : 4,
            borderWidth: isMine ? 0 : 1,
            borderColor: border,
            paddingHorizontal: 14,
            paddingVertical: 10,
          }}>
          <Text
            style={{
              fontSize: 15,
              lineHeight: 22,
              color: isMine ? '#f5f2ed' : textPrimary,
              fontWeight: '400',
            }}>
            {item.content}
          </Text>
        </View>

        {/* Timestamp + read receipt */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginTop: 4,
            paddingHorizontal: 4,
          }}>
          <Text style={{ fontSize: 11, color: textMuted }}>{time}</Text>
          {isMine && <CheckCheck size={13} color={textMuted} style={{ marginLeft: 4 }} />}
        </View>
      </View>
    );
  };

  // Typing indicator bubble
  const TypingBubble = () => (
    <View style={{ alignItems: 'flex-start', marginBottom: 20 }}>
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
            style={{
              width: 7,
              height: 7,
              borderRadius: 4,
              backgroundColor: textMuted,
            }}
          />
        ))}
      </View>
    </View>
  );

  return (
    <View style={{ flex: 1, backgroundColor: pageBg }}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ── Header ── */}
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
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* Back */}
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 8, padding: 4 }}>
            <ChevronLeft size={24} color={textPrimary} />
          </TouchableOpacity>

          {/* Avatar */}
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
              source={{ uri: `https://i.pravatar.cc/150?u=${username}` }}
              style={{ width: '100%', height: '100%' }}
              resizeMode="cover"
            />
          </View>

          {/* Name + status */}
          <View>
            <Text
              style={{
                fontSize: 15,
                fontWeight: '600',
                color: textPrimary,
                letterSpacing: -0.2,
              }}>
              {username || 'User'}
            </Text>
            <Text
              style={{
                fontSize: 12,
                color: isTyping ? textSec : textMuted,
                fontWeight: isTyping ? '500' : '400',
              }}>
              {isTyping ? 'typing...' : 'online'}
            </Text>
          </View>
        </View>

        {/* Menu */}
        <TouchableOpacity style={{ padding: 4 }}>
          <MoreVertical size={22} color={textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── Messages + Input ── */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top + 44 : 20}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingTop: 24,
            paddingBottom: 16,
          }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          initialNumToRender={15}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={Platform.OS === 'android'}
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
                    fontWeight: '500',
                    letterSpacing: 0.6,
                    textTransform: 'uppercase',
                  }}>
                  Today
                </Text>
              </View>
            </View>
          }
          ListFooterComponent={isTyping ? <TypingBubble /> : null}
        />

        {/* ── Input bar ── */}
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
            {/* Text input pill */}
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
              <Textarea
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
                  backgroundColor: 'transparent',
                  paddingVertical: 12,
                  paddingHorizontal: 0,
                  borderWidth: 0,
                  // @ts-ignore
                  outline: 'none',
                  shadowOpacity: 0,
                }}
              />
            </View>

            {/* Send / Mic button */}
            <TouchableOpacity
              onPress={content.trim() ? handleSend : undefined}
              style={{
                width: 48,
                height: 48,
                borderRadius: 24,
                backgroundColor: '#1a1a1a',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              {content.trim() ? (
                <Send size={18} color="#f5f2ed" style={{ marginLeft: 2 }} />
              ) : (
                <Mic size={19} color="#f5f2ed" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
