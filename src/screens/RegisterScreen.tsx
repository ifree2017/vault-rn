import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { register } from '../services/api';
import { useAuthStore, useAppStore } from '../store';
import { generateRecoveryPhrase } from '../crypto';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Register'> };

export default function RegisterScreen({ navigation }: Props) {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const setGlobalLoading = useAppStore((s) => s.setLoading);

  const handleRegister = async () => {
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    setError('');
    setGlobalLoading(true);
    try {
      // Generate recovery phrase for the new account
      const recoveryPhrase = generateRecoveryPhrase();
      const res = await register(username, email, password, recoveryPhrase);
      setAuth(res.token, { id: res.user_id, username: res.username });
      // Navigate to show recovery phrase
      navigation.navigate('RecoveryPhrase', { phrase: recoveryPhrase, isNew: true });
    } catch (e: any) {
      setError(e.message || 'Registration failed');
    } finally {
      setLoading(false);
      setGlobalLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.title}>Create Account</Text>
          <Text variant="bodyMedium" style={styles.subtitle}>No phone number required</Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
            style={styles.input}
            textColor="#e0e0e0"
            underlineColor="#444"
            activeUnderlineColor="#6c63ff"
          />
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={styles.input}
            textColor="#e0e0e0"
            underlineColor="#444"
            activeUnderlineColor="#6c63ff"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            textColor="#e0e0e0"
            underlineColor="#444"
            activeUnderlineColor="#6c63ff"
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            textColor="#e0e0e0"
            underlineColor="#444"
            activeUnderlineColor="#6c63ff"
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleRegister}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#6c63ff"
          >
            Create Account
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.goBack()}
            textColor="#6c63ff"
            style={styles.linkButton}
          >
            Already have an account? Sign in
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f0f1a' },
  scrollContent: { flexGrow: 1, justifyContent: 'center', padding: 24 },
  header: { alignItems: 'center', marginBottom: 48 },
  title: { color: '#ffffff', fontWeight: '700' },
  subtitle: { color: '#888', marginTop: 8 },
  form: { width: '100%' },
  input: { marginBottom: 16, backgroundColor: '#1a1a2e' },
  error: { color: '#ff6b6b', marginBottom: 16, textAlign: 'center' },
  button: { marginTop: 8, paddingVertical: 4 },
  linkButton: { marginTop: 16 },
});
