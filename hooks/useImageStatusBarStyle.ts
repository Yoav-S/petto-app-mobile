import { useEffect, useState } from 'react';
import { Image as ReactNativeImage, type ImageSourcePropType } from 'react-native';
import type { ImageSource } from 'expo-image';
import type { SystemBarContentStyle } from '@/context/SystemBarsContext';

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

function hexLuminance(hex: string): number | null {
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

function styleForBackground(color: string, fallback: SystemBarContentStyle) {
  const luminance = hexLuminance(color);
  if (luminance == null) return fallback;
  // Dark icons on bright imagery; light icons on dark imagery.
  return luminance > 0.42 ? 'dark' : 'light';
}

/**
 * Chooses status-bar icon contrast from an image's dominant/background color.
 * Dynamic import keeps Expo Go from crashing when the native module is absent.
 */
export function useImageStatusBarStyle(
  source: ImageSource | { uri: string },
  fallback: SystemBarContentStyle,
): SystemBarContentStyle {
  const [style, setStyle] = useState<SystemBarContentStyle>(fallback);

  useEffect(() => {
    let active = true;
    const uri = resolveImageUri(source);
    setStyle(fallback);
    if (!uri) return () => {
      active = false;
    };

    void import('react-native-image-colors')
      .then(({ getColors }) =>
        getColors(uri, {
          fallback: fallback === 'light' ? '#111315' : '#F6F7F9',
          cache: true,
          key: uri,
          quality: 'low',
        }),
      )
      .then((result) => {
        if (!active) return;
        const color =
          result.platform === 'ios'
            ? result.background
            : result.platform === 'android'
              ? result.average
              : result.dominant;
        setStyle(styleForBackground(color, fallback));
      })
      .catch(() => {
        // Theme contrast remains the safe fallback when analysis is unavailable.
      });

    return () => {
      active = false;
    };
  }, [fallback, source]);

  return style;
}
