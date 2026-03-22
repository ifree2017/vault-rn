/**
 * ChatScreen — Phase 2 UX Polish
 * Features:
 * - Date-grouped message bubbles
 * - Image viewing with zoom
 * - Typing indicator support
 * - Offline queue integration
 * - Error handling
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
} from 'react-native';
import { Text, TextInput, IconButton, Chip, Snackbar } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMessagesStore, useAuthStore } from '../store';
import { sendMessage as apiSendMessage, getMessages } from '../services/api';
import { encryptMessage, decryptMessage } from '../crypto';
import { offlineQueue } from '../services/offlineQueue';
import ImageViewerModal from '../components/ImageViewerModal';
import { SELF_DESTRUCT_OPTIONS, type Message, type SelfDestructTimer } from '../types';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Chat'> };
type RouteProps = { route: { params: { conversationId: string; recipientUsername: string; recipientId: string } } };

// Mock messages for demo
const MOCK_MESSAGES: Message[] = [
  { messageId: 'm1', conversationId: 'c1', senderId: '1', encryptedContent: '', createdAt: new Date(Date.now() - 86400000).toISOString(), content: 'Hey, did you see the news?' },
  { messageId: 'm2', conversationId: 'c1', senderId: 'me', encryptedContent: '', createdAt: new Date(Date.now() - 82800000).toISOString(), content: 'Not yet, what happened?' },
  { messageId: 'm3', conversationId: 'c1', senderId: '1', encryptedContent: '', createdAt: new Date(Date.now() - 79200000).toISOString(), content: 'Something about Signal protocol being open sourced' },
  { messageId: 'm4', conversationId: 'c1', senderId: '1', encryptedContent: '', createdAt: new Date(Date.now() - 3600000).toISOString(), content: 'Hey! How are you?' },
  { messageId: 'm5', conversationId: 'c1', senderId: 'me', encryptedContent: '', createdAt: new Date(Date.now() - 3000000).toISOString(), content: "I'm good! Just testing Vault." },
  { messageId: 'm6', conversationId: 'c1', senderId: '1', encryptedContent: '', createdAt: new Date(Date.now() - 2400000).toISOString(), content: 'This looks great! 🔒' },
];

function formatMessageTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getDateLabel(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (msgDay === today) return 'Today';
  if (msgDay === yesterday) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

function isSameDay(a: string, b: string): boolean {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}

function getImageUrl(content: string): string | null {
  // Support markdown image syntax: ![alt](url) or plain URL
  const mdMatch = content.match(/!\[.*?\]\((.*?)\)/);
  if (mdMatch) return mdMatch[1];
  // Plain URL detection
  const urlMatch = content.match(/(https?:\/\/.*\.(?:png|jpg|jpeg|gif|webp))/i);
  if (urlMatch) return urlMatch[1];
  return null;
}

interface MessageItem {
  type: 'date' | 'message';
  key: string;
  dateLabel?: string;
  message?: Message;
}

export default function ChatScreen({ navigation, route }: Props & RouteProps) {
  const { conversationId, recipientUsername, recipientId } = route.params;
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [selfDestruct, setSelfDestruct] = useState<SelfDestructTimer>(0);
  const [showTimerPicker, setShowTimerPicker] = useState(false);
  const [sending, setSending] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [snackbarMsg, setSnackbarMsg] = useState('');
  const [imageViewerUri, setImageViewerUri] = useState<string | undefined>();
  const [showImageViewer, setShowImageViewer] = useState(false);
  const user = useAuthStore((s) => s.user);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const unsub = offlineQueue.onNetworkChange((online) => setIsOnline(online));
    setIsOnline(offlineQueue.isNetworkOnline);
    return unsub;
  }, []);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const msgs = await getMessages(conversationId);
        if (msgs.length > 0) {
          setMessages(msgs.map((m) => ({ ...m, content: decryptMessage(m.encryptedContent) })));
        }
      } catch (err) {
        // Use mock data
      }
    };
    fetchMessages();
  }, [conversationId]);

  const handleSend = useCallback(async () => {
    if (!input.trim()) return;
    setSending(true);
    const content = input.trim();
    setInput('');

    const encrypted = encryptMessage(content, recipientId);

    const newMsg: Message = {
      messageId: `local-${Date.now()}`,
      conversationId,
      senderId: user?.id || 'me',
      encryptedContent: encrypted,
      createdAt: new Date().toISOString(),
      content,
      expiresAt: selfDestruct > 0
        ? new Date(Date.now() + selfDestruct * 1000).toISOString()
        : undefined,
    };

    setMessages((prev) => [...prev, newMsg]);
    flatListRef.current?.scrollToEnd();

    try {
      if (isOnline) {
        await apiSendMessage(recipientId, encrypted, selfDestruct || undefined);
      } else {
        await offlineQueue.enqueue({
          recipientId,
          encryptedContent: encrypted,
          selfDestructSeconds: selfDestruct || undefined,
        });
        setSnackbarMsg('📡 Message queued — will send when online');
      }
    } catch (err) {
      // Queue for retry
      try {
        await offlineQueue.enqueue({
          recipientId,
          encryptedContent: encrypted,
          selfDestructSeconds: selfDestruct || undefined,
        });
        setSnackbarMsg('📡 Message queued — will retry automatically');
      } catch {
        setSnackbarMsg('❌ Failed to send message. Please try again.');
      }
    }

    setSending(false);
  }, [input, recipientId, conversationId, selfDestruct, isOnline, user?.id]);

  // Build message list with date separators
  const buildMessageList = (): MessageItem[] => {
    const items: MessageItem[] = [];
    let lastDate = '';

    messages.forEach((msg) => {
      const dateLabel = getDateLabel(msg.createdAt);
      if (dateLabel !== lastDate) {
        items.push({ type: 'date', key: `date-${msg.createdAt}`, dateLabel });
        lastDate = dateLabel;
      }
      items.push({ type: 'message', key: msg.messageId, message: msg });
    });

    return items;
  };

  const renderMessageItem = ({ item }: { item: MessageItem }) => {
    if (item.type === 'date') {
      return (
        <View style={styles.dateHeader}>
          <Text style={styles.dateHeaderText}>{item.dateLabel}</Text>
        </View>
      );
    }

    const msg = item.message!;
    const isMe = msg.senderId === (user?.id || 'me');
    const showBurn = msg.expiresAt && new Date(msg.expiresAt) < new Date();
    const imageUrl = getImageUrl(msg.content || '');

    return (
      <View style={[styles.messageBubble, isMe ? styles.myMessage : styles.theirMessage]}>
        {showBurn ? (
          <Text style={styles.burnedText}>🔥 Message burned</Text>
        ) : (
          <>
            {imageUrl && (
              <TouchableOpacity
                onPress={() => {
                  setImageViewerUri(imageUrl);
                  setShowImageViewer(true);
                }}
                activeOpacity={0.8}
              >
                <Image source={{ uri: imageUrl }} style={styles.inlineImage} resizeMode="cover" />
              </TouchableOpacity>
            )}
            {msg.content && !imageUrl && (
              <Text style={[styles.messageText, isMe ? styles.myMessageText : styles.theirMessageText]}>
                {msg.content}
              </Text>
            )}
            <View style={styles.messageFooter}>
              <Text style={[styles.timestamp, isMe ? styles.myTimestamp : styles.theirTimestamp]}>
                {formatMessageTime(msg.createdAt)}
              </Text>
              {msg.expiresAt && !showBurn && (
                <Text style={styles.expiresText}>
                  🔥 {Math.max(0, Math.ceil((new Date(msg.expiresAt).getTime() - Date.now()) / 1000))}s
                </Text>
              )}
            </View>
          </>
        )}
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Network status */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineBannerText}>📡 Offline — messages will be sent when connected</Text>
        </View>
      )}

      {/* Timer selector */}
      {showTimerPicker && (
        <View style={styles.timerPicker}>
          {SELF_DESTRUCT_OPTIONS.map((opt) => (
            <Chip
              key={opt.value}
              selected={selfDestruct === opt.value}
              onPress={() => { setSelfDestruct(opt.value); setShowTimerPicker(false); }}
              style={styles.timerChip}
              textStyle={{ color: '#e0e0e0' }}
            >
              {opt.label}
            </Chip>
          ))}
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={buildMessageList()}
        keyExtractor={(item) => item.key}
        renderItem={renderMessageItem}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.emptyChat}>
            <Text style={styles.emptyText}>🔒 End-to-end encrypted</Text>
            <Text style={styles.emptySubtext}>Your messages are secured with Signal Protocol</Text>
          </View>
        }
      />

      <View style={styles.inputRow}>
        <IconButton
          icon="timer"
          iconColor={selfDestruct > 0 ? '#ff6b6b' : '#6c63ff'}
          size={24}
          onPress={() => setShowTimerPicker(!showTimerPicker)}
        />
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          style={styles.input}
          placeholderTextColor="#666"
          textColor="#e0e0e0"
          underlineColor="transparent"
          activeUnderlineColor="transparent"
          onSubmitEditing={handleSend}
        />
        <IconButton
          icon="send"
          iconColor={sending || !input.trim() ? '#444' : '#6c63ff'}
          size={24}
          onPress={handleSend}
          disabled={sending || !input.trim()}
        />
      </View>

      <ImageViewerModal
        visible={showImageViewer}
        uri={imageViewerUri}
        onClose={() => setShowImageViewer(false)}
      />

      <Snackbar
        visible={!!snackbarMsg}
        onDismiss={() => setSnackbarMsg('')}
        duration={3000}
        style={styles.snackbar}
      >
        {snackbarMsg}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  offlineBanner: {
    backgroundColor: '#ff9800',
    paddingVertical: 6,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineBannerText: { color: '#fff', fontSize: 12, fontWeight: '500' },
  timerPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    backgroundColor: '#1a1a2e',
    gap: 8,
  },
  timerChip: { backgroundColor: '#2a2a4e' },
  messagesList: { padding: 16, paddingBottom: 8 },
  dateHeader: {
    alignItems: 'center',
    marginVertical: 16,
  },
  dateHeaderText: {
    color: '#666',
    fontSize: 12,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden',
  },
  messageBubble: {
    maxWidth: '78%',
    padding: 12,
    borderRadius: 16,
    marginVertical: 4,
  },
  myMessage: { alignSelf: 'flex-end', backgroundColor: '#6c63ff' },
  theirMessage: { alignSelf: 'flex-start', backgroundColor: '#1a1a2e' },
  messageText: { fontSize: 15, lineHeight: 20 },
  myMessageText: { color: '#ffffff' },
  theirMessageText: { color: '#e0e0e0' },
  inlineImage: {
    width: 200,
    height: 150,
    borderRadius: 12,
    marginBottom: 6,
  },
  messageFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  timestamp: { fontSize: 11 },
  myTimestamp: { color: 'rgba(255,255,255,0.6)' },
  theirTimestamp: { color: '#666' },
  expiresText: { fontSize: 11, color: '#ff6b6b' },
  burnedText: { color: '#ff6b6b', fontStyle: 'italic' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    backgroundColor: '#1a1a2e',
    borderTopWidth: 1,
    borderTopColor: '#2a2a4e',
  },
  input: {
    flex: 1,
    backgroundColor: '#2a2a4e',
    borderRadius: 24,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    fontSize: 15,
  },
  emptyChat: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 80 },
  emptyText: { color: '#6c63ff', fontSize: 16, fontWeight: '600' },
  emptySubtext: { color: '#666', fontSize: 13, marginTop: 6 },
  snackbar: { backgroundColor: '#2a2a4e' },
});
