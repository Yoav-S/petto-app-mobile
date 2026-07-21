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
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ApiError } from '@/services/api';
import { getErrorMessage } from '@/services/errors';
import { sendOtp, setPendingEmail } from '@/services/auth';
import { t } from '@/i18n';
import { Radius, Spacing, type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function EmailAuthScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const inputRef = useRef<TextInput>(null);
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);

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

          <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError('');
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={t('auth.email_placeholder')}
              placeholderTextColor={colors.secondaryText}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              textContentType="emailAddress"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {email.length > 0 ? (
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  setEmail('');
                  inputRef.current?.focus();
                }}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={t('common.clear')}
              >
                <Ionicons name="close-circle" size={20} color={colors.secondaryText} />
              </Pressable>
            ) : null}
          </View>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {canSubmit ? (
            <Pressable
              style={styles.button}
              onPress={handleContinue}
              disabled={isLoading}
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator color={colors.surface} />
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

const makeStyles = (c: ThemeColors) => StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: c.background,
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
    color: c.secondaryText,
  },
  title: {
    fontFamily: 'Rubik-Regular',
    fontSize: 24,
    lineHeight: 28,
    color: c.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 20,
    color: c.secondaryText,
    marginBottom: Spacing.xl,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: c.border,
    borderRadius: Radius.md,
    backgroundColor: c.surface,
    paddingRight: Spacing.sm,
    marginBottom: Spacing.md,
  },
  inputWrapFocused: {
    borderColor: c.brand,
  },
  input: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 16,
    color: c.primaryText,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 14,
  },
  clearBtn: {
    padding: Spacing.xs,
  },
  errorText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: c.error,
    marginBottom: Spacing.md,
  },
  button: {
    backgroundColor: c.brand,
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
    color: c.surface,
  },
});
