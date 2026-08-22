export interface CursorListParams {
  limit?: number;
  cursor?: string;
}

export function buildCursorQuery(params?: CursorListParams): string {
  const search = new URLSearchParams();
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.cursor) search.set('cursor', params.cursor);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export function buildCursorQueryWithBase(
  baseQuery: Record<string, string>,
  params?: CursorListParams,
): string {
  const search = new URLSearchParams(baseQuery);
  if (params?.limit != null) search.set('limit', String(params.limit));
  if (params?.cursor) search.set('cursor', params.cursor);
  return `?${search.toString()}`;
}
