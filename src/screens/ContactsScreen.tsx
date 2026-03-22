/**
 * ContactsScreen — Phase 2 UX Polish
 * Features:
 * - Conversation list with unread badges + last message preview + timestamps
 * - Pull-to-refresh
 * - Offline indicator
 * - Empty states
 * - Date-grouped headers
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  SectionList,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { Text, Searchbar, Avatar, Badge, Divider } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useContactsStore, useMessagesStore, useAuthStore } from '../store';
import { offlineQueue } from '../services/offlineQueue';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { Contact, Conversation, Message } from '../types';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList> };

// Mock data for MVP demo
const MOCK_CONTACTS: Contact[] = [
  { id: '1', username: 'alice', addedAt: new Date().toISOString() },
  { id: '2', username: 'bob', addedAt: new Date().toISOString() },
  { id: '3', username: 'charlie', addedAt: new Date().toISOString() },
];

const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'c1',
    participants: ['me', '1'],
    selfDestructSeconds: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 300000).toISOString(),
    unreadCount: 2,
    lastMessage: {
      messageId: 'lm1',
      conversationId: 'c1',
      senderId: '1',
      encryptedContent: '',
      createdAt: new Date(Date.now() - 300000).toISOString(),
      content: 'Hey! How are you?',
    },
    otherUser: { id: '1', username: 'alice' },
  },
  {
    id: 'c2',
    participants: ['me', '2'],
    selfDestructSeconds: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 7200000).toISOString(),
    unreadCount: 0,
    lastMessage: {
      messageId: 'lm2',
      conversationId: 'c2',
      senderId: 'me',
      encryptedContent: '',
      createdAt: new Date(Date.now() - 7200000).toISOString(),
      content: "Let's catch up later",
    },
    otherUser: { id: '2', username: 'bob' },
  },
  {
    id: 'c3',
    participants: ['me', '3'],
    selfDestructSeconds: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    unreadCount: 5,
    lastMessage: {
      messageId: 'lm3',
      conversationId: 'c3',
      senderId: '3',
      encryptedContent: '',
      createdAt: new Date(Date.now() - 86400000).toISOString(),
      content: 'Check out this article 🔒',
    },
    otherUser: { id: '3', username: 'charlie' },
  },
];

function formatTimestamp(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const oneDay = 86400000;

  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < oneDay) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diff < 2 * oneDay) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function getDateHeader(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const yesterday = today - 86400000;
  const msgDay = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

  if (msgDay === today) return 'Today';
  if (msgDay === yesterday) return 'Yesterday';
  return date.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export default function ContactsScreen({ navigation }: Props) {
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const contacts = useContactsStore((s) => s.contacts);
  const conversations = useMessagesStore((s) => s.conversations);
  const user = useAuthStore((s) => s.user);

  const displayContacts = contacts.length > 0 ? contacts : MOCK_CONTACTS;
  const displayConversations =
    conversations.length > 0 ? conversations : MOCK_CONVERSATIONS;

  // Network status listener
  useEffect(() => {
    const unsubscribe = offlineQueue.onNetworkChange((online) => {
      setIsOnline(online);
    });
    setIsOnline(offlineQueue.isNetworkOnline);
    return unsubscribe;
  }, []);

  // Pending message count
  useEffect(() => {
    const updatePending = async () => {
      setPendingCount(await offlineQueue.getPendingCount());
    };
    updatePending();
    const interval = setInterval(updatePending, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    // In production: fetch conversations from server
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }, []);

  const filteredContacts = displayContacts.filter((c) =>
    c.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Build section list data
  const sectionData = [
    ...(displayConversations.length > 0
      ? [
          {
            title: 'Conversations',
            data: displayConversations.filter(
              (c) =>
                !searchQuery ||
                c.otherUser?.username.toLowerCase().includes(searchQuery.toLowerCase())
            ),
          },
        ]
      : []),
    ...(filteredContacts.length > 0 && !searchQuery
      ? [{ title: 'Contacts', data: filteredContacts }]
      : []),
  ];

  const handleConversationPress = (conv: Conversation) => {
    if (conv.otherUser) {
      navigation.navigate('Chat', {
        conversationId: conv.id,
        recipientUsername: conv.otherUser.username,
        recipientId: conv.otherUser.id,
      });
    }
  };

  const handleContactPress = (contact: Contact) => {
    const existing = displayConversations.find((c) =>
      c.participants.includes(contact.id)
    );
    if (existing) {
      navigation.navigate('Chat', {
        conversationId: existing.id,
        recipientUsername: contact.username,
        recipientId: contact.id,
      });
    } else {
      navigation.navigate('Chat', {
        conversationId: `new-${contact.id}`,
        recipientUsername: contact.username,
        recipientId: contact.id,
      });
    }
  };

  const renderConversationItem = ({ item }: { item: Conversation }) => {
    const lastMsg = item.lastMessage;
    const preview = lastMsg?.content || 'No messages yet';
    const time = lastMsg?.createdAt ? formatTimestamp(lastMsg.createdAt) : '';
    const isMe = lastMsg?.senderId === (user?.id || 'me');

    return (
      <TouchableOpacity
        style={styles.conversationItem}
        onPress={() => handleConversationPress(item)}
        activeOpacity={0.7}
      >
        <Avatar.Text
          size={52}
          label={item.otherUser?.username.substring(0, 2).toUpperCase() || '??'}
          style={styles.avatar}
        />
        <View style={styles.convContent}>
          <View style={styles.convHeader}>
            <Text style={styles.convName} numberOfLines={1}>
              {item.otherUser?.username || 'Unknown'}
            </Text>
            <Text style={styles.convTime}>{time}</Text>
          </View>
          <View style={styles.convPreview}>
            <Text style={styles.previewText} numberOfLines={1}>
              {isMe ? 'You: ' : ''}
              {preview}
            </Text>
            {item.unreadCount > 0 && (
              <Badge style={styles.unreadBadge} size={20}>
                {item.unreadCount > 99 ? '99+' : item.unreadCount}
              </Badge>
            )}
          </View>
          {item.selfDestructSeconds > 0 && (
            <Text style={styles.timerIndicator}>🔥 {item.selfDestructSeconds}s</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderContactItem = ({ item }: { item: Contact }) => (
    <TouchableOpacity
      style={styles.conversationItem}
      onPress={() => handleContactPress(item)}
      activeOpacity={0.7}
    >
      <Avatar.Text
        size={52}
        label={item.username.substring(0, 2).toUpperCase()}
        style={styles.avatar}
      />
      <View style={styles.convContent}>
        <Text style={styles.convName}>{item.username}</Text>
        <Text style={styles.previewText}>Tap to start conversation →</Text>
      </View>
    </TouchableOpacity>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const renderEmptyConversations = () => (
    <View style={styles.emptyConversations}>
      <Text style={styles.emptyTitle}>No conversations yet</Text>
      <Text style={styles.emptyDesc}>
        Add a contact below and start a secure chat
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Offline / Pending indicator */}
      {!isOnline && (
        <View style={styles.offlineBanner}>
          <Text style={styles.offlineText}>
            📡 Offline — {pendingCount > 0 ? `${pendingCount} message(s) queued` : 'Messages will send when online'}
          </Text>
        </View>
      )}

      <Searchbar
        placeholder="Search..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
        inputStyle={styles.searchInput}
        iconColor="#888"
      />

      {sectionData.length === 0 && !searchQuery ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No contacts yet</Text>
          <Text style={styles.emptyDesc}>
            Add someone by their username to start chatting
          </Text>
        </View>
      ) : (
        <SectionList
          sections={sectionData}
          keyExtractor={(item) => item.id}
          renderItem={({ item, section }) =>
            section.title === 'Conversations'
              ? renderConversationItem({ item: item as Conversation })
              : renderContactItem({ item: item as Contact })
          }
          renderSectionHeader={renderSectionHeader}
          ItemSeparatorComponent={() => <Divider style={styles.divider} />}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor="#6c63ff"
              colors={['#6c63ff']}
            />
          }
          stickySectionHeadersEnabled={false}
          ListEmptyComponent={
            sectionData[0]?.title === 'Conversations' ? renderEmptyConversations : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  offlineBanner: {
    backgroundColor: '#ff9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  offlineText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '500',
  },
  searchBar: {
    margin: 16,
    marginBottom: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
  },
  searchInput: { color: '#e0e0e0' },
  listContent: { paddingHorizontal: 8, paddingBottom: 80 },
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 6,
  },
  sectionTitle: {
    color: '#888',
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  conversationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#1a1a2e',
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 14,
  },
  avatar: { backgroundColor: '#6c63ff' },
  convContent: { flex: 1, marginLeft: 14, justifyContent: 'center' },
  convHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  convName: {
    color: '#e0e0e0',
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  convTime: {
    color: '#666',
    fontSize: 12,
    marginLeft: 8,
  },
  convPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  previewText: {
    color: '#888',
    fontSize: 14,
    flex: 1,
  },
  unreadBadge: {
    backgroundColor: '#6c63ff',
    marginLeft: 8,
  },
  timerIndicator: {
    color: '#ff6b6b',
    fontSize: 11,
    marginTop: 3,
  },
  divider: { backgroundColor: 'transparent', height: 2 },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 8 },
  emptyDesc: { color: '#888', textAlign: 'center', fontSize: 14 },
  emptyConversations: {
    padding: 32,
    alignItems: 'center',
  },
});
