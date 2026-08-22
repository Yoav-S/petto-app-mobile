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
  const [items, setItems] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cursorRef = useRef<string | null>(null);
  const loadingMoreRef = useRef(false);
  const fetchPageRef = useRef(fetchPage);
  fetchPageRef.current = fetchPage;

  const applyPage = useCallback(
    (page: T[], append: boolean) => {
      setItems((prev) => (append ? [...prev, ...page] : page));
      const nextCursor = page.length > 0 ? page[page.length - 1].id : null;
      cursorRef.current = nextCursor;
      setHasMore(page.length === pageSize);
    },
    [pageSize],
  );

  const loadInitial = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    setError(null);
    cursorRef.current = null;
    try {
      const page = await fetchPageRef.current({ limit: pageSize });
      applyPage(page, false);
    } catch (err) {
      setError(getErrorMessage(err));
      setItems([]);
      setHasMore(false);
      cursorRef.current = null;
    } finally {
      setLoading(false);
    }
  }, [applyPage, enabled, pageSize]);

  const loadMore = useCallback(async () => {
    if (!enabled || loadingMoreRef.current || !hasMore || !cursorRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await fetchPageRef.current({
        limit: pageSize,
        cursor: cursorRef.current,
      });
      applyPage(page, true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, [applyPage, enabled, hasMore, pageSize]);

  useEffect(() => {
    if (!enabled) {
      setItems([]);
      setHasMore(false);
      cursorRef.current = null;
      return;
    }
    void loadInitial();
  }, [enabled, resetKey, loadInitial]);

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
