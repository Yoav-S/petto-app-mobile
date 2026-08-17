import React from 'react';
import { Pressable, Text, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { t } from '@/i18n';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { PET_PHOTO_STEP } from '@/constants/petOnboarding';

type Props = {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

/** Top-right Skip on optional onboarding steps (photo / birth). */
export default function OnboardingSkipButton({ onPress, style }: Props) {
  const styles = useThemedStyles(makeStyles);
  return (
    <Pressable
      onPress={onPress}
      hitSlop={12}
      style={[styles.btn, style]}
      accessibilityRole="button"
      accessibilityLabel={t('petOnboarding.skip')}
    >
      <Text style={styles.text}>{t('petOnboarding.skip')}</Text>
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    btn: {
      minWidth: PET_PHOTO_STEP.skipWidth,
      minHeight: PET_PHOTO_STEP.skipHeight,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: {
      fontFamily: 'Rubik-Medium',
      fontSize: PET_PHOTO_STEP.skipFontSize,
      lineHeight: PET_PHOTO_STEP.skipLineHeight,
      color: c.primaryText,
      textAlign: 'center',
    },
  });
