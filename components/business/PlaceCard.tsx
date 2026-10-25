import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { BusinessPlace, Weekday } from '@/services/places';

const OPEN_COLOR = '#1EC876';
const MIXED_COLOR = '#F59E0B';
const CLOSED_COLOR = '#EF4444';
/** Figma image is 335×278 on a 375-wide screen. The card width follows the device; the height keeps this ratio. */
const BUSINESS_IMAGE_RATIO = 335 / 278;

const CATEGORY_LABEL: Record<BusinessPlace['category'], string> = {
  veterinarian: 'home.category_veterinary',
  groomer: 'home.category_grooming',
  pet_store: 'home.category_shops',
  pharmacy: 'home.category_pharmacies',
  pet_friendly: 'home.category_friendly',
};

const DAY_LABEL: Record<Weekday, string> = {
  mon: 'home.day_mon',
  tue: 'home.day_tue',
  wed: 'home.day_wed',
  thu: 'home.day_thu',
  fri: 'home.day_fri',
  sat: 'home.day_sat',
  sun: 'home.day_sun',
};

function clockLabel(value: string): string {
  const match = /^0?(\d+):(\d{2})$/.exec(value);
  if (!match) return value;
  return `${Number(match[1])}:${match[2]}`;
}

function opensDetail(place: BusinessPlace): string | null {
  const when = place.opens_at ? clockLabel(place.opens_at) : null;
  if (!when) return null;
  if (place.next_open_day) {
    return `${t('home.opens')} ${t(DAY_LABEL[place.next_open_day])} ${when}`;
  }
  return `${t('home.opens')} ${when}`;
}

/** Open, some services closed, Closed + Opens 9:30, or Opens Sunday 9:30. */
function placeStatus(place: BusinessPlace): { color: string; label: string; detail: string | null } | null {
  if (typeof place.open_now !== 'boolean') return null;
  if (place.some_services_closed) {
    return { color: MIXED_COLOR, label: t('home.some_services_closed'), detail: null };
  }
  if (place.open_now) {
    return { color: OPEN_COLOR, label: t('home.open'), detail: null };
  }
  return {
    color: CLOSED_COLOR,
    label: t('home.closed'),
    detail: opensDetail(place),
  };
}

export default function PlaceCard({
  place,
  onPress,
}: {
  place: BusinessPlace;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const status = placeStatus(place);
  const categories = place.categories?.length ? place.categories : [place.category];

  return (
    <View style={styles.placeCard} collapsable={false}>
    <TouchableOpacity style={styles.placePress} activeOpacity={0.9} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        {place.image ? (
          <Image source={{ uri: place.image }} style={styles.cardImage} contentFit="cover" />
        ) : (
          <View style={styles.cardImagePlaceholder}>
            <Image
              source={require('@/assets/images/business-photo-placeholder.png')}
              style={styles.cardImageIcon}
              contentFit="contain"
            />
          </View>
        )}
        {place.distance_km != null ? (
          <View style={styles.distanceSlot} pointerEvents="none">
            <View style={styles.distanceBadge}>
              {place.image ? (
                <Image
                  source={{ uri: place.image }}
                  style={styles.distanceBlur}
                  contentFit="cover"
                  blurRadius={40}
                />
              ) : null}
              <View style={styles.distanceTint} />
              <MapPin size={24} color="#1F2937" />
              <Text style={styles.distanceText} numberOfLines={1}>
                {`${place.distance_km} km`}
              </Text>
            </View>
          </View>
        ) : null}
      </View>
      <View style={styles.item}>
        <View style={styles.nameAndRate}>
          <View style={styles.titleRow}>
            <Text style={styles.placeName} numberOfLines={1}>
              {place.name}
            </Text>
            {typeof place.rating === 'number' ? (
              <View style={styles.ratingChip}>
                <Star size={12} color="#F6F7F9" fill="#F6F7F9" />
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
          <View style={styles.chipRow}>
            {categories.map((category) => (
              <View key={category} style={styles.categoryChip}>
                <Text style={styles.categoryChipText}>{t(CATEGORY_LABEL[category])}</Text>
              </View>
            ))}
          </View>
        </View>
        {status ? (
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
              {status.label}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            {status.detail ? (
              <Text style={styles.statusDetail} numberOfLines={1}>
                {status.detail}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.statusRow} />
        )}
      </View>
    </TouchableOpacity>
    </View>
  );
}

function makeStyles(colors: ThemeColors) {
  return StyleSheet.create({
    placeCard: {
      width: '100%',
      alignSelf: 'stretch',
      borderRadius: 24,
      backgroundColor: colors.iconChip,
      shadowColor: '#2D2D2A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 20,
      boxShadow: '0px 4px 20px rgba(45, 45, 42, 0.080)',
      elevation: 4,
    },
    placePress: {
      width: '100%',
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.iconChip,
      paddingBottom: 22,
      gap: 16,
    },
    cardImageWrap: {
      width: '100%',
      aspectRatio: BUSINESS_IMAGE_RATIO,
      borderRadius: 24,
      overflow: 'hidden',
      backgroundColor: colors.background,
    },
    cardImage: {
      width: '100%',
      height: '100%',
    },
    cardImagePlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: colors.background,
      alignItems: 'center',
      justifyContent: 'center',
    },
    cardImageIcon: {
      width: 42,
      height: 42,
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
      overflow: 'hidden',
      flexDirection: 'row',
      alignItems: 'center',
      height: 32,
      gap: 4,
      borderRadius: 10,
      paddingTop: 4,
      paddingRight: 10,
      paddingBottom: 4,
      paddingLeft: 8,
      backgroundColor: '#FFFFFF99',
    },
    distanceBlur: {
      position: 'absolute',
      top: -16,
      right: -16,
      width: 360,
      height: 280,
    },
    distanceTint: {
      position: 'absolute',
      top: 0,
      right: 0,
      bottom: 0,
      left: 0,
      backgroundColor: '#FFFFFF99',
    },
    distanceText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: '#1F2937',
      includeFontPadding: false,
    },
    item: {
      width: '100%',
      height: 76,
      paddingHorizontal: 12,
      justifyContent: 'space-between',
    },
    nameAndRate: {
      width: '100%',
      height: 52,
      gap: 8,
    },
    titleRow: {
      width: '100%',
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 8,
    },
    placeName: {
      flex: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: colors.primaryText,
      includeFontPadding: false,
    },
    ratingChip: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 6,
      backgroundColor: '#004741',
      paddingHorizontal: 6,
    },
    ratingText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      color: '#F6F7F9',
      includeFontPadding: false,
    },
    chipRow: {
      height: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      overflow: 'hidden',
    },
    categoryChip: {
      height: 16,
      justifyContent: 'center',
      borderRadius: 6,
      backgroundColor: colors.background,
      paddingHorizontal: 6,
    },
    categoryChipText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      color: colors.secondaryText,
      includeFontPadding: false,
    },
    statusRow: {
      height: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    statusText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      includeFontPadding: false,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusDetail: {
      flexShrink: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: colors.secondaryText,
      includeFontPadding: false,
    },
  });
}
