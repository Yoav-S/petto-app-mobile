import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, MapPin, Phone, Send, Star } from 'lucide-react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { DESIGN_COVER_HEIGHT, PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles, useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useImageStatusBarStyle } from '@/hooks/useImageStatusBarStyle';
import { useStatusBarOverride } from '@/context/SystemBarsContext';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import { useToast } from '@/context/ToastContext';
import {
  getPlace,
  type BusinessCategory,
  type BusinessPlaceDetail,
  type OpeningHours,
  type Weekday,
} from '@/services/places';

const WEEK: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];
const DAY_KEY: Record<Weekday, string> = {
  mon: 'business.day_mon',
  tue: 'business.day_tue',
  wed: 'business.day_wed',
  thu: 'business.day_thu',
  fri: 'business.day_fri',
  sat: 'business.day_sat',
  sun: 'business.day_sun',
};
const CATEGORY_KEY: Record<BusinessCategory, string> = {
  veterinarian: 'home.category_veterinary',
  groomer: 'home.category_grooming',
  pharmacy: 'home.category_pharmacies',
  pet_friendly: 'home.category_friendly',
  pet_store: 'home.category_shops',
};
const OPEN_COLOR = '#1EC876';
const CLOSED_COLOR = '#EF4444';

function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return '';
  const minutes = Math.max(0, Math.round((Date.now() - then) / 60000));
  if (minutes < 1) return t('business.just_now');
  if (minutes < 60) {
    return `${minutes} ${t(minutes === 1 ? 'business.minute_ago' : 'business.minutes_ago')}`;
  }
  const hours = Math.round(minutes / 60);
  if (hours < 24) {
    return `${hours} ${t(hours === 1 ? 'business.hour_ago' : 'business.hours_ago')}`;
  }
  const days = Math.round(hours / 24);
  return `${days} ${t(days === 1 ? 'business.day_ago' : 'business.days_ago')}`;
}

function dayHours(hours: OpeningHours | undefined, day: Weekday): string {
  if (!hours) return t('home.closed');
  if (hours.always_open) return '00:00 – 24:00';
  const slots = hours[day] ?? [];
  if (!slots.length) return t('home.closed');
  return slots.map((slot) => `${slot.open} – ${slot.close}`).join(', ');
}

function addressText(address: string, city: string): string {
  const line = address.trim();
  const town = city.trim();
  if (town && line && !line.toLowerCase().includes(town.toLowerCase())) {
    return `${line}\n${town}`;
  }
  return line || town;
}

function openUrl(url: string) {
  const target = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  void Linking.openURL(target);
}

function openInstagram(value: string) {
  if (/^https?:\/\//i.test(value)) {
    void Linking.openURL(value);
    return;
  }
  const handle = value.replace(/^@/, '').trim();
  if (handle) void Linking.openURL(`https://instagram.com/${handle}`);
}

function openDirections(place: BusinessPlaceDetail) {
  const point = place.location?.coordinates;
  if (point) {
    const [lng, lat] = point;
    const url =
      Platform.OS === 'ios'
        ? `http://maps.apple.com/?daddr=${lat},${lng}`
        : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    void Linking.openURL(url);
    return;
  }
  const query = encodeURIComponent(addressText(place.address, place.city));
  if (!query) return;
  const url =
    Platform.OS === 'ios'
      ? `http://maps.apple.com/?q=${query}`
      : `https://www.google.com/maps/search/?api=1&query=${query}`;
  void Linking.openURL(url);
}

