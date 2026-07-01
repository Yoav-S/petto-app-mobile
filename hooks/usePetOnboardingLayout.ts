import { useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  PET_ONBOARDING_DESIGN_WIDTH,
  PET_ONBOARDING_DESIGN_HEIGHT,
} from '@/constants/petOnboarding';

/** Keep typography readable on small phones without overflowing tall Figma frames. */
const MIN_SCALE = 0.78;
const MAX_SCALE = 1.12;

/**
 * Uniform scale from the 375×812 Figma frame.
 * Uses min(widthScale, heightScale) so short screens shrink content proportionally.
 */
export function usePetOnboardingLayout() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const scaleX = width / PET_ONBOARDING_DESIGN_WIDTH;
  const scaleY = height / PET_ONBOARDING_DESIGN_HEIGHT;
  const rawScale = Math.min(scaleX, scaleY);
  const scale = Math.max(MIN_SCALE, Math.min(rawScale, MAX_SCALE));

  const s = (value: number) => value * scale;

  const horizontalPadding = s(20);
  const contentWidth = Math.min(width - horizontalPadding * 2, s(335));
  const availableHeight = height - insets.top - insets.bottom;

  /** Hero image (collar, etc.) — capped by viewport so the form stays visible. */
  const heroSize = Math.min(s(222), contentWidth * 0.66, availableHeight * 0.28);

  return {
    scale,
    s,
    width,
    height,
    insets,
    horizontalPadding,
    contentWidth,
    availableHeight,
    heroSize,
  };
}
