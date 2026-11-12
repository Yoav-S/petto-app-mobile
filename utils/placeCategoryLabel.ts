import { t } from '@/i18n';
import type { BusinessCategory } from '@/services/places';
import { sentenceCaseLabel } from '@/utils/sentenceCase';

const CATEGORY_KEY: Record<BusinessCategory, string> = {
  veterinarian: 'home.category_veterinary',
  groomer: 'home.category_grooming',
  pharmacy: 'home.category_pharmacies',
  pet_friendly: 'home.category_friendly',
  /** Tile row uses the shops label; chips use the shorter store tag. */
  pet_store: 'home.category_shops',
};

const CATEGORY_CHIP_KEY: Record<BusinessCategory, string> = {
  ...CATEGORY_KEY,
  pet_store: 'home.tag_pet_store',
};

/** Home tiles, service tabs, category screen titles. */
export function placeCategoryLabel(category: BusinessCategory): string {
  return sentenceCaseLabel(t(CATEGORY_KEY[category]));
}

/** Near You / place card chips (shorter pet-store tag). */
export function placeCategoryChipLabel(category: BusinessCategory): string {
  return sentenceCaseLabel(t(CATEGORY_CHIP_KEY[category]));
}

/** Any translated place-category string → sentence case. */
export function formatPlaceCategoryText(value: string): string {
  return sentenceCaseLabel(value);
}
