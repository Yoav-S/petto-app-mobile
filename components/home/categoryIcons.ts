import type { ImageSourcePropType } from 'react-native';
import type { ThemeColors } from '@/constants/theme';

export const HOME_CATEGORY_ICONS = {
  vaccines: require('@/assets/images/home/vaccines.png') as ImageSourcePropType,
  health: require('@/assets/images/home/health.png') as ImageSourcePropType,
  reminders: require('@/assets/images/home/reminders.png') as ImageSourcePropType,
} as const;

/** Home card icon chip backgrounds — twins from the Vaccinations / Health / Reminders palette. */
export function homeCategoryIconBg(colors: ThemeColors) {
  return {
    vaccines: colors.category.vaccinesBg,
    health: colors.category.medicalBg,
    reminders: colors.category.remindersBg,
  } as const;
}
