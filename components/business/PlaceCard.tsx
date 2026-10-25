import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import { t } from '@/i18n';
import type { BusinessPlace, Weekday } from '@/services/places';

const OPEN_COLOR = '#1EC876';
const CLOSED_COLOR = '#EF4444';
/** Figma image is 335×278 on a 375-wide screen. The card width follows the device; the height keeps this ratio. */
const BUSINESS_IMAGE_RATIO = 335 / 278;

const DAY_LABEL: Record<Weekday, string> = {
  mon: 'home.day_mon',
  tue: 'home.day_tue',
  wed: 'home.day_wed',
  thu: 'home.day_thu',
  fri: 'home.day_fri',
  sat: 'home.day_sat',
  sun: 'home.day_sun',
};

const CATEGORY_LABEL: Record<BusinessPlace['category'], string> = {
  veterinarian: 'home.category_veterinary',
  groomer: 'home.category_grooming',
  pet_store: 'home.category_shops',
  pharmacy: 'home.category_pharmacies',
  pet_friendly: 'home.category_friendly',
};

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

export default function PlaceCard({
  place,
  onPress,
}: {
  place: BusinessPlace;
  onPress: () => void;
}) {
  const styles = useThemedStyles(makeStyles);
  const status = placeStatus(place);
  const statusColor = status ? (status.open ? OPEN_COLOR : CLOSED_COLOR) : CLOSED_COLOR;
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
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardMeta}>
            <View style={styles.chipRow}>
              {categories.map((category) => (
                <View key={category} style={styles.categoryChip}>
                  <Text style={styles.categoryChipText}>{t(CATEGORY_LABEL[category])}</Text>
                </View>
              ))}
            </View>
            {typeof place.rating === 'number' ? (
              <View style={styles.ratingChip}>
                <Star size={12} color="#F6F7F9" fill="#F6F7F9" />
                <Text style={styles.ratingText}>{place.rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.placeName} numberOfLines={1}>
            {place.name}
          </Text>
          {place.address ? (
            <Text style={styles.metaLine} numberOfLines={1}>
              {place.address}
            </Text>
          ) : null}
          {(place.location_count ?? 1) > 1 ? (
            <Text style={styles.metaLine}>
              {`${place.location_count} ${t('business.locations')}`}
            </Text>
          ) : null}
        </View>
        {status ? (
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: statusColor }]}>
              {status.open ? t('home.open') : t('home.closed')}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            {status.detail ? <Text style={styles.statusDetail}>{status.detail}</Text> : null}
          </View>
        ) : null}
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
    cardBody: {
      paddingHorizontal: 12,
      gap: 8,
    },
    cardTop: {
      gap: 4,
    },
    cardMeta: {
      minHeight: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 10,
    },
    chipRow: {
      flex: 1,
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: 12,
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
    metaLine: {
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
  });
}