export default function BusinessScreen() {
  const params = useLocalSearchParams<{
    id: string;
    name?: string;
    image?: string;
    category?: BusinessCategory;
    distance?: string;
    rating?: string;
    openNow?: string;
    open247?: string;
    lat?: string;
    lng?: string;
  }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { isDark } = useTheme();
  const styles = useThemedStyles(makeStyles);
  const toast = useToast();
  const { structuralScale } = useResponsiveLayout();
  const coverHeight = Math.round(DESIGN_COVER_HEIGHT * structuralScale);

  const [place, setPlace] = useState<BusinessPlaceDetail | null>(null);
  const [aboutOpen, setAboutOpen] = useState(false);
  const [footerHeight, setFooterHeight] = useState(104);

  const previewImage = params.image || null;
  const image = place?.image ?? previewImage;
  const coverSource = useMemo(() => ({ uri: image ?? '' }), [image]);
  const imageContrast = useImageStatusBarStyle(coverSource, isDark ? 'light' : 'dark');
  useStatusBarOverride(image ? imageContrast.style : isDark ? 'light' : 'dark');

  useEffect(() => {
    const id = params.id;
    if (!id) return;
    const lat = Number(params.lat);
    const lng = Number(params.lng);
    const coords = Number.isFinite(lat) && Number.isFinite(lng) && params.lat && params.lng
      ? { latitude: lat, longitude: lng }
      : undefined;
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
  }, [params.id, params.lat, params.lng, toast]);

  const name = place?.name || params.name || '';
  const category = place?.category ?? params.category;
  const rating = place?.rating ?? (params.rating ? Number(params.rating) : null);
  const distance = place?.distance_km ?? (params.distance ? Number(params.distance) : null);
  const open = place ? Boolean(place.open_now || place.open_24_7) : params.openNow === '1' || params.open247 === '1';
  const description = place?.description?.trim() ?? '';
  const showReadMore = description.length > 120;
  const reviews = place?.reviews ?? [];
  const phones = place?.phone ?? [];
  const website = place?.website?.trim() ?? '';
  const instagram = place?.instagram?.trim() ?? '';
  const statusColor = open ? OPEN_COLOR : CLOSED_COLOR;

  return (
    <View style={styles.screen}>
      <View style={[styles.cover, { height: coverHeight }]}>
        {image ? (
          <Image source={{ uri: image }} style={styles.coverImage} contentFit="cover" />
        ) : (
          <View style={styles.coverImage} />
        )}
        <View style={[styles.actionBar, { top: insets.top }]}>
          <HeaderIconButton
            onPress={() => router.back()}
            accessibilityLabel={t('petOnboarding.back')}
            style={styles.backButton}
          >
            <MaterialIcons name="chevron-left" size={24} color="#1F2937" />
          </HeaderIconButton>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: coverHeight + 4,
          paddingBottom: footerHeight + 4,
          gap: 4,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <View style={styles.metaRow}>
            <View style={styles.metaLead}>
              {category ? (
                <View style={styles.categoryChip}>
                  <Text style={styles.categoryText}>{t(CATEGORY_KEY[category])}</Text>
                </View>
              ) : null}
              <View style={[styles.statusChip, { backgroundColor: `${statusColor}33` }]}>
                <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                <Text style={[styles.statusLabel, { color: statusColor }]}>
                  {open ? t('home.open') : t('home.closed')}
                </Text>
              </View>
            </View>
            {typeof rating === 'number' && !Number.isNaN(rating) ? (
              <View style={styles.ratingChip}>
                <Star size={12} color="#F6F7F9" fill="#F6F7F9" />
                <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.businessName}>{name}</Text>
          {description ? (
            <View style={styles.aboutBlock}>
              <Text style={styles.aboutTitle}>{t('business.about')}</Text>
              <Text style={styles.aboutBody} numberOfLines={aboutOpen ? undefined : 3}>
                {description}
              </Text>
              {showReadMore ? (
                <TouchableOpacity onPress={() => setAboutOpen((value) => !value)} hitSlop={8}>
                  <Text style={styles.readMore}>
                    {aboutOpen ? t('business.read_less') : t('business.read_more')}
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          ) : null}
        </View>

        <View style={styles.card}>
          {reviews.length === 0 ? (
            <View style={styles.reviewsEmpty}>
              <View style={styles.reviewsEmptyCopy}>
                <Text style={styles.reviewsEmptyTitle}>{t('home.no_reviews')}</Text>
                <Text style={styles.reviewsEmptyBody}>{t('business.reviews_empty_body')}</Text>
              </View>
              <View style={styles.writeButton}>
                <Text style={styles.writeLabel}>{t('business.write_review')}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.reviewsFilled}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{t('business.reviews')}</Text>
                <View style={styles.seeAll}>
                  <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
                  <ChevronRight size={16} color={colors.primaryText} />
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.reviewRow}
              >
                {reviews.map((review) => (
                  <View key={review.id} style={styles.reviewCard}>
                    <View style={styles.reviewHead}>
                      {review.author_photo ? (
                        <Image
                          source={{ uri: review.author_photo }}
                          style={styles.reviewAvatar}
                          contentFit="cover"
                        />
                      ) : (
                        <View style={styles.reviewAvatar} />
                      )}
                      <View style={styles.reviewIdentity}>
                        <Text style={styles.reviewName} numberOfLines={1}>
                          {review.author_name || t('business.pet_parent')}
                        </Text>
                        <Text style={styles.reviewDate}>{relativeTime(review.created_at)}</Text>
                      </View>
                      <View style={styles.ratingChip}>
                        <Star size={12} color="#F6F7F9" fill="#F6F7F9" />
                        <Text style={styles.ratingText}>{review.rating.toFixed(1)}</Text>
                      </View>
                    </View>
                    {review.comment ? (
                      <Text style={styles.reviewBody} numberOfLines={3}>
                        {review.comment}
                      </Text>
                    ) : null}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHead}>
            <Text style={styles.sectionTitle}>{t('business.address')}</Text>
            {typeof distance === 'number' && !Number.isNaN(distance) ? (
              <View style={styles.distanceChip}>
                <MapPin size={24} color={colors.primaryText} />
                <Text style={styles.distanceText}>{`${distance} km`}</Text>
              </View>
            ) : null}
          </View>
          <Text style={styles.bodyText}>{addressText(place?.address ?? '', place?.city ?? '')}</Text>
        </View>

        {phones.length || website || instagram ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('business.contact')}</Text>
            <View style={styles.contactList}>
              {phones.map((phone) => (
                <TouchableOpacity key={phone} onPress={() => void Linking.openURL(`tel:${phone}`)}>
                  <Text style={styles.bodyText}>{phone}</Text>
                </TouchableOpacity>
              ))}
              {website ? (
                <TouchableOpacity onPress={() => openUrl(website)}>
                  <Text style={styles.bodyText}>{website}</Text>
                </TouchableOpacity>
              ) : null}
              {instagram ? (
                <TouchableOpacity onPress={() => openInstagram(instagram)}>
                  <Text style={styles.bodyText}>{instagram}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>{t('business.opening_hours')}</Text>
          <View style={styles.hoursList}>
            {WEEK.map((day) => (
              <View key={day} style={styles.hoursRow}>
                <Text style={styles.dayLabel}>{t(DAY_KEY[day])}</Text>
                <Text style={styles.hoursValue}>{dayHours(place?.opening_hours, day)}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      <View
        style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 16) }]}
        onLayout={(event) => setFooterHeight(event.nativeEvent.layout.height)}
      >
        <TouchableOpacity
          style={[styles.callButton, phones.length === 0 && styles.buttonDisabled]}
          disabled={phones.length === 0}
          onPress={() => void Linking.openURL(`tel:${phones[0]}`)}
        >
          <Phone size={20} color="#F6F7F9" />
          <Text style={styles.callLabel}>{t('business.call')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.directionsButton}
          disabled={!place}
          onPress={() => place && openDirections(place)}
        >
          <Send size={20} color={colors.primaryText} />
          <Text style={styles.directionsLabel}>{t('business.directions')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    screen: {
      flex: 1,
      backgroundColor: c.background,
    },
    cover: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      zIndex: 2,
      backgroundColor: c.border,
      overflow: 'hidden',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    actionBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
    },
    backButton: {
      backgroundColor: '#FFFFFF',
    },
    scroll: {
      flex: 1,
      zIndex: 1,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 20,
      gap: 4,
    },
    metaRow: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    metaLead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 10,
    },
    categoryChip: {
      height: 20,
      borderRadius: 6,
      backgroundColor: c.background,
      paddingTop: 2,
      paddingBottom: 2,
      paddingHorizontal: 6,
      justifyContent: 'center',
    },
    categoryText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      color: c.secondaryText,
    },
    statusChip: {
      height: 20,
      borderRadius: 6,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingTop: 2,
      paddingBottom: 2,
      paddingHorizontal: 6,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    statusLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
    },
    ratingChip: {
      height: 20,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      borderRadius: 6,
      backgroundColor: '#004741',
      paddingTop: 2,
      paddingBottom: 2,
      paddingHorizontal: 6,
    },
    ratingText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      color: '#F6F7F9',
    },
    businessName: {
      fontFamily: 'Rubik-Regular',
      fontSize: 36,
      lineHeight: 44,
      color: c.primaryText,
    },
    aboutBlock: {
      gap: 8,
      marginTop: 6,
    },
    aboutTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      color: c.primaryText,
    },
    aboutBody: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    readMore: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: c.brand,
    },
    reviewsEmpty: {
      alignSelf: 'center',
      width: 256,
      alignItems: 'center',
      gap: 20,
    },
    reviewsEmptyCopy: {
      alignItems: 'center',
      gap: 8,
    },
    reviewsEmptyTitle: {
      fontFamily: 'Rubik-Medium',
      fontSize: 20,
      lineHeight: 24,
      textAlign: 'center',
      color: c.primaryText,
    },
    reviewsEmptyBody: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      textAlign: 'center',
      color: c.secondaryText,
    },
    writeButton: {
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
      paddingVertical: 12,
      paddingHorizontal: 16,
      alignItems: 'center',
      justifyContent: 'center',
    },
    writeLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: '#F6F7F9',
    },
    reviewsFilled: {
      gap: 16,
    },
    sectionHead: {
      minHeight: 28,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    sectionTitle: {
      fontFamily: 'Rubik-Regular',
      fontSize: 24,
      lineHeight: 28,
      color: c.primaryText,
    },
    seeAll: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    seeAllText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 18,
      color: c.primaryText,
    },
    reviewRow: {
      gap: 6,
    },
    reviewCard: {
      width: 313,
      borderRadius: 24,
      backgroundColor: c.background,
      paddingTop: 12,
      paddingBottom: 12,
      paddingHorizontal: 16,
      gap: 6,
    },
    reviewHead: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 16,
    },
    reviewAvatar: {
      width: 36,
      height: 36,
      borderRadius: 10,
      backgroundColor: c.border,
    },
    reviewIdentity: {
      flex: 1,
    },
    reviewName: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 20,
      color: c.primaryText,
    },
    reviewDate: {
      fontFamily: 'Rubik-Regular',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
    reviewBody: {
      fontFamily: 'Rubik-Regular',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
    },
    distanceChip: {
      height: 32,
      borderRadius: 10,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      paddingTop: 4,
      paddingBottom: 4,
      paddingLeft: 8,
      paddingRight: 10,
    },
    distanceText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.primaryText,
    },
    bodyText: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    contactList: {
      gap: 6,
      marginTop: 2,
    },
    hoursList: {
      gap: 6,
      marginTop: 2,
    },
    hoursRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 22,
    },
    dayLabel: {
      width: 32,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    hoursValue: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    footer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 3,
      flexDirection: 'row',
      gap: 8,
      paddingTop: 12,
      paddingHorizontal: 20,
      borderTopLeftRadius: 24,
      borderTopRightRadius: 24,
      backgroundColor: c.surface,
      shadowColor: '#1E1E1E',
      shadowOffset: { width: 0, height: -1 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
      elevation: 8,
    },
    callButton: {
      flex: 1,
      height: 48,
      borderRadius: 12,
      backgroundColor: c.brand,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      paddingHorizontal: 16,
    },
    callLabel: {
      fontFamily: 'Rubik-Medium',
      fontSize: 16,
      lineHeight: 24,
      color: '#F6F7F9',
    },
    directionsButton: {
      flex: 1,
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
    buttonDisabled: {
      opacity: 0.5,
    },
  });
