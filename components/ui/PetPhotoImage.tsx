import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { Image, type ImageContentFit, type ImageSource } from 'expo-image';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';

type PhotoSource = ImageSource | number | { uri: string } | null | undefined;

function sourceKey(source: PhotoSource): string {
  if (!source) return 'empty';
  if (typeof source === 'number') return `asset:${source}`;
  if (typeof source === 'object' && 'uri' in source && typeof source.uri === 'string') {
    return `uri:${source.uri}`;
  }
  return `src:${JSON.stringify(source)}`;
}

function isRemoteUri(source: PhotoSource): boolean {
  if (!source || typeof source === 'number') return false;
  if (typeof source === 'object' && 'uri' in source) {
    const uri = source.uri;
    return typeof uri === 'string' && /^https?:\/\//i.test(uri);
  }
  return false;
}

interface PetPhotoImageProps {
  source?: PhotoSource;
  style?: StyleProp<ViewStyle>;
  contentFit?: ImageContentFit;
  /** Parent still fetching pet metadata — keep skeleton up. */
  forceLoading?: boolean;
  /** Prefer a centered spinner instead of the pulsing skeleton block. */
  mode?: 'skeleton' | 'spinner';
  accessibilityLabel?: string;
  recyclingKey?: string;
}

/**
 * Pet / remote photo with a visible loading state until the pixels are ready.
 * Bundled defaults skip the wait; http(s) URIs show skeleton/spinner until onLoad.
 */
export default function PetPhotoImage({
  source,
  style,
  contentFit = 'cover',
  forceLoading = false,
  mode = 'skeleton',
  accessibilityLabel,
  recyclingKey,
}: PetPhotoImageProps) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const key = sourceKey(source);
  const remote = isRemoteUri(source);
  const imageKey = recyclingKey ?? key;
  const [imageLoaded, setImageLoaded] = useState(!remote);
  const fadeAnim = useRef(new Animated.Value(0.45)).current;

  useEffect(() => {
    let cancelled = false;
    if (!remote) {
      setImageLoaded(true);
      return;
    }
    const uri =
      typeof source === 'object' && source && 'uri' in source && typeof source.uri === 'string'
        ? source.uri
        : null;
    if (!uri) {
      setImageLoaded(true);
      return;
    }
    setImageLoaded(false);
    void Image.prefetch(uri).finally(() => {
      if (!cancelled) setImageLoaded(true);
    });
    return () => {
      cancelled = true;
    };
  }, [imageKey, remote, source]);

  const waiting = forceLoading || (Boolean(source) && remote && !imageLoaded);

  useEffect(() => {
    if (!waiting || mode !== 'skeleton') {
      fadeAnim.stopAnimation();
      fadeAnim.setValue(0.45);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 0.45, duration: 750, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [waiting, mode, fadeAnim]);

  const flat = useMemo(() => StyleSheet.flatten(style) ?? {}, [style]);
  const radiusStyle = {
    borderRadius: flat.borderRadius,
    borderTopLeftRadius: flat.borderTopLeftRadius,
    borderTopRightRadius: flat.borderTopRightRadius,
    borderBottomLeftRadius: flat.borderBottomLeftRadius,
    borderBottomRightRadius: flat.borderBottomRightRadius,
  };

  return (
    <View style={[styles.host, style, { overflow: 'hidden' }]}>
      {!forceLoading && source ? (
        <Image
          key={imageKey}
          source={source}
          style={styles.image}
          contentFit={contentFit}
          accessibilityLabel={accessibilityLabel}
          priority="high"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageLoaded(true)}
          transition={remote ? 180 : 0}
          cachePolicy="memory-disk"
        />
      ) : null}

      {waiting ? (
        mode === 'spinner' ? (
          <View style={[styles.overlay, styles.spinnerOverlay, radiusStyle]}>
            <ActivityIndicator color={colors.secondaryText} />
          </View>
        ) : (
          <Animated.View
            style={[styles.overlay, styles.skeleton, radiusStyle, { opacity: fadeAnim }]}
          />
        )
      ) : null}
    </View>
  );
}

const makeStyles = (_c: ThemeColors) =>
  StyleSheet.create({
    host: {
      backgroundColor: '#E8E2D8',
    },
    image: {
      ...StyleSheet.absoluteFillObject,
    },
    overlay: {
      ...StyleSheet.absoluteFillObject,
    },
    skeleton: {
      backgroundColor: _c.border,
    },
    spinnerOverlay: {
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(232, 226, 216, 0.92)',
    },
  });
