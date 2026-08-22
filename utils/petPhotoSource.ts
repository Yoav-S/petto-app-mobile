import type { ImageSource } from 'expo-image';
import { Image } from 'expo-image';

const DEFAULT_DOG = require('@/assets/images/onboarding/no-pet-images-default.jpg') as ImageSource;
const DEFAULT_CAT =
  require('@/assets/images/onboarding/no-pet-images-default-cat.jpg') as ImageSource;

type PetPhotoLike = {
  photo_url?: string | null;
  type?: string | null;
};

function normalizePetType(type?: string | null): 'dog' | 'cat' | null {
  const value = type?.trim().toLowerCase();
  if (value === 'dog' || value === 'cat') return value;
  return null;
}

/** Bundled default portrait for a pet type when no photo was uploaded. */
export function defaultPetPhotoSource(type?: string | null): ImageSource {
  return normalizePetType(type) === 'cat' ? DEFAULT_CAT : DEFAULT_DOG;
}

/** Resolve display source: real photo → type default (dog/cat). */
export function petPhotoSource(pet: PetPhotoLike | null | undefined): ImageSource | { uri: string } {
  if (pet?.photo_url) return { uri: pet.photo_url };
  return defaultPetPhotoSource(pet?.type);
}

/** Bust expo-image slot when the photo URL changes for the same pet. */
export function petPhotoRecyclingKey(
  pet: (PetPhotoLike & { id?: string }) | null | undefined,
): string {
  if (!pet?.id) return 'empty';
  return `${pet.id}:${pet.photo_url ?? 'default'}`;
}

/** Warm expo-image cache so cover photos paint immediately after a URL change. */
export async function prefetchPetPhoto(url: string | null | undefined): Promise<void> {
  if (!url || !/^https?:\/\//i.test(url)) return;
  try {
    await Image.prefetch(url);
  } catch {
    // Non-fatal — onLoad still resolves once the network fetch completes.
  }
}

export function onboardingDefaultDogSource(): ImageSource {
  return DEFAULT_DOG;
}
