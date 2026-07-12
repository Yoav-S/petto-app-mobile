/** Normalize expo-router search/path params to a single string. */
export function normalizeRouteParam(
  value: string | string[] | undefined | null,
): string | undefined {
  if (value == null) return undefined;
  if (Array.isArray(value)) return value[0] || undefined;
  const trimmed = String(value).trim();
  return trimmed.length > 0 ? trimmed : undefined;
}
