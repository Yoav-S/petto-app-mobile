import { apiPost } from '@/services/api';
import type { Pet } from '@/types/api';

export interface CreatePetInput {
  name: string;
  type: string;
  birth_date?: string | null;
  photo_url?: string | null;
}

export async function createPet(input: CreatePetInput): Promise<Pet> {
  return apiPost<Pet>('/pets', input);
}
