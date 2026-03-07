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
import { Send, ChevronLeft } from 'lucide-react-native';

export default function ChatScreen() {
  const { id: otherUserId, username } = useLocalSearchParams<{ id: string; username: string }>();
  const [content, setContent] = useState('');
  const { user: currentUser } = useAuthStore();
  const { messages, setMessages } = useChatStore();
  const router = useRouter();
  const flatListRef = useRef<FlatList>(null);

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

  const renderMessage = ({ item }: { item: any }) => {
    const isMine = item.senderId === currentUser?.id;
    return (
      <View className={`mb-3 flex-row ${isMine ? 'justify-end' : 'justify-start'}`}>
        <View
          style={{ maxWidth: '80%' }}
          className={`rounded-2xl px-4 py-3 ${
            isMine ? 'rounded-tr-sm bg-indigo-600' : 'rounded-tl-sm bg-zinc-100 dark:bg-zinc-800'
          }`}>
          <Text
            className={`text-base ${isMine ? 'text-white' : 'text-zinc-900 dark:text-zinc-100'}`}>
            {item.content}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}>
      <Stack.Screen
        options={{
          title: username || 'Chat',
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} className="mr-4">
              <ChevronLeft size={28} color="#4f46e5" />
            </TouchableOpacity>
          ),
        }}
      />

      <View className="flex-1 bg-white dark:bg-zinc-950">
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        />

        <View className="flex-row items-center border-t border-zinc-100 bg-white p-4 dark:border-zinc-900 dark:bg-zinc-950">
          <TextInput
            value={content}
            onChangeText={setContent}
            placeholder="Type a message..."
            placeholderTextColor="#9ca3af"
            className="h-12 flex-1 rounded-full border border-transparent bg-zinc-100 px-5 text-zinc-900 focus:border-indigo-500/50 dark:bg-zinc-900 dark:text-zinc-100"
          />
          <TouchableOpacity
            onPress={handleSend}
            disabled={!content.trim()}
            className={`ml-3 h-12 w-12 items-center justify-center rounded-full ${content.trim() ? 'bg-indigo-600' : 'bg-indigo-600/50'}`}>
            <Send size={20} color="white" className="ml-1" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
