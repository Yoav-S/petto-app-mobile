import React, { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, FlatList, ActivityIndicator, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { type ThemeColors } from '@/constants/theme';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import SettingsHeader from '@/components/settings/SettingsHeader';
import PlaceCard from '@/components/business/PlaceCard';
import {
  listPlaces,
  readLastNearbyCoords,
  readNearby,
  rememberNearby,
  type BusinessCategory,
  type BusinessPlace,
} from '@/services/places';

const CATEGORY_LABEL: Record<BusinessCategory, string> = {
  veterinarian: 'home.category_veterinary',
  groomer: 'home.category_grooming',
  pharmacy: 'home.category_pharmacies',
  pet_friendly: 'home.category_friendly',
  pet_store: 'home.category_shops',
};

function isCategory(value: string | undefined): value is BusinessCategory {
  return value === 'veterinarian'
    || value === 'groomer'
    || value === 'pharmacy'
    || value === 'pet_friendly'
    || value === 'pet_store';
}

export default function CategoryPlacesScreen() {
  const params = useLocalSearchParams<{ category?: string }>();
  const category = isCategory(params.category) ? params.category : null;
  const router = useRouter();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const known = readLastNearbyCoords();
  const seed = category ? readNearby(known, category) : null;
  const coords = known;
  const [places, setPlaces] = useState<BusinessPlace[]>(seed?.items ?? []);
  const [hasMore, setHasMore] = useState(seed?.hasMore ?? false);
  const [loading, setLoading] = useState(places.length === 0);
  const placesRef = useRef(places);
  const hasMoreRef = useRef(hasMore);
  const loadingMoreRef = useRef(false);
  const refreshingRef = useRef(false);
  const coordsRef = useRef(coords);
  placesRef.current = places;
  hasMoreRef.current = hasMore;
  coordsRef.current = coords;

  useEffect(() => {
    if (!category) return;
    let cancelled = false;
    const here = coordsRef.current;
    const refreshing = placesRef.current.length > 0;
    if (!refreshing) setLoading(true);
    refreshingRef.current = true;
    listPlaces({
      latitude: here?.latitude,
      longitude: here?.longitude,
      offset: 0,
      category,
    })
      .then((page) => {
        if (cancelled) return;
        rememberNearby(here, category, page.items, page.has_more);
        placesRef.current = page.items;
        hasMoreRef.current = page.has_more;
        setPlaces(page.items);
        setHasMore(page.has_more);
      })
      .catch(() => {
        if (!cancelled && placesRef.current.length === 0) setPlaces([]);
      })
      .finally(() => {
        if (cancelled) return;
        refreshingRef.current = false;
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [category, coords]);

  const loadMore = useCallback(async () => {
    if (!category || !hasMoreRef.current || loadingMoreRef.current || refreshingRef.current) return;
    loadingMoreRef.current = true;
    const here = coordsRef.current;
    try {
      const page = await listPlaces({
        latitude: here?.latitude,
        longitude: here?.longitude,
        offset: placesRef.current.length,
        category,
      });
      const seen = new Set(placesRef.current.map((item) => item.id));
      const extra = page.items.filter((item) => !seen.has(item.id));
      const next = extra.length ? [...placesRef.current, ...extra] : placesRef.current;
      const more = extra.length > 0 && page.has_more;
      placesRef.current = next;
      hasMoreRef.current = more;
      rememberNearby(here, category, next, more);
      setPlaces(next);
      setHasMore(more);
    } catch {
      hasMoreRef.current = false;
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
    }
  }, [category]);

  const openPlace = (place: BusinessPlace) => {
    router.push({
      pathname: '/business/[id]',
      params: {
        id: place.id,
        name: place.name,
        image: place.image ?? '',
        category: place.category,
        distance: place.distance_km != null ? String(place.distance_km) : '',
        rating: typeof place.rating === 'number' ? String(place.rating) : '',
        openNow: place.open_now ? '1' : '0',
        open247: place.open_24_7 ? '1' : '0',
        lat: coords ? String(coords.latitude) : '',
        lng: coords ? String(coords.longitude) : '',
      },
    } as never);
  };

  return (
    <View style={styles.screen}>
      <SettingsHeader
        title={category ? t(CATEGORY_LABEL[category]) : t('home.categories')}
        backgroundColor={colors.background}
      />
      {loading && places.length === 0 ? (
        <ActivityIndicator color={colors.brand} style={styles.status} />
      ) : (
        <FlatList
          data={places}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => <PlaceCard place={item} onPress={() => openPlace(item)} />}
          onEndReached={() => {
            if (hasMore) void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<Text style={styles.empty}>{t('home.near_empty')}</Text>}
        />
      )}
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    list: {
      gap: 10,
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      paddingBottom: 24,
    },
    status: {
      marginTop: 28,
    },
    empty: {
      paddingHorizontal: 20,
      paddingVertical: 28,
      textAlign: 'center',
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryText,
    },
  });
}
