import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Plus, Settings, User } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useTheme, useThemedStyles } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/i18n';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { useActivePet } from '@/store/petStore';
import { guardAddPet, guardSelectPet } from '@/services/subscription';
import {
  clearNearbyCache,
  listPlaces,
  placeKey,
  rememberNearby,
  rememberNearbyCoords,
  type BusinessPlace,
} from '@/services/places';
import { petPhotoSource } from '@/utils/petPhotoSource';
import NearYouSheet from '@/components/home/NearYouSheet';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import type { Pet } from '@/types/api';

/** Greeting switches at these local hours. */
const MORNING_HOUR = 5;
const EVENING_HOUR = 17;
const NIGHT_HOUR = 21;

/** Header profile photo. The greeting row around it is taller than the photo. */
const GREETING_AVATAR = 42;
const PET_SIZE = 72;
const PET_GAP = 16;
const CATEGORY_WIDTH = 126;
const CATEGORY_GAP = 8;
const CATEGORY_INSET = 20;

type RowFit = { item: number; gap: number };

/**
 * Keeps the designed size and gap when the next item already peeks in.
 * When a device width tiles the row flush, tightens the gap (then the item
 * a little) so a sliver of the next item stays on the edge. Snapping to
 * item+gap keeps that same sliver after every swipe.
 */
function peekRow(
  viewport: number,
  item: number,
  gap: number,
  count: number,
  inset = 0,
  minPeek = 24,
): RowFit {
  if (viewport <= 0 || count <= 1) return { item, gap };
  const visibleOf = (index: number, size: number, spacing: number) =>
    viewport - (inset + index * (size + spacing));
  // A clip under ~10% still reads as a full item sitting on the edge.
  const flushHidden = Math.max(8, item * 0.1);
  let partial = 0;
  for (; partial < count; partial += 1) {
    if (visibleOf(partial, item, gap) < item - flushHidden) break;
  }
  if (partial >= count || partial === 0) return { item, gap };
  const peek = visibleOf(partial, item, gap);
  if (peek >= minPeek) return { item, gap };

  const minGap = Math.min(8, gap);
  const minItem = Math.round(item * 0.78);
  const room = viewport - minPeek - inset;
  if (room <= 0) return { item, gap };
  const stride = room / partial;
  const tighterGap = Math.floor(stride - item);
  if (tighterGap >= minGap) return { item, gap: tighterGap };
  const tighterItem = Math.floor(stride - minGap);
  if (tighterItem >= minItem) return { item: tighterItem, gap: minGap };
  return { item, gap };
}

/** Snap points that keep the peek, plus a final stop that shows the last item whole. */
function peekSnapOffsets(
  viewport: number,
  item: number,
  gap: number,
  count: number,
  inset = 0,
  trailing = 0,
): number[] | undefined {
  if (viewport <= 0 || count <= 1) return undefined;
  const stride = item + gap;
  const content = inset + count * item + Math.max(0, count - 1) * gap + trailing;
  const max = Math.max(0, Math.round(content - viewport));
  if (max <= 1) return undefined;
  const offsets = [0];
  for (let index = 1; index < count; index += 1) {
    const offset = index * stride;
    if (offset >= max - 1) break;
    offsets.push(offset);
  }
  if (offsets[offsets.length - 1] !== max) offsets.push(max);
  return offsets;
}

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
  const freshIds = new Set(fresh.map(placeKey));
  const rest = current.filter((item) => !freshIds.has(placeKey(item)));
  return [...fresh, ...rest];
}

const CATEGORY_ART = {
  veterinarian: require('@/assets/images/categories/veterinary.png'),
  groomer: require('@/assets/images/categories/grooming.png'),
  pet_store: require('@/assets/images/categories/shops.png'),
  pharmacy: require('@/assets/images/categories/pharmacy.png'),
  pet_friendly: require('@/assets/images/categories/pet-friendly.png'),
} as const;

