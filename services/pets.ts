import { apiPost, apiPatch, apiDelete } from '@/services/api';
import type { Pet } from '@/types/api';

export interface CreatePetInput {
  name: string;
  type: string;
  birth_date?: string | null;
  photo_url?: string | null;
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

export async function createPet(input: CreatePetInput): Promise<Pet> {
  return apiPost<Pet>('/pets', input);
}

export async function updatePet(petId: string, patch: UpdatePetInput): Promise<Pet> {
  return apiPatch<Pet>(`/pets/${petId}`, patch);
}

export async function deletePet(petId: string): Promise<void> {
  return apiDelete(`/pets/${petId}`);
}
