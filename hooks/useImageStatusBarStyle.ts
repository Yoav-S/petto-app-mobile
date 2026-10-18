import { useEffect, useState } from 'react';
import { Image as ReactNativeImage, type ImageSourcePropType } from 'react-native';
import type { ImageSource } from 'expo-image';
import type { SystemBarContentStyle } from '@/context/SystemBarsContext';
import { hexLuminance, statusBarStyleForHex } from '@/utils/statusBarContrast';

function resolveImageUri(source: ImageSource | { uri: string }): string | null {
  if (typeof source === 'string') return source;
  if (typeof source === 'number') {
    return ReactNativeImage.resolveAssetSource(source)?.uri ?? null;
  }
  if (Array.isArray(source)) {
    return source.find((item) => item?.uri)?.uri ?? null;
  }
  if (source && typeof source === 'object' && 'uri' in source) {
    return source.uri ?? null;
  }
  return ReactNativeImage.resolveAssetSource(source as ImageSourcePropType)?.uri ?? null;
}

function prominentColors(result: {
  platform: string;
  background?: string;
  primary?: string;
  secondary?: string;
  detail?: string;
  average?: string;
  dominant?: string;
  lightMuted?: string;
  muted?: string;
  darkMuted?: string;
  vibrant?: string;
}): string[] {
  if (result.platform === 'ios') {
    return [result.background, result.primary, result.secondary, result.detail].filter(
      (color): color is string => Boolean(color),
    );
  }
  if (result.platform === 'android') {
    return [result.average, result.dominant, result.lightMuted, result.muted, result.darkMuted].filter(
      (color): color is string => Boolean(color),
    );
  }
  return [result.dominant, result.muted, result.lightMuted, result.vibrant].filter(
    (color): color is string => Boolean(color),
  );
}

/**
 * Light photos need dark type. iOS reports the next accent when a photo is
 * nearly white, so one swatch is not enough — use the lightest prominent color.
 */
export function foregroundStyleForColors(
  colors: string[],
  fallback: SystemBarContentStyle,
): SystemBarContentStyle {
  const luminances = colors
    .map((color) => hexLuminance(color))
    .filter((value): value is number => value != null);
  if (luminances.length === 0) return fallback;
  const lightest = Math.max(...luminances);
  const average = luminances.reduce((sum, value) => sum + value, 0) / luminances.length;
  return Math.max(average, lightest * 0.85) > 0.45 ? 'dark' : 'light';
}

export type PhotoForeground = '#FFFFFF' | '#1F2937';

/** Dark status-bar icons mean the photo is light, so the type is dark too. */
export function foregroundForBarStyle(style: SystemBarContentStyle): PhotoForeground {
  return style === 'dark' ? '#1F2937' : '#FFFFFF';
}

/**
 * Chooses status-bar icon contrast from an image's dominant/background color.
 * Dynamic import keeps Expo Go from crashing when the native module is absent.
 */
export function useImageStatusBarStyle(
  source: ImageSource | { uri: string },
  fallback: SystemBarContentStyle,
): { style: SystemBarContentStyle; ready: boolean } {
  const [style, setStyle] = useState<SystemBarContentStyle>(fallback);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    const uri = resolveImageUri(source);
    setStyle(fallback);
    setReady(false);
    if (!uri) {
      return () => {
        active = false;
      };
    }

    void import('react-native-image-colors')
      .then(({ getColors }) =>
        getColors(uri, {
          fallback: fallback === 'light' ? '#111315' : '#F6F7F9',
          cache: true,
          key: uri,
          quality: 'high',
          pixelSpacing: 5,
        }),
      )
      .then((result) => {
        if (!active) return;
        const colors = prominentColors(result);
        setStyle(
          colors.length > 0
            ? foregroundStyleForColors(colors, fallback)
            : statusBarStyleForHex(
                result.platform === 'ios'
                  ? result.background
                  : result.platform === 'android'
                    ? result.average
                    : result.dominant,
                fallback,
              ),
        );
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setStyle(fallback);
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [fallback, source]);

  return { style, ready };
}
