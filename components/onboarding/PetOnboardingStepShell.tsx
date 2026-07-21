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
import { type ThemeColors } from '@/constants/theme';
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
  const { s, horizontalPadding, contentWidth } = usePetOnboardingLayout();

  const doneBtnStyle = {
    minWidth: s(100),
    height: s(40),
    borderRadius: s(12),
    paddingHorizontal: s(14),
    paddingVertical: s(8),
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'left', 'right']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        <View style={[styles.header, { paddingHorizontal: horizontalPadding, paddingVertical: s(12) }]}>
          <View style={styles.headerSide} />
          <OnboardingProgressDots currentStep={step} />
          <View style={[styles.headerSide, styles.headerSideEnd]}>
            {canContinue ? (
              <Pressable
                onPress={onDone}
                style={[styles.doneBtn, doneBtnStyle]}
                accessibilityRole="button"
              >
                <Text style={[styles.doneText, { fontSize: s(14) }]}>{t('petOnboarding.done')}</Text>
              </Pressable>
            ) : (
              <View
                style={[styles.doneBtn, styles.doneBtnDisabled, doneBtnStyle]}
                pointerEvents="none"
                accessibilityRole="button"
                accessibilityState={{ disabled: true }}
              >
                <Text style={[styles.doneText, { fontSize: s(14) }]}>{t('petOnboarding.done')}</Text>
              </View>
            )}
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: horizontalPadding, paddingBottom: s(32) },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.card,
              {
                width: contentWidth,
                borderRadius: s(12),
                paddingHorizontal: s(16),
                paddingTop: s(22),
                paddingBottom: s(32),
                gap: s(22),
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
    opacity: 0.4,
  },
  doneText: {
    fontFamily: 'Rubik-Medium',
    color: c.surface,
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
