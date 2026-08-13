import type { ImageSource } from 'expo-image';

const DEFAULT_DOG = require('@/assets/images/onboarding/no-pet-images-default.jpg') as ImageSource;
const FALLBACK = require('@/assets/images/onboarding-cover.png') as ImageSource;

type PetPhotoLike = {
  photo_url?: string | null;
  type?: string | null;
};

/** Resolve display source: real photo → dog default → generic cover. */
export function petPhotoSource(pet: PetPhotoLike | null | undefined): ImageSource | { uri: string } {
  if (pet?.photo_url) return { uri: pet.photo_url };
  if (pet?.type?.toLowerCase() === 'dog') return DEFAULT_DOG;
  return FALLBACK;
}

export function onboardingDefaultDogSource(): ImageSource {
  return DEFAULT_DOG;
}
