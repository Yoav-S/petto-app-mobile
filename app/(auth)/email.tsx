import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/services/api';
import { getErrorMessage } from '@/services/errors';
import { sendOtp, setPendingEmail } from '@/services/auth';
import { t } from '@/i18n';
import { Colors, Radius, Spacing } from '@/constants/theme';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailAuthScreen() {
  const router = useRouter();
  const inputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const canSubmit = EMAIL_REGEX.test(email.trim());

  const handleContinue = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(trimmed) || isLoading) return;

    setIsLoading(true);
    setError('');
    try {
      setPendingEmail(trimmed);
      await sendOtp(trimmed);
      router.push('/(auth)/verify-email' as never);
    } catch (err: unknown) {
      setError(getErrorMessage(err));
      if (err instanceof ApiError && err.status === 429 && err.retryAfterSec) {
        setError(
          `${getErrorMessage(err)} (${err.retryAfterSec}s)`,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Text style={styles.backText}>{t('petOnboarding.back')}</Text>
          </Pressable>

          <Text style={styles.title}>{t('auth.email_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.email_subtitle')}</Text>

          <TextInput
            ref={inputRef}
            style={styles.input}
            value={email}
            onChangeText={(v) => {
              setEmail(v);
              if (error) setError('');
            }}
            placeholder={t('auth.email_placeholder')}
            placeholderTextColor={Colors.secondaryText}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="email"
            textContentType="emailAddress"
            autoFocus
            returnKeyType="done"
            onSubmitEditing={handleContinue}
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {canSubmit ? (
            <Pressable
              style={styles.button}
              onPress={handleContinue}
              disabled={isLoading}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color={Colors.surface} />
              ) : (
                <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
              )}
            </Pressable>
          ) : (
            <View style={[styles.button, styles.buttonDisabled]} pointerEvents="none">
              <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  flex: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  backText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.secondaryText,
  },
  title: {
    fontFamily: 'Rubik-Regular',
    fontSize: 24,
    lineHeight: 28,
    color: Colors.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: Colors.secondaryText,
    marginBottom: Spacing.xl,
  },
  input: {
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: Colors.primaryText,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.md,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
    marginBottom: Spacing.md,
  },
  errorText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: Colors.error,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: Colors.primaryText,
    height: 48,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.surface,
  },
});
