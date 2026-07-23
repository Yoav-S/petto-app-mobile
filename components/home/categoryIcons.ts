import type { ImageSourcePropType } from 'react-native';

export const HOME_CATEGORY_ICONS = {
  vaccines: require('@/assets/images/home/vaccines.png') as ImageSourcePropType,
  health: require('@/assets/images/home/health.png') as ImageSourcePropType,
  reminders: require('@/assets/images/home/reminders.png') as ImageSourcePropType,
} as const;

/** Home card icon chip backgrounds (Figma). */
export const HOME_CATEGORY_ICON_BG = {
  vaccines: '#5B8DEF1A',
  health: '#F6E7E8',
  reminders: '#4CB78233',
} as const;