const CATEGORIES: { key: keyof typeof CATEGORY_ART; label: string }[] = [
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

export default function DiscoverHomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useTheme();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountName, accountPhotoUrl } = useAuth();
  const { setActivePetId } = useActivePet();
  const petsQuery = usePetsQuery();
  const pets = petsQuery.data ?? [];

  const [coords, setCoords] = useState<HomeCoords | null>(() => {
    if (savedNearby) {
      rememberNearby(savedNearby.coords, null, savedNearby.places, savedNearby.hasMore);
    }
    return savedNearby?.coords ?? null;
  });
  const [places, setPlaces] = useState<BusinessPlace[]>(savedNearby?.places ?? []);
  const [placesLoading, setPlacesLoading] = useState(!(savedNearby?.places.length));
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(savedNearby?.hasMore ?? false);
  const [placesEpoch, setPlacesEpoch] = useState(0);
  const [frameWidth, setFrameWidth] = useState(0);
  const [frameHeight, setFrameHeight] = useState(0);
  const [aboveHeight, setAboveHeight] = useState(0);
  const [nearOpen, setNearOpen] = useState(false);
  const [petsTrack, setPetsTrack] = useState(0);
  const [categoryTrack, setCategoryTrack] = useState(0);
  const [locating, setLocating] = useState(false);
  /** null while the permission check is still running. */
  const [locationOn, setLocationOn] = useState<boolean | null>(savedNearby ? true : null);
  const locatingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(savedNearby?.hasMore ?? false);
  const placesRef = useRef<BusinessPlace[]>(savedNearby?.places ?? []);
  const coordsRef = useRef(coords);
  hasMoreRef.current = hasMore;
  placesRef.current = places;
  coordsRef.current = coords;

  const publishCoords = useCallback((next: HomeCoords) => {
    coordsRef.current = next;
    rememberNearbyCoords(next);
    setCoords((current) => (current && sameSpot(current, next) ? current : next));
    if (placesRef.current.length === 0) setPlacesLoading(true);
  }, []);

  const clearNearby = useCallback(() => {
    savedNearby = null;
    clearNearbyCache();
    placesRef.current = [];
    hasMoreRef.current = false;
    setCoords(null);
    setPlaces([]);
    setHasMore(false);
    setPlacesLoading(false);
  }, []);

  const readPosition = useCallback(async (location: LocationModule) => {
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
  }, [publishCoords]);

  /** Load businesses only when location is already allowed. Never opens a dialog. */
  const refreshGrantedLocation = useCallback(async () => {
    const location = locationModule();
    if (!location) {
      setLocationOn(false);
      setPlacesLoading(false);
      return;
    }
    if (!placesRef.current.length) setPlacesLoading(true);
    const permission = await location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted' || !(await location.hasServicesEnabledAsync())) {
      setLocationOn(false);
      clearNearby();
      return;
    }
    setLocationOn(true);
    await readPosition(location);
    if (!coordsRef.current) setPlacesLoading(false);
  }, [clearNearby, readPosition]);

  useFocusEffect(
    useCallback(() => {
      void petsQuery.refetch();
      if (locatingRef.current) return;
      const before = coordsRef.current;
      void refreshGrantedLocation()
        .catch(() => {
          if (!placesRef.current.length) clearNearby();
        })
        .finally(() => {
          const after = coordsRef.current;
          if (after && before && sameSpot(before, after) && placesRef.current.length) {
            setPlacesEpoch((value) => value + 1);
          }
        });
    }, [petsQuery.refetch, refreshGrantedLocation, clearNearby]),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (next) => {
      if (next !== 'active' || locatingRef.current) return;
      void refreshGrantedLocation().catch(() => {
        if (!placesRef.current.length) clearNearby();
      });
    });
    return () => subscription.remove();
  }, [refreshGrantedLocation, clearNearby]);

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
        rememberNearby(coords, null, merged, more);
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
      const seen = new Set(placesRef.current.map(placeKey));
      const extra = page.items.filter((item) => !seen.has(placeKey(item)));
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
        rememberNearby(here, null, placesRef.current, page.has_more);
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
    if (locatingRef.current) return;
    const location = locationModule();
    if (!location) return;
    locatingRef.current = true;
    setLocating(true);
    try {
      if (Platform.OS === 'android' && !(await location.hasServicesEnabledAsync())) {
        try {
          await location.enableNetworkProviderAsync();
        } catch {
          return;
        }
        if (!(await location.hasServicesEnabledAsync())) return;
      }
      let permission = await location.getForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        permission = await location.requestForegroundPermissionsAsync();
      }
      if (permission.status !== 'granted') {
        setLocationOn(false);
        if (!permission.canAskAgain) {
          await Linking.openSettings();
        }
        return;
      }
      if (!(await location.hasServicesEnabledAsync())) {
        setLocationOn(false);
        if (Platform.OS === 'ios') await Linking.openSettings();
        return;
      }
      setLocationOn(true);
      if (!placesRef.current.length) setPlacesLoading(true);
      await readPosition(location);
      if (!coordsRef.current) setPlacesLoading(false);
    } catch {
      if (!placesRef.current.length) clearNearby();
    } finally {
      locatingRef.current = false;
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

  function openPlace(place: BusinessPlace) {
    router.push({
      pathname: '/business/[id]',
      params: {
        id: place.id,
        locationId: place.location_id ?? '',
        name: place.name,
        image: place.image ?? '',
        category: place.category,
        distance: place.distance_km != null ? String(place.distance_km) : '',
        rating: typeof place.rating === 'number' ? String(place.rating) : '',
        openNow: place.open_now ? '1' : '0',
        open247: place.open_24_7 ? '1' : '0',
        lat: coordsRef.current ? String(coordsRef.current.latitude) : '',
        lng: coordsRef.current ? String(coordsRef.current.longitude) : '',
      },
    } as never);
  }

  const greeting = (
    <View
      style={[styles.greetingBar, { paddingTop: insets.top + 10, paddingBottom: 8 }]}
      pointerEvents={nearOpen ? 'none' : 'auto'}
    >
      <View style={styles.welcomeRow}>
        <View style={styles.greeting}>
          <TouchableOpacity
            style={styles.avatar}
            disabled={nearOpen}
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
        <HeaderIconButton
          disabled={nearOpen}
          onPress={() => router.push('/settings' as never)}
          accessibilityLabel={t('home.settings')}
          style={styles.settingsButton}
        >
          <Settings size={24} color={colors.primaryText} />
        </HeaderIconButton>
      </View>
    </View>
  );

  const petViewport = petsTrack || frameWidth;
  const categoryViewport = categoryTrack || frameWidth;
  const petFit = peekRow(petViewport, PET_SIZE, PET_GAP, 1 + pets.length, CATEGORY_INSET, 22);
  const categoryFit = peekRow(
    categoryViewport,
    CATEGORY_WIDTH,
    CATEGORY_GAP,
    CATEGORIES.length,
    CATEGORY_INSET,
    36,
  );
  const petBox = { width: petFit.item, height: petFit.item };
  const petSnaps = peekSnapOffsets(
    petViewport,
    petFit.item,
    petFit.gap,
    1 + pets.length,
    CATEGORY_INSET,
    CATEGORY_INSET,
  );
  const categorySnaps = peekSnapOffsets(
    categoryViewport,
    categoryFit.item,
    categoryFit.gap,
    CATEGORIES.length,
    CATEGORY_INSET,
    CATEGORY_INSET,
  );

  const homeHeader = (
    <View style={styles.scrollStack}>
      <View style={styles.welcomeCard}>
        <View style={styles.petsBlock}>
          <Text style={[styles.sectionTitle, styles.petTitle]}>{t('home.my_pets')}</Text>
          <View
            style={styles.rowTrack}
            onLayout={(event) => {
              const next = Math.round(event.nativeEvent.layout.width);
              setPetsTrack((current) => (current === next ? current : next));
            }}
          >
          <ScrollView
            horizontal
            nestedScrollEnabled
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToOffsets={petSnaps}
            disableIntervalMomentum
            style={styles.petScroll}
            contentContainerStyle={[styles.petScrollContent, { gap: petFit.gap }]}
          >
            <TouchableOpacity
              style={[styles.petItem, { width: petFit.item }]}
              onPress={() => void addPet()}
            >
              <View
                style={[
                  styles.addPhoto,
                  petBox,
                  isDark ? { backgroundColor: colors.iconChip } : null,
                ]}
              >
                <Plus size={24} color={colors.primaryText} />
              </View>
              <Text style={[styles.petName, { width: petFit.item }]}>{t('home.add')}</Text>
            </TouchableOpacity>
            {pets.map((pet) => (
              <TouchableOpacity
                key={pet.id}
                style={[styles.petItem, { width: petFit.item }]}
                onPress={() => void openPet(pet)}
              >
                <Image
                  source={petPhotoSource(pet)}
                  style={[styles.petPhoto, petBox]}
                  contentFit="cover"
                />
                <Text style={[styles.petName, { width: petFit.item }]} numberOfLines={1}>
                  {pet.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          </View>
        </View>
      </View>

      <View style={styles.categoriesCard}>
        <Text style={[styles.sectionTitle, styles.categoryTitle]}>{t('home.categories')}</Text>
        <View
          style={styles.rowTrack}
          onLayout={(event) => {
            const next = Math.round(event.nativeEvent.layout.width);
            setCategoryTrack((current) => (current === next ? current : next));
          }}
        >
        <ScrollView
          horizontal
          nestedScrollEnabled
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToOffsets={categorySnaps}
          disableIntervalMomentum
          style={styles.petScroll}
          contentContainerStyle={[styles.categoryScroll, { gap: categoryFit.gap }]}
        >
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={[
                styles.categoryCard,
                { width: categoryFit.item },
                isDark ? { backgroundColor: colors.iconChip } : null,
              ]}
              activeOpacity={0.85}
              onPress={() =>
                router.push({
                  pathname: '/business/category/[category]',
                  params: { category: category.key },
                } as never)
              }
            >
              <View style={styles.categoryInner}>
                <Image
                  source={CATEGORY_ART[category.key]}
                  style={styles.categoryArt}
                  contentFit="contain"
                />
                <Text
                  style={styles.categoryLabel}
                  numberOfLines={1}
                  adjustsFontSizeToFit
                  minimumFontScale={0.75}
                >
                  {t(category.label)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
        </View>
      </View>
    </View>
  );

  return (
    <View
      style={styles.screen}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width >= 280 && Math.round(width) !== frameWidth) setFrameWidth(Math.round(width));
        if (height && Math.round(height) !== frameHeight) setFrameHeight(Math.round(height));
      }}
    >
      <View
        style={[
          styles.homeScroll,
          frameWidth ? { width: frameWidth } : null,
        ]}
      >
        {locationOn !== false ? (
          <>
            <View
              style={{ width: frameWidth || '100%' }}
              onLayout={(event) => {
                const next = Math.round(event.nativeEvent.layout.height);
                setAboveHeight((current) => (current === next ? current : next));
              }}
            >
              {greeting}
              <View style={styles.scrollStack}>{homeHeader}</View>
            </View>
            <NearYouSheet
              anchorTop={aboveHeight > 0 ? aboveHeight + 4 : 0}
              topInset={insets.top}
              frameWidth={frameWidth}
              onExpandedChange={setNearOpen}
              frameHeight={frameHeight}
              places={places}
              loading={placesLoading || coords == null}
              loadingMore={loadingMore}
              bottomInset={insets.bottom}
              onLoadMore={() => void loadMore()}
              onPressPlace={openPlace}
            />
          </>
        ) : (
          <ScrollView
            style={styles.placeList}
            contentContainerStyle={[
              styles.locationScroll,
              { width: frameWidth || '100%' },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {greeting}
            <View style={styles.scrollStack}>{homeHeader}</View>
            <View style={[styles.locationCard, { paddingBottom: insets.bottom + 22 }]}>
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
          </ScrollView>
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
      overflow: 'visible',
    },
    greetingBar: {
      width: '100%',
      backgroundColor: colors.surface,
      paddingHorizontal: 20,
    },
    homeScroll: {
      flex: 1,
      width: '100%',
    },
    scrollStack: {
      width: '100%',
      gap: 4,
    },
    welcomeCard: {
      width: '100%',
      backgroundColor: colors.surface,
      borderTopLeftRadius: 0,
      borderTopRightRadius: 0,
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
      paddingTop: 4,
      paddingBottom: 22,
      gap: 22,
      flexShrink: 0,
    },
    welcomeRow: {
      height: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    greeting: {
      flex: 1,
      minWidth: 0,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    greetingCopy: {
      flex: 1,
      gap: 2,
    },
    avatar: {
      width: GREETING_AVATAR,
      height: GREETING_AVATAR,
      borderRadius: 12,
      overflow: 'hidden',
      flexShrink: 0,
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
      flexShrink: 0,
    },
    petsBlock: {
      width: '100%',
      gap: 16,
    },
    sectionTitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: colors.primaryText,
    },
    rowTrack: {
      width: '100%',
    },
    petScroll: {
      width: '100%',
      flexGrow: 0,
    },
    petTitle: {
      marginLeft: 20,
      marginRight: 20,
    },
    petScrollContent: {
      paddingLeft: 20,
      paddingRight: 20,
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
      width: '100%',
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
      marginTop: 4,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
    },
    curtain: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 8,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      overflow: 'hidden',
    },
    curtainList: {
      flex: 1,
      backgroundColor: colors.surface,
    },
    nearHandleHit: {
      alignItems: 'center',
      paddingTop: 8,
      paddingBottom: 12,
    },
    nearHandle: {
      width: 36,
      height: 5,
      borderRadius: 100,
      backgroundColor: colors.border,
    },
    nearBody: {
      backgroundColor: colors.surface,
      paddingBottom: 10,
    },
    skeletonStack: {
      backgroundColor: colors.surface,
      gap: 10,
      paddingBottom: 10,
    },
    nearFooter: {
      flexGrow: 1,
      backgroundColor: colors.surface,
    },
    nearHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
      paddingHorizontal: 20,
      paddingTop: 0,
      marginBottom: 10,
    },
    nearTitle: {
      flex: 1,
    },
    nearEmptyWrap: {
      flexGrow: 1,
      flex: 1,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 20,
      paddingVertical: 28,
    },
    nearEmpty: {
      textAlign: 'center',
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: colors.secondaryText,
    },
    placeList: {
      flex: 1,
      width: '100%',
      alignSelf: 'stretch',
      backgroundColor: colors.background,
    },
    placeListContent: {
      width: '100%',
      alignSelf: 'stretch',
    },
    locationScroll: {
      flexGrow: 1,
    },
    locationCard: {
      flex: 1,
      width: '100%',
      marginTop: 4,
      backgroundColor: colors.surface,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      borderBottomLeftRadius: 0,
      borderBottomRightRadius: 0,
      alignItems: 'center',
    },
    locationHandle: {
      position: 'absolute',
      top: 8,
      left: '50%',
      marginLeft: -18,
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
