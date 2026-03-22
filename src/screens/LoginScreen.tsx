import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { login } from '../services/api';
import { useAuthStore, useAppStore } from '../store';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = { navigation: NativeStackNavigationProp<RootStackParamList, 'Login'> };

export default function LoginScreen({ navigation }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const setAuth = useAuthStore((s) => s.setAuth);
  const setGlobalLoading = useAppStore((s) => s.setLoading);

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }
    setLoading(true);
    setError('');
    setGlobalLoading(true);
    try {
      const res = await login(email, password);
      setAuth(res.token, { id: res.user_id, username: res.username });
    } catch (e: any) {
      setError(e.message || 'Login failed');
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
          <Text variant="displaySmall" style={styles.title}>🔒 Vault</Text>
          <Text variant="bodyLarge" style={styles.subtitle}>Private by design. Yours by default.</Text>
        </View>

        <View style={styles.form}>
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

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button
            mode="contained"
            onPress={handleLogin}
            loading={loading}
            disabled={loading}
            style={styles.button}
            buttonColor="#6c63ff"
          >
            Sign In
          </Button>

          <Button
            mode="text"
            onPress={() => navigation.navigate('Register')}
            textColor="#6c63ff"
            style={styles.linkButton}
          >
            Don't have an account? Sign up
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
