import { useCallback, useEffect, useRef, useState } from 'react';
import { LIST_PAGE_SIZE } from '@/constants/pagination';
import { getErrorMessage } from '@/services/errors';

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
}

export function useCursorPagination<T extends { id: string }>({
  fetchPage,
  pageSize = LIST_PAGE_SIZE,
  enabled = true,
  resetKey,
}: UseCursorPaginationOptions<T>) {
  const [items, setItemsState] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const itemsRef = useRef<T[]>([]);
  const cursorRef = useRef<string | null>(null);
  const loadingInitialRef = useRef(false);
  const loadingMoreRef = useRef(false);
  /** Bumped on reset, unmount, and a new initial load so stale responses are dropped. */
  const genRef = useRef(0);
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
    },
    [pageSize],
  );

  const loadInitial = useCallback(async () => {
    if (!enabled) return;
    const gen = ++genRef.current;
    loadingMoreRef.current = false;
    loadingInitialRef.current = true;
    setLoadingMore(false);
    setLoading(true);
    setError(null);
    cursorRef.current = null;
    try {
      const page = await fetchPageRef.current({ limit: pageSize });
      if (gen !== genRef.current) return;
      applyPage(page, false);
    } catch (err) {
      if (gen !== genRef.current) return;
      setError(getErrorMessage(err));
      itemsRef.current = [];
      setItemsState([]);
      setHasMore(false);
      cursorRef.current = null;
    } finally {
      if (gen !== genRef.current) return;
      loadingInitialRef.current = false;
      setLoading(false);
    }
  }, [applyPage, enabled, pageSize]);

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
    if (!enabled) {
      genRef.current += 1;
      loadingInitialRef.current = false;
      loadingMoreRef.current = false;
      itemsRef.current = [];
      setItemsState([]);
      setHasMore(false);
      setLoading(false);
      setLoadingMore(false);
      cursorRef.current = null;
      return;
    }
    void loadInitial();
  }, [enabled, resetKey, loadInitial]);

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
    error,
    loadMore,
    refresh: loadInitial,
    setItems,
  };
}
