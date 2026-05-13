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

export interface Message {
  id: string;
  content: string;
  senderId: string;
  receiverId?: string | null;
  groupId?: string | null;
  status: string;
  createdAt: string;
  sender?: { id?: string; username: string } | null;
}

interface Group {
  id: string;
  name: string;
  createdAt: string;
}

interface ChatSummary {
  type: 'direct' | 'group';
  user?: User;
  group?: Group;
  lastMessage: Message | null;
}

// ─── Auth Store ──────────────────────────────────────────────────────────────

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

    set({ hasSeenOnboarding: onboardingStr === 'true' });

    if (token && userStr) {
      const user = JSON.parse(userStr) as User;
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

// ─── Chat Store ───────────────────────────────────────────────────────────────
// This store manages the SIDEBAR (chatsList) and typing indicators only.
// Individual chat messages are managed locally inside ChatScreen via
// wsManager.onChatMessageHandler.

interface ChatState {
  chatsList: ChatSummary[];
  typingUsers: Record<string, boolean>;
  setChatsList: (chatsList: ChatSummary[]) => void;
  setTyping: (userId: string, isTyping: boolean) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  chatsList: [],
  typingUsers: {},
  setChatsList: (chatsList) => set({ chatsList: Array.isArray(chatsList) ? chatsList : [] }),
  setTyping: (userId, isTyping) =>
    set((state) => ({
      typingUsers: { ...state.typingUsers, [userId]: isTyping },
    })),
}));

// ─── Global WS handler (store-level) ─────────────────────────────────────────
// Handles sidebar updates, typing indicators, and status changes.
// The ChatScreen registers its OWN handler via wsManager.onChatMessageHandler.

wsManager.onMessageHandler = (msg: any) => {
  if (!msg || !msg.type) return;

  if (msg.type === 'status_change') {
    useChatStore.setState((state) => ({
      chatsList: state.chatsList.map((chat) =>
        chat.type === 'direct' && String(chat.user?.id) === String(msg.userId)
          ? { ...chat, user: { ...chat.user!, isOnline: msg.isOnline, lastSeen: msg.lastSeen } }
          : chat
      ),
    }));
  } else if (msg.type === 'message_status_update') {
    useChatStore.setState((state) => ({
      chatsList: state.chatsList.map((chat) =>
        chat.lastMessage && msg.messageIds?.includes(chat.lastMessage.id)
          ? { ...chat, lastMessage: { ...chat.lastMessage, status: msg.status } }
          : chat
      ),
    }));
  } else if (msg.type === 'typing') {
    useChatStore.setState((state) => ({
      typingUsers: { ...state.typingUsers, [msg.senderId]: true },
    }));
  } else if (msg.type === 'stop_typing') {
    useChatStore.setState((state) => ({
      typingUsers: { ...state.typingUsers, [msg.senderId]: false },
    }));
  } else if (msg.type === 'new_message' || msg.type === 'new_group_message') {
    // Update chatsList so the sidebar shows the latest message + sorts correctly
    const newMsg: Message = msg.message;
    if (!newMsg || !newMsg.id) return;

    useChatStore.setState((state) => {
      const newChatsList = [...state.chatsList];
      const isGroupMsg = msg.type === 'new_group_message';
      let chatIndex = -1;

      if (isGroupMsg) {
        chatIndex = newChatsList.findIndex(
          (c) => c.type === 'group' && String(c.group?.id) === String(msg.groupId)
        );
      } else {
        const authUser = useAuthStore.getState().user;
        const sMyId = authUser?.id ? String(authUser.id) : '';
        const sSndr = String(newMsg.senderId);
        const sRcvr = newMsg.receiverId ? String(newMsg.receiverId) : '';
        const otherUserId = sSndr === sMyId ? sRcvr : sSndr;

        if (otherUserId) {
          chatIndex = newChatsList.findIndex(
            (c) => c.type === 'direct' && String(c.user?.id) === otherUserId
          );
        }
      }

      if (chatIndex >= 0) {
        // Existing chat: update message and move to top
        const [chat] = newChatsList.splice(chatIndex, 1);
        newChatsList.unshift({ ...chat, lastMessage: newMsg });
      } else if (!isGroupMsg) {
        // Fallback for new direct chats: since we don't have the user object here,
        // we'll just keep the list as is, but in a real app you'd fetch the user info.
        // However, since backend /chats/:id returns everyone, this shouldn't happen often.
        console.log('New direct chat message received, but user not found in current list.');
      }

      return { chatsList: newChatsList };
    });
  }
};
