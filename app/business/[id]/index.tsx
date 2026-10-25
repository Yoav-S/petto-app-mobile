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
import { openSystemDirections, openSystemPhones } from '@/services/systemApps';
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

function hoursListed(hours: OpeningHours | undefined): boolean {
  return Boolean(hours) && hours?.provided !== false;
}

function dayHours(hours: OpeningHours | undefined, day: Weekday): string {
  if (!hoursListed(hours)) return t('business.hours_unlisted');
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
  if (!hours || hours.provided === false) return null;
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

function HoursSchedule({ hours, id }: { hours: OpeningHours | undefined; id: string }) {
  const styles = useThemedStyles(makeStyles);
  return (
    <View style={styles.hoursList}>
      {hoursListed(hours) ? (
        WEEK.map((day) => (
          <View key={`${id}-${day}`} style={styles.hoursRow}>
            <Text style={styles.dayLabel} numberOfLines={1}>
              {t(DAY_KEY[day])}
            </Text>
            <Text style={styles.hoursValue}>{dayHours(hours, day)}</Text>
          </View>
        ))
      ) : (
        <Text style={styles.hoursValue}>{t('business.hours_unlisted')}</Text>
      )}
    </View>
  );
}

function HoursToggle({
  hours,
  hoursKey,
  expanded,
  onToggle,
}: {
  hours: OpeningHours | undefined;
  hoursKey: string;
  expanded: boolean;
  onToggle: () => void;
}) {
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);
  const status = branchStatus(hours);
  const statusTint = status ? (status.open ? OPEN_COLOR : CLOSED_COLOR) : colors.secondaryText;
  return (
    <View>
      <Pressable
        style={styles.hoursToggle}
        onPress={onToggle}
        hitSlop={8}
        accessibilityRole="button"
      >
        {status ? (
          <View style={styles.locationStatus}>
            <Text style={[styles.locationStatusText, { color: statusTint }]}>
              {status.open ? t('home.open') : t('home.closed')}
            </Text>
            <View style={[styles.locationStatusDot, { backgroundColor: statusTint }]} />
            {status.detail ? (
              <Text style={styles.locationStatusDetail} numberOfLines={1}>
                {status.detail}
              </Text>
            ) : null}
          </View>
        ) : (
          <View style={styles.locationStatus} />
        )}
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={colors.primaryText}
        />
      </Pressable>
      {expanded ? <HoursSchedule hours={hours} id={hoursKey} /> : null}
    </View>
  );
}

