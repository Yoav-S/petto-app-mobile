import { apiPatch } from '@/services/api';
import type { OnboardingProgress, OnboardingStep, UserProfile } from '@/types/api';
import type { PetOnboardingDraft } from '@/store/petOnboardingDraft';

export function draftFromProgress(
  progress: OnboardingProgress | null | undefined,
): PetOnboardingDraft {
  const photo = progress?.photo_url;
  return {
    name: progress?.pet_name?.trim() ?? '',
    type: progress?.pet_type === 'dog' || progress?.pet_type === 'cat' ? progress.pet_type : null,
    photoUri: photo && photo.startsWith('https://') ? photo : null,
    birthDate: progress?.birth_date ?? null,
  };
}

export function buildOnboardingProgress(
  step: OnboardingStep,
  draft: PetOnboardingDraft,
  photoUrl?: string | null,
): OnboardingProgress {
  const storedPhoto =
    photoUrl !== undefined
      ? photoUrl
      : draft.photoUri?.startsWith('https://')
        ? draft.photoUri
        : null;
  return {
    step,
    pet_name: draft.name.trim() || null,
    pet_type: draft.type,
    photo_url: storedPhoto,
    birth_date: draft.birthDate,
  };
}

/** Write the current step and every answer already collected. */
export function saveOnboardingProgress(progress: OnboardingProgress): Promise<UserProfile> {
  return apiPatch<UserProfile>('/users/me/onboarding', progress);
}
