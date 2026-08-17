import {
  PET_ONBOARDING_DESIGN_HEIGHT,
  PET_ONBOARDING_DESIGN_WIDTH,
} from '@/constants/petOnboarding';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { fluidContentWidth } from '@/utils/responsive';

const CARD_PADDING_TOP_DESIGN = 22;

/**
 * Onboarding layout metrics — fixed typography/spacing, fluid content width.
 * No global sx/sy scale factors.
 */
export function getPetOnboardingLayoutMetrics(
  width: number,
  height: number,
  safeTop = 0,
  safeBottom = 0,
) {
  const horizontalPadding = PAGE_HORIZONTAL_PADDING;
  const contentWidth = fluidContentWidth(width, 335, horizontalPadding);
  const availableHeight = height - safeTop - safeBottom;
  const heightRatio = availableHeight / PET_ONBOARDING_DESIGN_HEIGHT;
  const heroSize = Math.min(222, contentWidth * 0.66, availableHeight * 0.28);

  let cardPaddingTop = CARD_PADDING_TOP_DESIGN;
  if (heightRatio < 0.92) {
    cardPaddingTop = 0;
  } else if (heightRatio < 1) {
    const t = (heightRatio - 0.92) / (1 - 0.92);
    cardPaddingTop = CARD_PADDING_TOP_DESIGN * t;
  }

  return {
    horizontalPadding,
    contentWidth,
    availableHeight,
    heroSize,
    cardPaddingTop,
    designWidth: PET_ONBOARDING_DESIGN_WIDTH,
    designHeight: PET_ONBOARDING_DESIGN_HEIGHT,
  };
}

/** @deprecated Use getPetOnboardingLayoutMetrics — sx/sy are always 1. */
export function getPetOnboardingScale(
  width: number,
  height: number,
  safeTop = 0,
  safeBottom = 0,
) {
  const metrics = getPetOnboardingLayoutMetrics(width, height, safeTop, safeBottom);
  return {
    sx: 1,
    sy: 1,
    heightRatio: metrics.availableHeight / PET_ONBOARDING_DESIGN_HEIGHT,
    ...metrics,
  };
}

/** @deprecated Identity — offsets are fixed design values. */
export function scaleOffset(value: number, _scale = 1): number {
  return value;
}
