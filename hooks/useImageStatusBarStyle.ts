import { useEffect, useState } from 'react';
import { Image as ReactNativeImage, type ImageSourcePropType } from 'react-native';
import type { ImageSource } from 'expo-image';
import type { SystemBarContentStyle } from '@/context/SystemBarsContext';
import { statusBarStyleForHex } from '@/utils/statusBarContrast';

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
        setStyle(statusBarStyleForHex(color, fallback));
        setReady(true);
      })
      .catch(() => {
        // Day mode keeps the white title until a photo color is identified.
      });

    return () => {
      active = false;
    };
  }, [fallback, source]);

  return { style, ready };
}
