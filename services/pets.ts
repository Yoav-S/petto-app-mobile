import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Pet } from '@/types/api';
import { queryKeys } from '@/services/queryKeys';
import {
  invalidatePetDomain,
  invalidateProfile,
  queryClient,
} from '@/services/queryClient';
import { prefetchPetPhoto } from '@/utils/petPhotoSource';

function upsertPetInCache(pet: Pet): void {
  void queryClient.cancelQueries({ queryKey: queryKeys.pets.all });
  queryClient.setQueryData<Pet[]>(queryKeys.pets.all, (old) => {
    if (!old?.length) return [pet];
    const idx = old.findIndex((p) => p.id === pet.id);
    if (idx < 0) return [...old, pet];
    const next = [...old];
    next[idx] = pet;
    return next;
  });
}

function patchPetInCache(petId: string, patch: Partial<Pet>): void {
  void queryClient.cancelQueries({ queryKey: queryKeys.pets.all });
  queryClient.setQueryData<Pet[]>(queryKeys.pets.all, (old) => {
    if (!old?.length) return old;
    const idx = old.findIndex((p) => p.id === petId);
    if (idx < 0) return old;
    const next = [...old];
    next[idx] = { ...next[idx], ...patch };
    return next;
  });
}

function removePetFromCache(petId: string): void {
  void queryClient.cancelQueries({ queryKey: queryKeys.pets.all });
  queryClient.setQueryData<Pet[]>(queryKeys.pets.all, (old) =>
    old?.filter((p) => p.id !== petId) ?? [],
  );
}

export { upsertPetInCache, patchPetInCache };

export interface CreatePetInput {
  name: string;
  type: string;
  birth_date?: string | null;
  photo_url?: string | null;
  sex?: string | null;
}

/** Partial update — only the provided keys are sent. `null` clears a field. */
export interface UpdatePetInput {
  name?: string;
  type?: string;
  photo_url?: string | null;
  breed?: string | null;
  birth_date?: string | null;
  sex?: string | null;
  weight?: number | null;
  color?: string | null;
  is_neutered?: boolean | null;
  chip_id?: string | null;
  passport_number?: string | null;
  notes?: string | null;
}

export function listPets(): Promise<Pet[]> {
  return apiGet<Pet[]>('/pets');
}

export async function createPet(input: CreatePetInput): Promise<Pet> {
  const pet = await apiPost<Pet>('/pets', input);
  upsertPetInCache(pet);
  await prefetchPetPhoto(pet.photo_url);
  invalidateProfile();
  return pet;
}

export async function updatePet(petId: string, patch: UpdatePetInput): Promise<Pet> {
  const pet = await apiPatch<Pet>(`/pets/${petId}`, patch);
  upsertPetInCache(pet);
  if (patch.photo_url !== undefined) {
    await prefetchPetPhoto(pet.photo_url);
  }
  return pet;
}

export async function deletePet(petId: string): Promise<void> {
  await apiDelete(`/pets/${petId}`);
  removePetFromCache(petId);
  invalidatePetDomain(petId);
  invalidateProfile();
}
