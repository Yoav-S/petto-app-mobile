import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
  type LayoutChangeEvent,
} from 'react-native';
import { Image } from 'expo-image';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import { CATEGORY_ART, categoryPinBg } from '@/components/business/categoryArt';
import type { BusinessCategory, PlaceLocation } from '@/services/places';
import {
  OSM_TILE_HEADERS,
  OSM_TILE_SIZE,
  fitPins,
  tilesForView,
  worldPixel,
  type MapOrigin,
} from '@/utils/osmTiles';

export type BranchMapPin = {
  id: string;
  latitude: number;
  longitude: number;
  category: BusinessCategory;
  branch: PlaceLocation;
};

const PIN_SIZE = 22;
const PIN_SELECTED = 26;
const ICON_SIZE = 16;
const ICON_SELECTED = 18;

function branchCategory(
  branch: PlaceLocation,
  fallback: BusinessCategory,
  preferred?: BusinessCategory | null,
): BusinessCategory {
  const listed = branch.categories?.length
    ? branch.categories
    : (branch.services ?? []).map((service) => service.category);
  if (preferred && listed.includes(preferred)) return preferred;
  return listed[0] ?? fallback;
}

export function pinsFromLocations(
  locations: PlaceLocation[],
  fallback: BusinessCategory,
  preferred?: BusinessCategory | null,
): BranchMapPin[] {
  const pins: BranchMapPin[] = [];
  for (const branch of locations) {
    const point = branch.location?.coordinates;
    if (!point || point.length < 2) continue;
    const [lng, lat] = point;
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) continue;
    pins.push({
      id: branch.id,
      latitude: lat,
      longitude: lng,
      category: branchCategory(branch, fallback, preferred),
      branch,
    });
  }
  return pins;
}

function CategoryMark({
  category,
  selected,
}: {
  category: BusinessCategory;
  selected: boolean;
}) {
  const { isDark } = useTheme();
  const colors = useColors();
  const chip = selected ? PIN_SELECTED : PIN_SIZE;
  const icon = selected ? ICON_SELECTED : ICON_SIZE;
  return (
    <View
      style={{
        width: chip,
        height: chip,
        borderRadius: chip / 2,
        backgroundColor: categoryPinBg(category, isDark),
        borderWidth: 1.5,
        borderColor: isDark ? colors.surface : '#FFFFFF',
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: '#1E1E1E',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.22,
        shadowRadius: 2,
        elevation: 3,
      }}
    >
      <Image
        source={CATEGORY_ART[category]}
        style={{ width: icon, height: icon }}
        contentFit="contain"
      />
    </View>
  );
}

export default function BranchMap({
  pins,
  selectedId,
  interactive = false,
  onPressPin,
}: {
  pins: BranchMapPin[];
  selectedId?: string;
  interactive?: boolean;
  onPressPin?: (pin: BranchMapPin) => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const fitted = useMemo(
    () => fitPins(pins, size.width, size.height),
    [pins, size.height, size.width],
  );
  const [origin, setOrigin] = useState<MapOrigin>(fitted.origin);
  const originRef = useRef(origin);
  const pan = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    originRef.current = fitted.origin;
    setOrigin(fitted.origin);
    pan.setValue({ x: 0, y: 0 });
  }, [fitted.origin.x, fitted.origin.y, fitted.zoom, pan]);

  const tiles = useMemo(
    () => tilesForView(origin, size.width, size.height, fitted.zoom, interactive ? 2 : 1),
    [fitted.zoom, interactive, origin, size.height, size.width],
  );

  const markers = useMemo(() => {
    const ordered = [...pins].sort((a, b) => {
      if (a.id === selectedId) return 1;
      if (b.id === selectedId) return -1;
      return 0;
    });
    return ordered.map((pin) => {
      const pixel = worldPixel(pin, fitted.zoom);
      const selected = pin.id === selectedId;
      const size = selected ? PIN_SELECTED : PIN_SIZE;
      return {
        pin,
        selected,
        left: pixel.x - origin.x - size / 2,
        top: pixel.y - origin.y - size,
      };
    });
  }, [fitted.zoom, origin.x, origin.y, pins, selectedId]);

  const responder = useMemo(
    () =>
      PanResponder.create({
        onMoveShouldSetPanResponder: (_, gesture) =>
          interactive && (Math.abs(gesture.dx) > 4 || Math.abs(gesture.dy) > 4),
        onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], {
          useNativeDriver: false,
        }),
        onPanResponderRelease: (_, gesture) => {
          const next = {
            x: originRef.current.x - gesture.dx,
            y: originRef.current.y - gesture.dy,
          };
          originRef.current = next;
          pan.setValue({ x: 0, y: 0 });
          setOrigin(next);
        },
        onPanResponderTerminate: () => {
          pan.setValue({ x: 0, y: 0 });
        },
      }),
    [interactive, pan],
  );

  const onLayout = (event: LayoutChangeEvent) => {
    const { width, height } = event.nativeEvent.layout;
    const next = { width: Math.round(width), height: Math.round(height) };
    setSize((current) =>
      current.width === next.width && current.height === next.height ? current : next,
    );
  };

  return (
    <View
      style={styles.wrap}
      onLayout={onLayout}
      {...(interactive ? responder.panHandlers : null)}
    >
      <View style={styles.canvas} pointerEvents={interactive ? 'box-none' : 'none'}>
        <Animated.View
          style={[
            styles.layer,
            { width: size.width, height: size.height, transform: pan.getTranslateTransform() },
          ]}
        >
          {tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tile.uri, headers: OSM_TILE_HEADERS }}
              recyclingKey={tile.key}
              cachePolicy="memory-disk"
              style={{
                position: 'absolute',
                left: tile.left,
                top: tile.top,
                width: OSM_TILE_SIZE,
                height: OSM_TILE_SIZE,
              }}
            />
          ))}
          {markers.map(({ pin, selected, left, top }) => {
            const pinStyle = { position: 'absolute' as const, left, top };
            const mark = <CategoryMark category={pin.category} selected={selected} />;
            if (!interactive || !onPressPin) {
              return (
                <View key={pin.id} style={pinStyle} pointerEvents="none">
                  {mark}
                </View>
              );
            }
            return (
              <Pressable
                key={pin.id}
                onPress={() => onPressPin(pin)}
                style={pinStyle}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel={pin.branch.address || t('business.map')}
              >
                {mark}
              </Pressable>
            );
          })}
        </Animated.View>
      </View>
      <Text style={styles.credit} pointerEvents="none">
        © OpenStreetMap
      </Text>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: {
      flex: 1,
      overflow: 'hidden',
      backgroundColor: c.border,
    },
    canvas: {
      ...StyleSheet.absoluteFillObject,
    },
    layer: {
      overflow: 'visible',
    },
    credit: {
      position: 'absolute',
      left: 8,
      bottom: 6,
      fontFamily: 'Rubik-Regular',
      fontSize: 9,
      lineHeight: 12,
      color: c.secondaryText,
    },
  });
