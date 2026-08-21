import type { SystemBarContentStyle } from '@/context/SystemBarsContext';

/**
 * Status-bar icon style that contrasts with a known surface.
 * - light surface → dark icons
 * - dark surface → light icons
 */
export function statusBarStyleForSurface(
  surface: 'light' | 'dark',
): SystemBarContentStyle {
  return surface === 'light' ? 'dark' : 'light';
}

/** Relative luminance of a #RRGGBB color (0–1), or null if invalid. */
export function hexLuminance(hex: string): number | null {
  const normalized = hex.trim().replace('#', '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;

  const channels = [0, 2, 4].map((offset) => {
    const value = Number.parseInt(normalized.slice(offset, offset + 2), 16) / 255;
    return value <= 0.04045
      ? value / 12.92
      : Math.pow((value + 0.055) / 1.055, 2.4);
  });

  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
}

/**
 * Pick status-bar icons from a background hex.
 * Bright bg → dark icons; dark bg → light icons.
 */
export function statusBarStyleForHex(
  color: string,
  fallback: SystemBarContentStyle,
): SystemBarContentStyle {
  const luminance = hexLuminance(color);
  if (luminance == null) return fallback;
  return luminance > 0.42 ? 'dark' : 'light';
}

/** Theme mode → status bar icon style (default app chrome). */
export function statusBarStyleForTheme(isDark: boolean): SystemBarContentStyle {
  return statusBarStyleForSurface(isDark ? 'dark' : 'light');
}
