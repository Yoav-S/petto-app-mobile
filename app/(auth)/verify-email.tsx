import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import auth from '@/services/firebaseAuth';
import { syncUserWithBackend } from '@/services/auth';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, resendVerificationEmail, refreshUser, signOut, syncError, retryBackendSync, isSyncing } = useAuth();

  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const handleResend = async () => {
    setIsSending(true);
    setError('');
    setMessage('');
    try {
      await resendVerificationEmail();
      setMessage('Verification email sent. Check your inbox.');
    } catch (err: any) {
      setError(err.message || 'Failed to send verification email.');
    } finally {
      setIsSending(false);
    }
  };

  const handleContinue = async () => {
    setIsChecking(true);
    setError('');
    try {
      await refreshUser();
      if (!auth.currentUser?.emailVerified) {
        setError('Email not verified yet. Open the link in your inbox, then try again.');
        return;
      }
      await syncUserWithBackend();
      router.replace('/(tabs)' as any);
    } catch (err: any) {
      setError(err.message || 'Could not finish sign-in. Check your connection and try again.');
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <Text style={styles.title}>Verify your email</Text>
        <Text style={styles.subtitle}>
          We sent a verification link to{'\n'}
          <Text style={styles.email}>{user?.email}</Text>
        </Text>

        {message ? <Text style={styles.messageText}>{message}</Text> : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {syncError ? (
          <View style={styles.syncErrorBox}>
            <Text style={styles.syncErrorText}>Server sync failed: {syncError}</Text>
            <TouchableOpacity onPress={retryBackendSync} disabled={isSyncing}>
              <Text style={styles.retryLink}>{isSyncing ? 'Retrying…' : 'Retry'}</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        <TouchableOpacity
          style={[styles.button, isChecking && styles.buttonDisabled]}
          onPress={handleContinue}
          disabled={isChecking}
        >
          {isChecking ? (
            <ActivityIndicator color={Colors.surface} />
          ) : (
            <Text style={styles.buttonText}>I've verified my email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryButton, isSending && styles.buttonDisabled]}
          onPress={handleResend}
          disabled={isSending}
        >
          {isSending ? (
            <ActivityIndicator color={Colors.primaryText} />
          ) : (
            <Text style={styles.secondaryButtonText}>Resend email</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <Text style={styles.signOutText}>Sign out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    justifyContent: 'center',
  },
  title: {
    fontFamily: 'Rubik-SemiBold',
    fontSize: 28,
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    lineHeight: 24,
  },
  email: {
    fontFamily: 'Rubik-Medium',
    color: Colors.primaryText,
  },
  messageText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.category.vaccines,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  errorText: {
    fontFamily: 'Rubik-Regular',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  syncErrorBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  syncErrorText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: Spacing.xs,
  },
  retryLink: {
    fontFamily: 'Rubik-Medium',
    fontSize: 14,
    color: Colors.primaryText,
  },
  button: {
    backgroundColor: Colors.primaryText,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  secondaryButton: {
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.xl,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
  secondaryButtonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  signOutButton: {
    alignItems: 'center',
    padding: Spacing.md,
  },
  signOutText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
});
