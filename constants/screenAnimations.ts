import { I18nManager } from 'react-native';

/** Regular navigation: the new screen enters from the side (mirrored in RTL). */
export const SIDE_ANIMATION = I18nManager.isRTL ? 'slide_from_left' : 'slide_from_right';

/**
 * Create screens (add reminder / vaccine / topic / note / pet) slide up from
 * the bottom with the platform's native animation.
 * - iOS: a real full-screen modal (cover vertical). Focusing the input as it
 *   presents makes UIKit animate the keyboard together with the modal.
 * - Android: native slide_from_bottom (fixed 400ms); useDeferredFocus times
 *   the IME to it.
 */
export const CREATE_SCREEN_OPTIONS = {
  presentation: 'fullScreenModal',
  animation: 'slide_from_bottom',
  gestureEnabled: false,
} as const;
