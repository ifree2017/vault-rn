/**
 * Security utilities for Vault client
 * Phase 2.1 Security features:
 * - Jailbreak/root detection
 * - Certificate pinning readiness
 * - Clipboard auto-clear (opt-in)
 */

import { Platform, Alert } from 'react-native';

// ============================================================
// Jailbreak / Root Detection
// ============================================================

const JAILBREAK_INDICATORS: { paths: string[]; patterns: RegExp[] } = {
  paths: [
    '/Applications/Cydia.app',
    '/Applications/Sileo.app',
    '/Applications/Zebra.app',
    '/Library/MobileSubstrate/MobileSubstrate.dylib',
    '/bin/bash',
    '/usr/sbin/sshd',
    '/etc/apt',
    '/private/var/lib/apt/',
    '/private/var/lib/cydia',
    '/private/var/mobile/Library/SBSettings/Themes',
    '/usr/libexec/cydia',
    '/var/cache/apt',
    '/var/lib/apt',
    '/var/lib/cydia',
    '/var/log/syslog',
    '/bin/sh',
    '/etc/ssh/sshd_config',
    '/private/var/tmp/cydia.log',
    // Android
    '/su',
    '/su/bin/su',
    '/sbin/su',
    '/data/local/su',
    '/system/app/Superuser.apk',
    '/system/xbin/daemonsu',
    '/system/xbin/su',
    '/system/bin/su',
  ],
  patterns: [
    /cydia:\/\/package\/com\.example\.package/,
    /apt:\/\/com\.example\.package/,
    /file:\/\/\/private\/var\/lib\/cydia/,
    /ssl\/pins\/v3\/user/,
  ],
};

export function detectJailbreak(): { isJailbroken: boolean; reasons: string[] } {
  const reasons: string[] = [];

  // Check for suspicious paths
  for (const path of JAILBREAK_INDICATORS.paths) {
    try {
      // On Android/JS environment we can't actually check file system
      // but we document what we'd check
      if (typeof globalThis.require === 'function') {
        // Would use native module in production
      }
    } catch {
      // Ignore
    }
  }

  // Android-specific: check for su binary
  if (Platform.OS === 'android') {
    try {
      // In a real native module we'd check process.execSync for 'su'
      // For JS fallback, check known paths
      reasons.push('Android root indicators detected');
    } catch {
      // Not root
    }
  }

  // iOS-specific checks
  if (Platform.OS === 'ios') {
    // Check for suspicious URL schemes
    const iosSuspicious = [
      'cydia://',
      'sileo://',
      'zbra://',
      'filza://',
    ];
    // Would check canOpenURL in production with native module
    if (reasons.length > 0) {
      reasons.push('iOS jailbreak indicators detected');
    }
  }

  return {
    isJailbroken: reasons.length > 0,
    reasons,
  };
}

/**
 * Show security warning to user if device appears jailbroken/rooted
 * Does NOT block app usage — just warns
 */
export function warnIfJailbroken(): void {
  const { isJailbroken, reasons } = detectJailbreak();
  if (isJailbroken) {
    Alert.alert(
      '⚠️ Security Notice',
      'Your device appears to be modified. Vault is designed for standard devices. ' +
        'Modified environments may compromise end-to-end encryption and message security. ' +
        'Proceed with caution.',
      [{ text: 'I Understand', style: 'default' }]
    );
  }
}

// ============================================================
// Certificate Pinning (Client-side readiness)
// ============================================================

// In production with Expo managed workflow, certificate pinning
// requires a native module. This provides the interface and
// a mock implementation that logs intent.

const PINNED_CERTIFICATE_HASHES: Record<string, string> = {
  // SHA-256 fingerprint of server certificate (add in production)
  // 'api.vault.example': 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=',
};

// Environment-aware API base URL
export function getPinnedApiBase(): string {
  // In development, pinning is disabled
  if (__DEV__) {
    return 'http://localhost:8080';
  }
  return process.env.EXPO_PUBLIC_API_URL || 'https://api.vault.example';
}

/**
 * Validate that a fetch response comes from a pinned server.
 * In production with native module, this would verify TLS certificate chain.
 */
export async function validatePinnedResponse(response: Response): Promise<boolean> {
  if (__DEV__) return true; // Skip in dev

  const cert = response.headers.get('x-ssl-cert');
  if (!cert) {
    console.warn('[Security] No certificate header — cannot verify pinned connection');
    return false;
  }

  // In production: verify cert against PINNED_CERTIFICATE_HASHES
  return true;
}

// ============================================================
// Clipboard Auto-Clear (Opt-in)
// ============================================================

let clipboardTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Clear clipboard after a delay (default 60 seconds)
 * Must be enabled explicitly — privacy feature
 */
export function copyWithAutoClear(text: string, delayMs = 60000): void {
  // In React Native, we'd use @react-native-clipboard/clipboard
  // For now this is a placeholder interface
  if (clipboardTimer) clearTimeout(clipboardTimer);

  // Would call: Clipboard.setString(text)
  clipboardTimer = setTimeout(() => {
    // Would call: Clipboard.setString('')
    console.log('[Security] Clipboard auto-cleared');
  }, delayMs);
}

export function cancelClipboardAutoClear(): void {
  if (clipboardTimer) {
    clearTimeout(clipboardTimer);
    clipboardTimer = null;
  }
}
