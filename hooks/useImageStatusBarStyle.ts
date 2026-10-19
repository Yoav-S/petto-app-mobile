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

function isInk(color: string | undefined, ink: '#ffffff' | '#000000'): boolean {
  return (color ?? '').replace('#', '').toLowerCase() === ink.slice(1);
}

/**
 * Dark type on a light photo, white type on a dark photo.
 * iOS fills unused swatches with pure white or pure black, and those fillers
 * were flipping the result. A clearly light or dark background wins. A replaced
 * black or white field still shows up as another near-extreme swatch.
 */
export function foregroundStyleForColors(
  colors: string[],
  fallback: SystemBarContentStyle,
  background?: string,
): SystemBarContentStyle {
  const backgroundLum = background ? hexLuminance(background) : null;
  if (backgroundLum != null && backgroundLum >= 0.62) return 'dark';
  if (backgroundLum != null && backgroundLum <= 0.28) return 'light';

  const luminances = colors
    .map((color) => {
      if (backgroundLum != null && backgroundLum < 0.5 && isInk(color, '#ffffff')) return null;
      if (backgroundLum != null && backgroundLum > 0.5 && isInk(color, '#000000')) return null;
      return hexLuminance(color);
    })
    .filter((value): value is number => value != null);
  if (luminances.length === 0) {
    if (backgroundLum == null) return fallback;
    return backgroundLum >= 0.5 ? 'dark' : 'light';
  }
  const lightest = Math.max(...luminances);
  const darkest = Math.min(...luminances);
  if (lightest >= 0.9 && darkest > 0.2) return 'dark';
  if (darkest <= 0.1 && lightest < 0.8) return 'light';
  const average = luminances.reduce((sum, value) => sum + value, 0) / luminances.length;
  return average >= 0.5 ? 'dark' : 'light';
}

export type PhotoForeground = '#FFFFFF' | '#000000';

/** Dark status-bar icons mean the photo is light, so the type is black. */
export function foregroundForBarStyle(style: SystemBarContentStyle): PhotoForeground {
  return style === 'dark' ? '#000000' : '#FFFFFF';
}

/**
 * Chooses status-bar icon contrast from an image's dominant/background color.
 * Dynamic import keeps Expo Go from crashing when the native module is absent.
 */
export function useImageStatusBarStyle(
  source: ImageSource | { uri: string },
  fallback: SystemBarContentStyle,
): { style: SystemBarContentStyle; ready: boolean; fromPhoto: boolean } {
  const [style, setStyle] = useState<SystemBarContentStyle>(fallback);
  const [ready, setReady] = useState(false);
  const [fromPhoto, setFromPhoto] = useState(false);

  useEffect(() => {
    let active = true;
    const uri = resolveImageUri(source);
    setReady(false);
    if (!uri) {
      setFromPhoto(false);
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
        const background = result.platform === 'ios'
          ? result.background
          : result.platform === 'android'
            ? result.average ?? result.dominant
            : result.dominant;
        setStyle(
          colors.length > 0
            ? foregroundStyleForColors(colors, fallback, background)
            : background
              ? statusBarStyleForHex(background, fallback)
              : fallback,
        );
        setFromPhoto(true);
        setReady(true);
      })
      .catch(() => {
        if (!active) return;
        setStyle(fallback);
        setFromPhoto(false);
        setReady(true);
      });

    return () => {
      active = false;
    };
  }, [fallback, source]);

  return { style, ready, fromPhoto };
}
