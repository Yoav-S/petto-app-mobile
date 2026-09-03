import {
  PET_ONBOARDING_CARD_PADDING_H,
  PET_ONBOARDING_DESIGN_HEIGHT,
  PET_ONBOARDING_DESIGN_WIDTH,
  PET_ONBOARDING_HERO,
  PET_ONBOARDING_HERO_ASPECT,
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
  const contentWidth = fluidContentWidth(width);
  const availableHeight = height - safeTop - safeBottom;
  const heightRatio = availableHeight / PET_ONBOARDING_DESIGN_HEIGHT;
  const heroSize = Math.min(222, contentWidth * 0.66, availableHeight * 0.28);

  /**
   * One hero footprint for every step: the full card column at the Figma
   * aspect. Fixed 303 art looked smaller than the fluid fields and buttons
   * around it on anything wider than the 375 design frame.
   */
  const cardInnerWidth = Math.max(0, contentWidth - PET_ONBOARDING_CARD_PADDING_H * 2);
  const heroWidth = Math.round(cardInnerWidth);
  const heroHeight = Math.round(heroWidth / PET_ONBOARDING_HERO_ASPECT);
  /** Rendered hero vs the 303-wide design — for overlays anchored to the art. */
  const heroScale = heroWidth / PET_ONBOARDING_HERO.width;

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
    cardInnerWidth,
    availableHeight,
    heroSize,
    heroWidth,
    heroHeight,
    heroScale,
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
