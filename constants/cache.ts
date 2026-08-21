/**
 * Launch cache configuration — tweak here; QueryClient reads these defaults.
 * No mock data: every query hits the real API (stale-while-revalidate).
 */
export const CACHE_CONFIG = {
  /** In-memory: treat data as fresh for this long (ms). */
  staleTimeMs: 60_000,
  /** Keep unused queries in memory (ms). */
  gcTimeMs: 1000 * 60 * 60 * 24,
  /** Disk persistence max age (ms). */
  persistMaxAgeMs: 1000 * 60 * 60 * 24,
  /** Persist write throttle (ms). */
  persistThrottleMs: 1_000,
  /** AsyncStorage key prefix; per-user suffix is applied at runtime. */
  storageKeyPrefix: 'ragly-qc-v1',
  /** Schema buster — bump when persisted shape changes incompatibly. */
  busterVersion: '1',
} as const;
