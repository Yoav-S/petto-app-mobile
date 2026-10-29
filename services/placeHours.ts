import { t } from '@/i18n';
import type { BusinessPlace, OpeningHours, Weekday } from '@/services/places';

const WEEK: Weekday[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_LABEL: Record<Weekday, string> = {
  mon: 'home.day_mon',
  tue: 'home.day_tue',
  wed: 'home.day_wed',
  thu: 'home.day_thu',
  fri: 'home.day_fri',
  sat: 'home.day_sat',
  sun: 'home.day_sun',
};

export const OPEN_COLOR = '#1EC876';
export const MIXED_COLOR = '#F59E0B';
export const CLOSED_COLOR = '#EF4444';

function clockFromApi(value: string): string {
  const match = /^0?(\d+):(\d{2})$/.exec(value);
  if (!match) return value;
  return `${Number(match[1])}:${match[2]}`;
}

function clockFromMinutes(total: number): string {
  const hour = Math.floor(total / 60);
  const minute = total % 60;
  return `${hour}:${String(minute).padStart(2, '0')}`;
}

function minutesOf(value: string): number | null {
  if (value === '24:00') return 24 * 60;
  const match = /^(\d{1,2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (hour > 24 || minute > 59 || (hour === 24 && minute !== 0)) return null;
  return hour * 60 + minute;
}

function localIsoDate(now: Date, offset: number): string {
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() + offset);
  const month = String(day.getMonth() + 1).padStart(2, '0');
  const date = String(day.getDate()).padStart(2, '0');
  return `${day.getFullYear()}-${month}-${date}`;
}

function parseSlots(slots: { open: string; close: string }[] | undefined): { start: number; end: number }[] {
  const parsed: { start: number; end: number }[] = [];
  for (const slot of slots ?? []) {
    const start = minutesOf(slot.open);
    const end = minutesOf(slot.close);
    if (start == null || end == null || end <= start) continue;
    parsed.push({ start, end });
  }
  return parsed;
}

function slotsFor(hours: OpeningHours, now: Date, offset: number): { start: number; end: number }[] {
  const iso = localIsoDate(now, offset);
  const override = hours.special_dates?.find((item) => item.date === iso);
  if (override) return override.closed ? [] : parseSlots(override.slots);
  const today = (now.getDay() + 6) % 7;
  const day = WEEK[(today + offset + 70) % 7];
  return parseSlots(hours[day]);
}

export function formatOpensAt(place: Pick<BusinessPlace, 'opens_at' | 'next_open_day' | 'opens_tomorrow'>): string | null {
  const when = place.opens_at ? clockFromApi(place.opens_at) : null;
  if (!when) return null;
  if (place.opens_tomorrow) return `${t('home.opens_tomorrow')} ${when}`;
  if (place.next_open_day) return `${t('home.opens')} ${t(DAY_LABEL[place.next_open_day])} ${when}`;
  return `${t('home.opens')} ${when}`;
}

export function formatClosesAt(place: Pick<BusinessPlace, 'closes_at' | 'open_24_7'>): string | null {
  if (place.open_24_7) return t('home.opens_24_7');
  const when = place.closes_at ? clockFromApi(place.closes_at) : null;
  if (!when) return null;
  return `${t('home.closes')} ${when}`;
}

export type HoursStatus = { open: boolean; mixed?: boolean; color: string; label: string; detail: string | null };

function openDetail(place: BusinessPlace): string | null {
  return formatClosesAt(place);
}

function closedDetail(place: BusinessPlace): string | null {
  return formatOpensAt(place);
}

/** Open + Closes 19:00, Closed + Opens 9:30 / tomorrow / Sunday 9:30. */
export function placeHoursStatus(place: BusinessPlace): HoursStatus | null {
  if (typeof place.open_now !== 'boolean') return null;
  if (place.some_services_closed) {
    const isOpen = place.open_now !== false;
    return {
      open: isOpen,
      mixed: true,
      color: isOpen ? OPEN_COLOR : CLOSED_COLOR,
      label: isOpen ? t('home.open') : t('home.closed'),
      detail: (isOpen ? openDetail(place) : closedDetail(place)) ?? t('home.some_services_closed'),
    };
  }
  if (place.open_now) {
    return {
      open: true,
      color: OPEN_COLOR,
      label: t('home.open'),
      detail: openDetail(place),
    };
  }
  return {
    open: false,
    color: CLOSED_COLOR,
    label: t('home.closed'),
    detail: closedDetail(place),
  };
}

/** Open or closed from a branch/service schedule. Looks up to two weeks ahead. */
export function branchHoursStatus(hours: OpeningHours | undefined): HoursStatus | null {
  if (!hours || hours.provided === false) return null;
  if (hours.always_open) {
    return { open: true, color: OPEN_COLOR, label: t('home.open'), detail: t('home.opens_24_7') };
  }
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  const fullWeek = WEEK.every((_, index) =>
    slotsFor(hours, now, index).some((slot) => slot.start === 0 && slot.end >= 24 * 60 - 1),
  );
  if (fullWeek && !hours.special_dates?.length) {
    return { open: true, color: OPEN_COLOR, label: t('home.open'), detail: t('home.opens_24_7') };
  }
  const current = slotsFor(hours, now, 0).find((slot) => slot.start <= nowMin && nowMin < slot.end);
  if (current) {
    return {
      open: true,
      color: OPEN_COLOR,
      label: t('home.open'),
      detail: `${t('home.closes')} ${clockFromMinutes(current.end)}`,
    };
  }
  const later = slotsFor(hours, now, 0).filter((slot) => slot.start > nowMin);
  if (later.length) {
    return {
      open: false,
      color: CLOSED_COLOR,
      label: t('home.closed'),
      detail: `${t('home.opens')} ${clockFromMinutes(Math.min(...later.map((slot) => slot.start)))}`,
    };
  }
  for (let offset = 1; offset < 15; offset += 1) {
    const upcoming = slotsFor(hours, now, offset);
    if (!upcoming.length) continue;
    const when = clockFromMinutes(Math.min(...upcoming.map((slot) => slot.start)));
    const day = WEEK[((now.getDay() + 6) % 7 + offset) % 7];
    const detail =
      offset === 1
        ? `${t('home.opens_tomorrow')} ${when}`
        : `${t('home.opens')} ${t(DAY_LABEL[day])} ${when}`;
    return { open: false, color: CLOSED_COLOR, label: t('home.closed'), detail };
  }
  return { open: false, color: CLOSED_COLOR, label: t('home.closed'), detail: null };
}
