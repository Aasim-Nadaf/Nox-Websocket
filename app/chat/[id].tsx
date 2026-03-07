import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { useAuthStore, useChatStore } from '@/lib/store';
import { wsManager } from '@/lib/websocket';
import api from '@/lib/api';
import { Send, ChevronLeft, MoreVertical, Plus, Mic, User, CheckCheck } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function ChatScreen() {
  const { id: otherUserId, username } = useLocalSearchParams<{ id: string; username: string }>();
  const [content, setContent] = useState('');
  const { user: currentUser } = useAuthStore();
  const { messages, setMessages } = useChatStore();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);
  const insets = useSafeAreaInsets();

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

  const handleSend = () => {
    if (!content.trim() || !currentUser || !otherUserId) return;

    wsManager.sendMessage(otherUserId, content.trim());
    setContent('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const renderMessage = ({ item, index }: { item: any; index: number }) => {
    const isMine = item.senderId === currentUser?.id;
    // Mock time for design
    const time = '10:44 AM';

    return (
      <View className={`mb-6 ${isMine ? 'items-end' : 'items-start'}`}>
        <View
          style={{ maxWidth: '80%' }}
          className={`px-5 py-4 shadow-sm shadow-black/5 ${
            isMine
              ? 'rounded-[24px] rounded-br-sm bg-black dark:bg-white'
              : 'rounded-[24px] rounded-tl-sm border border-zinc-100 bg-white dark:border-zinc-800 dark:bg-zinc-900'
          }`}>
          <Text
            className={`text-[16px] leading-6 ${isMine ? 'text-white dark:text-black' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {item.content}
          </Text>
        </View>
        <View
          className={`mt-1 flex-row items-center px-2 ${isMine ? 'justify-end' : 'justify-start'}`}>
          <Text className="text-[11px] text-zinc-400 dark:text-zinc-500">{time}</Text>
          {isMine && <CheckCheck size={14} color="#a1a1aa" className="ml-1" />}
        </View>
      </View>
    );
  };

  return (
    <View className="flex-1 bg-[#F9F9F9] dark:bg-zinc-950">
      <Stack.Screen options={{ headerShown: false }} />

      {/* Custom Header */}
      <View
        className="z-10 flex-row items-center justify-between border-b border-zinc-200/50 bg-[#F9F9F9] px-4 pb-4 dark:border-zinc-900/50 dark:bg-zinc-950"
        style={{ paddingTop: insets.top || 44 }}>
        <View className="flex-row items-center">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <ChevronLeft size={28} color="#000" className="dark:color-white" />
          </TouchableOpacity>
          <View className="mr-3 h-11 w-11 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
            <User size={22} color="#ea580c" />
          </View>
          <View>
            <Text className="text-lg font-bold text-zinc-900 dark:text-white">
              {username || 'User'}
            </Text>
            <Text className="text-xs font-medium text-zinc-400 dark:text-zinc-500">Online</Text>
          </View>
        </View>
        <TouchableOpacity className="p-2">
          <MoreVertical size={24} color="#000" className="dark:color-white" />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingTop: 24, paddingBottom: 24 }}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListHeaderComponent={
            <View className="mb-6 items-center">
              <View className="rounded-full bg-zinc-100 px-4 py-1.5 dark:bg-zinc-900">
                <Text className="text-[11px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                  Today
                </Text>
              </View>
            </View>
          }
        />

        {/* Input Bar */}
        <View
          className="bg-[#F9F9F9] pt-2 dark:bg-zinc-950"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
          <View className="flex-row items-end px-4">
            <View className="min-h-[52px] flex-1 flex-row items-center rounded-full bg-zinc-100 px-4 dark:bg-zinc-900">
              <TouchableOpacity className="mr-3">
                <Plus size={24} color="#000" className="dark:color-white" />
              </TouchableOpacity>
              <TextInput
                value={content}
                onChangeText={setContent}
                placeholder="Message"
                placeholderTextColor="#a1a1aa"
                multiline
                className="max-h-32 flex-1 py-3 pt-3.5 text-base text-zinc-900 dark:text-white"
              />
            </View>

            {content.trim() ? (
              <TouchableOpacity
                onPress={handleSend}
                className="ml-3 h-[52px] w-[52px] items-center justify-center rounded-full bg-black shadow-sm dark:bg-white">
                <Send size={20} color="white" className="ml-1 dark:color-black" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity className="ml-3 h-[52px] w-[52px] items-center justify-center rounded-full bg-black shadow-sm dark:bg-white">
                <Mic size={22} color="white" className="dark:color-black" />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
