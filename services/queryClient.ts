import { QueryClient } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { CACHE_CONFIG } from '@/constants/cache';
import { queryKeys } from '@/services/queryKeys';

/** Shared client — stale-while-revalidate defaults for launch. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: CACHE_CONFIG.staleTimeMs,
      gcTime: CACHE_CONFIG.gcTimeMs,
      retry: 1,
      refetchOnReconnect: true,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
});

export function queryCacheStorageKey(userId: string | null | undefined): string {
  return `${CACHE_CONFIG.storageKeyPrefix}:${userId ?? 'anon'}`;
}

export function createQueryPersister(userId: string | null | undefined) {
  return createAsyncStoragePersister({
    storage: AsyncStorage,
    key: queryCacheStorageKey(userId),
    throttleTime: CACHE_CONFIG.persistThrottleMs,
  });
}

/** Wipe in-memory + persisted cache (call on logout). */
export async function clearQueryCache(userId?: string | null): Promise<void> {
  queryClient.clear();
  const keys = [queryCacheStorageKey(userId), queryCacheStorageKey(null)];
  await AsyncStorage.multiRemove(keys).catch(() => {});
}

export function invalidatePets(): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.pets.all });
}

export function invalidateVaccinations(petId: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.vaccinations.all(petId) });
}

export function invalidateReminders(petId: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.reminders.all(petId) });
}

export function invalidateRecords(petId: string): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.records.all(petId) });
}

export function invalidateProfile(): void {
  void queryClient.invalidateQueries({ queryKey: queryKeys.profile.me });
}

/** After any write that affects home cards for a pet. */
export function invalidatePetDomain(petId: string): void {
  invalidatePets();
  invalidateVaccinations(petId);
  invalidateReminders(petId);
  invalidateRecords(petId);
}
