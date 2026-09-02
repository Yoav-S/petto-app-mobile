/**
 * Remembers per-list scroll metrics between mounts so returning to a screen can
 * paint its edge fades immediately instead of waiting for onLayout/onContentSizeChange.
 */
interface ScrollFadeMemoryEntry {
  chromeHeight: number;
  scrollable: boolean;
}

const memory = new Map<string, ScrollFadeMemoryEntry>();

export function readScrollFadeMemory(key?: string): ScrollFadeMemoryEntry | undefined {
  return key ? memory.get(key) : undefined;
}

export function writeScrollFadeMemory(
  key: string | undefined,
  patch: Partial<ScrollFadeMemoryEntry>,
): void {
  if (!key) return;
  const prev = memory.get(key) ?? { chromeHeight: 0, scrollable: false };
  const next = { ...prev, ...patch };
  if (next.chromeHeight === prev.chromeHeight && next.scrollable === prev.scrollable) return;
  memory.set(key, next);
}
