import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Linking,
  Modal,
  Platform,
} from 'react-native';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronRight, Globe, MapPin, Phone, Send, Star } from 'lucide-react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { type ThemeColors } from '@/constants/theme';
import { DESIGN_COVER_HEIGHT, PAGE_HORIZONTAL_PADDING } from '@/constants/layout';
import { useColors, useThemedStyles, useTheme } from '@/context/ThemeContext';
import { useResponsiveLayout } from '@/hooks/useResponsiveLayout';
import { useImageStatusBarStyle } from '@/hooks/useImageStatusBarStyle';
import { useStatusBarOverride } from '@/context/SystemBarsContext';
import HeaderIconButton from '@/components/ui/HeaderIconButton';
import { useSettledModalVisible } from '@/components/ui/BottomSheetModal';
import { t } from '@/i18n';
import { getErrorMessage } from '@/services/errors';
import WriteReviewSheet from '@/components/business/WriteReviewSheet';
import { LocationSheet, PhoneSheet } from '@/components/business/ContactSheets';
import { postedLabel } from '@/utils/reviewPosted';
import { useToast } from '@/context/ToastContext';
import {
  getPlace,
  rememberPlaceReview,
  upsertOwnReview,
  type BusinessCategory,
  type BusinessPlaceDetail,
  type OpeningHours,
  type PlaceLocation,
  type PlaceReview,
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

function clockLabel(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}`;
}

function minutesOf(value: string): number | null {
  if (value === '24:00') return 24 * 60;
  const match = /^(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

/** Open or closed from a branch schedule, in the phone's local time. */
function branchStatus(hours: OpeningHours | undefined): { open: boolean; detail: string | null } | null {
  if (!hours) return null;
  if (hours.always_open) return { open: true, detail: t('home.opens_24_7') };
  const now = new Date();
  const today = (now.getDay() + 6) % 7;
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const slotsFor = (index: number) => {
    const day = WEEK[(index + 7) % 7];
    const parsed: { start: number; end: number }[] = [];
    for (const slot of hours[day] ?? []) {
      const start = minutesOf(slot.open);
      const end = minutesOf(slot.close);
      if (start == null || end == null || end <= start) continue;
      parsed.push({ start, end });
    }
    return parsed;
  };
  const fullDay = (index: number) =>
    slotsFor(index).some((slot) => slot.start === 0 && slot.end >= 24 * 60 - 1);
  if (WEEK.every((_, index) => fullDay(index))) {
    return { open: true, detail: t('home.opens_24_7') };
  }
  const current = slotsFor(today).find((slot) => slot.start <= nowMin && nowMin < slot.end);
  if (current) return { open: true, detail: `${t('home.closes')} ${clockLabel(current.end)}` };
  const later = slotsFor(today).filter((slot) => slot.start > nowMin);
  if (later.length) {
    return { open: false, detail: `${t('home.opens')} ${clockLabel(Math.min(...later.map((slot) => slot.start)))}` };
  }
  for (let offset = 1; offset < 8; offset += 1) {
    const index = (today + offset) % 7;
    const upcoming = slotsFor(index);
    if (!upcoming.length) continue;
    const when = clockLabel(Math.min(...upcoming.map((slot) => slot.start)));
    if (offset === 1) return { open: false, detail: `${t('home.opens_tomorrow')} ${when}` };
    return { open: false, detail: `${t('home.opens')} ${t(`home.day_${WEEK[index]}` as 'home.day_mon')} ${when}` };
  }
  return { open: false, detail: null };
}

function dialNumbers(branch: PlaceLocation): string[] {
  const own = branch.phone.map((phone) => phone.trim()).filter(Boolean);
  if (own.length) return own;
  return branch.call_phone.map((phone) => phone.trim()).filter(Boolean);
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

type NavApp = 'google' | 'waze' | 'apple';

function directionUrl(
  app: NavApp,
  target: { address: string; city: string; location?: { coordinates: [number, number] } | null },
): string | null {
  const point = target.location?.coordinates;
  const query = encodeURIComponent(addressText(target.address, target.city));
  if (!point && !query) return null;
  if (point) {
    const [lng, lat] = point;
    if (app === 'waze') return `https://waze.com/ul?ll=${lat},${lng}&navigate=yes`;
    if (app === 'apple') return `http://maps.apple.com/?daddr=${lat},${lng}`;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  }
  if (app === 'waze') return `https://waze.com/ul?q=${query}&navigate=yes`;
  if (app === 'apple') return `http://maps.apple.com/?q=${query}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
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
  const [aboutLineCount, setAboutLineCount] = useState(0);
  const [photoOpen, setPhotoOpen] = useState(false);
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [mapsOpen, setMapsOpen] = useState(false);
  const [callPhones, setCallPhones] = useState<string[]>([]);
  const [mapTarget, setMapTarget] = useState<PlaceLocation | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const savedReviewRef = useRef<PlaceReview | null>(null);
  const [openLocationIds, setOpenLocationIds] = useState<string[]>([]);

  const previewImage = params.image || null;
  const image = place?.image ?? previewImage;
  const coverSource = useMemo(() => ({ uri: image ?? '' }), [image]);
  const imageContrast = useImageStatusBarStyle(coverSource, isDark ? 'light' : 'dark');
  useStatusBarOverride(image ? imageContrast.style : isDark ? 'light' : 'dark');

  useFocusEffect(
    useCallback(() => {
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
          if (!active) return;
          const pending = savedReviewRef.current;
          setPlace(
            pending
              ? { ...detail, reviews: upsertOwnReview(detail.reviews ?? [], pending) }
              : detail,
          );
        })
        .catch((err) => {
          if (active) toast.showError(getErrorMessage(err));
        });
      return () => {
        active = false;
      };
    }, [params.id, params.lat, params.lng, reloadToken, toast]),
  );

  const name = place?.name || params.name || '';
  const category = place?.category ?? params.category;
  const rating = place?.rating ?? (params.rating ? Number(params.rating) : null);
  const distance = place?.distance_km ?? (params.distance ? Number(params.distance) : null);
  const open = place ? Boolean(place.open_now || place.open_24_7) : params.openNow === '1' || params.open247 === '1';
  const description = place?.description?.trim() ?? '';
  const aboutOverflows = aboutLineCount > 3;
  useEffect(() => {
    setAboutOpen(false);
    setAboutLineCount(0);
  }, [place?.id, description]);
  const reviews = place?.reviews ?? [];
  const phones = place?.phone ?? [];
  const branches = place?.locations ?? [];
  const locationCards = branches.length
    ? branches
    : place
      ? [{
          id: place.id,
          address: place.address,
          city: place.city,
          opening_hours: place.opening_hours,
          phone: [] as string[],
          call_phone: phones,
          shared_phone: true,
          location: place.location,
          distance_km: typeof distance === 'number' && !Number.isNaN(distance) ? distance : null,
        } satisfies PlaceLocation]
      : [];
  const phoneKeys = locationCards.map((branch) => [...dialNumbers(branch)].sort().join('|'));
  const phonesOnEachLocation = locationCards.length > 1 && new Set(phoneKeys).size > 1;
  const contactPhones = phonesOnEachLocation
    ? []
    : (locationCards[0] ? dialNumbers(locationCards[0]) : phones);
  const photoPresented = useSettledModalVisible(photoOpen && Boolean(image));

  const showPhones = (numbers?: string[]) => {
    const list = numbers ?? phones;
    if (!list.length) return;
    setCallPhones(list);
    setMapsOpen(false);
    setPhoneOpen(true);
  };

  const showMaps = (target?: PlaceLocation) => {
    const next = target ?? place;
    if (!next || !directionUrl('google', next)) return;
    setMapTarget(target ?? null);
    setPhoneOpen(false);
    setMapsOpen(true);
  };

  const website = place?.website?.trim() ?? '';
  const instagram = place?.instagram?.trim() ?? '';
  const statusColor = open ? OPEN_COLOR : CLOSED_COLOR;

  return (
    <View style={styles.screen}>
      <View style={[styles.cover, { height: coverHeight }]}>
        <Pressable
          style={styles.coverImage}
          disabled={!image}
          onPress={() => setPhotoOpen(true)}
          accessibilityRole="button"
        >
          {image ? (
            <Image source={{ uri: image }} style={styles.coverImage} contentFit="cover" />
          ) : (
            <View style={styles.coverImage} />
          )}
        </Pressable>
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
            ) : (
              <Text style={styles.noReviews}>{t('home.no_reviews')}</Text>
            )}
          </View>
          <Text style={styles.businessName}>{name}</Text>
          {description ? (
            <View style={styles.aboutBlock}>
              <Text style={styles.aboutTitle}>{t('business.about')}</Text>
              <View>
                <Text
                  pointerEvents="none"
                  style={[styles.aboutBody, styles.aboutMeasure]}
                  accessible={false}
                  onTextLayout={(event) => {
                    const count = event.nativeEvent.lines.length;
                    setAboutLineCount((current) => (current === count ? current : count));
                  }}
                >
                  {description}
                </Text>
                <Text
                  style={styles.aboutBody}
                  numberOfLines={aboutOpen ? undefined : 3}
                  ellipsizeMode="tail"
                >
                  {description}
                </Text>
              </View>
              {aboutOverflows ? (
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
              <TouchableOpacity style={styles.writeButton} onPress={() => setReviewOpen(true)}>
                <Text style={styles.writeLabel}>{t('business.write_review')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.reviewsFilled}>
              <View style={styles.sectionHead}>
                <Text style={styles.sectionTitle}>{t('business.reviews')}</Text>
                <TouchableOpacity
                  style={styles.seeAll}
                  onPress={() =>
                    router.push({
                      pathname: '/business/[id]/reviews',
                      params: { id: params.id },
                    } as never)
                  }
                  hitSlop={8}
                >
                  <Text style={styles.seeAllText}>{t('home.see_all')}</Text>
                  <ChevronRight size={16} color={colors.primaryText} />
                </TouchableOpacity>
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
                        <Text style={styles.reviewDate}>{postedLabel(review.created_at)}</Text>
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
        {locationCards.map((branch) => {
          const expanded = openLocationIds.includes(branch.id);
          const branchDistance = branch.distance_km;
          const status = branchStatus(branch.opening_hours);
          const statusTint = status ? (status.open ? OPEN_COLOR : CLOSED_COLOR) : colors.secondaryText;
          const branchPhones = dialNumbers(branch);
          return (
            <View key={branch.id} style={styles.locationCard}>
              <View style={styles.locationBody}>
                <Pressable
                  style={styles.locationAddressBlock}
                  onPress={() => showMaps(branch)}
                  accessibilityRole="button"
                  accessibilityLabel={t('business.directions')}
                >
                  {typeof branchDistance === 'number' ? (
                    <View style={styles.locationDistanceRow}>
                      <MapPin size={12} color={colors.primaryText} />
                      <Text style={styles.locationDistance}>{`${branchDistance} km`}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.locationAddress}>
                    {addressText(branch.address, branch.city)}
                  </Text>
                </Pressable>
                <View style={styles.locationStatusRow}>
                  {status ? (
                    <View style={styles.locationStatus}>
                      <Text style={[styles.locationStatusText, { color: statusTint }]}>
                        {status.open ? t('home.open') : t('home.closed')}
                      </Text>
                      <View style={[styles.locationStatusDot, { backgroundColor: statusTint }]} />
                      {status.detail ? (
                        <Text style={styles.locationStatusDetail}>{status.detail}</Text>
                      ) : null}
                    </View>
                  ) : <View />}
                  <Pressable
                    onPress={() =>
                      setOpenLocationIds((current) =>
                        current.includes(branch.id)
                          ? current.filter((id) => id !== branch.id)
                          : [...current, branch.id],
                      )
                    }
                    hitSlop={8}
                    accessibilityRole="button"
                  >
                    <Ionicons
                      name={expanded ? 'chevron-up' : 'chevron-down'}
                      size={24}
                      color={colors.primaryText}
                    />
                  </Pressable>
                </View>
              </View>
              {expanded ? (
                <View style={styles.hoursList}>
                  {WEEK.map((day) => (
                    <View key={`${branch.id}-${day}`} style={styles.hoursRow}>
                      <Text style={styles.dayLabel}>{t(DAY_KEY[day])}</Text>
                      <Text style={styles.hoursValue}>{dayHours(branch.opening_hours, day)}</Text>
                    </View>
                  ))}
                </View>
              ) : null}
              {phonesOnEachLocation ? (
                <View style={styles.locationPhones}>
                  {branchPhones.map((phone) => (
                    <Pressable
                      key={phone}
                      style={styles.locationPhone}
                      onPress={() => showPhones([phone])}
                      accessibilityRole="button"
                    >
                      <Phone size={24} color={colors.primaryText} />
                      <Text style={styles.contactValue} numberOfLines={1}>{phone}</Text>
                    </Pressable>
                  ))}
                </View>
              ) : null}
            </View>
          );
        })}
        </View>

        {contactPhones.length || website || instagram ? (
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{t('business.contact')}</Text>
            <View style={styles.contactList}>
              {contactPhones.map((phone) => (
                <Pressable
                  key={phone}
                  style={styles.contactRow}
                  onPress={() => showPhones([phone])}
                  accessibilityRole="button"
                >
                  <Phone size={24} color={colors.primaryText} />
                  <Text style={styles.contactValue} numberOfLines={1}>{phone}</Text>
                </Pressable>
              ))}
              {website ? (
                <Pressable
                  style={styles.contactRow}
                  onPress={() => openUrl(website)}
                  accessibilityRole="button"
                >
                  <Globe size={24} color={colors.primaryText} />
                  <Text style={styles.contactValue} numberOfLines={1}>{website}</Text>
                </Pressable>
              ) : null}
              {instagram ? (
                <Pressable
                  style={styles.contactRow}
                  onPress={() => openInstagram(instagram)}
                  accessibilityRole="button"
                >
                  <Ionicons name="logo-instagram" size={24} color={colors.primaryText} />
                  <Text style={styles.contactValue} numberOfLines={1}>{instagram}</Text>
                </Pressable>
              ) : null}
            </View>
          </View>
        ) : null}

        <View style={[styles.actions, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <TouchableOpacity
            style={[styles.callButton, contactPhones.length === 0 && styles.buttonDisabled]}
            disabled={contactPhones.length === 0}
            onPress={() => showPhones(contactPhones)}
          >
            <Phone size={20} color="#F6F7F9" />
            <Text style={styles.callLabel}>{t('business.call')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.directionsButton}
            disabled={!place || !directionUrl('google', place)}
            onPress={() => showMaps()}
          >
            <Send size={20} color={colors.primaryText} />
            <Text style={styles.directionsLabel}>{t('business.directions')}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {photoPresented && image ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPhotoOpen(false)}>
          <View style={styles.photoModal}>
            <Image source={{ uri: image }} style={styles.photoFull} contentFit="contain" />
            <View style={[styles.photoClose, { top: insets.top + 8 }]}>
              <HeaderIconButton
                onPress={() => setPhotoOpen(false)}
                accessibilityLabel={t('petOnboarding.photo_close_a11y')}
                style={styles.backButton}
              >
                <Ionicons name="close" size={24} color="#1F2937" />
              </HeaderIconButton>
            </View>
          </View>
        </Modal>
      ) : null}

      <WriteReviewSheet
        visible={reviewOpen}
        businessId={params.id}
        initialRating={reviews.find((review) => review.is_mine)?.rating}
        initialComment={reviews.find((review) => review.is_mine)?.comment}
        onClose={() => setReviewOpen(false)}
        onSaved={(review) => {
          savedReviewRef.current = review;
          if (params.id) rememberPlaceReview(params.id, review);
          setPlace((current) =>
            current
              ? { ...current, reviews: upsertOwnReview(current.reviews ?? [], review) }
              : current,
          );
          setReloadToken((value) => value + 1);
        }}
      />

      <PhoneSheet
        visible={phoneOpen}
        phones={callPhones.length ? callPhones : phones}
        onClose={() => setPhoneOpen(false)}
      />
      <LocationSheet
        visible={mapsOpen}
        options={(
          ['google', 'waze', ...(Platform.OS === 'ios' ? (['apple'] as const) : [])] as NavApp[]
        ).flatMap((app) => {
          const target = mapTarget ?? place;
          if (!target) return [];
          const url = directionUrl(app, target);
          if (!url) return [];
          return [
            {
              key: app,
              label: t(
                app === 'google'
                  ? 'business.google_maps'
                  : app === 'waze'
                    ? 'business.waze'
                    : 'business.apple_maps',
              ),
              url,
            },
          ];
        })}
        onClose={() => setMapsOpen(false)}
      />
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
    locationCard: {
      backgroundColor: c.background,
      borderRadius: 24,
      paddingTop: 12,
      paddingBottom: 12,
      paddingLeft: 16,
      paddingRight: 16,
      gap: 6,
    },
    locationBody: {
      gap: 4,
    },
    locationAddressBlock: {
      gap: 2,
    },
    locationDistanceRow: {
      height: 16,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    locationDistance: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      textAlign: 'center',
      color: c.primaryText,
    },
    locationAddress: {
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    locationStatusRow: {
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    locationStatus: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    locationStatusText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
    },
    locationStatusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
    },
    locationStatusDetail: {
      flexShrink: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
    locationPhones: {
      gap: 6,
      marginTop: 10,
    },
    locationPhone: {
      height: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
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
    noReviews: {
      fontFamily: 'Rubik-Medium',
      fontSize: 10,
      lineHeight: 16,
      color: c.secondaryText,
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
    aboutMeasure: {
      position: 'absolute',
      opacity: 0,
      left: 0,
      right: 0,
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
    },
    contactRow: {
      height: 56,
      boxSizing: 'border-box',
      borderRadius: 16,
      padding: 16,
      backgroundColor: c.background,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
    },
    contactValue: {
      flex: 1,
      fontFamily: 'Rubik-Regular',
      fontSize: 16,
      lineHeight: 24,
      color: c.primaryText,
    },
    hoursList: {
      gap: 6,
      marginTop: 10,
    },
    actions: {
      flexDirection: 'row',
      gap: 8,
      marginTop: 12,
      paddingTop: 12,
      paddingHorizontal: 20,
      paddingBottom: 0,
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
    photoModal: {
      flex: 1,
      backgroundColor: '#000000',
    },
    photoFull: {
      flex: 1,
    },
    photoClose: {
      position: 'absolute',
      right: PAGE_HORIZONTAL_PADDING,
      zIndex: 2,
    },
  });
