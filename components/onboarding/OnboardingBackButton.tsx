import React from 'react';
import { Ionicons } from '@expo/vector-icons';
import { type ViewStyle } from 'react-native';
import { useColors } from '@/context/ThemeContext';
import { t } from '@/i18n';
import HeaderIconButton, { HEADER_ICON_BTN } from '@/components/ui/HeaderIconButton';

/** Onboarding back control — shared 32×32 surface chip. */
export default function OnboardingBackButton({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: ViewStyle;
}) {
  const colors = useColors();
  return (
    <HeaderIconButton
      onPress={onPress}
      style={style}
      accessibilityLabel={t('petOnboarding.back')}
    >
      <Ionicons name="chevron-back" size={HEADER_ICON_BTN.iconSize} color={colors.primaryText} />
    </HeaderIconButton>
  );
}
