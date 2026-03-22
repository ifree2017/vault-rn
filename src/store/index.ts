import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, Conversation, Contact, Message } from '../types';

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setAuth: (token: string, user: User) => void;
  logout: () => void;
  restoreAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  isAuthenticated: false,
  setAuth: (token, user) => {
    set({ token, user, isAuthenticated: true });
    AsyncStorage.setItem('vault_token', token);
    AsyncStorage.setItem('vault_user', JSON.stringify(user));
  },
  logout: () => {
    set({ token: null, user: null, isAuthenticated: false });
    AsyncStorage.removeItem('vault_token');
    AsyncStorage.removeItem('vault_user');
  },
  restoreAuth: async () => {
    try {
      const token = await AsyncStorage.getItem('vault_token');
      const userStr = await AsyncStorage.getItem('vault_user');
      if (token && userStr) {
        const user = JSON.parse(userStr);
        set({ token, user, isAuthenticated: true });
      }
    } catch (e) {
      // Ignore
    }
  },
}));

interface ContactsState {
  contacts: Contact[];
  setContacts: (contacts: Contact[]) => void;
  addContact: (contact: Contact) => void;
}

export const useContactsStore = create<ContactsState>((set) => ({
  contacts: [],
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts.filter(c => c.id !== contact.id), contact]
  })),
}));

interface MessagesState {
  conversations: Conversation[];
  messages: Record<string, Message[]>;
  setConversations: (convs: Conversation[]) => void;
  addMessage: (conversationId: string, message: Message) => void;
  setMessages: (conversationId: string, messages: Message[]) => void;
}

export const useMessagesStore = create<MessagesState>((set) => ({
  conversations: [],
  messages: {},
  setConversations: (conversations) => set({ conversations }),
  addMessage: (conversationId, message) => set((state) => ({
    messages: {
      ...state.messages,
      [conversationId]: [...(state.messages[conversationId] || []), message],
    },
  })),
  setMessages: (conversationId, messages) => set((state) => ({
    messages: { ...state.messages, [conversationId]: messages },
  })),
}));

interface AppState {
  isLoading: boolean;
  setLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppState>((set) => ({
  isLoading: false,
  setLoading: (isLoading) => set({ isLoading }),
}));
