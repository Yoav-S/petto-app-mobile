import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { queryClient } from '@/services/queryClient';
import { queryKeys } from '@/services/queryKeys';
import { firstIncludedPet } from '@/services/subscription';
import type { Pet } from '@/types/api';

const ACTIVE_PET_KEY = '@petto_active_pet_id';

interface PetStoreContextType {
  activePetId: string | null;
  setActivePetId: (id: string) => Promise<void>;
}

const PetStoreContext = createContext<PetStoreContextType | null>(null);

export function PetStoreProvider({ children }: { children: React.ReactNode }) {
  const [activePetId, setActivePetIdState] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem(ACTIVE_PET_KEY).then((id) => {
      if (id) setActivePetIdState(id);
    });
  }, []);

  async function setActivePetId(id: string) {
    const cached = queryClient.getQueryData<Pet[]>(queryKeys.pets.all);
    const requested = cached?.find((p) => p.id === id);
    const nextId =
      requested?.locked ? firstIncludedPet(cached ?? [])?.id ?? null : id;
    if (!nextId) return;
    setActivePetIdState(nextId);
    await AsyncStorage.setItem(ACTIVE_PET_KEY, nextId);
  }

  return (
    <PetStoreContext.Provider value={{ activePetId, setActivePetId }}>
      {children}
    </PetStoreContext.Provider>
  );
}

export function useActivePet() {
  const ctx = useContext(PetStoreContext);
  if (!ctx) throw new Error('useActivePet must be inside PetStoreProvider');
  return ctx;
}

/** After a downgrade, keep the session on the included pet so locked pets are never loaded. */
export function useSnapActivePetToIncluded(enabled: boolean) {
  const { activePetId, setActivePetId } = useActivePet();
  const pets = usePetsQuery(enabled).data ?? [];

  useEffect(() => {
    if (!enabled || !pets.length) return;
    const current = pets.find((p) => p.id === activePetId);
    if (current && !current.locked) return;
    const included = firstIncludedPet(pets);
    if (included && included.id !== activePetId) {
      void setActivePetId(included.id);
    }
  }, [activePetId, enabled, pets, setActivePetId]);
}
