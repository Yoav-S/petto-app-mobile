import {
  PET_ONBOARDING_DESIGN_WIDTH,
  PET_ONBOARDING_DESIGN_HEIGHT,
} from '@/constants/petOnboarding';

const CARD_PADDING_TOP_DESIGN = 22;
/**
 * Phones shorter than this vs the 812px Figma frame get 0 card padding-top.
 * Between this and 1.0, padding ramps up to the full 22px design value.
 */
const CARD_PADDING_TOP_COMPACT_RATIO = 0.92;

export function getPetOnboardingScale(
  width: number,
  height: number,
  safeTop = 0,
  safeBottom = 0,
) {
  const sx = width / PET_ONBOARDING_DESIGN_WIDTH;
  const sy = height / PET_ONBOARDING_DESIGN_HEIGHT;
  const availableHeight = height - safeTop - safeBottom;
  const heightRatio = availableHeight / PET_ONBOARDING_DESIGN_HEIGHT;

  let cardPaddingTop = 0;
  if (heightRatio >= 1) {
    cardPaddingTop = CARD_PADDING_TOP_DESIGN * sy;
  } else if (heightRatio > CARD_PADDING_TOP_COMPACT_RATIO) {
    const t =
      (heightRatio - CARD_PADDING_TOP_COMPACT_RATIO) / (1 - CARD_PADDING_TOP_COMPACT_RATIO);
    cardPaddingTop = CARD_PADDING_TOP_DESIGN * sy * t;
  }

  return { sx, sy, heightRatio, cardPaddingTop };
}

/** Scale fixed Figma tweak offsets so compact layouts work on every screen size. */
export function scaleOffset(value: number, scale: number): number {
  return value * scale;
}
