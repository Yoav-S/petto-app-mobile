import React, { useMemo } from 'react';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { useAuth } from '@/context/AuthContext';
import { CACHE_CONFIG } from '@/constants/cache';
import { createQueryPersister, queryClient } from '@/services/queryClient';

/**
 * Disk-backed React Query cache. Keyed by Firebase UID so accounts never share
 * cached pets/records. Real API only — no mock data.
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.uid ?? null;
  const persister = useMemo(() => createQueryPersister(userId), [userId]);

  return (
    <PersistQueryClientProvider
      key={userId ?? 'anon'}
      client={queryClient}
      persistOptions={{
        persister,
        maxAge: CACHE_CONFIG.persistMaxAgeMs,
        buster: `${CACHE_CONFIG.busterVersion}:${userId ?? 'anon'}`,
        dehydrateOptions: {
          shouldDehydrateQuery: (query) => query.state.status === 'success',
        },
      }}
    >
      {children}
    </PersistQueryClientProvider>
  );
}
