import { apiGet, apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Pet } from '@/types/api';
import { invalidatePets, invalidatePetDomain, invalidateProfile } from '@/services/queryClient';

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
  invalidatePets();
  invalidateProfile();
  return pet;
}

export async function updatePet(petId: string, patch: UpdatePetInput): Promise<Pet> {
  const pet = await apiPatch<Pet>(`/pets/${petId}`, patch);
  invalidatePets();
  invalidatePetDomain(petId);
  return pet;
}

export async function deletePet(petId: string): Promise<void> {
  await apiDelete(`/pets/${petId}`);
  invalidatePets();
  invalidatePetDomain(petId);
  invalidateProfile();
}
