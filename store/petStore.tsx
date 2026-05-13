import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

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
    setActivePetIdState(id);
    await AsyncStorage.setItem(ACTIVE_PET_KEY, id);
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
