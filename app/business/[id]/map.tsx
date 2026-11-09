import { useCallback, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Send } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/context/ThemeContext';
import { useToast } from '@/context/ToastContext';
import SettingsHeader from '@/components/settings/SettingsHeader';
import BranchMap, { pinsFromLocations, type BranchMapPin } from '@/components/business/BranchMap';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { formatKm } from '@/utils/localeFormat';
import { openSystemDirections } from '@/services/systemApps';
import {
  getPlace,
  readLastNearbyCoords,
  trackPlaceEvent,
  type BusinessPlaceDetail,
  type PlaceLocation,
} from '@/services/places';

function userCoords(
  latParam?: string,
  lngParam?: string,
): { latitude: number; longitude: number } | undefined {
  const here = readLastNearbyCoords();
  if (here) return here;
  const lat = Number(latParam);
  const lng = Number(lngParam);
  if (Number.isFinite(lat) && Number.isFinite(lng) && latParam && lngParam) {
    return { latitude: lat, longitude: lng };
  }
  return undefined;
}

function addressText(address: string, city: string): string {
  const line = address.trim();
  const town = city.trim();
  if (town && line && !line.toLowerCase().includes(town.toLowerCase())) {
    return `${line}\n${town}`;
  }
  return line || town;
}

export default function BusinessMapScreen() {
  const params = useLocalSearchParams<{
    id: string;
    locationId?: string;
    name?: string;
    lat?: string;
    lng?: string;
  }>();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const [place, setPlace] = useState<BusinessPlaceDetail | null>(null);
  const [selectedId, setSelectedId] = useState(params.locationId || '');

  useFocusEffect(
    useCallback(() => {
      const id = params.id;
      if (!id) return;
      const coords = userCoords(params.lat, params.lng);
      let active = true;
      getPlace(id, coords)
        .then((detail) => {
          if (active) setPlace(detail);
        })
        .catch((err) => {
          if (active) toast.showError(getErrorMessage(err));
        });
      return () => {
        active = false;
      };
    }, [params.id, params.lat, params.lng, toast]),
  );

  const locations: PlaceLocation[] = useMemo(() => {
    const branches = place?.locations ?? [];
    if (branches.length) return branches;
    if (!place) return [];
    return [{
      id: place.id,
      address: place.address,
      city: place.city,
      opening_hours: place.opening_hours,
      phone: [],
      call_phone: place.phone ?? [],
      shared_phone: true,
      location: place.location,
      distance_km: place.distance_km,
    }];
  }, [place]);

  const pins = useMemo(
    () => pinsFromLocations(locations, place?.category ?? 'veterinarian'),
    [locations, place?.category],
  );
  const selected = pins.find((pin) => pin.id === selectedId) ?? pins[0] ?? null;

  const onPressPin = (pin: BranchMapPin) => {
    setSelectedId(pin.id);
  };

  const onDirections = () => {
    if (!selected) return;
    if (place?.id) {
      trackPlaceEvent(place.id, selected.id, 'directions');
    }
    void openSystemDirections(selected.branch);
  };

  return (
    <View style={styles.screen}>
      <SettingsHeader title={t('business.map')} rounded />
      {!place ? (
        <ActivityIndicator color={colors.brand} style={styles.loader} />
      ) : (
        <>
          <View style={styles.map}>
            <BranchMap
              pins={pins}
              selectedId={selected?.id}
              interactive
              onPressPin={onPressPin}
            />
          </View>
          {selected ? (
            <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
              <View style={styles.sheetCopy}>
                {typeof selected.branch.distance_km === 'number' ? (
                  <Text style={styles.distance}>{formatKm(selected.branch.distance_km)}</Text>
                ) : null}
                <Text style={styles.address}>
                  {addressText(selected.branch.address, selected.branch.city)}
                </Text>
              </View>
              <TouchableOpacity
                style={styles.directions}
                onPress={onDirections}
                accessibilityRole="button"
              >
                <Send size={20} color={colors.primaryText} />
                <Text style={styles.directionsLabel}>{t('business.directions')}</Text>
              </TouchableOpacity>
            </View>
          ) : null}
        </>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    loader: {
      marginTop: 24,
    },
    map: {
      flex: 1,
      marginTop: 4,
      marginBottom: 4,
      borderRadius: 24,
      overflow: 'hidden',
    },
    sheet: {
      paddingTop: 12,
      paddingHorizontal: 20,
      gap: 12,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: c.surface,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 15 / 255,
      shadowRadius: 8,
      boxShadow: '0px -1px 8px rgba(30, 30, 30, 0.059)',
      elevation: 8,
    },
    sheetCopy: {
      gap: 4,
    },
    distance: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: c.primaryText,
    },
    address: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    directions: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    directionsLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
  });
