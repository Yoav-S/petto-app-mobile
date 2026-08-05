import React from 'react';
import { Pressable, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useColors } from '@/context/ThemeContext';
import { t } from '@/i18n';

/** Figma onboarding back control — 32×32 white chip, 24 chevron. */
export default function OnboardingBackButton({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={[styles.btn, style]}
      accessibilityRole="button"
      accessibilityLabel={t('petOnboarding.back')}
    >
      <Ionicons name="chevron-back" size={24} color={colors.primaryText} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    padding: 4,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D2D2A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 3,
  },
});
