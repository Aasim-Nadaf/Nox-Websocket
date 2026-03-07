import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wsManager } from './websocket';

interface User {
  id: string;
  username: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  setAuth: async (user, token) => {
    await AsyncStorage.setItem('auth_token', token);
    await AsyncStorage.setItem('auth_user', JSON.stringify(user));
    set({ user, token, isAuthenticated: true });
    wsManager.connect(user.id);
  },
  logout: async () => {
    await AsyncStorage.removeItem('auth_token');
    await AsyncStorage.removeItem('auth_user');
    set({ user: null, token: null, isAuthenticated: false });
    wsManager.disconnect();
  },
  loadAuth: async () => {
    const token = await AsyncStorage.getItem('auth_token');
    const userStr = await AsyncStorage.getItem('auth_user');
    if (token && userStr) {
      const user = JSON.parse(userStr) as unknown as User;
      set({ user, token, isAuthenticated: true, isLoading: false });
      wsManager.connect(user.id);
    } else {
      set({ isLoading: false });
    }
  },
}));

interface ChatSummary {
  user: User;
  lastMessage: Message | null;
}

interface ChatState {
  messages: Message[];
  chatsList: ChatSummary[];
  typingUsers: Record<string, boolean>;
  setMessages: (messages: Message[]) => void;
  setChatsList: (chatsList: ChatSummary[]) => void;
  addMessage: (message: Message) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => {
  // Register the message handler with wsManager to avoid import cycle
  wsManager.onMessageHandler = (msg: any) => {
    if (msg.type === 'typing') {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [msg.senderId]: true },
      }));
    } else if (msg.type === 'stop_typing') {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [msg.senderId]: false },
      }));
    } else {
      // Treat as new_message (backwards compatibility)
      const newMsg = msg.type === 'new_message' ? msg.message : msg;
      if (!newMsg || !newMsg.id) return;

      set((state) => {
        if (state.messages.some((m) => m.id === newMsg.id)) return state;

        // Also update the chatsList to reflect the new lastMessage
        const newChatsList = [...state.chatsList];
        const otherUserId =
          newMsg.senderId === useAuthStore.getState().user?.id
            ? newMsg.receiverId
            : newMsg.senderId;

        const chatIndex = newChatsList.findIndex((chat) => chat.user.id === otherUserId);

        if (chatIndex >= 0) {
          // Update existing chat
          const chat = newChatsList[chatIndex];
          newChatsList.splice(chatIndex, 1);
          newChatsList.unshift({ ...chat, lastMessage: newMsg });
        } else {
          // We could fetch chats here or just ignore if user doesn't exist in list yet,
          // but typically it should exist. (In a full app we fetch the missing user).
        }

        return {
          messages: [...state.messages, newMsg],
          chatsList: newChatsList,
        };
      });
    }
  };

  return {
    messages: [],
    chatsList: [],
    typingUsers: {},
    setMessages: (messages) => set({ messages }),
    setChatsList: (chatsList) => set({ chatsList }),
    addMessage: (message) =>
      set((state) => {
        if (state.messages.some((m) => m.id === message.id)) return state;
        return { messages: [...state.messages, message] };
      }),
    setTyping: (userId, isTyping) =>
      set((state) => ({
        typingUsers: { ...state.typingUsers, [userId]: isTyping },
      })),
  };
});
