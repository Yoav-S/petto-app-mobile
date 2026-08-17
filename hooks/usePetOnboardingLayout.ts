import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PET_ONBOARDING_DESIGN_HEIGHT } from '@/constants/petOnboarding';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';

/**
 * Pet onboarding layout — fixed Figma metrics + fluid content width.
 * No global scale factor; typography and control sizes stay fixed.
 */
export function usePetOnboardingLayout() {
  const insets = useSafeAreaInsets();
  const { width, height, contentWidth, pagePadding } = useResponsiveLayout();

  const availableHeight = height - insets.top - insets.bottom;

  /** Hero image (collar, etc.) — capped by viewport so the form stays visible. */
  const heroSize = useMemo(
    () => Math.min(222, contentWidth * 0.66, availableHeight * 0.28),
    [availableHeight, contentWidth],
  );

  return {
    width,
    height,
    insets,
    horizontalPadding: pagePadding,
    contentWidth: Math.min(contentWidth, 335),
    availableHeight,
    heroSize,
    designHeight: PET_ONBOARDING_DESIGN_HEIGHT,
  };
}
