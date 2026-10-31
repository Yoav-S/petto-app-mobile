import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Star } from 'lucide-react-native';
import { LIST_CARD_LAST_SHADOW } from '@/constants/layout';
import { type ThemeColors } from '@/constants/theme';
import { useThemedStyles } from '@/context/ThemeContext';
import ListRowPressable from '@/components/ui/ListRowPressable';
import { t } from '@/i18n';
import { placeHoursStatus } from '@/services/placeHours';
import type { BusinessPlace } from '@/services/places';

/** Figma image is 335×278 on a 375-wide screen. The card width follows the device; the height keeps this ratio. */
const BUSINESS_IMAGE_RATIO = 335 / 278;

const CATEGORY_LABEL: Record<BusinessPlace['category'], string> = {
  veterinarian: 'home.category_veterinary',
  groomer: 'home.category_grooming',
  pet_store: 'home.category_shops',
  pharmacy: 'home.category_pharmacies',
  pet_friendly: 'home.category_friendly',
};

export default function PlaceCard({
  place,
  onPress,
  last = false,
}: {
  place: BusinessPlace;
  onPress: () => void;
  last?: boolean;
}) {
  const styles = useThemedStyles(makeStyles);
  const status = placeHoursStatus(place);
  const categories = place.categories?.length ? place.categories : [place.category];

  return (
    <View style={[styles.placeCard, last ? styles.placeCardLast : null]} collapsable={false}>
    <ListRowPressable style={styles.placePress} onPress={onPress}>
      <View style={styles.cardImageWrap}>
        {place.image ? (
          <Image
            source={{ uri: place.image }}
            style={styles.cardImage}
            contentFit="cover"
            recyclingKey={place.image}
            cachePolicy="memory-disk"
          />
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
        <View style={styles.chipRow}>
          {categories.map((category) => (
            <View key={category} style={styles.categoryChip}>
              <Text style={styles.categoryChipText}>{t(CATEGORY_LABEL[category])}</Text>
            </View>
          ))}
        </View>
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
        {status ? (
          <View style={styles.statusRow}>
            <Text style={[styles.statusText, { color: status.color }]} numberOfLines={1}>
              {status.label}
            </Text>
            <View style={[styles.statusDot, { backgroundColor: status.color }]} />
            {status.detail ? (
              <Text style={styles.statusDetail} numberOfLines={2}>
                {status.detail}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.statusRow} />
        )}
      </View>
    </ListRowPressable>
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
    placeCardLast: {
      ...LIST_CARD_LAST_SHADOW,
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
      ...StyleSheet.absoluteFillObject,
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
      minHeight: 76,
      paddingHorizontal: 12,
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
      minHeight: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 6,
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
      minHeight: 16,
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      columnGap: 6,
      rowGap: 2,
    },
    statusText: {
      flexShrink: 0,
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
      flexGrow: 1,
      flexShrink: 1,
      flexBasis: 120,
      minWidth: 0,
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: colors.secondaryText,
      includeFontPadding: false,
    },
  });
}
