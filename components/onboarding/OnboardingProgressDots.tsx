import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import {
  PET_ONBOARDING_DESIGN_WIDTH,
  PET_ONBOARDING_STEPS,
} from '@/constants/petOnboarding';

const DOT_COLOR = '#1F2937';

interface OnboardingProgressDotsProps {
  currentStep: number;
  totalSteps?: number;
}

export default function OnboardingProgressDots({
  currentStep,
  totalSteps = PET_ONBOARDING_STEPS,
}: OnboardingProgressDotsProps) {
  const { width } = useWindowDimensions();
  const sx = width / PET_ONBOARDING_DESIGN_WIDTH;

  const inactiveSize = 8 * sx;
  const activeWidth = 18 * sx;
  const activeHeight = 8 * sx;
  const activeRadius = 5 * sx;

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
                    backgroundColor: DOT_COLOR,
                    opacity: 1,
                  }
                : {
                    width: inactiveSize,
                    height: inactiveSize,
                    borderRadius: inactiveSize / 2,
                    backgroundColor: DOT_COLOR,
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
