import { I18nManager } from 'react-native';

/** Regular navigation: the new screen enters from the side (mirrored in RTL). */
export const SIDE_ANIMATION = I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right';

/**
 * Create screens (add reminder / vaccine / topic / note / pet): a transparent
 * modal so the previous screen stays visible while KeyboardRiseIn moves the
 * new screen up together with the keyboard. Closing fades out.
 */
export const CREATE_SCREEN_OPTIONS = {
  presentation: 'transparentModal',
  animation: 'fade',
  contentStyle: { backgroundColor: 'transparent' },
} as const;
