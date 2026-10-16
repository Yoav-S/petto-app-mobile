import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
  Animated,
  PanResponder,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Plus, Settings, User } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/i18n';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { useActivePet } from '@/store/petStore';
import { guardAddPet, guardSelectPet } from '@/services/subscription';
import {
  clearNearbyCache,
  listPlaces,
  rememberNearby,
  rememberNearbyCoords,
  type BusinessPlace,
} from '@/services/places';
import { petPhotoSource } from '@/utils/petPhotoSource';
import PlaceCard from '@/components/business/PlaceCard';
import { PlaceCardSkeletons } from '@/components/business/PlaceCardSkeleton';
import type { Pet } from '@/types/api';

/** Greeting switches at these local hours. */
const MORNING_HOUR = 5;
const EVENING_HOUR = 17;
const NIGHT_HOUR = 21;

/** Header profile photo. The greeting row around it is taller than the photo. */
const GREETING_AVATAR = 42;
const PET_SIZE = 72;
const PET_GAP = 16;
const PET_STRIDE = PET_SIZE + PET_GAP;
/** Visible sliver of the next pet when it would otherwise be cut in half. */
const PET_PEEK = 4;
const PAGE_END_PX = 480;

function petClipWidth(viewport: number, itemCount: number): number {
  if (viewport <= 0 || itemCount <= 1) return viewport;
  let full = 0;
  while ((full + 1) * PET_STRIDE - PET_GAP <= viewport) full += 1;
  if (full >= itemCount) return viewport;
  const nextStart = full * PET_STRIDE;
  if (nextStart >= viewport) return viewport;
  const peekEnd = nextStart + PET_PEEK;
  return peekEnd <= viewport ? peekEnd : nextStart;
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
  const freshIds = new Set(fresh.map((item) => item.id));
  const rest = current.filter((item) => !freshIds.has(item.id));
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
  const [placesLoading, setPlacesLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(savedNearby?.hasMore ?? false);
  const [placesEpoch, setPlacesEpoch] = useState(0);
  const [frameWidth, setFrameWidth] = useState(0);
  const [homeListHeight, setHomeListHeight] = useState(0);
  const [homeHeaderHeight, setHomeHeaderHeight] = useState(0);
  const [petsTrack, setPetsTrack] = useState(0);
  const [curtainOn, setCurtainOn] = useState(false);
  const [curtainFull, setCurtainFull] = useState(false);
  const [locating, setLocating] = useState(false);
  const screenRef = useRef<View>(null);
  const nearAnchorRef = useRef<View>(null);
  const curtainTop = useRef(new Animated.Value(0)).current;
  const curtainTopRef = useRef(0);
  const dragOriginRef = useRef(0);
  const gestureDyRef = useRef(0);
  const draggingRef = useRef(false);
  const curtainOnRef = useRef(false);
  const frameHeightRef = useRef(0);
  const insetsTopRef = useRef(insets.top);
  insetsTopRef.current = insets.top;
  useEffect(() => {
    const id = curtainTop.addListener(({ value }) => {
      curtainTopRef.current = value;
    });
    return () => curtainTop.removeListener(id);
  }, [curtainTop]);
  const applyCurtain = useCallback((origin: number, dy: number) => {
    const min = insetsTopRef.current;
    const next = Math.min(Math.max(min, origin + dy), Math.max(min, frameHeightRef.current));
    curtainTop.setValue(next);
    curtainTopRef.current = next;
  }, [curtainTop]);
  const closeCurtain = useCallback(() => {
    curtainOnRef.current = false;
    setCurtainOn(false);
    setCurtainFull(false);
  }, []);
  const nearPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, gesture) => {
        const vertical = Math.abs(gesture.dy) > Math.abs(gesture.dx) && Math.abs(gesture.dy) > 8;
        if (!vertical) return false;
        return curtainOnRef.current ? gesture.dy > 0 : gesture.dy < 0;
      },
      onPanResponderGrant: () => {
        gestureDyRef.current = 0;
        draggingRef.current = true;
        curtainTop.stopAnimation();
        setCurtainFull(false);
        if (curtainOnRef.current) {
          dragOriginRef.current = curtainTopRef.current;
          return;
        }
        const anchor = nearAnchorRef.current;
        const screen = screenRef.current;
        if (!anchor || !screen) return;
        screen.measureInWindow((_sx, screenY) => {
          anchor.measureInWindow((_ax, anchorY) => {
            if (!draggingRef.current && !curtainOnRef.current) return;
            const start = Math.max(insetsTopRef.current, anchorY - screenY);
            dragOriginRef.current = start;
            if (!curtainOnRef.current) {
              curtainOnRef.current = true;
              setCurtainOn(true);
            }
            if (draggingRef.current) applyCurtain(start, gestureDyRef.current);
          });
        });
      },
      onPanResponderMove: (_, gesture) => {
        gestureDyRef.current = gesture.dy;
        if (!curtainOnRef.current) return;
        applyCurtain(dragOriginRef.current, gesture.dy);
      },
      onPanResponderRelease: (_, gesture) => {
        draggingRef.current = false;
        if (!curtainOnRef.current) return;
        const min = insetsTopRef.current;
        const origin = dragOriginRef.current;
        const current = Math.min(Math.max(min, origin + gesture.dy), Math.max(min, frameHeightRef.current));
        const open = gesture.vy < -0.35 || current < (origin + min) / 2;
        if (open) {
          setCurtainFull(true);
          Animated.spring(curtainTop, {
            toValue: min,
            useNativeDriver: false,
            friction: 9,
            tension: 70,
          }).start();
        } else {
          Animated.timing(curtainTop, {
            toValue: origin,
            duration: 180,
            useNativeDriver: false,
          }).start(({ finished }) => {
            if (finished) closeCurtain();
          });
        }
      },
    }),
  ).current;
  const locatingRef = useRef(false);
  const loadingMoreRef = useRef(false);
  const hasMoreRef = useRef(savedNearby?.hasMore ?? false);
  const placesRef = useRef<BusinessPlace[]>(savedNearby?.places ?? []);
  const coordsRef = useRef(coords);
  hasMoreRef.current = hasMore;
  placesRef.current = places;
  coordsRef.current = coords;

  const publishCoords = useCallback((next: HomeCoords) => {
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
    if (!location) return;
    const permission = await location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted' || !(await location.hasServicesEnabledAsync())) {
      clearNearby();
      return;
    }
    await readPosition(location);
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
        if (!permission.canAskAgain) {
          await Linking.openSettings();
        }
        return;
      }
      if (!(await location.hasServicesEnabledAsync())) {
        if (Platform.OS === 'ios') await Linking.openSettings();
        return;
      }
      await readPosition(location);
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
    <View style={[styles.greetingBar, { paddingTop: insets.top + 10, paddingBottom: 8 }]}>
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
          <Settings size={24} color={colors.primaryText} />
        </TouchableOpacity>
      </View>
    </View>
  );

  const homeHeader = (
    <View style={styles.scrollStack}>
      <View style={styles.welcomeCard}>
        <View style={styles.petsBlock}>
          <Text style={styles.sectionTitle}>{t('home.my_pets')}</Text>
          <View
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
            snapToInterval={PET_STRIDE}
            snapToAlignment="start"
            disableIntervalMomentum
            style={[
              styles.petScroll,
              petsTrack > 0 ? { width: petClipWidth(petsTrack, 1 + pets.length) } : null,
            ]}
            contentContainerStyle={styles.petScrollContent}
          >
            <TouchableOpacity style={styles.petItem} onPress={() => void addPet()}>
              <View style={styles.addPhoto}>
                <Plus size={24} color={colors.primaryText} />
              </View>
              <Text style={styles.petName}>{t('home.add')}</Text>
            </TouchableOpacity>
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
          {CATEGORIES.map((category) => (
            <TouchableOpacity
              key={category.key}
              style={styles.categoryCard}
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
  );

  return (
    <View
      ref={screenRef}
      style={styles.screen}
      onLayout={(event) => {
        const { width, height } = event.nativeEvent.layout;
        if (width && width !== frameWidth) setFrameWidth(width);
        if (height) frameHeightRef.current = height;
      }}
    >
      <View
        style={[
          styles.homeScroll,
          frameWidth ? { width: frameWidth } : null,
        ]}
      >
        {coords ? (
          <FlatList
            style={styles.placeList}
            onLayout={(event) => {
              const next = Math.round(event.nativeEvent.layout.height);
              setHomeListHeight((current) => (current === next ? current : next));
            }}
            data={placesLoading ? [] : places}
            keyExtractor={(place) => place.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={!curtainOn}
            contentContainerStyle={[
              styles.placeListContent,
              { width: frameWidth || '100%', flexGrow: 1 },
            ]}
            scrollEventThrottle={16}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const distance = contentSize.height - layoutMeasurement.height - contentOffset.y;
              if (distance < PAGE_END_PX) void loadMore();
            }}
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.8}
            ListHeaderComponent={
              <View
                onLayout={(event) => {
                  const next = Math.round(event.nativeEvent.layout.height);
                  setHomeHeaderHeight((current) => (current === next ? current : next));
                }}
              >
                {greeting}
                <View style={styles.scrollStack}>{homeHeader}</View>
                <View ref={nearAnchorRef} collapsable={false} style={styles.nearSheet}>
                  <View style={styles.nearHandleHit} {...nearPan.panHandlers}>
                    <View style={styles.nearHandle} />
                  </View>
                  <View style={styles.nearHeader}>
                    <Text style={[styles.sectionTitle, styles.nearTitle]} numberOfLines={1}>
                      {t('home.near_you')}
                    </Text>
                  </View>
                </View>
              </View>
            }
            ListEmptyComponent={
              placesLoading ? (
                <View style={styles.skeletonStack}>
                  <PlaceCardSkeletons />
                </View>
              ) : (
                <View
                  style={[
                    styles.nearEmptyWrap,
                    { height: Math.max(160, homeListHeight - homeHeaderHeight) },
                  ]}
                >
                  <Text style={styles.nearEmpty}>{t('home.near_empty')}</Text>
                </View>
              )
            }
            ListFooterComponent={
              placesLoading || places.length > 0 ? (
                <View style={{ paddingBottom: insets.bottom + 22 }}>
                  {loadingMore ? <PlaceCardSkeletons count={1} /> : null}
                </View>
              ) : null
            }
            ListFooterComponentStyle={
              placesLoading || places.length > 0 ? styles.nearFooter : undefined
            }
            renderItem={({ item: place }) => (
              <View style={styles.nearBody}>
                <PlaceCard place={place} onPress={() => openPlace(place)} />
              </View>
            )}
          />
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
      {coords && curtainOn ? (
        <Animated.View style={[styles.curtain, { top: curtainTop }]}>
          <View style={styles.nearHandleHit} {...nearPan.panHandlers}>
            <View style={styles.nearHandle} />
          </View>
          <View style={styles.nearHeader}>
            <Text style={[styles.sectionTitle, styles.nearTitle]} numberOfLines={1}>
              {t('home.near_you')}
            </Text>
          </View>
          <FlatList
            style={styles.curtainList}
            data={placesLoading ? [] : places}
            keyExtractor={(place) => place.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={curtainFull}
            contentContainerStyle={[styles.placeListContent, { flexGrow: 1 }]}
            scrollEventThrottle={16}
            onScroll={(event) => {
              const { contentOffset, contentSize, layoutMeasurement } = event.nativeEvent;
              const distance = contentSize.height - layoutMeasurement.height - contentOffset.y;
              if (distance < PAGE_END_PX) void loadMore();
            }}
            onEndReached={() => void loadMore()}
            onEndReachedThreshold={0.8}
            ListEmptyComponent={
              placesLoading ? (
                <View style={styles.skeletonStack}>
                  <PlaceCardSkeletons />
                </View>
              ) : (
                <View style={styles.nearEmptyWrap}>
                  <Text style={styles.nearEmpty}>{t('home.near_empty')}</Text>
                </View>
              )
            }
            ListFooterComponent={
              placesLoading || places.length > 0 ? (
                <View style={{ paddingBottom: insets.bottom + 22 }}>
                  {loadingMore ? <PlaceCardSkeletons count={1} /> : null}
                </View>
              ) : null
            }
            ListFooterComponentStyle={
              placesLoading || places.length > 0 ? styles.nearFooter : undefined
            }
            renderItem={({ item: place }) => (
              <View style={styles.nearBody}>
                <PlaceCard place={place} onPress={() => openPlace(place)} />
              </View>
            )}
          />
        </Animated.View>
      ) : null}
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
      paddingHorizontal: 20,
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
      width: 32,
      height: 32,
      borderRadius: 10,
      flexShrink: 0,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 20 / 255,
      shadowRadius: 20,
      boxShadow: '0px 4px 20px rgba(45, 45, 42, 0.078)',
      elevation: 4,
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
    petScroll: {
      alignSelf: 'flex-start',
      maxWidth: '100%',
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
