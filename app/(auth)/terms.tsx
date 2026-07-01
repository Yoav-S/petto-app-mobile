import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import {
  setTermsAccepted,
  isWelcomeContinueUnlocked,
  unlockWelcomeContinue,
  clearTermsAccepted,
} from '@/services/onboarding';
import { t } from '@/i18n';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function TermsScreen() {
  const router = useRouter();
  const [agreed, setAgreed] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setAgreed(isWelcomeContinueUnlocked());
    }, []),
  );

  const toggleAgreed = () => {
    setAgreed((checked) => {
      const next = !checked;
      if (!next) {
        void clearTermsAccepted();
      }
      return next;
    });
  };

  const handleContinue = async () => {
    if (!agreed) return;
    unlockWelcomeContinue();
    await setTermsAccepted();
    router.back();
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.primaryText} />
        </Pressable>
        <Text style={styles.headerTitle}>{t('onboarding.terms_screen_title')}</Text>
        <View style={styles.backBtn} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.body}>{t('onboarding.terms_body')}</Text>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.checkboxRow} onPress={toggleAgreed}>
          <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
            {agreed ? <Ionicons name="checkmark" size={16} color="#FFFFFF" /> : null}
          </View>
          <Text style={styles.checkboxLabel}>{t('onboarding.terms_agree')}</Text>
        </Pressable>

        {agreed ? (
          <Pressable
            style={styles.button}
            onPress={handleContinue}
            accessibilityRole="button"
          >
            <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
          </Pressable>
        ) : (
          <View
            style={[styles.button, styles.buttonDisabled]}
            pointerEvents="none"
            accessibilityRole="button"
            accessibilityState={{ disabled: true }}
          >
            <Text style={styles.buttonText}>{t('onboarding.continue')}</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: 'Rubik-Medium',
    fontSize: 16,
    color: Colors.primaryText,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: Spacing.xl,
    paddingBottom: Spacing.xl,
  },
  body: {
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    lineHeight: 22,
    color: Colors.secondaryText,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.md,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
  },
  checkboxChecked: {
    backgroundColor: Colors.primaryText,
    borderColor: Colors.primaryText,
  },
  checkboxLabel: {
    flex: 1,
    fontFamily: 'Rubik-Regular',
    fontSize: 14,
    color: Colors.primaryText,
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
