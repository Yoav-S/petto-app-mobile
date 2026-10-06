import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  PanResponder,
  Animated,
  Easing,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { ChevronDown, ChevronUp, MapPin, Plus, Settings, Star, User, X } from 'lucide-react-native';
import { PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/i18n';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { useActivePet } from '@/store/petStore';
import { guardAddPet, guardSelectPet } from '@/services/subscription';
import { listPlaces, type BusinessPlace, type Weekday } from '@/services/places';
import { petPhotoSource } from '@/utils/petPhotoSource';
import type { Pet } from '@/types/api';

/** Greeting switches at these local hours. */
const MORNING_HOUR = 5;
const EVENING_HOUR = 17;
const NIGHT_HOUR = 21;

/** Greeting line 24 + 2px gap + name line 20. */
const GREETING_AVATAR = 24 + 2 + 20;
const CARD_IMAGE_HEIGHT = 278;
const PET_SIZE = 72;
const PET_GAP = 16;
const PET_SCROLL_WIDTH = PET_SIZE * 2 + PET_GAP;
const SHEET_SNAP_MS = 320;
const PAGE_END_PX = 480;

type HomeCoords = { latitude: number; longitude: number };

/** Survives leaving home for a pet and coming back. Cleared when location is off. */
let savedNearby: {
  coords: HomeCoords;
  places: BusinessPlace[];
  hasMore: boolean;
} | null = null;

function sameSpot(a: HomeCoords, b: HomeCoords): boolean {
  return Math.abs(a.latitude - b.latitude) < 0.0002
    && Math.abs(a.longitude - b.longitude) < 0.0002;
}

function mergeFirstPage(current: BusinessPlace[], fresh: BusinessPlace[]): BusinessPlace[] {
  if (current.length === 0) return fresh;
  const freshIds = new Set(fresh.map((item) => item.id));
  const rest = current.filter((item) => !freshIds.has(item.id));
  return [...fresh, ...rest];
}

const CATEGORY_ART = {
  veterinarian: require('@/assets/images/categories/veterinary.png'),
  groomer: require('@/assets/images/categories/grooming.png'),
  pet_store: require('@/assets/images/categories/shops.png'),
} as const;

const CATEGORIES: { key: keyof typeof CATEGORY_ART | 'pharmacy' | 'pet_friendly'; label: string }[] = [
  { key: 'veterinarian', label: 'home.category_veterinary' },
  { key: 'groomer', label: 'home.category_grooming' },
  { key: 'pet_store', label: 'home.category_shops' },
  { key: 'pharmacy', label: 'home.category_pharmacies' },
  { key: 'pet_friendly', label: 'home.category_friendly' },
];

type LocationModule = typeof import('expo-location');

/** This dev build has no ExpoLocation native module. Never load the package then. */
function locationModule(): LocationModule | null {
  if (!requireOptionalNativeModule('ExpoLocation')) return null;
  return require('expo-location') as LocationModule;
}

function greetingKey(now = new Date()): string {
  const hour = now.getHours();
  if (hour >= NIGHT_HOUR || hour < MORNING_HOUR) return 'home.greeting_night';
  if (hour >= EVENING_HOUR) return 'home.greeting_evening';
  return 'home.greeting_morning';
}

const OPEN_COLOR = '#1EC876';
const CLOSED_COLOR = '#E5484D';

const DAY_LABEL: Record<Weekday, string> = {
  mon: 'home.day_mon',
  tue: 'home.day_tue',
  wed: 'home.day_wed',
  thu: 'home.day_thu',
  fri: 'home.day_fri',
  sat: 'home.day_sat',
  sun: 'home.day_sun',
};

function categoryLabel(category: BusinessPlace['category']): string {
  const match = CATEGORIES.find((item) => item.key === category);
  return match ? t(match.label) : category;
}

function placeStatus(place: BusinessPlace): { open: boolean; detail: string | null } | null {
  if (typeof place.open_now !== 'boolean') return null;
  if (place.open_24_7) return { open: true, detail: t('home.opens_24_7') };
  if (place.open_now) {
    return {
      open: true,
      detail: place.closes_at ? `${t('home.closes')} ${place.closes_at}` : null,
    };
  }
  const when = place.opens_at;
  if (place.opens_tomorrow) {
    return {
      open: false,
      detail: when ? `${t('home.opens_tomorrow')} ${when}` : t('home.opens_tomorrow'),
    };
  }
  if (place.next_open_day) {
    const day = t(DAY_LABEL[place.next_open_day]);
  return {
      open: false,
      detail: when ? `${t('home.opens')} ${day} ${when}` : `${t('home.opens')} ${day}`,
    };
  }
  if (when) return { open: false, detail: `${t('home.opens')} ${when}` };
  return { open: false, detail: null };
}

export default function DiscoverHomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountName, accountPhotoUrl } = useAuth();
  const { setActivePetId } = useActivePet();
  const petsQuery = usePetsQuery();
  const pets = petsQuery.data ?? [];

  const [coords, setCoords] = useState<HomeCoords | null>(savedNearby?.coords ?? null);
  const [places, setPlaces] = useState<BusinessPlace[]>(savedNearby?.places ?? []);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(savedNearby?.hasMore ?? false);
  const [placesEpoch, setPlacesEpoch] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const [locating, setLocating] = useState(false);
  const askedOnLoad = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(savedNearby?.hasMore ?? false);
  const placesRef = useRef<BusinessPlace[]>(savedNearby?.places ?? []);
  const coordsRef = useRef(coords);
  const sheetShift = useRef(new Animated.Value(800)).current;
  const sheetShiftRef = useRef(800);
  const collapsedHeightRef = useRef(0);
  const screenHeightRef = useRef(0);
  const topHeightRef = useRef(0);
  const expandedRef = useRef(false);
  const draggingRef = useRef(false);
  const animatingRef = useRef(false);
  const dragOriginRef = useRef(0);
  const [frameHeight, setFrameHeight] = useState(0);
  hasMoreRef.current = hasMore;
  placesRef.current = places;
  coordsRef.current = coords;

  useEffect(() => {
    const id = sheetShift.addListener(({ value }) => {
      sheetShiftRef.current = value;
    });
    return () => sheetShift.removeListener(id);
  }, [sheetShift]);

  const collapsedShift = useCallback(() => {
    const screen = screenHeightRef.current;
    const collapsed = collapsedHeightRef.current;
    if (!screen || !collapsed) return 0;
    return Math.max(0, screen - collapsed);
  }, []);

  const syncSheetRest = useCallback(() => {
    const screen = screenHeightRef.current;
    const top = topHeightRef.current;
    if (!screen || !top) return;
    const collapsed = Math.max(180, screen - top - 4);
    collapsedHeightRef.current = collapsed;
    if (draggingRef.current || animatingRef.current) return;
    sheetShift.setValue(expandedRef.current ? 0 : Math.max(0, screen - collapsed));
  }, [sheetShift]);

  const snapSheet = useCallback((toExpanded: boolean) => {
    const screen = screenHeightRef.current;
    const collapsed = collapsedHeightRef.current;
    if (!screen || !collapsed) return;
    const target = toExpanded ? 0 : Math.max(0, screen - collapsed);
    expandedRef.current = toExpanded;
    setExpanded(toExpanded);
    animatingRef.current = true;
    Animated.timing(sheetShift, {
      toValue: target,
      duration: SHEET_SNAP_MS,
      easing: Easing.bezier(0.22, 0.61, 0.36, 1),
      useNativeDriver: true,
    }).start(() => {
      animatingRef.current = false;
    });
  }, [sheetShift]);

  const snapSheetRef = useRef(snapSheet);
  snapSheetRef.current = snapSheet;

  const sheetPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) =>
        Math.abs(gesture.dy) > 6 && Math.abs(gesture.dy) > Math.abs(gesture.dx),
      onPanResponderGrant: () => {
        draggingRef.current = true;
        animatingRef.current = false;
        dragOriginRef.current = sheetShiftRef.current;
        sheetShift.stopAnimation();
      },
      onPanResponderMove: (_, gesture) => {
        const maxShift = collapsedShift();
        const next = Math.min(maxShift, Math.max(0, dragOriginRef.current + gesture.dy));
        sheetShiftRef.current = next;
        sheetShift.setValue(next);
      },
      onPanResponderRelease: () => {
        draggingRef.current = false;
        const maxShift = collapsedShift();
        snapSheetRef.current(sheetShiftRef.current < maxShift / 2);
      },
      onPanResponderTerminate: () => {
        draggingRef.current = false;
        const maxShift = collapsedShift();
        snapSheetRef.current(sheetShiftRef.current < maxShift / 2);
      },
    }),
  ).current;

  const publishCoords = useCallback((next: HomeCoords) => {
    setCoords((current) => (current && sameSpot(current, next) ? current : next));
  }, []);

  const clearNearby = useCallback(() => {
    savedNearby = null;
    placesRef.current = [];
    hasMoreRef.current = false;
    setCoords(null);
    setPlaces([]);
    setHasMore(false);
    setPlacesLoading(false);
  }, []);

  const resolveLocation = useCallback(async (ask: boolean) => {
    const location = locationModule();
    if (!location) return;
    let permission = await location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      if (!ask) {
        clearNearby();
        return;
      }
      if (!permission.canAskAgain) {
        await Linking.openSettings();
        return;
      }
      permission = await location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        clearNearby();
        return;
      }
    }
    if (!(await location.hasServicesEnabledAsync())) {
      if (ask && Platform.OS === 'android') {
        try {
          await location.enableNetworkProviderAsync();
        } catch {
          clearNearby();
          return;
        }
      }
      if (!(await location.hasServicesEnabledAsync())) {
        clearNearby();
        return;
      }
    }
    const last = await location.getLastKnownPositionAsync();
    if (last) {
      publishCoords({
        latitude: last.coords.latitude,
        longitude: last.coords.longitude,
      });
    }
    try {
      const position = await location.getCurrentPositionAsync({
        accuracy: location.Accuracy.Balanced,
      });
      publishCoords({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
      });
    } catch {
      // Permission is still on. Keep the list that is already on screen.
    }
  }, [clearNearby, publishCoords]);

  useFocusEffect(
    useCallback(() => {
      void petsQuery.refetch();
      const ask = !askedOnLoad.current;
      askedOnLoad.current = true;
      const before = coordsRef.current;
      void resolveLocation(ask)
        .catch(() => {
          if (!placesRef.current.length) clearNearby();
        })
        .finally(() => {
          const after = coordsRef.current;
          if (after && before && sameSpot(before, after) && placesRef.current.length) {
            setPlacesEpoch((value) => value + 1);
          }
        });
    }, [petsQuery.refetch, resolveLocation, clearNearby]),
  );

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    const refreshing = placesRef.current.length > 0;
    if (!refreshing) setPlacesLoading(true);
    listPlaces({
      latitude: coords.latitude,
      longitude: coords.longitude,
      offset: 0,
    })
      .then((page) => {
        if (cancelled) return;
        const merged = mergeFirstPage(placesRef.current, page.items);
        const more = merged.length > page.items.length ? hasMoreRef.current : page.has_more;
        placesRef.current = merged;
        hasMoreRef.current = more;
        savedNearby = { coords, places: merged, hasMore: more };
        setPlaces(merged);
        setHasMore(more);
      })
      .catch(() => {
        if (!cancelled && placesRef.current.length === 0) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords, placesEpoch]);

  const loadMore = useCallback(async () => {
    const here = coordsRef.current;
    if (!here || !hasMoreRef.current || loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const page = await listPlaces({
        latitude: here.latitude,
        longitude: here.longitude,
        offset: placesRef.current.length,
      });
      const seen = new Set(placesRef.current.map((item) => item.id));
      const extra = page.items.filter((item) => !seen.has(item.id));
      if (extra.length === 0) {
        hasMoreRef.current = false;
        setHasMore(false);
      return;
    }
      placesRef.current = [...placesRef.current, ...extra];
      hasMoreRef.current = page.has_more;
      if (here) {
        savedNearby = {
          coords: here,
          places: placesRef.current,
          hasMore: page.has_more,
        };
      }
      setPlaces(placesRef.current);
      setHasMore(page.has_more);
    } catch {
      setHasMore(false);
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  }, []);

  async function enableLocation() {
    if (locating) return;
    setLocating(true);
    try {
      await resolveLocation(true);
    } catch {
      if (!placesRef.current.length) clearNearby();
    } finally {
      setLocating(false);
    }
  }

  async function openPet(pet: Pet) {
    if (!(await guardSelectPet(router, pet))) return;
    await setActivePetId(pet.id);
    router.push('/pet-home' as never);
  }

  async function addPet() {
    if (!(await guardAddPet(router, pets.length))) return;
    router.push('/pets/add' as never);
  }

  const statusColor = (open: boolean) => (open ? OPEN_COLOR : CLOSED_COLOR);

  return (
    <View
      style={styles.screen}
      onLayout={(event) => {
        const height = event.nativeEvent.layout.height;
        screenHeightRef.current = height;
        setFrameHeight(height);
        syncSheetRest();
      }}
    >
      <View style={styles.page}>
        <View
          style={styles.topStack}
          onLayout={(event) => {
            topHeightRef.current = event.nativeEvent.layout.height;
            syncSheetRest();
          }}
        >
        <View style={[styles.welcomeCard, { paddingTop: insets.top + 10 }]}>
          <View style={styles.welcomeRow}>
            <View style={styles.greeting}>
              <TouchableOpacity
                style={styles.avatar}
                onPress={() => router.push('/settings/account' as never)}
                accessibilityRole="button"
                accessibilityLabel={t('settings.my_profile')}
              >
                {accountPhotoUrl ? (
                  <Image
                    source={{ uri: accountPhotoUrl }}
                    style={styles.avatarImage}
                    contentFit="cover"
                  />
                ) : (
                  <View style={styles.avatarFallback}>
                    <User size={24} color={colors.primaryText} />
                  </View>
                )}
              </TouchableOpacity>
              <View style={styles.greetingCopy}>
                <Text style={styles.greetingLine}>{t(greetingKey())}</Text>
                {accountName ? (
                  <Text style={styles.nameLine} numberOfLines={1}>
                    {`${accountName} !`}
                  </Text>
                ) : null}
              </View>
            </View>
            <TouchableOpacity
              style={styles.settingsButton}
              onPress={() => router.push('/settings' as never)}
              accessibilityLabel={t('home.settings')}
            >
              <Settings size={18} color={colors.primaryText} />
            </TouchableOpacity>
          </View>

          <View style={styles.petsBlock}>
            <Text style={styles.sectionTitle}>{t('home.my_pets')}</Text>
            <View style={styles.petsRow}>
              {pets.length > 1 ? (
                <ScrollView
                  horizontal
                  nestedScrollEnabled
                  showsHorizontalScrollIndicator={false}
                  style={styles.petScroll}
                  contentContainerStyle={styles.petScrollContent}
                >
                  {pets.map((pet) => (
                    <TouchableOpacity
                      key={pet.id}
                      style={styles.petItem}
                      onPress={() => void openPet(pet)}
                    >
                      <Image
                        source={petPhotoSource(pet)}
                        style={styles.petPhoto}
                        contentFit="cover"
                      />
                      <Text style={styles.petName} numberOfLines={1}>
                        {pet.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              ) : (
                pets.map((pet) => (
                  <TouchableOpacity
                    key={pet.id}
                    style={styles.petItem}
                    onPress={() => void openPet(pet)}
                  >
                    <Image
                      source={petPhotoSource(pet)}
                      style={styles.petPhoto}
                      contentFit="cover"
                    />
                    <Text style={styles.petName} numberOfLines={1}>
                      {pet.name}
                    </Text>
                  </TouchableOpacity>
                ))
              )}
              <TouchableOpacity style={styles.petItem} onPress={() => void addPet()}>
                <View style={styles.addPhoto}>
                  <Plus size={24} color={colors.primaryText} />
                </View>
                <Text style={styles.petName}>{t('home.add')}</Text>
              </TouchableOpacity>
            </View>
          </View>
                </View>

        <View style={styles.categoriesCard}>
          <Text style={[styles.sectionTitle, styles.categoryTitle]}>{t('home.categories')}</Text>
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoryScroll}
          >
            {CATEGORIES.map((category) => {
              const art = category.key in CATEGORY_ART
                ? CATEGORY_ART[category.key as keyof typeof CATEGORY_ART]
                : null;
              return (
                <View key={category.key} style={styles.categoryCard}>
                  <View style={styles.categoryInner}>
                    {art ? (
                      <Image source={art} style={styles.categoryArt} contentFit="contain" />
                    ) : (
                      <View style={styles.categoryArt} />
                    )}
                    <Text style={styles.categoryLabel} numberOfLines={2}>
                      {t(category.label)}
                    </Text>
                  </View>
                </View>
              );
            })}
          </ScrollView>
        </View>
        </View>

        {coords ? (
          <Animated.View
            style={[
              styles.nearSheet,
              {
                height: frameHeight || undefined,
                transform: [{ translateY: sheetShift }],
                paddingTop: expanded ? insets.top + 10 : 0,
                gap: expanded ? 0 : 10,
                borderRadius: expanded ? 0 : 24,
              },
            ]}
          >
            <View {...sheetPan.panHandlers}>
              {expanded ? null : (
                <View style={styles.handleHit}>
                  <View style={styles.sheetHandle} />
              </View>
            )}
              <View style={[styles.nearHeader, expanded && styles.nearHeaderExpanded]}>
                {expanded ? (
                  <TouchableOpacity
                    style={styles.sheetClose}
                    onPress={() => snapSheet(false)}
                    accessibilityLabel={t('home.close_list')}
                  >
                    <X size={18} color={colors.primaryText} />
                  </TouchableOpacity>
                ) : null}
                <Text style={[styles.sectionTitle, styles.nearTitle]} numberOfLines={1}>
                  {t('home.near_you')}
                </Text>
                <TouchableOpacity
                  style={styles.seeAll}
                  onPress={() => snapSheet(!expanded)}
                  hitSlop={8}
                >
                  <Text style={styles.seeAllText}>
                    {expanded ? t('home.see_less') : t('home.see_all')}
                  </Text>
                  {expanded ? (
                    <ChevronDown size={16} color={colors.primaryText} />
                  ) : (
                    <ChevronUp size={16} color={colors.primaryText} />
                  )}
                </TouchableOpacity>
              </View>
            </View>
            {placesLoading ? (
              <ActivityIndicator color={colors.brand} style={styles.nearStatus} />
            ) : (
              <FlatList
                style={styles.placeList}
                data={places}
                keyExtractor={(place) => place.id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[
                  styles.placeListContent,
                  { paddingTop: expanded ? 12 : 0, paddingBottom: insets.bottom + 22 },
                ]}
                scrollEventThrottle={16}
                onScroll={(event) => {
                  const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
                  const distance = contentSize.height - layoutMeasurement.height - contentOffset.y;
                  if (distance < PAGE_END_PX) void loadMore();
                }}
                onEndReached={() => void loadMore()}
                onEndReachedThreshold={0.8}
                ListEmptyComponent={
                  <Text style={styles.nearEmpty}>{t('home.near_empty')}</Text>
                }
                ListFooterComponent={
                  loadingMore ? (
                    <ActivityIndicator color={colors.brand} style={styles.nearStatus} />
                  ) : null
                }
                renderItem={({ item: place }) => {
                  const status = placeStatus(place);
                  return (
                    <TouchableOpacity
                      style={styles.placeCard}
                      activeOpacity={0.9}
                      onPress={() =>
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
                        } as never)
                      }
                    >
                      <View style={styles.cardImageWrap}>
                        {place.image ? (
                          <Image
                            source={{ uri: place.image }}
                            style={styles.cardImage}
                            contentFit="cover"
                          />
                        ) : (
                          <View style={styles.cardImage} />
                        )}
                        {place.distance_km != null ? (
                          <View style={styles.distanceSlot} pointerEvents="none">
                            <View style={styles.distanceBadge}>
                              <MapPin size={24} color="#1F2937" />
                              <Text style={styles.distanceText} numberOfLines={1}>
                                {`${place.distance_km} km`}
                              </Text>
                            </View>
                          </View>
                        ) : null}
                      </View>
                      <View style={styles.cardBody}>
                        <View style={styles.cardTop}>
                          <View style={styles.cardMeta}>
                            <View style={styles.categoryChip}>
                              <Text style={styles.categoryChipText}>
                                {categoryLabel(place.category)}
                              </Text>
                            </View>
                            {typeof place.rating === 'number' ? (
                              <View style={styles.ratingChip}>
                                <Star size={12} color="#F6F7F9" fill="#F6F7F9" />
                                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
                              </View>
                            ) : (
                              <Text style={styles.noReviews}>{t('home.no_reviews')}</Text>
                            )}
                          </View>
                          <Text style={styles.placeName} numberOfLines={1}>
                            {place.name}
                          </Text>
                          {place.address ? (
                            <Text style={styles.noReviews} numberOfLines={1}>
                              {place.address}
                            </Text>
                          ) : null}
                          {(place.location_count ?? 1) > 1 ? (
                            <Text style={styles.noReviews}>
                              {`${place.location_count} ${t('business.locations')}`}
                            </Text>
          ) : null}
        </View>
                        {status ? (
                          <View style={styles.statusRow}>
                            <Text style={[styles.statusText, { color: statusColor(status.open) }]}>
                              {status.open ? t('home.open') : t('home.closed')}
                            </Text>
                            <View
                              style={[
                                styles.statusDot,
                                { backgroundColor: statusColor(status.open) },
                              ]}
                            />
                            {status.detail ? (
                              <Text style={styles.statusDetail}>{status.detail}</Text>
                            ) : null}
                          </View>
        ) : null}
      </View>
                    </TouchableOpacity>
                  );
                }}
              />
            )}
          </Animated.View>
        ) : (
          <View style={styles.locationCard}>
            <View style={styles.locationHandle} />
            <View style={styles.locationBody}>
              <View style={styles.locationCopy}>
                <Text style={styles.locationTitle}>{t('home.near_title')}</Text>
                <Text style={styles.locationSubtitle}>{t('home.near_subtitle')}</Text>
              </View>
              <TouchableOpacity
                style={styles.locationButton}
                onPress={() => void enableLocation()}
                disabled={locating}
              >
                <Text style={styles.locationButtonText}>{t('home.enable_location')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
      overflow: 'hidden',
    },
    page: {
      flex: 1,
      gap: 4,
    },
    topStack: {
      gap: 4,
    },
    welcomeCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 22,
      gap: 22,
      flexShrink: 0,
    },
    welcomeRow: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    greeting: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingRight: 12,
    },
    greetingCopy: {
      flex: 1,
      gap: 2,
    },
    avatar: {
      width: GREETING_AVATAR,
      height: GREETING_AVATAR,
      borderRadius: GREETING_AVATAR / 2,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    avatarImage: {
      width: GREETING_AVATAR,
      height: GREETING_AVATAR,
    },
    avatarFallback: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    greetingLine: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: colors.primaryText,
    },
    nameLine: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: colors.primaryText,
    },
    settingsButton: {
      width: 32,
      height: 32,
      borderRadius: 10,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    petsBlock: {
      alignSelf: 'flex-start',
      gap: 16,
    },
    sectionTitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: colors.primaryText,
    },
    petsRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: PET_GAP,
    },
    petScroll: {
      width: PET_SCROLL_WIDTH,
      flexGrow: 0,
    },
    petScrollContent: {
      gap: PET_GAP,
    },
    petItem: {
      width: PET_SIZE,
      gap: 8,
      alignItems: 'center',
    },
    petPhoto: {
      width: PET_SIZE,
      height: PET_SIZE,
      borderRadius: 22,
      backgroundColor: colors.background,
    },
    addPhoto: {
      width: PET_SIZE,
      height: PET_SIZE,
      borderRadius: 22,
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    petName: {
      width: PET_SIZE,
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      textAlign: 'center',
      color: colors.primaryText,
    },
    categoriesCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      gap: 16,
      flexShrink: 0,
    },
    categoryTitle: {
      marginLeft: 20,
    },
    categoryScroll: {
      paddingLeft: 20,
      paddingRight: 20,
      gap: 8,
    },
    categoryCard: {
      width: 126,
      minHeight: 154,
      borderRadius: 12,
      backgroundColor: colors.background,
      padding: 12,
    },
    categoryInner: {
      flex: 1,
      justifyContent: 'space-between',
      minHeight: 130,
    },
    categoryArt: {
      width: 46,
      height: 61,
    },
    categoryLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: colors.primaryText,
    },
    nearSheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      top: 0,
      zIndex: 5,
      backgroundColor: colors.surface,
      borderRadius: 24,
      gap: 10,
    },
    handleHit: {
      height: 28,
      alignItems: 'center',
    },
    sheetHandle: {
      position: 'absolute',
      top: 4,
      width: 36,
      height: 5,
      borderRadius: 100,
      backgroundColor: colors.border,
    },
    nearHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
    },
    nearHeaderExpanded: {
      marginBottom: 12,
    },
    nearTitle: {
      flex: 1,
    },
    sheetClose: {
      width: 32,
      height: 32,
      borderRadius: 10,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      height: 18,
    },
    seeAllText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: colors.primaryText,
    },
    nearStatus: {
      paddingVertical: 28,
    },
    nearEmpty: {
      paddingHorizontal: 20,
      paddingVertical: 28,
      textAlign: 'center',
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryText,
    },
    placeList: {
      flex: 1,
    },
    placeListContent: {
      gap: 10,
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    placeCard: {
      borderRadius: 24,
      backgroundColor: colors.surface,
      paddingBottom: 22,
      gap: 16,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
    },
    cardImageWrap: {
      height: CARD_IMAGE_HEIGHT,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    cardImage: {
      width: '100%',
      height: CARD_IMAGE_HEIGHT,
    },
    distanceSlot: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      zIndex: 20,
      elevation: 20,
      paddingTop: 16,
      paddingRight: 16,
      alignItems: 'flex-end',
    },
    distanceBadge: {
      flexGrow: 0,
      flexShrink: 0,
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      boxSizing: 'border-box',
      gap: 4,
      borderRadius: 10,
      paddingTop: 4,
      paddingRight: 10,
      paddingBottom: 4,
      paddingLeft: 8,
      backgroundColor: 'rgba(255,255,255,0.6)',
    },
    distanceText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: '#1F2937',
      includeFontPadding: false,
    },
    cardBody: {
      paddingHorizontal: 12,
      gap: 8,
    },
    cardTop: {
      gap: 4,
    },
    cardMeta: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    categoryChip: {
      borderRadius: 6,
      backgroundColor: colors.background,
      paddingTop: 2,
      paddingRight: 6,
      paddingBottom: 2,
      paddingLeft: 6,
    },
    categoryChipText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      color: colors.secondaryText,
    },
    ratingChip: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 6,
      backgroundColor: '#004741',
      paddingTop: 2,
      paddingRight: 6,
      paddingBottom: 2,
      paddingLeft: 6,
    },
    ratingText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      color: '#F6F7F9',
    },
    noReviews: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      color: colors.secondaryText,
    },
    placeName: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: colors.primaryText,
    },
    statusRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      textAlign: 'center',
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDetail: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: colors.secondaryText,
    },
    locationCard: {
      flexGrow: 1,
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingBottom: 22,
      alignItems: 'center',
    },
    locationHandle: {
      position: 'absolute',
      top: 8,
      width: 36,
      height: 5,
      borderRadius: 100,
      backgroundColor: colors.border,
    },
    locationBody: {
      marginTop: 45,
      gap: 20,
      alignItems: 'center',
      paddingHorizontal: 20,
    },
    locationCopy: {
      width: 256,
      gap: 8,
      alignItems: 'center',
    },
    locationTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.primaryText,
    },
    locationSubtitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: colors.secondaryText,
    },
    locationButton: {
      minWidth: 136,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.brand,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    locationButtonText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: '#F6F7F9',
    },
  });
}
