import React from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { Text, List, Switch, Divider, Button } from 'react-native-paper';
import { useAuthStore } from '../store';

export default function SettingsScreen() {
  const { user, logout } = useAuthStore();

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.substring(0, 2).toUpperCase() || '??'}
          </Text>
        </View>
        <Text variant="headlineSmall" style={styles.username}>{user?.username || 'Unknown'}</Text>
        <Text style={styles.userId}>ID: {user?.id?.substring(0, 8) || '??'}...</Text>
      </View>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.sectionHeader}>Security</List.Subheader>
        <List.Item
          title="View Recovery Phrase"
          description="Access your backup phrase"
          left={(props) => <List.Icon {...props} icon="key" color="#6c63ff" />}
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
        />
        <List.Item
          title="Change Password"
          description="Update your account password"
          left={(props) => <List.Icon {...props} icon="lock" color="#6c63ff" />}
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.sectionHeader}>Privacy</List.Subheader>
        <List.Item
          title="Read Receipts"
          description="Let others know when you've read messages"
          left={(props) => <List.Icon {...props} icon="check-all" color="#6c63ff" />}
          right={() => <Switch value={false} onValueChange={() => {}} />}
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
        />
        <List.Item
          title="Typing Indicators"
          description="Show when you're typing"
          left={(props) => <List.Icon {...props} icon="message-draw" color="#6c63ff" />}
          right={() => <Switch value={true} onValueChange={() => {}} />}
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <List.Section>
        <List.Subheader style={styles.sectionHeader}>About</List.Subheader>
        <List.Item
          title="Version"
          description="0.1.0 (MVP)"
          left={(props) => <List.Icon {...props} icon="information" color="#6c63ff" />}
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
        />
        <List.Item
          title="Privacy Policy"
          description="Read our privacy commitment"
          left={(props) => <List.Icon {...props} icon="shield-lock" color="#6c63ff" />}
          style={styles.listItem}
          titleStyle={styles.listTitle}
          descriptionStyle={styles.listDesc}
        />
      </List.Section>

      <Divider style={styles.divider} />

      <View style={styles.dangerZone}>
        <Button
          mode="outlined"
          onPress={logout}
          textColor="#ff6b6b"
          style={styles.dangerButton}
        >
          Sign Out
        </Button>
        <Button
          mode="text"
          onPress={() => {}}
          textColor="#ff4444"
          style={styles.deleteButton}
        >
          Delete Account
        </Button>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  header: { alignItems: 'center', padding: 32 },
  avatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  avatarText: { color: '#fff', fontSize: 28, fontWeight: '700' },
  username: { color: '#fff', fontWeight: '600' },
  userId: { color: '#666', marginTop: 4, fontSize: 12 },
  divider: { backgroundColor: '#2a2a4e' },
  sectionHeader: { color: '#6c63ff' },
  listItem: { backgroundColor: '#1a1a2e', marginHorizontal: 8, marginVertical: 2, borderRadius: 12 },
  listTitle: { color: '#e0e0e0' },
  listDesc: { color: '#888' },
  dangerZone: { padding: 24, alignItems: 'center' },
  dangerButton: { borderColor: '#ff6b6b', marginBottom: 12 },
  deleteButton: {},
});
