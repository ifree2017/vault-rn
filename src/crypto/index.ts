// Mock crypto service for MVP
// In production, this would use libsignal-client WASM
// For MVP, we use Base64-encoded "encryption" as a placeholder

import type { PrekeyBundle, OneTimePrekey } from '../types';

// Generate a random ID (simulates key generation)
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + 
         Math.random().toString(36).substring(2, 15);
}

// Generate a mock prekey bundle
export function generatePrekeyBundle(): {
  identityKey: string;
  signedPrekey: string;
  signedPrekeySignature: string;
  oneTimePrekeys: OneTimePrekey[];
} {
  return {
    identityKey: generateId(),
    signedPrekey: generateId(),
    signedPrekeySignature: generateId(),
    oneTimePrekeys: Array.from({ length: 10 }, (_, i) => ({
      id: i + 1,
      data: generateId(),
    })),
  };
}

// Encrypt a message (mock - base64 encode for MVP)
export function encryptMessage(plaintext: string, _recipientId: string): string {
  // In production: X3DH key agreement + Double Ratchet
  // For MVP: just base64 encode
  const encoded = Buffer.from(plaintext, 'utf-8').toString('base64');
  return JSON.stringify({ v: 1, c: encoded });
}

// Decrypt a message (mock - base64 decode for MVP)
export function decryptMessage(encrypted: string): string {
  try {
    const parsed = JSON.parse(encrypted);
    if (parsed.v === 1 && parsed.c) {
      return Buffer.from(parsed.c, 'base64').toString('utf-8');
    }
    // Fallback for simple base64
    return Buffer.from(encrypted, 'base64').toString('utf-8');
  } catch {
    return encrypted;
  }
}

// Generate a BIP39-like recovery phrase (mock)
export function generateRecoveryPhrase(): string {
  const words = [
    'abandon', 'ability', 'able', 'about', 'above', 'absent', 'absorb', 'abstract',
    'absurd', 'abuse', 'access', 'accident', 'account', 'accuse', 'achieve', 'acid',
    'acoustic', 'acquire', 'across', 'act', 'action', 'actor', 'actress', 'actual',
    'adapt', 'add', 'addict', 'address', 'adjust', 'admit', 'adult', 'advance',
    'advice', 'aerobic', 'affair', 'afford', 'afraid', 'again', 'age', 'agent',
    'agree', 'ahead', 'aim', 'air', 'airport', 'aisle', 'alarm', 'album',
  ];
  const phrase: string[] = [];
  for (let i = 0; i < 12; i++) {
    phrase.push(words[Math.floor(Math.random() * words.length)]);
  }
  return phrase.join(' ');
}

// Derive identity from recovery phrase (mock)
export function deriveIdentityFromRecoveryPhrase(phrase: string): {
  id: string;
  keyMaterial: string;
} {
  // In production: BIP39/BIP32 key derivation
  return {
    id: generateId(),
    keyMaterial: Buffer.from(phrase, 'utf-8').toString('base64'),
  };
}
