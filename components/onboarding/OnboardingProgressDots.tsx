import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  PET_ONBOARDING_DESIGN_WIDTH,
  PET_ONBOARDING_STEPS,
} from '@/constants/petOnboarding';
import { useTheme } from '@/context/ThemeContext';

interface OnboardingProgressDotsProps {
  currentStep: number;
  totalSteps?: number;
}

/** Figma fill for dark canvases. Light mode keeps brand so dots stay visible on #F6F7F9. */
const DOT_COLOR_DARK = '#F6F7F9';

export default function OnboardingProgressDots({
  currentStep,
  totalSteps = PET_ONBOARDING_STEPS,
}: OnboardingProgressDotsProps) {
  const { isDark, colors } = useTheme();
  const { width } = useWindowDimensions();
  const sx = width / PET_ONBOARDING_DESIGN_WIDTH;

  const inactiveSize = 8 * sx;
  const activeWidth = 18 * sx;
  const activeHeight = 8 * sx;
  const activeRadius = 5 * sx;
  const dotColor = isDark ? DOT_COLOR_DARK : colors.brand;

  return (
    <View style={styles.row} accessibilityRole="progressbar">
      {Array.from({ length: totalSteps }).map((_, index) => {
        const step = index + 1;
        const isActive = step === currentStep;

        return (
          <View
            key={step}
            style={
              isActive
                ? {
                    width: activeWidth,
                    height: activeHeight,
                    borderRadius: activeRadius,
                    backgroundColor: dotColor,
                    opacity: 1,
                  }
                : {
                    width: inactiveSize,
                    height: inactiveSize,
                    borderRadius: inactiveSize / 2,
                    backgroundColor: dotColor,
                    opacity: 0.3,
                  }
            }
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
});
