/**
 * Offline Message Queue Service
 * Queues messages when offline, syncs when back online
 * Uses navigator.onLine + health check ping for network detection (no native module needed)
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { sendMessage as apiSendMessage, healthCheck } from './api';

const QUEUE_KEY = 'vault_message_queue';
const NETWORK_CHECK_KEY = 'vault_network_status';

export interface QueuedMessage {
  id: string;
  recipientId: string;
  encryptedContent: string;
  selfDestructSeconds?: number;
  queuedAt: string;
  retryCount: number;
}

class OfflineQueue {
  private _isOnline: boolean = true;
  private isProcessing = false;
  private listeners: Set<(online: boolean) => void> = new Set();
  private lastCheck = 0;

  constructor() {
    // Use native onLine event as initial state
    this._isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
    this.initNetworkCheck();
  }

  private async initNetworkCheck(): Promise<void> {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.checkAndNotify();
    });

    window.addEventListener('offline', () => {
      this._isOnline = false;
      this.notifyListeners();
    });

    // Periodic health check ping
    setInterval(() => this.checkAndNotify(), 15000);
    await this.checkAndNotify();
  }

  private async checkAndNotify(): Promise<void> {
    const wasOnline = this._isOnline;
    this._isOnline = await this.ping();
    if (wasOnline !== this._isOnline) {
      this.notifyListeners();
      if (this._isOnline) {
        this.processQueue();
      }
    }
  }

  private async ping(): Promise<boolean> {
    try {
      await healthCheck();
      return true;
    } catch {
      return false;
    }
  }

  private notifyListeners(): void {
    this.listeners.forEach((listener) => listener(this._isOnline));
  }

  onNetworkChange(listener: (online: boolean) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  get isNetworkOnline(): boolean {
    return this._isOnline;
  }

  /**
   * Add a message to the offline queue
   */
  async enqueue(msg: Omit<QueuedMessage, 'id' | 'queuedAt' | 'retryCount'>): Promise<string> {
    const queued: QueuedMessage = {
      ...msg,
      id: `q-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      queuedAt: new Date().toISOString(),
      retryCount: 0,
    };

    const queue = await this.getQueue();
    queue.push(queued);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));

    if (this._isOnline) {
      this.processQueue();
    }

    return queued.id;
  }

  /**
   * Get all queued messages
   */
  async getQueue(): Promise<QueuedMessage[]> {
    try {
      const raw = await AsyncStorage.getItem(QUEUE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Remove a message from the queue after successful send
   */
  async dequeue(messageId: string): Promise<void> {
    const queue = await this.getQueue();
    const filtered = queue.filter((m) => m.id !== messageId);
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(filtered));
  }

  /**
   * Mark a message as failed (increment retry count)
   */
  async markFailed(messageId: string): Promise<void> {
    const queue = await this.getQueue();
    const idx = queue.findIndex((m) => m.id === messageId);
    if (idx !== -1) {
      queue[idx].retryCount += 1;
      if (queue[idx].retryCount >= 5) {
        queue.splice(idx, 1);
      }
    }
    await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  }

  /**
   * Process all queued messages
   */
  async processQueue(): Promise<void> {
    if (this.isProcessing || !this._isOnline) return;
    this.isProcessing = true;

    try {
      const queue = await this.getQueue();
      for (const msg of queue) {
        try {
          await apiSendMessage(msg.recipientId, msg.encryptedContent, msg.selfDestructSeconds);
          await this.dequeue(msg.id);
        } catch {
          await this.markFailed(msg.id);
        }
      }
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Get count of pending messages
   */
  async getPendingCount(): Promise<number> {
    const queue = await this.getQueue();
    return queue.length;
  }

  /**
   * Clear all queued messages
   */
  async clearQueue(): Promise<void> {
    await AsyncStorage.removeItem(QUEUE_KEY);
  }
}

export const offlineQueue = new OfflineQueue();
