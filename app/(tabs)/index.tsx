import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { requireOptionalNativeModule } from 'expo-modules-core';
import { Plus, Settings } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';
import { t } from '@/i18n';
import { usePetsQuery } from '@/hooks/useCachedQueries';
import { useActivePet } from '@/store/petStore';
import { guardAddPet, guardSelectPet } from '@/services/subscription';
import { listNearbyBusinesses, type BusinessPlace } from '@/services/places';
import { petPhotoSource } from '@/utils/petPhotoSource';
import type { Pet } from '@/types/api';

/** Greeting switches at these local hours. */
const MORNING_HOUR = 5;
const EVENING_HOUR = 17;
const NIGHT_HOUR = 21;

const PET_SIZE = 72;
const PET_GAP = 16;
const PET_SCROLL_WIDTH = PET_SIZE * 2 + PET_GAP;

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

function categoryLabel(category: BusinessPlace['category']): string {
  const match = CATEGORIES.find((item) => item.key === category);
  return match ? t(match.label) : category;
}

export default function DiscoverHomeScreen() {
  const styles = useThemedStyles(makeStyles);
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { accountName } = useAuth();
  const { setActivePetId } = useActivePet();
  const petsQuery = usePetsQuery();
  const pets = petsQuery.data ?? [];

  const [coords, setCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [places, setPlaces] = useState<BusinessPlace[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const askedOnLoad = useRef(false);

  const readLocation = useCallback(async () => {
    const location = locationModule();
    if (!location) return;
    const position = await location.getCurrentPositionAsync({
      accuracy: location.Accuracy.Balanced,
    });
    setCoords({
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    });
  }, []);

  const resolveLocation = useCallback(async (ask: boolean) => {
    const location = locationModule();
    if (!location) return;
    let permission = await location.getForegroundPermissionsAsync();
    if (permission.status !== 'granted') {
      if (!ask) {
        setCoords(null);
        return;
      }
      if (!permission.canAskAgain) {
        await Linking.openSettings();
        return;
      }
      permission = await location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        setCoords(null);
        return;
      }
    }
    const servicesOn = await location.hasServicesEnabledAsync();
    if (!servicesOn && ask && Platform.OS === 'android') {
      try {
        await location.enableNetworkProviderAsync();
      } catch {
        setCoords(null);
        return;
      }
    }
    if (!(await location.hasServicesEnabledAsync())) {
      setCoords(null);
      return;
    }
    await readLocation();
  }, [readLocation]);

  useFocusEffect(
    useCallback(() => {
      void petsQuery.refetch();
      const ask = !askedOnLoad.current;
      askedOnLoad.current = true;
      void resolveLocation(ask).catch(() => setCoords(null));
    }, [petsQuery.refetch, resolveLocation]),
  );

  useEffect(() => {
    if (!coords) return;
    let cancelled = false;
    setPlacesLoading(true);
    listNearbyBusinesses(coords.latitude, coords.longitude)
      .then((rows) => {
        if (!cancelled) setPlaces(rows);
      })
      .catch(() => {
        if (!cancelled) setPlaces([]);
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [coords]);

  async function enableLocation() {
    if (locating) return;
    setLocating(true);
    try {
      await resolveLocation(true);
    } catch {
      setCoords(null);
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

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.page}
      >
        <View style={[styles.welcomeCard, { paddingTop: insets.top + 10 }]}>
          <View style={styles.welcomeRow}>
            <View style={styles.greeting}>
              <Text style={styles.greetingLine}>{t(greetingKey())}</Text>
              {accountName ? (
                <Text style={styles.nameLine} numberOfLines={1}>
                  {`${accountName} !`}
                </Text>
              ) : null}
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

        {coords ? (
          <View style={styles.nearSection}>
            <View style={styles.nearHeader}>
              <Text style={styles.sectionTitle}>{t('home.near_you')}</Text>
              <Text style={styles.seeAll}>{t('home.see_all')}</Text>
            </View>
            <View style={styles.nearCard}>
              {placesLoading ? (
                <ActivityIndicator color={colors.brand} style={styles.nearStatus} />
              ) : places.length === 0 ? (
                <Text style={styles.nearEmpty}>{t('home.near_empty')}</Text>
              ) : (
                places.map((place) => (
                  <View key={place.id} style={styles.placeRow}>
                    <View style={styles.placeText}>
                      <Text style={styles.placeName} numberOfLines={1}>
                        {place.name}
                      </Text>
                      <Text style={styles.placeMeta} numberOfLines={1}>
                        {place.distance_km != null
                          ? `${categoryLabel(place.category)} · ${place.distance_km} km`
                          : categoryLabel(place.category)}
                      </Text>
                    </View>
                    {place.image ? (
                      <Image source={{ uri: place.image }} style={styles.placeImage} contentFit="cover" />
                    ) : (
                      <View style={styles.placeImage} />
                    )}
                  </View>
                ))
              )}
            </View>
          </View>
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
      </ScrollView>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: colors.background,
    },
    page: {
      flexGrow: 1,
      gap: 4,
    },
    welcomeCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingHorizontal: 20,
      paddingBottom: 22,
      gap: 22,
    },
    welcomeRow: {
      minHeight: 46,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    greeting: {
      flex: 1,
      gap: 2,
      paddingRight: 12,
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
    nearSection: {
      paddingHorizontal: 20,
      gap: 16,
      paddingTop: 12,
    },
    nearHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    seeAll: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: colors.primaryText,
    },
    nearCard: {
      backgroundColor: colors.surface,
      borderRadius: 24,
      paddingBottom: 12,
      paddingTop: 8,
      gap: 10,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      elevation: 4,
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
    placeRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      paddingHorizontal: 16,
      paddingVertical: 8,
    },
    placeText: {
      flex: 1,
      gap: 4,
    },
    placeName: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: colors.primaryText,
    },
    placeMeta: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 18,
      color: colors.secondaryText,
    },
    placeImage: {
      width: 64,
      height: 64,
      borderRadius: 16,
      backgroundColor: colors.background,
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
