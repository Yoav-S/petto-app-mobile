import type { ImageSourcePropType } from 'react-native';
import type { BusinessCategory } from '@/services/places';

export const CATEGORY_ART: Record<BusinessCategory, ImageSourcePropType> = {
  veterinarian: require('@/assets/images/categories/veterinary.png'),
  groomer: require('@/assets/images/categories/grooming.png'),
  pet_store: require('@/assets/images/categories/shops.png'),
  pharmacy: require('@/assets/images/categories/pharmacy.png'),
  pet_friendly: require('@/assets/images/categories/pet-friendly.png'),
};

const PIN_BG_LIGHT: Record<BusinessCategory, string> = {
  veterinarian: '#DCEFEA',
  groomer: '#F8E4E8',
  pharmacy: '#FCEFD6',
  pet_store: '#E4F3EA',
  pet_friendly: '#E8EEF8',
};

const PIN_BG_DARK: Record<BusinessCategory, string> = {
  veterinarian: '#1E3A36',
  groomer: '#4B3135',
  pharmacy: '#3F3420',
  pet_store: '#233A2F',
  pet_friendly: '#24364D',
};

export function categoryPinBg(category: BusinessCategory, isDark: boolean): string {
  return (isDark ? PIN_BG_DARK : PIN_BG_LIGHT)[category];
}
