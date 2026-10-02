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
import { saveAccountName } from '@/services/auth';
import { getErrorMessage } from '@/services/errors';
import { t } from '@/i18n';
import OnboardingBackButton from '@/components/onboarding/OnboardingBackButton';
import { useAuth } from '@/context/AuthContext';
import { Spacing, type ThemeColors } from '@/constants/theme';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { PRIMARY_BUTTON } from '@/constants/buttons';
import {
  centeredInputText,
  FIELD_LABEL_TEXT,
  FIELD_TO_ACTION_GAP,
  SINGLE_LINE_FIELD,
} from '@/constants/textField';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

export default function YourNameScreen() {
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const { hasPets, markAccountName } = useAuth();
  const inputRef = useRef<TextInput>(null);
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focused, setFocused] = useState(false);
  const trimmed = name.trim();
  const canSubmit = trimmed.length > 0;

  const handleContinue = async () => {
    if (!canSubmit || isLoading) return;
    setIsLoading(true);
    setError('');
    try {
      await saveAccountName(trimmed);
      markAccountName(trimmed);
      if (hasPets) {
        router.replace('/(tabs)' as never);
      } else {
        router.replace('/(onboarding)/name' as never);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err));
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

          <Text style={styles.title}>{t('auth.your_name_title')}</Text>
          <Text style={styles.subtitle}>{t('auth.your_name_subtitle')}</Text>

          <View style={[styles.inputWrap, focused && styles.inputWrapFocused]}>
            <TextInput
              ref={inputRef}
              style={styles.input}
              value={name}
              onChangeText={(value) => {
                setName(value);
                if (error) setError('');
              }}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="words"
              autoCorrect={false}
              autoComplete="name"
              textContentType="name"
              autoFocus
              returnKeyType="done"
              onSubmitEditing={() => {
                void handleContinue();
              }}
            />
            {name.length > 0 ? (
              <Pressable
                style={styles.clearBtn}
                onPress={() => {
                  setName('');
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
              onPress={() => {
                void handleContinue();
              }}
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
    lineHeight: 32,
    color: c.primaryText,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...FIELD_LABEL_TEXT,
    color: c.secondaryText,
    marginBottom: 22,
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
