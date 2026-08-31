import { useCallback, useEffect, useRef, useState } from 'react';
import { LIST_PAGE_SIZE } from '@/constants/pagination';
import { getErrorMessage } from '@/services/errors';
import { queryClient } from '@/services/queryClient';

export interface CursorPageParams {
  limit: number;
  cursor?: string;
}

interface UseCursorPaginationOptions<T extends { id: string }> {
  fetchPage: (params: CursorPageParams) => Promise<T[]>;
  pageSize?: number;
  enabled?: boolean;
  /** When this value changes the list resets (e.g. pet id or tab). */
  resetKey?: string | number | null;
  /**
   * React Query key used to remember the first page. Seeding from it lets a
   * revisited screen paint instantly and refresh in the background instead of
   * showing a spinner.
   */
  cacheKey?: readonly unknown[];
}

export function useCursorPagination<T extends { id: string }>({
  fetchPage,
  pageSize = LIST_PAGE_SIZE,
  enabled = true,
  resetKey,
  cacheKey,
}: UseCursorPaginationOptions<T>) {
  const cacheKeyRef = useRef(cacheKey);
  cacheKeyRef.current = cacheKey;

  const readCache = useCallback((): T[] | undefined => {
    const key = cacheKeyRef.current;
    if (!key) return undefined;
    const cached = queryClient.getQueryData<T[]>(key);
    return cached && cached.length > 0 ? cached : undefined;
  }, []);

  const writeCache = useCallback((page: T[]) => {
    const key = cacheKeyRef.current;
    if (!key) return;
    queryClient.setQueryData(key, page);
  }, []);

  const seed = useRef<T[]>(enabled ? readCache() ?? [] : []).current;

  const [items, setItemsState] = useState<T[]>(seed);
  const [loading, setLoading] = useState(enabled && seed.length === 0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(seed.length === pageSize);
  /** False only until the very first page for this reset key has resolved. */
  const [loaded, setLoaded] = useState(seed.length > 0);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<T[]>(seed);
  const cursorRef = useRef<string | null>(
    seed.length > 0 ? seed[seed.length - 1].id : null,
  );
  const loadingInitialRef = useRef(false);
  const loadingMoreRef = useRef(false);
  /** Bumped on reset, unmount, and a new initial load so stale responses are dropped. */
  const genRef = useRef(0);
  const resetKeyRef = useRef(resetKey);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const setItems = useCallback((updater: T[] | ((prev: T[]) => T[])) => {
    setItemsState((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : updater;
      itemsRef.current = next;
      return next;
    });
  }, []);

  const applyPage = useCallback(
    (page: T[], append: boolean) => {
      const prev = append ? itemsRef.current : [];
      const seen = new Set(prev.map((item) => item.id));
      const extra = append ? page.filter((item) => !seen.has(item.id)) : page;

      if (append && extra.length === 0) {
        setHasMore(false);
        return;
      }

      const next = append ? [...prev, ...extra] : extra;
      itemsRef.current = next;
      setItemsState(next);
      cursorRef.current = next.length > 0 ? next[next.length - 1].id : null;
      setHasMore(page.length === pageSize);
      if (!append) writeCache(page);
    },
    [pageSize, writeCache],
  );

  const clearAll = useCallback(() => {
    genRef.current += 1;
    loadingInitialRef.current = false;
    loadingMoreRef.current = false;
    itemsRef.current = [];
    cursorRef.current = null;
    setItemsState([]);
    setHasMore(false);
    setLoading(false);
    setLoadingMore(false);
    setLoaded(false);
  }, []);

  const loadInitial = useCallback(async () => {
    if (!enabled) return;
    const gen = ++genRef.current;
    loadingMoreRef.current = false;
    loadingInitialRef.current = true;
    setLoadingMore(false);

    // Anything already on screen (live or cache-seeded) stays visible while the
    // refresh runs, so re-entering a screen never flashes a spinner.
    if (itemsRef.current.length === 0) {
      const cached = readCache();
      if (cached) {
        itemsRef.current = cached;
        setItemsState(cached);
        cursorRef.current = cached[cached.length - 1].id;
        setHasMore(cached.length === pageSize);
        setLoaded(true);
      }
    }
    setLoading(itemsRef.current.length === 0);
    setError(null);
    cursorRef.current = itemsRef.current.length
      ? itemsRef.current[itemsRef.current.length - 1].id
      : null;

    try {
      const page = await fetchPageRef.current({ limit: pageSize });
      if (gen !== genRef.current) return;
      applyPage(page, false);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(getErrorMessage(err));
      if (itemsRef.current.length === 0) {
        setHasMore(false);
        cursorRef.current = null;
      }
    } finally {
      if (gen !== genRef.current) return;
      loadingInitialRef.current = false;
      setLoading(false);
      setLoaded(true);
    }
  }, [applyPage, enabled, pageSize, readCache]);

  const loadMore = useCallback(async () => {
    if (
      !enabled ||
      loadingInitialRef.current ||
      loadingMoreRef.current ||
      !hasMore ||
      !cursorRef.current
    ) {
      return;
    }
    const gen = genRef.current;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    setError(null);
    try {
      const page = await fetchPageRef.current({
        limit: pageSize,
        cursor: cursorRef.current,
      });
      if (gen !== genRef.current) return;
      applyPage(page, true);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(getErrorMessage(err));
    } finally {
      if (gen !== genRef.current) return;
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [applyPage, enabled, hasMore, pageSize]);

  useEffect(() => {
    const resetKeyChanged = resetKeyRef.current !== resetKey;
    resetKeyRef.current = resetKey;

    if (!enabled) {
      clearAll();
      return;
    }
    if (resetKeyChanged) {
      itemsRef.current = [];
      setItemsState([]);
      setLoaded(false);
    }
    void loadInitial();
  }, [clearAll, enabled, resetKey, loadInitial]);

  useEffect(
    () => () => {
      genRef.current += 1;
    },
    [],
  );

  return {
    items,
    loading,
    loadingMore,
    hasMore,
    loaded,
    error,
    loadMore,
    refresh: loadInitial,
    setItems,
  };
}
