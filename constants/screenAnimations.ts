import { I18nManager } from 'react-native';

/** Regular navigation: the new screen enters from the side (mirrored in RTL). */
export const SIDE_ANIMATION = I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right';

/**
 * Create screens (add reminder / vaccine / topic / note / pet) rise from the
 * bottom, so the keyboard focused on push comes up together with the screen.
 */
export const CREATE_SCREEN_OPTIONS = {
  animation: 'slide_from_bottom',
  gestureDirection: 'vertical',
} as const;
