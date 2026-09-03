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
import OnboardingBackButton from '@/components/onboarding/OnboardingBackButton';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import {
  centeredInputText,
  FIELD_LABEL_GAP,
  FIELD_LABEL_TEXT,
  FIELD_TO_ACTION_GAP,
  SINGLE_LINE_FIELD,
} from '@/constants/textField';
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
          <OnboardingBackButton onPress={() => router.back()} style={styles.backBtn} />


          <Text style={styles.title}>{t('auth.email_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.email_subtitle')}</Text>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('auth.email_label')}</Text>
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
    paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xl,
  },
  backBtn: {
    alignSelf: 'flex-start',
    marginBottom: Spacing.lg,
  },
  title: {
    fontFamily: 'Rubik-Regular',
    fontSize: 24,
    // Looser than the 28 single-line spec so RU/RO titles breathe when they wrap.
    lineHeight: 32,
    color: c.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...FIELD_LABEL_TEXT,
    color: c.secondaryText,
    marginBottom: 22,
  },
  /** Label + field measures 76: 20 label, 8 gap, 48 field. */
  fieldGroup: {
    gap: FIELD_LABEL_GAP,
  },
  fieldLabel: {
    ...FIELD_LABEL_TEXT,
    color: c.secondaryText,
  },
  inputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: SINGLE_LINE_FIELD.borderWidth,
    borderColor: c.border,
    borderRadius: SINGLE_LINE_FIELD.borderRadius,
    backgroundColor: c.surface,
    paddingHorizontal: SINGLE_LINE_FIELD.paddingHorizontal,
    gap: SINGLE_LINE_FIELD.innerGap,
    height: SINGLE_LINE_FIELD.height,
  },
  inputWrapFocused: {
    borderColor: c.brand,
  },
  input: {
    ...centeredInputText({
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      color: c.primaryText,
      height: '100%',
    }),
  },
  clearBtn: {
    padding: 0,
  },
  errorText: {
    fontFamily: 'Rubik-Regular',
    fontSize: 13,
    color: c.error,
    marginTop: Spacing.sm,
  },
  button: {
    ...PRIMARY_BUTTON,
    marginTop: FIELD_TO_ACTION_GAP,
    backgroundColor: c.brand,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    backgroundColor: c.button.disabledBg,
  },
  buttonText: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: c.button.primaryText,
  },
});
