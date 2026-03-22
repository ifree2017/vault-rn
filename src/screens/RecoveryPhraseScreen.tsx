import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, Platform } from 'react-native';
import { Text, Button, Card } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'RecoveryPhrase'> };
type RouteProps = { route: { params: { phrase: string; isNew: boolean } } };

export default function RecoveryPhraseScreen({ navigation, route }: Props & RouteProps) {
  const { phrase, isNew } = route.params;

  const words = phrase.split(' ');

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text variant="headlineSmall" style={styles.title}>
        {isNew ? '🎉 Account Created!' : '🔑 Your Recovery Phrase'}
      </Text>
      <Text variant="bodyMedium" style={styles.desc}>
        {isNew
          ? 'Write down these 12 words and store them safely. This is the ONLY way to recover your account.'
          : 'Enter your recovery phrase to access your account.'}
      </Text>

      <Card style={styles.card}>
        <Card.Content>
          <View style={styles.wordGrid}>
            {words.map((word, i) => (
              <View key={i} style={styles.wordItem}>
                <Text style={styles.wordNumber}>{i + 1}.</Text>
                <Text style={styles.word}>{word}</Text>
              </View>
            ))}
          </View>
        </Card.Content>
      </Card>

      <View style={styles.warning}>
        <Text style={styles.warningText}>
          ⚠️ Never share this phrase with anyone. Anyone with this phrase can access your account.
        </Text>
      </View>

      {isNew && (
        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => {
              navigation.getParent()?.goBack();
            }}
            style={styles.button}
            buttonColor="#6c63ff"
          >
            I've Saved My Phrase
          </Button>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  content: { padding: 24 },
  title: { color: '#ffffff', fontWeight: '700', marginBottom: 12, textAlign: 'center' },
  desc: { color: '#aaa', marginBottom: 24, textAlign: 'center', lineHeight: 22 },
  card: { backgroundColor: '#1a1a2e', marginBottom: 24 },
  wordGrid: { flexDirection: 'row', flexWrap: 'wrap' },
  wordItem: { flexDirection: 'row', width: '33%', paddingVertical: 6 },
  wordNumber: { color: '#666', marginRight: 4, width: 24 },
  word: { color: '#e0e0e0', fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace' },
  warning: { backgroundColor: '#2a1a1a', padding: 16, borderRadius: 8, marginBottom: 24 },
  warningText: { color: '#ff6b6b', textAlign: 'center', fontSize: 13 },
  actions: { alignItems: 'center' },
  button: { paddingHorizontal: 32 },
});
