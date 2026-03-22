import type { AuthResponse, Message, Conversation, PrekeyBundle } from '../types';
import { useAuthStore } from '../store';

const API_BASE = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8080';

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = useAuthStore.getState().token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

// Auth
export async function register(
  username: string,
  email: string,
  password: string,
  recoveryPhrase: string
): Promise<AuthResponse> {
  return request('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password, recovery_phrase: recoveryPhrase }),
  });
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  return request('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export async function getMe(): Promise<{ user_id: string; username: string }> {
  return request('/api/v1/auth/me');
}

// Prekeys
export async function uploadPrekeys(bundle: {
  identity_key: string;
  signed_prekey: string;
  signed_prekey_signature: string;
  one_time_prekeys: { id: number; data: string }[];
}): Promise<{ status: string; uploaded: number }> {
  return request('/api/v1/keys/prekey', {
    method: 'POST',
    body: JSON.stringify(bundle),
  });
}

export async function fetchPrekeys(userId: string): Promise<PrekeyBundle> {
  return request(`/api/v1/keys/prekey/${userId}`);
}

// Messages
export async function sendMessage(
  recipientId: string,
  encryptedContent: string,
  selfDestructSeconds?: number
): Promise<{ message_id: string; created_at: string }> {
  return request('/api/v1/messages/send', {
    method: 'POST',
    body: JSON.stringify({
      recipient_id: recipientId,
      encrypted_content: encryptedContent,
      self_destruct_seconds: selfDestructSeconds,
    }),
  });
}

export async function getMessages(conversationId?: string, limit = 50): Promise<Message[]> {
  const params = new URLSearchParams();
  if (conversationId) params.set('conversation_id', conversationId);
  params.set('limit', limit.toString());
  return request(`/api/v1/messages?${params}`);
}

// Health
export async function healthCheck(): Promise<{ status: string; service: string }> {
  return request('/api/v1/health');
}