export default function BusinessScreen() {
  const params = useLocalSearchParams<{
    id: string;
    locationId?: string;
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
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reloadToken, setReloadToken] = useState(0);
  const savedReviewRef = useRef<PlaceReview | null>(null);
  const [openHoursKeys, setOpenHoursKeys] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<BusinessCategory | null>(null);

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

  useEffect(() => {
    setOpenHoursKeys([]);
  }, [params.id, params.locationId]);

  const toggleHours = (key: string) => {
    setOpenHoursKeys((current) =>
      current.includes(key) ? current.filter((id) => id !== key) : [...current, key],
    );
  };

  const name = place?.name || params.name || '';
  const category = place?.category ?? params.category;
  const categories = place?.categories?.length
    ? place.categories
    : category
      ? [category]
      : [];
  const rating = place?.rating ?? (params.rating ? Number(params.rating) : null);
  const distance = place?.distance_km ?? (params.distance ? Number(params.distance) : null);
  const hoursKnown = place
    ? typeof place.open_now === 'boolean'
    : params.openNow === '1' || params.openNow === '0' || params.open247 === '1';
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
  const fallbackBranch = place
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
  const locationCards = (() => {
    const rows = branches.length ? [...branches] : fallbackBranch;
    const target = params.locationId;
    if (!target) return rows;
    const index = rows.findIndex((branch) => branch.id === target);
    if (index <= 0) return rows;
    const next = [...rows];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    return next;
  })();
  const phoneKeys = locationCards.map((branch) => [...dialNumbers(branch)].sort().join('|'));
  const phonesOnEachLocation = locationCards.length > 1 && new Set(phoneKeys).size > 1;
  const contactPhones = phonesOnEachLocation
    ? []
    : (locationCards[0] ? dialNumbers(locationCards[0]) : phones);
  const serviceCategories = (() => {
    const seen: BusinessCategory[] = [];
    for (const branch of locationCards) {
      for (const service of branch.services ?? []) {
        if (!seen.includes(service.category)) seen.push(service.category);
      }
    }
    return seen.length ? seen : categories;
  })();
  const photoPresented = useSettledModalVisible(photoOpen && Boolean(image));

  useEffect(() => {
    const fromParam = params.category && CATEGORY_KEY[params.category] ? params.category : null;
    setSelectedCategory(fromParam ?? serviceCategories[0] ?? null);
  }, [place?.id, params.category]);

  const headerStatus = (() => {
    const statuses = locationCards.flatMap((branch) => {
      const services = branch.services?.length
        ? branch.services
        : [{ opening_hours: branch.opening_hours }];
      return services.map((service) => branchStatus(service.opening_hours));
    }).filter((row): row is NonNullable<typeof row> => row != null);
    if (!statuses.length) {
      return hoursKnown ? { open, detail: null as string | null } : null;
    }
    const opened = statuses.filter((row) => row.open);
    const closed = statuses.filter((row) => !row.open);
    if (opened.length && closed.length) {
      return { open: true, detail: t('home.some_services_closed') };
    }
    return opened[0] ?? closed[0] ?? null;
  })();
  const headerStatusColor = headerStatus
    ? (headerStatus.open ? OPEN_COLOR : CLOSED_COLOR)
    : CLOSED_COLOR;

  const showPhones = (numbers?: string[]) => {
    const list = numbers ?? phones;
    if (!list.length) return;
    void openSystemPhones(list);
  };

  const showMaps = (target?: PlaceLocation) => {
    void openSystemDirections(target ?? place);
  };

  const website = place?.website?.trim() ?? '';
  const instagram = place?.instagram?.trim() ?? '';
  const actionBottom = Math.max(insets.bottom, 16);
  const actionBarHeight = 12 + 48 + actionBottom;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: actionBarHeight + 4 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.cover, { height: coverHeight }]}>
          <Pressable
            style={styles.coverImage}
            disabled={!image}
            onPress={() => {
              setReviewOpen(false);
              setPhotoOpen(true);
            }}
            accessibilityRole="button"
          >
            {image ? (
              <Image source={{ uri: image }} style={styles.coverImage} contentFit="cover" />
            ) : (
              <View style={styles.coverPlaceholder}>
                <Image
                  source={require('@/assets/images/business-photo-placeholder.png')}
                  style={styles.coverPlaceholderIcon}
                  contentFit="contain"
                />
              </View>
            )}
          </Pressable>
        </View>
        <View style={styles.scrollBody}>
        <View style={styles.aboutCard}>
          <View style={styles.aboutStatusRow}>
            {headerStatus ? (
              <View style={styles.aboutStatus}>
                <Text style={[styles.aboutStatusText, { color: headerStatusColor }]}>
                  {headerStatus.open ? t('home.open') : t('home.closed')}
                </Text>
                <View style={[styles.statusDot, { backgroundColor: headerStatusColor }]} />
                {headerStatus.detail ? (
                  <Text style={styles.aboutStatusDetail} numberOfLines={1}>
                    {headerStatus.detail}
                  </Text>
                ) : null}
              </View>
            ) : (
              <View style={styles.aboutStatus} />
            )}
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
        {serviceCategories.length ? (
          <View style={styles.serviceTabs}>
            {serviceCategories.map((item) => {
              const on = selectedCategory === item;
              return (
                <Pressable
                  key={item}
                  style={[styles.serviceTab, on && styles.serviceTabOn]}
                  onPress={() => setSelectedCategory(item)}
                  accessibilityRole="button"
                >
                  <Text style={[styles.serviceTabText, on && styles.serviceTabTextOn]}>
                    {t(CATEGORY_KEY[item])}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        ) : null}
        {locationCards.map((branch) => {
          const branchDistance = branch.distance_km;
          const branchPhones = dialNumbers(branch);
          const services = branch.services ?? [];
          const hourBlocks = services.length
            ? services
                .filter((service) => !selectedCategory || service.category === selectedCategory)
                .map((service) => ({
                  key: service.id,
                  hours: hoursListed(service.opening_hours)
                    ? service.opening_hours
                    : branch.opening_hours,
                }))
            : [{
                key: branch.id,
                hours: branch.opening_hours,
              }];
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
                <View style={styles.hoursBlocks}>
                  {hourBlocks.map((block) => (
                    <HoursToggle
                      key={block.key}
                      hours={block.hours}
                      hoursKey={block.key}
                      expanded={openHoursKeys.includes(block.key)}
                      onToggle={() => toggleHours(block.key)}
                    />
                  ))}
                </View>
              </View>
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
        </View>
      </ScrollView>

      <View style={[styles.actions, { paddingBottom: actionBottom }]}>
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
            disabled={!place || (!place.address && !place.city && !place.location)}
            onPress={() => showMaps()}
          >
            <Send size={20} color={colors.primaryText} />
            <Text style={styles.directionsLabel}>{t('business.directions')}</Text>
          </TouchableOpacity>
      </View>

      <View style={[styles.actionBar, { top: insets.top }]} pointerEvents="box-none">
        <HeaderIconButton
          onPress={() => router.back()}
          accessibilityLabel={t('petOnboarding.back')}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.primaryText} />
        </HeaderIconButton>
      </View>

      {photoPresented && image ? (
        <Modal visible transparent animationType="fade" onRequestClose={() => setPhotoOpen(false)}>
          <View style={styles.photoModal}>
            <Image source={{ uri: image }} style={styles.photoFull} contentFit="contain" />
            <View style={[styles.photoClose, { top: insets.top + 8 }]}>
              <HeaderIconButton
                onPress={() => setPhotoOpen(false)}
                accessibilityLabel={t('petOnboarding.photo_close_a11y')}
              >
                <Ionicons name="close" size={24} color={colors.primaryText} />
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
      width: '100%',
      backgroundColor: c.border,
      overflow: 'hidden',
      borderBottomLeftRadius: 24,
      borderBottomRightRadius: 24,
    },
    coverImage: {
      width: '100%',
      height: '100%',
    },
    coverPlaceholder: {
      width: '100%',
      height: '100%',
      backgroundColor: '#F6F7F9',
      alignItems: 'center',
      justifyContent: 'center',
    },
    coverPlaceholderIcon: {
      width: 42,
      height: 42,
    },
    actionBar: {
      position: 'absolute',
      left: 0,
      right: 0,
      height: 44,
      justifyContent: 'center',
      paddingHorizontal: PAGE_HORIZONTAL_PADDING,
      zIndex: 3,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      paddingBottom: 0,
    },
    scrollBody: {
      gap: 4,
      marginTop: 4,
    },
    card: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 20,
      gap: 4,
    },
    aboutCard: {
      backgroundColor: c.surface,
      borderRadius: 24,
      paddingTop: 22,
      paddingBottom: 22,
      paddingHorizontal: 20,
      gap: 8,
    },
    aboutStatusRow: {
      minHeight: 20,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 10,
    },
    aboutStatus: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    aboutStatusText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
    },
    aboutStatusDetail: {
      flexShrink: 1,
      fontFamily: 'Rubik-Medium',
      fontSize: 12,
      lineHeight: 16,
      color: c.secondaryText,
    },
    serviceTabs: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'center',
      gap: 8,
      marginBottom: 12,
    },
    serviceTab: {
      borderRadius: 10,
      backgroundColor: c.background,
      paddingHorizontal: 8,
      paddingVertical: 4,
    },
    serviceTabOn: {
      backgroundColor: '#004741',
    },
    serviceTabText: {
      fontFamily: 'Rubik-Medium',
      fontSize: 14,
      lineHeight: 20,
      color: c.secondaryText,
    },
    serviceTabTextOn: {
      color: '#F6F7F9',
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
    hoursToggle: {
      minHeight: 24,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 8,
    },
    hoursBlocks: {
      gap: 8,
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
      minHeight: 20,
      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
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
      alignSelf: 'flex-start',
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
      marginTop: 12,
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
      marginTop: 6,
    },
    actions: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 4,
      flexDirection: 'row',
      gap: 10,
      paddingTop: 12,
      paddingHorizontal: 20,
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
    hoursRow: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      flexWrap: 'nowrap',
    },
    dayLabel: {
      width: 48,
      flexGrow: 0,
      flexShrink: 0,
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
