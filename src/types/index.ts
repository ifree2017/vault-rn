// Shared types for Vault client
export interface User {
  id: string;
  username: string;
  email?: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user_id: string;
  username: string;
}

export interface Message {
  messageId: string;
  conversationId: string;
  senderId: string;
  encryptedContent: string;
  createdAt: string;
  expiresAt?: string;
  deliveredAt?: string;
  // Decrypted content (client-side only)
  content?: string;
}

export interface Conversation {
  id: string;
  participants: string[];
  lastMessage?: Message;
  selfDestructSeconds: number;
  createdAt: string;
  updatedAt?: string;
  unreadCount?: number; // Phase 2: unread badge count
  // Display info
  otherUser?: User;
}

export interface Contact {
  id: string;
  username: string;
  addedAt: string;
}

export interface PrekeyBundle {
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: OneTimePrekey[];
}

export interface OneTimePrekey {
  id: number;
  data: string;
}

export type SelfDestructTimer = 0 | 5 | 30 | 60 | 300 | 3600 | 86400;

export const SELF_DESTRUCT_OPTIONS: { label: string; value: SelfDestructTimer }[] = [
  { label: 'Off', value: 0 },
  { label: '5 seconds', value: 5 },
  { label: '30 seconds', value: 30 },
  { label: '1 minute', value: 60 },
  { label: '5 minutes', value: 300 },
  { label: '1 hour', value: 3600 },
  { label: '24 hours', value: 86400 },
];
