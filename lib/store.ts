import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { wsManager } from './websocket';

interface User {
  id: string;
  username: string;
  bio?: string;
  isOnline?: boolean;
  lastSeen?: string;
}

interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string;
  groupId?: string;
  status: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  createdAt: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  hasSeenOnboarding: boolean;
  hasShownSplash: boolean;
  setAuth: (user: User, token: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  setHasSeenOnboarding: (value: boolean) => Promise<void>;
  setHasShownSplash: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true,
  hasSeenOnboarding: false,
  hasShownSplash: false,
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
    const onboardingStr = await AsyncStorage.getItem('has_seen_onboarding');
    
    set({ 
      hasSeenOnboarding: onboardingStr === 'true',
    });

    if (token && userStr) {
      const user = JSON.parse(userStr) as unknown as User;
      set({ user, token, isAuthenticated: true, isLoading: false });
      wsManager.connect(user.id);
    } else {
      set({ isLoading: false });
    }
  },
  setHasSeenOnboarding: async (value: boolean) => {
    await AsyncStorage.setItem('has_seen_onboarding', value ? 'true' : 'false');
    set({ hasSeenOnboarding: value });
  },
  setHasShownSplash: (value: boolean) => {
    set({ hasShownSplash: value });
  },
}));

interface ChatSummary {
  type: 'direct' | 'group';
  user?: User;
  group?: Group;
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
    if (msg.type === 'status_change') {
      set((state) => ({
        chatsList: state.chatsList.map(chat => 
          chat.type === 'direct' && chat.user?.id === msg.userId 
            ? { ...chat, user: { ...chat.user!, isOnline: msg.isOnline, lastSeen: msg.lastSeen } }
            : chat
        )
      }));
    } else if (msg.type === 'message_status_update') {
      set((state) => ({
        messages: state.messages.map(m => 
          msg.messageIds.includes(m.id) ? { ...m, status: msg.status } : m
        ),
        chatsList: state.chatsList.map(chat => 
          chat.lastMessage && msg.messageIds.includes(chat.lastMessage.id)
            ? { ...chat, lastMessage: { ...chat.lastMessage, status: msg.status } }
            : chat
        )
      }));
    } else if (msg.type === 'typing') {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [msg.senderId]: true },
      }));
    } else if (msg.type === 'stop_typing') {
      set((state) => ({
        typingUsers: { ...state.typingUsers, [msg.senderId]: false },
      }));
    } else {
      // Treat as new_message or new_group_message
      const isNewMessage = msg.type === 'new_message' || msg.type === 'new_group_message';
      if (!isNewMessage) return; // Ignore other unhandled events
      const newMsg = msg.message;
      if (!newMsg || !newMsg.id) return;

      set((state) => {
        if (state.messages.some((m) => m.id === newMsg.id)) return state;

        // Also update the chatsList to reflect the new lastMessage
        const newChatsList = [...state.chatsList];
        let chatIndex = -1;

        if (msg.type === 'new_group_message') {
          chatIndex = newChatsList.findIndex((chat) => chat.type === 'group' && chat.group?.id === msg.groupId);
        } else {
          const otherUserId =
            newMsg.senderId === useAuthStore.getState().user?.id
              ? newMsg.receiverId
              : newMsg.senderId;
          chatIndex = newChatsList.findIndex((chat) => chat.type === 'direct' && chat.user?.id === otherUserId);
        }

        if (chatIndex >= 0) {
          // Update existing chat
          const chat = newChatsList[chatIndex];
          newChatsList.splice(chatIndex, 1);
          newChatsList.unshift({ ...chat, lastMessage: newMsg });
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
