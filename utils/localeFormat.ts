import { currentLocale, t } from '@/i18n';

/** BCP 47 tag for the active app language. */
export function localeTag(): string {
  switch (currentLocale) {
    case 'ro':
      return 'ro-RO';
    case 'ru':
      return 'ru-RU';
    case 'he':
      return 'he-IL';
    default:
      return 'en-GB';
  }
}

/**
 * Romanian one / few / other from the PDF: 1 an, 2–19 ani, 20 de ani and up
 * (including 21, 100). Not the full CLDR table.
 */
function roPlural(n: number): 'one' | 'few' | 'other' {
  if (n === 1) return 'one';
  if (n >= 2 && n <= 19) return 'few';
  return 'other';
}

function formatRoUnit(n: number, one: string, few: string): string {
  const form = roPlural(n);
  if (form === 'one') return one;
  if (form === 'few') return `${n} ${few}`;
  return `${n} de ${few}`;
}

/** 1 час, 2–4 часа, 5 часов (and 21 час, 22 часа, 11 часов). */
function ruPlural(n: number): 'one' | 'few' | 'many' {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return 'many';
  if (last === 1) return 'one';
  if (last >= 2 && last <= 4) return 'few';
  return 'many';
}

function formatRuUnit(
  n: number,
  one: string,
  few: string,
  many: string,
): string {
  const form = ruPlural(n);
  const word = form === 'one' ? one : form === 'few' ? few : many;
  return `${n} ${word}`;
}

export function formatDecimal(value: number, fractionDigits?: number): string {
  const opts =
    fractionDigits != null
      ? { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits }
      : { maximumFractionDigits: 1 };
  return value.toLocaleString(localeTag(), opts);
}

export function formatKm(km: number): string {
  const unit = currentLocale === 'ru' ? 'км' : 'km';
  return `${formatDecimal(km)} ${unit}`;
}

export function formatRating(rating: number): string {
  return formatDecimal(rating, 1);
}

export function formatWeightKg(weight: number): string {
  return `${formatDecimal(weight)} ${t('profile.weight_unit')}`;
}

/** Pet age under the photo: "3 years old" → "3 ani". */
export function formatPetAge(years: number, months: number): string {
  if (years > 0) {
    if (currentLocale === 'ro') return formatRoUnit(years, '1 an', 'ani');
    if (currentLocale === 'ru') return formatRuUnit(years, 'год', 'года', 'лет');
    return `${years} ${t(years === 1 ? 'profile.age_year' : 'profile.age_years')}`;
  }
  const count = Math.max(months, 0);
  if (currentLocale === 'ro') return formatRoUnit(count, '1 lună', 'luni');
  if (currentLocale === 'ru') return formatRuUnit(count, 'месяц', 'месяца', 'месяцев');
  return `${count} ${t(count === 1 ? 'profile.age_month' : 'profile.age_months')}`;
}

/** Home reminders card footer: "2 upcoming" → "2 programate". */
export function formatUpcomingCount(count: number): string {
  if (currentLocale === 'ro') {
    return formatRoUnit(count, '1 programată', 'programate');
  }
  return `${count} ${t('home.remindersCard.upcoming')}`;
}

type RelativeUnit = 'second' | 'minute' | 'hour' | 'day' | 'week' | 'month';

const RO_RELATIVE: Record<RelativeUnit, { one: string; few: string }> = {
  second: { one: 'o secundă', few: 'secunde' },
  minute: { one: 'un minut', few: 'minute' },
  hour: { one: 'o oră', few: 'ore' },
  day: { one: 'o zi', few: 'zile' },
  week: { one: 'o săptămână', few: 'săptămâni' },
  month: { one: 'o lună', few: 'luni' },
};

const EN_RELATIVE: Record<RelativeUnit, { one: string; many: string }> = {
  second: { one: 'business.second_ago', many: 'business.seconds_ago' },
  minute: { one: 'business.minute_ago', many: 'business.minutes_ago' },
  hour: { one: 'business.hour_ago', many: 'business.hours_ago' },
  day: { one: 'business.day_ago', many: 'business.days_ago' },
  week: { one: 'business.week_ago', many: 'business.weeks_ago' },
  month: { one: 'business.month_ago', many: 'business.months_ago' },
};

const RU_RELATIVE: Record<RelativeUnit, { one: string; few: string; many: string }> = {
  second: { one: 'секунду назад', few: 'секунды назад', many: 'секунд назад' },
  minute: { one: 'минуту назад', few: 'минуты назад', many: 'минут назад' },
  hour: { one: 'час назад', few: 'часа назад', many: 'часов назад' },
  day: { one: 'день назад', few: 'дня назад', many: 'дней назад' },
  week: { one: 'неделю назад', few: 'недели назад', many: 'недель назад' },
  month: { one: 'месяц назад', few: 'месяца назад', many: 'месяцев назад' },
};

/** Relative time: EN "3 hours ago", RO "Acum 3 ore", RU "3 часа назад". */
export function formatRelativeAgo(count: number, unit: RelativeUnit): string {
  if (currentLocale === 'ro') {
    const words = RO_RELATIVE[unit];
    return `Acum ${formatRoUnit(count, words.one, words.few)}`;
  }
  if (currentLocale === 'ru') {
    const words = RU_RELATIVE[unit];
    return formatRuUnit(count, words.one, words.few, words.many);
  }
  const keys = EN_RELATIVE[unit];
  return `${count} ${t(count === 1 ? keys.one : keys.many)}`;
}

/** 24-hour clock for RO/RU/HE; 12-hour for English (Figma still shows AM). */
export function formatLocaleClock(date: Date): string {
  if (currentLocale === 'en') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  return `${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}
