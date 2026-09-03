import { SINGLE_LINE_FIELD } from '@/constants/textField';

/** Figma reference frame 375Ã—812 â€” pet creation onboarding */
export const PET_ONBOARDING_DESIGN_WIDTH = 375;
export const PET_ONBOARDING_DESIGN_HEIGHT = 812;
export const PET_ONBOARDING_STEPS = 4;

/** Shared hero art footprint from Figma exports (303Ã—168). */
export const PET_ONBOARDING_HERO = {
  width: 303,
  height: 168,
  radius: 12,
} as const;

/** Every step's card uses the same inner padding, so all steps share one column. */
export const PET_ONBOARDING_CARD_PADDING_H = 16;

/** Hero art aspect — the four hero assets are all 909Ã—504 (303Ã—168 at 3x). */
export const PET_ONBOARDING_HERO_ASPECT =
  PET_ONBOARDING_HERO.width / PET_ONBOARDING_HERO.height;

export const PET_NAME_STEP = {
  progressTop: 56,
  cardTop: 116,
  cardLeft: 20,
  cardWidth: 335,
  cardHeight: 342,
  cardRadius: 12,
  cardPaddingTop: 16,
  cardPaddingH: 16,
  cardPaddingBottom: 22,
  cardGap: 22,
  copyGap: 12,
  titleSize: 24,
  titleLine: 28,
  subtitleSize: 14,
  subtitleLine: 20,
  inputWidth: 303,
  inputHeight: SINGLE_LINE_FIELD.height,
  inputRadius: SINGLE_LINE_FIELD.borderRadius,
} as const;

export const PET_TYPE_STEP = {
  progressTop: 56,
  cardTop: 116,
  cardLeft: 20,
  cardWidth: 335,
  cardHeight: 464,
  cardRadius: 12,
  cardPaddingTop: 16,
  cardPaddingH: 16,
  cardPaddingBottom: 32,
  cardGap: 22,
  titleSize: 24,
  titleLine: 28,
  pickerWidth: 303,
  pickerHeight: 160,
  pickerGap: 15,
  petIconWidth: 106,
  petIconHeight: 93,
  continuePaddingH: 20,
  continueBtnHeight: 48,
  continueBtnRadius: 12,
} as const;

export const PET_PHOTO_STEP = {
  progressTop: 56,
  cardTop: 116,
  cardLeft: 20,
  cardWidth: 335,
  cardHeight: 342,
  cardRadius: 12,
  cardPaddingTop: 16,
  cardPaddingH: 16,
  cardPaddingBottom: 32,
  cardGap: 22,
  innerGap: 22,
  copyGap: 12,
  titleSize: 24,
  titleLine: 28,
  subtitleSize: 14,
  subtitleLine: 20,
  /** Overlay metrics below are anchored to the 303-wide hero and scale with it. */
  userPhotoWidth: 67,
  userPhotoHeight: 68,
  userPhotoTop: 42,
  userPhotoLeft: 124,
  /** Mask holder sitting above the user photo */
  maskWidth: 21,
  maskHeight: 21,
  maskTop: 25,
  maskLeft: 147,
  /** Add-photo chip under the hero — width is a floor, the label may be longer. */
  addBtnMinWidth: 126,
  addBtnHeight: 48,
  addBtnRadius: 12,
  addBtnPaddingH: 16,
  addBtnPaddingV: 12,
  addBtnGap: 8,
  addBtnIconSize: 16,
  addBtnFontSize: 14,
  addBtnLineHeight: 18,
  skipWidth: 29,
  skipHeight: 18,
  skipFontSize: 14,
  skipLineHeight: 18,
  continuePaddingH: 20,
  continueBtnHeight: 48,
  continueBtnRadius: 12,
} as const;

export const PET_PHOTO_SHEET = {
  height: 288,
  radius: 24,
  background: '#F6F7F9',
  titleRowWidth: 226,
  titleRowHeight: 32,
  titleRowTop: 32,
  titleRowLeft: 129,
  closeSize: 24,
  optionsWidth: 335,
  optionsHeight: 96,
  optionsRadius: 12,
  optionsGap: 10,
  optionsPadding: 16,
  optionFontSize: 16,
  optionLineHeight: 24,
  cancelSectionHeight: 84,
  cancelGap: 2,
  cancelFontSize: 16,
  cancelLineHeight: 24,
} as const;

export const PET_BIRTH_STEP = {
  progressTop: 56,
  cardTop: 116,
  cardLeft: 20,
  cardWidth: 335,
  cardHeight: 394,
  cardRadius: 12,
  cardPaddingTop: 16,
  cardPaddingH: 16,
  cardPaddingBottom: 32,
  cardGap: 22,
  copyGap: 32,
  titleBlockGap: 12,
  titleSize: 24,
  titleLine: 28,
  subtitleSize: 14,
  subtitleLine: 20,
  selectBtnHeight: SINGLE_LINE_FIELD.height,
  selectBtnRadius: SINGLE_LINE_FIELD.borderRadius,
  continuePaddingH: 20,
  continueBtnHeight: 48,
  continueBtnRadius: 12,
} as const;

export const PET_BIRTH_SHEET = {
  height: 605,
  radius: 24,
  background: '#F6F7F9',
  titleRowWidth: 228,
  titleRowHeight: 32,
  titleRowTop: 32,
  titleRowLeft: 127,
  closeSize: 24,
  titleSize: 20,
  titleLine: 24,
  bodyTop: 86,
  bodyGap: 22,
  monthBtnWidth: 85,
  yearBtnWidth: 89,
  dropdownHeight: 40,
  dropdownRadius: 12,
  weekdayRowWidth: 303,
  weekdayHeight: 23,
  gridWidth: 303,
  gridHeight: 284,
  dayCellHeight: 40,
  dayFontSize: 14,
  dayLineHeight: 20,
  mutedDayColor: '#D1D5DB',
  continueSectionHeight: 84,
} as const;
