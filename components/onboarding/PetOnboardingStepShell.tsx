import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import OnboardingProgressDots from '@/components/onboarding/OnboardingProgressDots';
import { usePetOnboardingLayout } from '@/hooks/usePetOnboardingLayout';
import { t } from '@/i18n';
import { type ThemeColors, Radius, Spacing, FontSize } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';

interface PetOnboardingStepShellProps {
  step: number;
  canContinue: boolean;
  onDone: () => void;
  children: React.ReactNode;
}

export default function PetOnboardingStepShell({
  step,
  canContinue,
  onDone,
  children,
}: PetOnboardingStepShellProps) {
  const styles = useThemedStyles(makeStyles);
  const { horizontalPadding, contentWidth } = usePetOnboardingLayout();

  const doneBtnStyle = {
    minWidth: 100,
    height: 40,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: Spacing.sm,
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingVertical: Spacing.md }]}>
          <View style={styles.headerSide} />
          <OnboardingProgressDots currentStep={step} />
          <View style={[styles.headerSide, styles.headerSideEnd]}>
            {canContinue ? (
              <Pressable
                onPress={onDone}
                style={[styles.doneBtn, doneBtnStyle]}
                accessibilityRole="button"
              >
                <Text style={styles.doneText}>{t('petOnboarding.done')}</Text>
              </Pressable>
            ) : (
              <View
                style={[styles.doneBtn, styles.doneBtnDisabled, doneBtnStyle]}
                pointerEvents="none"
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
              >
                <Text style={styles.doneText}>{t('petOnboarding.done')}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding, paddingBottom: Spacing.xl },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                width: contentWidth,
                borderRadius: Radius.md,
                paddingHorizontal: Spacing.lg,
                paddingTop: 22,
                paddingBottom: Spacing.xl,
                gap: 22,
              },
            ]}
          >
            {children}
          </View>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerSide: {
    flex: 1,
  },
  headerSideEnd: {
    alignItems: 'flex-end',
  },
  doneBtn: {
    backgroundColor: c.brand,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneBtnDisabled: {
    backgroundColor: c.button.disabledBg,
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    fontSize: FontSize.h5,
    color: c.button.primaryText,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: 'center',
    paddingTop: 8,
  },
  card: {
    alignSelf: 'center',
    backgroundColor: c.surface,
    alignItems: 'center',
  },
});
