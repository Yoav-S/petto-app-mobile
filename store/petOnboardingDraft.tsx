import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';

export type PetType = 'dog' | 'cat';

export interface PetOnboardingDraft {
  name: string;
  type: PetType | null;
  photoUri: string | null;
  birthDate: string | null;
}

interface PetOnboardingDraftContextValue {
  draft: PetOnboardingDraft;
  setName: (name: string) => void;
  setType: (type: PetType) => void;
  setPhotoUri: (uri: string | null) => void;
  setBirthDate: (date: string | null) => void;
  resetDraft: () => void;
}

const emptyDraft: PetOnboardingDraft = {
  name: '',
  type: null,
  photoUri: null,
  birthDate: null,
};

const PetOnboardingDraftContext = createContext<PetOnboardingDraftContextValue | null>(null);

export function PetOnboardingDraftProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<PetOnboardingDraft>(emptyDraft);

  const setName = useCallback((name: string) => {
    setDraft((prev) => ({ ...prev, name }));
  }, []);

  const setType = useCallback((type: PetType) => {
    setDraft((prev) => ({ ...prev, type }));
  }, []);

  const setPhotoUri = useCallback((photoUri: string | null) => {
    setDraft((prev) => ({ ...prev, photoUri }));
  }, []);

  const setBirthDate = useCallback((birthDate: string | null) => {
    setDraft((prev) => ({ ...prev, birthDate }));
  }, []);

  const resetDraft = useCallback(() => {
    setDraft(emptyDraft);
  }, []);

  const value = useMemo(
    () => ({ draft, setName, setType, setPhotoUri, setBirthDate, resetDraft }),
    [draft, setName, setType, setPhotoUri, setBirthDate, resetDraft],
  );

  return (
    <PetOnboardingDraftContext.Provider value={value}>{children}</PetOnboardingDraftContext.Provider>
  );
}

export function usePetOnboardingDraft() {
  const ctx = useContext(PetOnboardingDraftContext);
  if (!ctx) {
    throw new Error('usePetOnboardingDraft must be used within PetOnboardingDraftProvider');
  }
  return ctx;
}
