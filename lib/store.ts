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

interface ChatState {
  messages: Message[];
  setMessages: (messages: Message[]) => void;
  addMessage: (message: Message) => void;
}

export const useChatStore = create<ChatState>((set) => {
  // Register the message handler with wsManager to avoid import cycle
  wsManager.onMessageHandler = (msg: Message) => {
    set((state) => {
      if (state.messages.some((m) => m.id === msg.id)) return state;
      return { messages: [...state.messages, msg] };
    });
  };

  return {
    messages: [],
    setMessages: (messages) => set({ messages }),
    addMessage: (message) =>
      set((state) => {
        if (state.messages.some((m) => m.id === message.id)) return state;
        return { messages: [...state.messages, message] };
      }),
  };
});
